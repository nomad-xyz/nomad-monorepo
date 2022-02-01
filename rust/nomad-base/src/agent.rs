use crate::{
    cancel_task,
    metrics::CoreMetrics,
    settings::{IndexSettings, Settings},
    BaseError, CachingHome, CachingReplica, ContractSyncMetrics, IndexDataTypes,
};
use async_trait::async_trait;
use color_eyre::{eyre::WrapErr, Result};
use futures_util::future::select_all;
use nomad_core::db::DB;
use tracing::instrument::Instrumented;
use tracing::{info_span, Instrument};

use std::{collections::HashMap, sync::Arc, time::Duration};
use tokio::{task::JoinHandle, time::sleep};

/// Properties shared across all agents
#[derive(Debug)]
pub struct AgentCore {
    /// A boxed Home
    pub home: Arc<CachingHome>,
    /// A map of boxed Replicas
    pub replicas: HashMap<String, Arc<CachingReplica>>,
    /// A persistent KV Store (currently implemented as rocksdb)
    pub db: DB,
    /// Prometheus metrics
    pub metrics: Arc<CoreMetrics>,
    /// The height at which to start indexing the Home
    pub indexer: IndexSettings,
    /// Settings this agent was created with
    pub settings: crate::settings::Settings,
}

/// A trait for an application:
///      that runs on a replica
/// and:
///     a reference to a home.
#[async_trait]
pub trait NomadAgent: Send + Sync + std::fmt::Debug + AsRef<AgentCore> {
    /// The agent's name
    const AGENT_NAME: &'static str;

    /// The settings object for this agent
    type Settings: AsRef<Settings>;

    /// Instantiate the agent from the standard settings object
    async fn from_settings(settings: Self::Settings) -> Result<Self>
    where
        Self: Sized;

    /// Return a handle to the metrics registry
    fn metrics(&self) -> Arc<CoreMetrics> {
        self.as_ref().metrics.clone()
    }

    /// Return a handle to the DB
    fn db(&self) -> DB {
        self.as_ref().db.clone()
    }

    /// Return a reference to a home contract
    fn home(&self) -> Arc<CachingHome> {
        self.as_ref().home.clone()
    }

    /// Get a reference to the replicas map
    fn replicas(&self) -> &HashMap<String, Arc<CachingReplica>> {
        &self.as_ref().replicas
    }

    /// Get a reference to a replica by its name
    fn replica_by_name(&self, name: &str) -> Option<Arc<CachingReplica>> {
        self.replicas().get(name).map(Clone::clone)
    }

    /// Run the agent with the given home and replica
    fn run(&self, replica: &str) -> Instrumented<JoinHandle<Result<()>>>;

    /// Run the Agent, and tag errors with the domain ID of the replica
    #[allow(clippy::unit_arg)]
    #[tracing::instrument]
    fn run_report_error(&self, replica: &str) -> Instrumented<JoinHandle<Result<()>>> {
        let m = format!("Task for replica named {} failed", replica);
        let handle = self.run(replica).in_current_span();

        let fut = async move { handle.await?.wrap_err(m) };

        tokio::spawn(fut).in_current_span()
    }

    /// Run several agents by replica name
    #[allow(clippy::unit_arg)]
    fn run_many(&self, replicas: &[&str]) -> Instrumented<JoinHandle<Result<()>>> {
        let span = info_span!("run_many");
        let handles: Vec<_> = replicas
            .iter()
            .map(|replica| self.run_report_error(replica))
            .collect();

        tokio::spawn(async move {
            // This gets the first future to resolve.
            let (res, _, remaining) = select_all(handles).await;

            for task in remaining.into_iter() {
                cancel_task!(task);
            }

            res?
        })
        .instrument(span)
    }

    /// Run several agents
    #[allow(clippy::unit_arg, unused_must_use)]
    fn run_all(self) -> Instrumented<JoinHandle<Result<()>>>
    where
        Self: Sized + 'static,
    {
        let span = info_span!("run_all");
        tokio::spawn(async move {
            self.assert_home_not_failed().await?;
            // this is the unused must use
            let names: Vec<&str> = self.replicas().keys().map(|k| k.as_str()).collect();

            let run_task = self.run_many(&names);
            let home_fail_watch_task = self.watch_home_fail(5);

            let mut tasks = vec![run_task, home_fail_watch_task];

            // kludge
            if Self::AGENT_NAME != "kathy" {
                let sync_metrics = ContractSyncMetrics::new(self.metrics());

                let indexer = &self.as_ref().indexer;

                // Only the processor needs to index messages so default is
                // just indexing updates
                let sync_task = self.home().sync(
                    Self::AGENT_NAME.to_owned(),
                    indexer.from(),
                    indexer.chunk_size(),
                    sync_metrics,
                    IndexDataTypes::Updates,
                );

                tasks.push(sync_task);
            }

            let (res, _, remaining) = select_all(tasks).await;

            for task in remaining.into_iter() {
                cancel_task!(task);
            }

            res?
        })
        .instrument(span)
    }

    /// Spawn a task which continuously watch home for getting into failed state
    /// and resolve once it happened.
    /// `Reported` flag turns `Ok(())` into `Err(Report)` on failed home.
    #[allow(clippy::unit_arg)]
    fn watch_home_fail(&self, interval: u64) -> Instrumented<JoinHandle<Result<()>>> {
        use nomad_core::Common;
        let span = info_span!("home_watch");
        let home = self.home();
        tokio::spawn(async move {
            let home = home.clone();
            loop {
                if home.state().await? == nomad_core::State::Failed {
                    return Err(BaseError::FailedHome.into());
                }

                sleep(Duration::from_secs(interval)).await;
            }
        })
        .instrument(span)
    }

    /// Returns `true` if home is in failed state. Intended to return once and immediately
    #[allow(clippy::unit_arg)]
    fn assert_home_not_failed(&self) -> Instrumented<JoinHandle<Result<()>>> {
        use nomad_core::Common;
        let span = info_span!("check_home_state");
        let home = self.home();
        tokio::spawn(async move {
            if home.state().await? == nomad_core::State::Failed {
                Err(BaseError::FailedHome.into())
            } else {
                Ok(())
            }
        })
        .instrument(span)
    }
}
