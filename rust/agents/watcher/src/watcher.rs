use async_trait::async_trait;
use color_eyre::{eyre::bail, Report, Result};
use thiserror::Error;

use ethers::core::types::H256;
use futures_util::future::{join, join_all, select_all};
use std::{collections::HashMap, fmt::Display, sync::Arc, time::Duration};
use tokio::{
    select,
    sync::{mpsc, RwLock},
    task::JoinHandle,
    time::sleep,
};
use tracing::{error, info, info_span, instrument::Instrumented, Instrument};

use nomad_base::{
    cancel_task, AgentCore, CachingHome, ConnectionManagers, ContractSyncMetrics, IndexDataTypes,
    NomadAgent, NomadDB,
};
use nomad_core::{
    ChainCommunicationError, Common, CommonEvents, ConnectionManager, DoubleUpdate,
    FailureNotification, Home, SignedFailureNotification, SignedUpdate, Signers, State, TxOutcome,
};

use crate::settings::WatcherSettings as Settings;

const AGENT_NAME: &str = "watcher";

#[derive(Debug, Error)]
enum WatcherError {
    #[error("Syncing finished")]
    SyncingFinished,
}

#[derive(Debug)]
pub struct ContractWatcher<C>
where
    C: Common + CommonEvents + ?Sized + 'static,
{
    interval: u64,
    committed_root: H256,
    tx: mpsc::Sender<SignedUpdate>,
    contract: Arc<C>,
}

