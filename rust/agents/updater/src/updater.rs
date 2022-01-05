use std::sync::Arc;

use async_trait::async_trait;
use color_eyre::{eyre::ensure, Result};
use ethers::{signers::Signer, types::Address};
use futures_util::future::select_all;
use prometheus::IntCounter;
use tokio::task::JoinHandle;
use tracing::{info, instrument::Instrumented, Instrument};

use crate::{
    produce::UpdateProducer, settings::UpdaterSettings as Settings, submit::UpdateSubmitter,
};
use nomad_base::{AgentCore, ContractSyncMetrics, IndexDataTypes, NomadAgent, NomadDB};
use nomad_core::{Common, Signers};

/// An updater agent
#[derive(Debug)]
pub struct Updater {
    signer: Arc<Signers>,
    interval_seconds: u64,
    pub(crate) core: AgentCore,
    signed_attestation_count: IntCounter,
    submitted_update_count: IntCounter,
}

impl AsRef<AgentCore> for Updater {
    fn as_ref(&self) -> &AgentCore {
        &self.core
    }
}

impl Updater {
    /// Instantiate a new updater
    pub fn new(signer: Signers, interval_seconds: u64, core: AgentCore) -> Self {
        let home_name = core.home.name();
        let signed_attestation_count = core
            .metrics
            .new_int_counter(
                "signed_attestation_count",
                "Number of attestations signed",
                &["network", "agent"],
            )
            .expect("failed to register signed_attestation_count")
            .with_label_values(&[home_name, Self::AGENT_NAME]);

        let submitted_update_count = core
            .metrics
            .new_int_counter(
                "submitted_update_count",
                "Number of updates successfully submitted to home",
                &["network", "agent"],
            )
            .expect("failed to register submitted_update_count")
            .with_label_values(&[home_name, Self::AGENT_NAME]);

        Self {
            signer: Arc::new(signer),
            interval_seconds,
            core,
            signed_attestation_count,
            submitted_update_count,
        }
    }
}

#[async_trait]
// This is a bit of a kludge to make from_settings work.
// Ideally this hould be generic across all signers.
// Right now we only have one
impl NomadAgent for Updater {
    const AGENT_NAME: &'static str = "updater";

    type Settings = Settings;

    async fn from_settings(settings: Self::Settings) -> Result<Self>
    where
        Self: Sized,
    {
        let signer = settings.updater.try_into_signer().await?;
        let interval_seconds = settings.interval.parse().expect("invalid uint");
        let core = settings.as_ref().try_into_core(Self::AGENT_NAME).await?;
        Ok(Self::new(signer, interval_seconds, core))
    }

    fn run(&self, _replica: &str) -> Instrumented<JoinHandle<Result<()>>> {
        // First we check that we have the correct key to sign with.
        let home = self.home();
        let address = self.signer.address();
        let db = NomadDB::new(self.home().name(), self.db());

        let indexer = self.as_ref().indexer.clone();
        let sync_metrics = ContractSyncMetrics::new(self.metrics());

        let produce = UpdateProducer::new(
            self.home(),
            db.clone(),
            self.signer.clone(),
            self.interval_seconds,
            self.signed_attestation_count.clone(),
        );

        let submit = UpdateSubmitter::new(
            self.home(),
            db,
            self.interval_seconds,
            self.submitted_update_count.clone(),
        );

        tokio::spawn(async move {
            let expected: Address = home.updater().await?.into();
            ensure!(
                expected == address,
                "Contract updater does not match keys. On-chain: {}. Local: {}",
                expected,
                address
            );

            info!("Spawning sync task for updater...");
            let sync_task = home.sync(
                Updater::AGENT_NAME.to_owned(),
                indexer.from(),
                indexer.chunk_size(),
                sync_metrics,
                IndexDataTypes::Updates,
            );

            // Only spawn updater tasks once syncing has finished
            info!("Spawning produce and submit tasks...");
            let produce_task = produce.spawn();
            let submit_task = submit.spawn();

            let (res, _, rem) = select_all(vec![sync_task, produce_task, submit_task]).await;

            for task in rem.into_iter() {
                task.into_inner().abort();
            }
            res?
        })
        .in_current_span()
    }
}

#[cfg(test)]
mod test {}
