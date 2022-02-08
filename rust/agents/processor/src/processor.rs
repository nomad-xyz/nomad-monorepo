use async_trait::async_trait;
use color_eyre::{eyre::bail, Result};
use ethers::prelude::H256;
use futures_util::future::select_all;
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
    time::Duration,
};
use tokio::{sync::RwLock, task::JoinHandle, time::sleep};
use tracing::{debug, error, info, info_span, instrument, instrument::Instrumented, Instrument};

use nomad_base::{
    cancel_task, decl_agent, AgentCore, CachingHome, CachingReplica, ChannelBase,
    ContractSyncMetrics, IndexDataTypes, NomadAgent, NomadDB, ProcessorError,
};
use nomad_core::{
    accumulator::merkle::Proof, CommittedMessage, Common, Home, HomeEvents, MessageStatus,
};

use crate::{
    prover_sync::ProverSync,
    push::Pusher,
    settings::{ProcessorSettings as Settings, S3Config},
};

const AGENT_NAME: &str = "processor";
static CURRENT_NONCE: &str = "current_nonce_";

enum Flow {
    Advance,
    Repeat,
}

/// The replica processor is responsible for polling messages and waiting until they validate
/// before proving/processing them.
#[derive(Debug)]
pub(crate) struct Replica {
    interval: u64,
    replica: Arc<CachingReplica>,
    home: Arc<CachingHome>,
    db: NomadDB,
    allowed: Option<Arc<HashSet<H256>>>,
    denied: Option<Arc<HashSet<H256>>>,
    next_message_nonce: prometheus::IntGauge,
}

impl std::fmt::Display for Replica {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "ReplicaProcessor: {{ home: {:?}, replica: {:?}, allowed: {:?}, denied: {:?} }}",
            self.home, self.replica, self.allowed, self.denied
        )
    }
}

impl Replica {
    #[instrument(skip(self), fields(self = %self))]
    fn main(self) -> JoinHandle<Result<()>> {
        tokio::spawn(
            async move {
                use nomad_core::Replica;

                let replica_domain = self.replica.local_domain();

                // The basic structure of this loop is as follows:
                // 1. Get the last processed index
                // 2. Check if the Home knows of a message above that index
                //      - If not, wait and poll again
                // 3. Check if we have a proof for that message
                //      - If not, wait and poll again
                // 4. Check if the proof is valid under the replica
                // 5. Submit the proof to the replica
                let mut next_message_nonce: u32 = self
                    .db
                    .retrieve_keyed_decodable(CURRENT_NONCE, &replica_domain)?
                    .map(|n: u32| n + 1)
                    .unwrap_or_default();

                self.next_message_nonce.set(next_message_nonce as i64);

                info!(
                    replica_domain,
                    nonce = next_message_nonce,
                    replica = self.replica.name(),
                    "Starting processor for {}:{} at nonce {}",
                    self.replica.name(),
                    replica_domain,
                    next_message_nonce
                );

                loop {
                    let seq_span = tracing::trace_span!(
                        "ReplicaProcessor",
                        name = self.replica.name(),
                        nonce = next_message_nonce,
                        replica_domain = replica_domain,
                        home_domain = self.home.local_domain(),
                    );

                    match self
                        .try_msg_by_domain_and_nonce(replica_domain, next_message_nonce)
                        .instrument(seq_span)
                        .await
                    {
                        Ok(Flow::Advance) => {
                            self.db
                            .store_keyed_encodable(CURRENT_NONCE, &replica_domain, &next_message_nonce)?;

                            next_message_nonce += 1;
                            self.next_message_nonce.set(next_message_nonce as i64);
                        }
                        Ok(Flow::Repeat) => {
                            // there was some fault, let's wait and then try again later when state may have moved
                            debug!(
                                replica_domain,
                                nonce = next_message_nonce,
                                replica = self.replica.name(),
                                "Failed to find message_by_nonce or proof_by_leaf_index. Processor retrying message. Replica: {}. Nonce: {}. Domain: {}.",
                                self.replica.name(),
                                next_message_nonce,
                                replica_domain,
                            );
                            sleep(Duration::from_secs(self.interval)).await
                        }
                        Err(e) => {
                            error!("fatal error in processor::Replica: {}", e);
                            bail!(e)
                        }
                    }
                }
            }
            .in_current_span(),
        )
    }