impl<C> Display for ContractWatcher<C>
where
    C: Common + CommonEvents + ?Sized + 'static,
{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ContractWatcher {{ ")?;
        write!(f, "interval: {}", self.interval)?;
        write!(f, "committed_root: {}", self.committed_root)?;
        write!(f, "contract: {}", self.contract.name())?;
        write!(f, "}}")?;
        Ok(())
    }
}

impl<C> ContractWatcher<C>
where
    C: Common + CommonEvents + ?Sized + 'static,
{
    pub fn new(
        interval: u64,
        from: H256,
        tx: mpsc::Sender<SignedUpdate>,
        contract: Arc<C>,
    ) -> Self {
        Self {
            interval,
            committed_root: from,
            tx,
            contract,
        }
    }

    async fn poll_and_send_update(&mut self) -> Result<()> {
        let update_opt = self
            .contract
            .signed_update_by_old_root(self.committed_root)
            .await?;

        if update_opt.is_none() {
            info!(
                "No new update found. Previous root: {}. From contract: {}.",
                self.committed_root,
                self.contract.name()
            );
            return Ok(());
        }

        let new_update = update_opt.unwrap();
        self.committed_root = new_update.update.new_root;

        info!(
            "Sending new update to UpdateHandler. Update: {:?}. From contract: {}.",
            &new_update,
            self.contract.name()
        );
        self.tx.send(new_update).await?;
        Ok(())
    }

    #[tracing::instrument]
    fn spawn(mut self) -> JoinHandle<Result<()>> {
        tokio::spawn(async move {
            loop {
                self.poll_and_send_update().await?;
                sleep(Duration::from_secs(self.interval)).await;
            }
        })
    }
}

#[derive(Debug)]
pub struct HistorySync<C>
where
    C: Common + CommonEvents + ?Sized + 'static,
{
    interval: u64,
    committed_root: H256,
    tx: mpsc::Sender<SignedUpdate>,
    contract: Arc<C>,
}

impl<C> HistorySync<C>
where
    C: Common + CommonEvents + ?Sized + 'static,
{
    pub fn new(
        interval: u64,
        from: H256,
        tx: mpsc::Sender<SignedUpdate>,
        contract: Arc<C>,
    ) -> Self {
        Self {
            committed_root: from,
            tx,
            contract,
            interval,
        }
    }

    async fn update_history(&mut self) -> Result<()> {
        let previous_update = self
            .contract
            .signed_update_by_new_root(self.committed_root)
            .await?;

        if previous_update.is_none() {
            info!(
                "HistorySync for contract {} has finished.",
                self.contract.name()
            );
            return Err(Report::new(WatcherError::SyncingFinished));
        }

        // Dispatch to the handler
        let previous_update = previous_update.unwrap();
        self.tx.send(previous_update.clone()).await?;

        // set up for next loop iteration
        self.committed_root = previous_update.update.previous_root;
        if self.committed_root.is_zero() {
            info!(
                "HistorySync for contract {} has finished.",
                self.contract.name()
            );
            return Err(Report::new(WatcherError::SyncingFinished));
        }

        Ok(())
    }

    #[tracing::instrument]
    fn spawn(mut self) -> JoinHandle<Result<()>> {
        tokio::spawn(async move {
            loop {
                let res = self.update_history().await;
                if res.is_err() {
                    // Syncing done
                    break;
                }

                sleep(Duration::from_secs(self.interval)).await;
            }

            Ok(())
        })
    }
}

#[derive(Debug)]
pub struct UpdateHandler {
    rx: mpsc::Receiver<SignedUpdate>,
    watcher_db: NomadDB,
    home: Arc<CachingHome>,
}

impl UpdateHandler {
    pub fn new(
        rx: mpsc::Receiver<SignedUpdate>,
        watcher_db: NomadDB,
        home: Arc<CachingHome>,
    ) -> Self {
        Self {
            rx,
            watcher_db,
            home,
        }
    }

    fn check_double_update(&mut self, update: &SignedUpdate) -> Result<(), DoubleUpdate> {
        let old_root = update.update.previous_root;
        let new_root = update.update.new_root;

        match self
            .watcher_db
            .update_by_previous_root(old_root)
            .expect("!db_get")
        {
            Some(existing) => {
                if existing.update.new_root != new_root {
                    error!(
                        "UpdateHandler detected double update! Existing: {:?}. Double: {:?}.",
                        &existing, &update
                    );
                    return Err(DoubleUpdate(existing, update.to_owned()));
                }
            }
            None => {
                info!(
                    "UpdateHandler storing new update from root {} to {}. Update: {:?}.",
                    &update.update.previous_root, &update.update.new_root, &update
                );
                self.watcher_db.store_update(update).expect("!db_put");
            }
        }

        Ok(())
    }

    /// Receive updates and check them for fraud. If double update was
    /// found, return Ok(double_update). This loop should never exit naturally
    /// unless the channel for sending new updates was closed, in which case we
    /// return an error.
    #[tracing::instrument]
    fn spawn(mut self) -> JoinHandle<Result<DoubleUpdate>> {
        tokio::spawn(async move {
            loop {
                let update = self.rx.recv().await;
                // channel is closed
                if update.is_none() {
                    bail!("Channel closed.")
                }

                let update = update.unwrap();
                let old_root = update.update.previous_root;

                if old_root == self.home.committed_root().await? {
                    // It is okay if tx reverts
                    let _ = self.home.update(&update).await;
                }

                if let Err(double_update) = self.check_double_update(&update) {
                    return Ok(double_update);
                }
            }
        })
    }
}

type TaskMap = Arc<RwLock<HashMap<String, Instrumented<JoinHandle<Result<()>>>>>>;

#[derive(Debug)]
pub struct Watcher {
    signer: Arc<Signers>,
    interval_seconds: u64,
    sync_tasks: TaskMap,
    watch_tasks: TaskMap,
    connection_managers: Vec<Arc<ConnectionManagers>>,
    core: AgentCore,
}

impl AsRef<AgentCore> for Watcher {
    fn as_ref(&self) -> &AgentCore {
        &self.core
    }
}

#[allow(clippy::unit_arg)]
impl Watcher {
    /// Instantiate a new watcher.
    pub fn new(
        signer: Signers,
        interval_seconds: u64,
        connection_managers: Vec<Arc<ConnectionManagers>>,
        core: AgentCore,
    ) -> Self {
        Self {
            signer: Arc::new(signer),
            interval_seconds,
            sync_tasks: Default::default(),
            watch_tasks: Default::default(),
            connection_managers,
            core,
        }
    }

    /// Spawn UpdateHandler and sync tasks. Have sync tasks send UpdateHandler
    /// signed updates through mpsc. Return Some(double_update) if any
    /// conflicting updates are found.
    fn watch_double_update(&self) -> Instrumented<JoinHandle<Result<Option<DoubleUpdate>>>> {
        let home = self.home();
        let replicas = self.replicas().clone();
        let watcher_db_name = format!("{}_{}", home.name(), AGENT_NAME);
        let watcher_db = NomadDB::new(watcher_db_name, self.db());
        let interval_seconds = self.interval_seconds;
        let sync_tasks = self.sync_tasks.clone();
        let watch_tasks = self.watch_tasks.clone();

        tokio::spawn(async move {
            // Spawn update handler
            let (tx, rx) = mpsc::channel(200);
            let handler = UpdateHandler::new(rx, watcher_db, home.clone()).spawn();

            // For each replica, spawn polling and history syncing tasks
            info!("Spawning replica watch and sync tasks...");
            for (name, replica) in replicas {
                info!("Spawning watch and sync tasks for replica {}.", name);
                let from = replica.committed_root().await?;

                watch_tasks.write().await.insert(
                    (*name).to_owned(),
                    ContractWatcher::new(interval_seconds, from, tx.clone(), replica.clone())
                        .spawn()
                        .in_current_span(),
                );
                sync_tasks.write().await.insert(
                    (*name).to_owned(),
                    HistorySync::new(interval_seconds, from, tx.clone(), replica)
                        .spawn()
                        .in_current_span(),
                );
            }

            // Spawn polling and history syncing tasks for home
            info!("Starting watch and sync tasks for home {}.", home.name());
            let from = home.committed_root().await?;
            let home_watcher =
                ContractWatcher::new(interval_seconds, from, tx.clone(), home.clone())
                    .spawn()
                    .in_current_span();
            let home_sync = HistorySync::new(interval_seconds, from, tx.clone(), home)
                .spawn()
                .in_current_span();

            // Wait for update handler to finish (should only happen watcher is
            // manually shut down)
            let double_update_res = handler.await?;

            // Cancel running tasks
            tracing::info!("Update handler has resolved. Cancelling all other tasks");
            cancel_task!(home_watcher);
            cancel_task!(home_sync);

            // Map Result<DoubleUpdate> into Option. If handler returned error
            // no double update. If handler returned Ok(double_update), map into
            // Some(double_update).
            Ok(double_update_res.ok())
        })
        .in_current_span()
    }

    /// Periodically poll `home.state()` to check for failure due to improper
    /// update. If failed state detected, return `State::Failed`.
    fn watch_improper_update(&self) -> Instrumented<JoinHandle<Result<State>>> {
        let home = self.home();
        let interval = self.interval_seconds;

        tokio::spawn(async move {
            loop {
                let state = home.state().await?;
                if state == State::Failed {
                    return Ok(state);
                }

                sleep(Duration::from_secs(interval)).await;
            }
        })
        .in_current_span()
    }

    async fn create_signed_failure(&self) -> SignedFailureNotification {
        FailureNotification {
            home_domain: self.home().local_domain(),
            updater: self.home().updater().await.unwrap().into(),
        }
        .sign_with(self.signer.as_ref())
        .await
        .expect("!sign")
    }

    /// Handle a double-update once it has been detected. Submit double updates
    /// and failure notifications to all homes/replicas.
    #[tracing::instrument]
    async fn handle_double_update_failure(
        &self,
        double: &DoubleUpdate,
    ) -> Vec<Result<TxOutcome, ChainCommunicationError>> {
        // Create vector of double update futures
        let mut double_update_futs: Vec<_> = self
            .core
            .replicas
            .values()
            .map(|replica| replica.double_update(double))
            .collect();
        double_update_futs.push(self.core.home.double_update(double));

        // Created signed failure notification
        let signed_failure = self.create_signed_failure().await;

        // Create vector of futures for unenrolling replicas (one per
        // connection manager)
        let mut unenroll_futs = Vec::new();
        for connection_manager in self.connection_managers.iter() {
            unenroll_futs.push(connection_manager.unenroll_replica(&signed_failure));
        }

        // Join both vectors of double update and unenroll futures and
        // return vector containing all results
        let (double_update_res, unenroll_res) =
            join(join_all(double_update_futs), join_all(unenroll_futs)).await;
        double_update_res
            .into_iter()
            .chain(unenroll_res.into_iter())
            .collect()
    }

    /// Handle a double-update once it has been detected. Submit double updates
    /// and failure notifications to all homes/replicas.
    #[tracing::instrument]
    async fn handle_improper_update_failure(
        &self,
    ) -> Vec<Result<TxOutcome, ChainCommunicationError>> {
        let signed_failure = self.create_signed_failure().await;
        let mut unenroll_futs = Vec::new();
        for connection_manager in self.connection_managers.iter() {
            unenroll_futs.push(connection_manager.unenroll_replica(&signed_failure));
        }

        join_all(unenroll_futs).await
    }

    async fn shutdown(&self) {
        for (_, v) in self.watch_tasks.write().await.drain() {
            cancel_task!(v);
        }
        for (_, v) in self.sync_tasks.write().await.drain() {
            cancel_task!(v);
        }
    }
}

#[async_trait]
#[allow(clippy::unit_arg)]
impl NomadAgent for Watcher {
    const AGENT_NAME: &'static str = AGENT_NAME;

    type Settings = Settings;

    #[tracing::instrument(err)]
    async fn from_settings(settings: Self::Settings) -> Result<Self>
    where
        Self: Sized,
    {
        let mut connection_managers = vec![];
        for chain_setup in settings.managers.values() {
            let signer = settings.base.get_signer(&chain_setup.name).await;
            let xapp_timelag = if settings.base.use_timelag {
                Some(chain_setup.timelag)
            } else {
                None
            };

            let manager = chain_setup
                .try_into_connection_manager(signer, xapp_timelag)
                .await;
            connection_managers.push(manager);
        }

        let (connection_managers, errors): (Vec<_>, Vec<_>) =
            connection_managers.into_iter().partition(Result::is_ok);

        // Report any invalid ConnectionManager chain setups
        errors.into_iter().for_each(|e| {
            let err = e.unwrap_err();
            tracing::error!("{:?}", err)
        });

        let connection_managers: Vec<_> = connection_managers
            .into_iter()
            .map(Result::unwrap)
            .map(Arc::new)
            .collect();

        let core = settings.as_ref().try_into_core("watcher").await?;

        Ok(Self::new(
            settings.watcher.try_into_signer().await?,
            settings.interval.parse().expect("invalid uint"),
            connection_managers,
            core,
        ))
    }

    #[tracing::instrument]
    fn run(&self, _name: &str) -> Instrumented<tokio::task::JoinHandle<Result<()>>> {
        panic!("Watcher::run should not be called. Always call run_all")
    }

    fn run_many(&self, _replicas: &[&str]) -> Instrumented<JoinHandle<Result<()>>> {
        panic!("Watcher::run_many should not be called. Always call run_all")
    }

    fn run_all(self) -> Instrumented<JoinHandle<Result<()>>>
    where
        Self: Sized + 'static,
    {
        tokio::spawn(async move {
            info!("Starting Watcher tasks");

            let indexer = &self.as_ref().indexer;
            let sync_metrics = ContractSyncMetrics::new(self.metrics());

            let home_sync_task = self
                .home()
                .sync(Self::AGENT_NAME.to_owned(), indexer.from(), indexer.chunk_size(), sync_metrics.clone(), IndexDataTypes::Updates);

            let replica_sync_tasks: Vec<Instrumented<JoinHandle<Result<()>>>> = self.replicas().values().map(|replica| {
                replica.sync(Self::AGENT_NAME.to_owned(), indexer.from(), indexer.chunk_size(), sync_metrics.clone())
            }).collect();

            let mut sync_tasks = vec![home_sync_task];
            sync_tasks.extend(replica_sync_tasks);
            let sync_task_unified = select_all(sync_tasks);

            let double_update_watch_task = self.watch_double_update();
            let improper_update_watch_task = self.watch_improper_update();

            // Race index and run tasks
            info!("Selecting across tasks...");
            select! {
                _ = sync_task_unified => {
                    info!("Syncing tasks finished early!");
                    self.shutdown().await;
                },
                double_res = double_update_watch_task => {
                    let opt_double = double_res??;
                    if let Some(double) = opt_double {
                        tracing::error!(
                            double_update = ?double,
                            "Double update detected! Notifying all contracts and unenrolling replicas! Double update: {:?}",
                            double
                        );

                        self.handle_double_update_failure(&double)
                            .await
                            .iter()
                            .for_each(|res| tracing::info!("{:#?}", res));

                        bail!(
                            r#"
                            Double update detected!
                            All contracts notified!
                            Replicas unenrolled!
                            Watcher has been shut down!
                        "#
                        )
                    }

                    self.shutdown().await;
                },
                improper_res = improper_update_watch_task => {
                    let state = improper_res??;
                    if state == State::Failed {
                        self.handle_improper_update_failure()
                            .await
                            .iter()
                            .for_each(|res| tracing::info!("{:#?}", res));

                        bail!(
                            r#"
                            Improper update detected!
                            Replicas unenrolled!
                            Watcher has been shut down!
                        "#
                        )
                    }

                    self.shutdown().await;
                }
            }

            Ok(())
        })
        .instrument(info_span!("Watcher::run_all"))
    }
}

#[cfg(test)]
mod test {
    use nomad_base::IndexSettings;
    use nomad_test::mocks::MockIndexer;
    use std::sync::Arc;
    use tokio::sync::mpsc;

    use ethers::core::types::H256;
    use ethers::signers::{LocalWallet, Signer};

    use nomad_base::{CachingReplica, CommonIndexers, HomeIndexers, Homes, Replicas};
    use nomad_core::{DoubleUpdate, SignedFailureNotification, Update};
    use nomad_test::mocks::{MockConnectionManagerContract, MockHomeContract, MockReplicaContract};
    use nomad_test::test_utils;

    use super::*;

    #[tokio::test]
    async fn contract_watcher_polls_and_sends_update() {
        test_utils::run_test_db(|db| async move {
            let signer: LocalWallet =
                "1111111111111111111111111111111111111111111111111111111111111111"
                    .parse()
                    .unwrap();

            let first_root = H256::from([0; 32]);
            let second_root = H256::from([1; 32]);

            let signed_update = Update {
                home_domain: 1,
                previous_root: first_root,
                new_root: second_root,
            }
            .sign_with(&signer)
            .await
            .expect("!sign");

            let mut mock_home = MockHomeContract::new();
            let nomad_db = NomadDB::new("home_1", db.clone());

            {
                mock_home.expect__name().return_const("home_1".to_owned());

                // When home polls for new update it gets `signed_update`
                nomad_db.store_latest_update(&signed_update).unwrap();
            }

            let mock_home_indexer = Arc::new(MockIndexer::new().into());
            let home: Arc<CachingHome> =
                CachingHome::new(mock_home.into(), nomad_db.clone(), mock_home_indexer).into();

            let (tx, mut rx) = mpsc::channel(200);
            let mut contract_watcher =
                ContractWatcher::new(3, first_root, tx.clone(), home.clone());

            contract_watcher
                .poll_and_send_update()
                .await
                .expect("Should have received Ok(())");

            assert_eq!(contract_watcher.committed_root, second_root);
            assert_eq!(rx.recv().await.unwrap(), signed_update);
        })
        .await
    }

    #[tokio::test]
    async fn history_sync_updates_history() {
        test_utils::run_test_db(|db| async move {
            let signer: LocalWallet =
                "1111111111111111111111111111111111111111111111111111111111111111"
                    .parse()
                    .unwrap();

            let zero_root = H256::zero(); // Original zero root
            let first_root = H256::from([1; 32]);
            let second_root = H256::from([2; 32]);

            // Zero root to first root
            let first_signed_update = Update {
                home_domain: 1,
                previous_root: zero_root,
                new_root: first_root,
            }
            .sign_with(&signer)
            .await
            .expect("!sign");

            // First root to second root
            let second_signed_update = Update {
                home_domain: 1,
                previous_root: first_root,
                new_root: second_root,
            }
            .sign_with(&signer)
            .await
            .expect("!sign");

            let mut mock_home = MockHomeContract::new();
            let nomad_db = NomadDB::new("home_1", db.clone());

            {
                mock_home.expect__name().return_const("home_1".to_owned());

                // When HistorySync works through history it finds second and first signed updates
                nomad_db.store_latest_update(&first_signed_update).unwrap();
                nomad_db.store_latest_update(&second_signed_update).unwrap();
            }

            let mock_home_indexer = Arc::new(MockIndexer::new().into());
            let home: Arc<CachingHome> =
                CachingHome::new(mock_home.into(), nomad_db.clone(), mock_home_indexer).into();

            let (tx, mut rx) = mpsc::channel(200);
            let mut history_sync = HistorySync::new(3, second_root, tx.clone(), home.clone());

            // First update_history call returns first -> second update
            history_sync
                .update_history()
                .await
                .expect("Should have received Ok(())");

            assert_eq!(history_sync.committed_root, first_root);
            assert_eq!(rx.recv().await.unwrap(), second_signed_update);

            // Second update_history call returns zero -> first update
            // and should return WatcherError::SyncingFinished
            history_sync
                .update_history()
                .await
                .expect_err("Should have received WatcherError::SyncingFinished");

            assert_eq!(history_sync.committed_root, zero_root);
            assert_eq!(rx.recv().await.unwrap(), first_signed_update)
        })
        .await
    }

    #[tokio::test]
    async fn update_handler_detects_double_update() {
        test_utils::run_test_db(|db| async move {
            let signer: LocalWallet =
                "1111111111111111111111111111111111111111111111111111111111111111"
                    .parse()
                    .unwrap();

            let first_root = H256::from([1; 32]);
            let second_root = H256::from([2; 32]);
            let third_root = H256::from([3; 32]);
            let bad_third_root = H256::from([4; 32]);

            let first_update = Update {
                home_domain: 1,
                previous_root: first_root,
                new_root: second_root,
            }
            .sign_with(&signer)
            .await
            .expect("!sign");

            let second_update = Update {
                home_domain: 1,
                previous_root: second_root,
                new_root: third_root,
            }
            .sign_with(&signer)
            .await
            .expect("!sign");

            let bad_second_update = Update {
                home_domain: 1,
                previous_root: second_root,
                new_root: bad_third_root,
            }
            .sign_with(&signer)
            .await
            .expect("!sign");

            let mut mock_home = MockHomeContract::new();
            mock_home.expect__name().return_const("home_1".to_owned());

            let nomad_db = NomadDB::new("home_1_watcher", db);
            let mock_home_indexer = Arc::new(MockIndexer::new().into());
            let home: Arc<CachingHome> =
                CachingHome::new(mock_home.into(), nomad_db.clone(), mock_home_indexer).into();

            let (_tx, rx) = mpsc::channel(200);
            let mut handler = UpdateHandler {
                rx,
                watcher_db: nomad_db.clone(),
                home,
            };

            let _first_update_ret = handler
                .check_double_update(&first_update)
                .expect("Update should have been valid");

            let _second_update_ret = handler
                .check_double_update(&second_update)
                .expect("Update should have been valid");

            let bad_second_update_ret = handler
                .check_double_update(&bad_second_update)
                .expect_err("Update should have been invalid");
            assert_eq!(
                bad_second_update_ret,
                DoubleUpdate(second_update, bad_second_update)
            );
        })
        .await
    }

    #[tokio::test]
    async fn it_fails_contracts_and_unenrolls_replicas_on_double_update() {
        test_utils::run_test_db(|db| async move {
            let home_domain = 1;

            let updater: LocalWallet =
                "1111111111111111111111111111111111111111111111111111111111111111"
                    .parse()
                    .unwrap();

            // Double update setup
            let first_root = H256::from([1; 32]);
            let second_root = H256::from([2; 32]);
            let bad_second_root = H256::from([3; 32]);

            let update = Update {
                home_domain,
                previous_root: first_root,
                new_root: second_root,
            }
            .sign_with(&updater)
            .await
            .expect("!sign");

            let bad_update = Update {
                home_domain,
                previous_root: first_root,
                new_root: bad_second_root,
            }
            .sign_with(&updater)
            .await
            .expect("!sign");

            let double = DoubleUpdate(update, bad_update);
            let signed_failure = FailureNotification {
                home_domain,
                updater: updater.address().into(),
            }
            .sign_with(&updater)
            .await
            .expect("!sign");

            // Contract setup
            let mut mock_connection_manager_1 = MockConnectionManagerContract::new();
            let mut mock_connection_manager_2 = MockConnectionManagerContract::new();

            let mut mock_home = MockHomeContract::new();
            let mut mock_replica_1 = MockReplicaContract::new();
            let mut mock_replica_2 = MockReplicaContract::new();

            // Home and replica expectations
            {
                mock_home.expect__name().return_const("home_1".to_owned());

                mock_home
                    .expect__local_domain()
                    .times(1)
                    .return_once(move || home_domain);

                let updater = updater.clone();
                mock_home
                    .expect__updater()
                    .times(1)
                    .return_once(move || Ok(updater.address().into()));

                // home.double_update called once
                let double = double.clone();
                mock_home
                    .expect__double_update()
                    .withf(move |d: &DoubleUpdate| *d == double)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }
            {
                mock_replica_1
                    .expect__name()
                    .return_const("replica_1".to_owned());

                // replica_1.double_update called once
                let double = double.clone();
                mock_replica_1
                    .expect__double_update()
                    .withf(move |d: &DoubleUpdate| *d == double)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }
            {
                mock_replica_2
                    .expect__name()
                    .return_const("replica_2".to_owned());

                // replica_2.double_update called once
                let double = double.clone();
                mock_replica_2
                    .expect__double_update()
                    .withf(move |d: &DoubleUpdate| *d == double)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }

            // Connection manager expectations
            {
                // connection_manager_1.unenroll_replica called once
                let signed_failure = signed_failure.clone();
                mock_connection_manager_1
                    .expect__unenroll_replica()
                    .withf(move |f: &SignedFailureNotification| *f == signed_failure)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }
            {
                // connection_manager_2.unenroll_replica called once
                let signed_failure = signed_failure.clone();
                mock_connection_manager_2
                    .expect__unenroll_replica()
                    .withf(move |f: &SignedFailureNotification| *f == signed_failure)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }

            // Watcher agent setup
            let mut connection_managers: Vec<Arc<ConnectionManagers>> = vec![
                Arc::new(mock_connection_manager_1.into()),
                Arc::new(mock_connection_manager_2.into()),
            ];

            let mock_indexer: Arc<CommonIndexers> = Arc::new(MockIndexer::new().into());
            let mock_home_indexer: Arc<HomeIndexers> = Arc::new(MockIndexer::new().into());
            let mut mock_home: Homes = mock_home.into();
            let mut mock_replica_1: Replicas = mock_replica_1.into();
            let mut mock_replica_2: Replicas = mock_replica_2.into();

            let home_db = NomadDB::new("home_1", db.clone());
            let replica_1_db = NomadDB::new("replica_1", db.clone());
            let replica_2_db = NomadDB::new("replica_2", db.clone());

            {
                let home: Arc<CachingHome> = CachingHome::new(
                    mock_home.clone(),
                    home_db.clone(),
                    mock_home_indexer.clone(),
                )
                .into();
                let replica_1: Arc<CachingReplica> = CachingReplica::new(
                    mock_replica_1.clone(),
                    replica_1_db.clone(),
                    mock_indexer.clone(),
                )
                .into();
                let replica_2: Arc<CachingReplica> = CachingReplica::new(
                    mock_replica_2.clone(),
                    replica_2_db.clone(),
                    mock_indexer.clone(),
                )
                .into();

                let mut replica_map: HashMap<String, Arc<CachingReplica>> = HashMap::new();
                replica_map.insert("replica_1".into(), replica_1);
                replica_map.insert("replica_2".into(), replica_2);

                let core = AgentCore {
                    home: home.clone(),
                    replicas: replica_map,
                    db,
                    indexer: IndexSettings::default(),
                    settings: nomad_base::Settings::default(),
                    metrics: Arc::new(
                        nomad_base::CoreMetrics::new(
                            "watcher_test",
                            None,
                            Arc::new(prometheus::Registry::new()),
                        )
                        .expect("could not make metrics"),
                    ),
                };

                {
                    let watcher =
                        Watcher::new(updater.into(), 1, connection_managers.clone(), core);
                    watcher.handle_double_update_failure(&double).await;
                }

                // Checkpoint connection managers
                for connection_manager in connection_managers.iter_mut() {
                    Arc::get_mut(connection_manager).unwrap().checkpoint();
                }
            }

            // Checkpoint home and replicas
            Arc::get_mut(&mut mock_home).unwrap().checkpoint();
            Arc::get_mut(&mut mock_replica_1).unwrap().checkpoint();
            Arc::get_mut(&mut mock_replica_2).unwrap().checkpoint();
        })
        .await
    }

    #[tokio::test]
    async fn it_unenrolls_replicas_on_improper_update() {
        test_utils::run_test_db(|db| async move {
            let home_domain = 1;

            let updater: LocalWallet =
                "1111111111111111111111111111111111111111111111111111111111111111"
                    .parse()
                    .unwrap();

            let signed_failure = FailureNotification {
                home_domain,
                updater: updater.address().into(),
            }
            .sign_with(&updater)
            .await
            .expect("!sign");

            // Contract setup
            let mut mock_connection_manager_1 = MockConnectionManagerContract::new();
            let mut mock_connection_manager_2 = MockConnectionManagerContract::new();

            let mut mock_home = MockHomeContract::new();
            let mock_replica_1 = MockReplicaContract::new();
            let mock_replica_2 = MockReplicaContract::new();

            // Home and replica expectations
            {
                mock_home.expect__name().return_const("home_1".to_owned());

                mock_home
                    .expect__local_domain()
                    .times(1)
                    .return_once(move || home_domain);

                let updater = updater.clone();
                mock_home
                    .expect__updater()
                    .times(1)
                    .return_once(move || Ok(updater.address().into()));

                // Home returns failed state
                mock_home
                    .expect__state()
                    .times(1)
                    .return_once(move || Ok(State::Failed));
            }

            // Connection manager expectations
            {
                // connection_manager_1.unenroll_replica called once
                let signed_failure = signed_failure.clone();
                mock_connection_manager_1
                    .expect__unenroll_replica()
                    .withf(move |f: &SignedFailureNotification| *f == signed_failure)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }
            {
                // connection_manager_2.unenroll_replica called once
                let signed_failure = signed_failure.clone();
                mock_connection_manager_2
                    .expect__unenroll_replica()
                    .withf(move |f: &SignedFailureNotification| *f == signed_failure)
                    .times(1)
                    .return_once(move |_| {
                        Ok(TxOutcome {
                            txid: H256::default(),
                            executed: true,
                        })
                    });
            }

            // Watcher agent setup
            let mut connection_managers: Vec<Arc<ConnectionManagers>> = vec![
                Arc::new(mock_connection_manager_1.into()),
                Arc::new(mock_connection_manager_2.into()),
            ];

            let mock_indexer: Arc<CommonIndexers> = Arc::new(MockIndexer::new().into());
            let mock_home_indexer: Arc<HomeIndexers> = Arc::new(MockIndexer::new().into());
            let mut mock_home: Homes = mock_home.into();
            let mut mock_replica_1: Replicas = mock_replica_1.into();
            let mut mock_replica_2: Replicas = mock_replica_2.into();

            let home_db = NomadDB::new("home_1", db.clone());
            let replica_1_db = NomadDB::new("replica_1", db.clone());
            let replica_2_db = NomadDB::new("replica_2", db.clone());

            {
                let home: Arc<CachingHome> = CachingHome::new(
                    mock_home.clone(),
                    home_db.clone(),
                    mock_home_indexer.clone(),
                )
                .into();
                let replica_1: Arc<CachingReplica> = CachingReplica::new(
                    mock_replica_1.clone(),
                    replica_1_db.clone(),
                    mock_indexer.clone(),
                )
                .into();
                let replica_2: Arc<CachingReplica> = CachingReplica::new(
                    mock_replica_2.clone(),
                    replica_2_db.clone(),
                    mock_indexer.clone(),
                )
                .into();

                let mut replica_map: HashMap<String, Arc<CachingReplica>> = HashMap::new();
                replica_map.insert("replica_1".into(), replica_1);
                replica_map.insert("replica_2".into(), replica_2);

                let core = AgentCore {
                    home: home.clone(),
                    replicas: replica_map,
                    db,
                    indexer: IndexSettings::default(),
                    settings: nomad_base::Settings::default(),
                    metrics: Arc::new(
                        nomad_base::CoreMetrics::new(
                            "watcher_test",
                            None,
                            Arc::new(prometheus::Registry::new()),
                        )
                        .expect("could not make metrics"),
                    ),
                };

                let watcher = Watcher::new(updater.into(), 1, connection_managers.clone(), core);
                let state = watcher.watch_improper_update().await.unwrap().unwrap();
                assert_eq!(state, State::Failed);

                watcher.handle_improper_update_failure().await;
            }

            // Checkpoint connection managers
            for connection_manager in connection_managers.iter_mut() {
                Arc::get_mut(connection_manager).unwrap().checkpoint();
            }

            // Checkpoint home and replicas
            Arc::get_mut(&mut mock_home).unwrap().checkpoint();
            Arc::get_mut(&mut mock_replica_1).unwrap().checkpoint();
            Arc::get_mut(&mut mock_replica_2).unwrap().checkpoint();
        })
        .await
    }
}
