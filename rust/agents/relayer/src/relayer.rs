use async_trait::async_trait;
use color_eyre::Result;
use std::{sync::Arc, time::Duration};
use tokio::{sync::Mutex, task::JoinHandle, time::sleep};
use tracing::{info, instrument::Instrumented, Instrument};

use nomad_base::{decl_agent, decl_channel, AgentCore, CachingHome, CachingReplica, NomadAgent};
use nomad_core::{Common, CommonEvents};

use crate::settings::RelayerSettings as Settings;

#[derive(Debug)]
struct UpdatePoller {
    interval: u64,
    home: Arc<CachingHome>,
    replica: Arc<CachingReplica>,
    semaphore: Mutex<()>,
    updates_relayed_count: prometheus::IntCounter,
}

impl std::fmt::Display for UpdatePoller {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "UpdatePoller: {{ home: {:?}, replica: {:?} }}",
            self.home, self.replica
        )
    }
}

impl UpdatePoller {
    fn new(
        home: Arc<CachingHome>,
        replica: Arc<CachingReplica>,
        interval: u64,
        updates_relayed_count: prometheus::IntCounter,
    ) -> Self {
        Self {
            home,
            replica,
            interval,
            semaphore: Mutex::new(()),
            updates_relayed_count,
        }
    }

    #[tracing::instrument(err, skip(self), fields(self = %self))]
    async fn poll_and_relay_update(&self) -> Result<()> {
        // Get replica's current root.
        let old_root = self.replica.committed_root().await?;
        info!(
            "Replica {} latest root is: {}",
            self.replica.name(),
            old_root
        );

        // Check for first signed update building off of the replica's current root
        let signed_update_opt = self.home.signed_update_by_old_root(old_root).await?;

        // If signed update exists for replica's committed root, try to
        // relay
        if let Some(signed_update) = signed_update_opt {
            info!(
                "Update for replica {}. Root {} to {}",
                self.replica.name(),
                &signed_update.update.previous_root,
                &signed_update.update.new_root,
            );

            // Attempt to acquire lock for submitting tx
            let lock = self.semaphore.try_lock();
            if lock.is_err() {
                return Ok(()); // tx in flight. just do nothing
            }

            // Relay update and increment counters if tx successful
            if self.replica.update(&signed_update).await.is_ok() {
                self.updates_relayed_count.inc();
            }

            // lock dropped here
        } else {
            info!(
                "No update. Current root for replica {} is {}",
                self.replica.name(),
                old_root
            );
        }

        Ok(())
    }

    fn spawn(self) -> JoinHandle<Result<()>> {
        tokio::spawn(async move {
            loop {
                self.poll_and_relay_update().await?;
                sleep(Duration::from_secs(self.interval)).await;
            }
        })
    }
}

decl_agent!(Relayer {
    updates_relayed_counts: prometheus::IntCounterVec,
    interval: u64,
});

#[allow(clippy::unit_arg)]
impl Relayer {
    /// Instantiate a new relayer
    pub fn new(interval: u64, core: AgentCore) -> Self {
        let updates_relayed_counts = core
            .metrics
            .new_int_counter(
                "updates_relayed_count",
                "Number of updates relayed from given home to replica",
                &["home", "replica", "agent"],
            )
            .expect("processor metric already registered -- should have be a singleton");

        Self {
            interval,
            core,
            updates_relayed_counts,
        }
    }
}

decl_channel!(Relayer {
    updates_relayed_count: prometheus::IntCounter,
    interval: u64,
});

#[async_trait]
#[allow(clippy::unit_arg)]
impl NomadAgent for Relayer {
    const AGENT_NAME: &'static str = "relayer";

    type Settings = Settings;

    type Channel = RelayerChannel;

    async fn from_settings(settings: Self::Settings) -> Result<Self>
    where
        Self: Sized,
    {
        Ok(Self::new(
            settings.interval.parse().expect("invalid uint"),
            settings.as_ref().try_into_core("relayer").await?,
        ))
    }

    fn build_channel(&self, replica: &str) -> Self::Channel {
        Self::Channel {
            base: self.channel_base(replica),
            updates_relayed_count: self.updates_relayed_counts.with_label_values(&[
                self.home().name(),
                replica,
                Self::AGENT_NAME,
            ]),
            interval: self.interval,
        }
    }

    #[tracing::instrument]
    fn run(channel: Self::Channel) -> Instrumented<JoinHandle<Result<()>>> {
        tokio::spawn(async move {
            let update_poller = UpdatePoller::new(
                channel.home(),
                channel.replica(),
                channel.interval,
                channel.updates_relayed_count,
            );
            update_poller.spawn().await?
        })
        .in_current_span()
    }
}

#[cfg(test)]
mod test {}