    /// Attempt to process a message.
    ///
    /// Postcondition: ```match retval? {
    ///   Advance => message skipped ⊻ message was processed
    ///   Repeat => try again later
    /// }```
    ///
    /// In case of error: send help?
    #[instrument(err, skip(self), fields(self = %self))]
    async fn try_msg_by_domain_and_nonce(&self, domain: u32, nonce: u32) -> Result<Flow> {
        use nomad_core::Replica;

        let message = match self.home.message_by_nonce(domain, nonce).await {
            Ok(Some(m)) => m,
            Ok(None) => {
                info!(
                    domain = domain,
                    sequence = nonce,
                    "Message not yet found {}:{}",
                    domain,
                    nonce,
                );
                return Ok(Flow::Repeat);
            }
            Err(e) => bail!(e),
        };

        info!(target: "seen_committed_messages", leaf_index = message.leaf_index);
        let sender = message.message.sender;

        // if we have an allow list, filter senders not on it
        if let Some(false) = self.allowed.as_ref().map(|set| set.contains(&sender)) {
            info!(
                sender = ?sender,
                nonce = nonce,
                "Skipping message because sender not on allow list. Sender: {}. Domain: {}. Nonce: {}",
                sender,
                domain,
                nonce
            );
            return Ok(Flow::Advance);
        }

        // if we have a deny list, filter senders on it
        if let Some(true) = self.denied.as_ref().map(|set| set.contains(&sender)) {
            info!(
                sender = ?sender,
                nonce = nonce,
                "Skipping message because sender on deny list. Sender: {}. Domain: {}. Nonce: {}",
                sender,
                domain,
                nonce
            );
            return Ok(Flow::Advance);
        }

        let proof = match self.db.proof_by_leaf_index(message.leaf_index) {
            Ok(Some(p)) => p,
            Ok(None) => {
                info!(
                    leaf_hash = ?message.to_leaf(),
                    leaf_index = message.leaf_index,
                    "Proof not yet found"
                );
                return Ok(Flow::Repeat);
            }
            Err(e) => bail!(e),
        };

        if proof.leaf != message.to_leaf() {
            bail!(ProcessorError::ProverConflictError {
                index: message.leaf_index,
                calculated_leaf: message.to_leaf(),
                proof_leaf: proof.leaf,
            });
        }

        while !self.replica.acceptable_root(proof.root()).await? {
            info!(
                leaf_hash = ?message.to_leaf(),
                leaf_index = message.leaf_index,
                "Proof under {root} not yet valid here, waiting until Replica confirms",
                root = proof.root(),
            );
            sleep(Duration::from_secs(self.interval)).await;
        }

        info!(
            leaf_hash = ?message.to_leaf(),
            leaf_index = message.leaf_index,
            "Dispatching a message for processing {}:{}",
            domain,
            nonce
        );

        self.process(message, proof).await?;

        Ok(Flow::Advance)
    }

    #[instrument(err, level = "trace", skip(self), fields(self = %self))]
    /// Dispatch a message for processing. If the message is already proven, process only.
    async fn process(&self, message: CommittedMessage, proof: Proof) -> Result<()> {
        use nomad_core::Replica;
        let status = self.replica.message_status(message.to_leaf()).await?;

        let opt_tx_outcome = match status {
            MessageStatus::None => Some(
                self.replica
                    .prove_and_process(message.as_ref(), &proof)
                    .await?,
            ),
            MessageStatus::Proven => Some(self.replica.process(message.as_ref()).await?),
            MessageStatus::Processed => {
                info!(
                    domain = message.message.destination,
                    nonce = message.message.nonce,
                    leaf_index = message.leaf_index,
                    leaf = ?message.message.to_leaf(),
                    "Message {}:{} already processed",
                    message.message.destination,
                    message.message.nonce
                );
                None
            }
        };

        if let Some(tx_outcome) = opt_tx_outcome {
            if !tx_outcome.executed {
                return Err(ProcessorError::ProcessTransactionReverted {
                    tx: tx_outcome.txid,
                }
                .into());
            }
        }

        info!(
            domain = message.message.destination,
            nonce = message.message.nonce,
            leaf_index = message.leaf_index,
            leaf = ?message.message.to_leaf(),
            "Processed message. Destination: {}. Nonce: {}. Leaf index: {}.",
            message.message.destination,
            message.message.nonce,
            message.leaf_index,
        );

        Ok(())
    }
}

decl_agent!(
    /// A processor agent
    Processor {
        interval: u64,
        replica_tasks: RwLock<HashMap<String, JoinHandle<Result<()>>>>,
        allowed: Option<Arc<HashSet<H256>>>,
        denied: Option<Arc<HashSet<H256>>>,
        index_only: bool,
        next_message_nonces: prometheus::IntGaugeVec,
        config: Option<S3Config>,
    }
);

impl Processor {
    /// Instantiate a new processor
    pub fn new(
        interval: u64,
        core: AgentCore,
        allowed: Option<HashSet<H256>>,
        denied: Option<HashSet<H256>>,
        index_only: bool,
        config: Option<S3Config>,
    ) -> Self {
        let next_message_nonces = core
            .metrics
            .new_int_gauge(
                "next_message_nonce",
                "Index of the next message to inspect",
                &["home", "replica", "agent"],
            )
            .expect("processor metric already registered -- should have be a singleton");

        Self {
            interval,
            core,
            replica_tasks: Default::default(),
            allowed: allowed.map(Arc::new),
            denied: denied.map(Arc::new),
            next_message_nonces,
            index_only,
            config,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ProcessorChannel {
    base: ChannelBase,
    next_message_nonce: prometheus::IntGauge,
    allowed: Option<Arc<HashSet<H256>>>,
    denied: Option<Arc<HashSet<H256>>>,
    interval: u64,
}

#[async_trait]
#[allow(clippy::unit_arg)]
impl NomadAgent for Processor {
    const AGENT_NAME: &'static str = AGENT_NAME;

    type Settings = Settings;

    type Channel = ProcessorChannel;

    async fn from_settings(settings: Self::Settings) -> Result<Self>
    where
        Self: Sized,
    {
        Ok(Self::new(
            settings.interval.parse().expect("invalid integer"),
            settings.as_ref().try_into_core(AGENT_NAME).await?,
            settings.allowed,
            settings.denied,
            settings.indexon.is_some(),
            settings.s3,
        ))
    }

    fn build_channel(&self, replica: &str) -> Self::Channel {
        Self::Channel {
            base: self.channel_base(replica),
            next_message_nonce: self.next_message_nonces.with_label_values(&[
                self.home().name(),
                replica,
                Self::AGENT_NAME,
            ]),
            allowed: self.allowed.clone(),
            denied: self.denied.clone(),
            interval: self.interval,
        }
    }

    fn run(channel: Self::Channel) -> Instrumented<JoinHandle<Result<()>>> {
        tokio::spawn(async move {
            Replica {
                interval: channel.interval,
                replica: channel.base.replica,
                home: channel.base.home,
                db: channel.base.db,
                allowed: channel.allowed,
                denied: channel.denied,
                next_message_nonce: channel.next_message_nonce,
            }
            .main()
            .await?
        })
        .in_current_span()
    }

    fn run_all(self) -> Instrumented<JoinHandle<Result<()>>>
    where
        Self: Sized + 'static,
    {
        tokio::spawn(async move {
            self.assert_home_not_failed().await??;

            info!("Starting Processor tasks");

            // tree sync
            info!("Starting ProverSync");
            let db = NomadDB::new(self.home().name().to_owned(), self.db());
            let sync = ProverSync::from_disk(db.clone());
            let prover_sync_task = sync.spawn();

            info!("Starting indexer");
            let indexer = &self.as_ref().indexer;
            let sync_metrics = ContractSyncMetrics::new(self.metrics());

            let home_sync_task = self.home().sync(
                Self::AGENT_NAME.to_owned(),
                indexer.from(),
                indexer.chunk_size(),
                sync_metrics,
                IndexDataTypes::Both,
            );

            let home_fail_watch_task = self.watch_home_fail(self.interval);

            info!("started indexer, sync and home fail watch");

            // instantiate task array here so we can optionally push run_task
            let mut tasks = vec![home_sync_task, prover_sync_task, home_fail_watch_task];

            if !self.index_only {
                // this is the unused must use
                let names: Vec<&str> = self.replicas().keys().map(|k| k.as_str()).collect();
                tasks.push(self.run_many(&names));
            }

            // if we have a bucket, add a task to push to it
            if let Some(config) = &self.config {
                info!(bucket = %config.bucket, "Starting S3 push tasks");
                tasks.push(
                    Pusher::new(
                        self.core.home.name(),
                        &config.bucket,
                        config.region.parse().expect("invalid s3 region"),
                        db.clone(),
                    )
                    .spawn(),
                )
            }

            // find the first task to shut down. Then cancel all others
            debug!(tasks = tasks.len(), "Selecting across Processor tasks");
            let (res, _, remaining) = select_all(tasks).await;
            for task in remaining.into_iter() {
                cancel_task!(task);
            }

            res?
        })
        .instrument(info_span!("Processor::run_all"))
    }
}
