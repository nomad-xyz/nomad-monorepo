use ethers::core::types::H256;
use prometheus::IntCounter;
use std::{sync::Arc, time::Duration};

use color_eyre::Result;
use nomad_base::{CachingHome, NomadDB, UpdaterError};
use nomad_core::{Common, Home, SignedUpdate, Signers};
use tokio::{task::JoinHandle, time::sleep};
use tracing::{debug, error, info, info_span, instrument::Instrumented, Instrument};

#[derive(Debug)]
pub(crate) struct UpdateProducer {
    home: Arc<CachingHome>,
    db: NomadDB,
    signer: Arc<Signers>,
    interval_seconds: u64,
    signed_attestation_count: IntCounter,
}

impl UpdateProducer {
    pub(crate) fn new(
        home: Arc<CachingHome>,
        db: NomadDB,
        signer: Arc<Signers>,
        interval_seconds: u64,
        signed_attestation_count: IntCounter,
    ) -> Self {
        Self {
            home,
            db,
            signer,
            interval_seconds,
            signed_attestation_count,
        }
    }

    fn find_latest_root(&self) -> Result<H256> {
        // If db latest root is empty, this will produce `H256::default()`
        // which is equal to `H256::zero()`
        Ok(self.db.retrieve_latest_root()?.unwrap_or_default())
    }

    /// Store a pending update in the DB for potential submission.
    ///
    /// This does not produce update meta or update the latest update db value.
    /// It is used by update production and submission.
    fn store_produced_update(&self, update: &SignedUpdate) -> Result<()> {
        let existing_opt = self
            .db
            .retrieve_produced_update(update.update.previous_root)?;

        if let Some(existing) = existing_opt {
            if existing.update.new_root != update.update.new_root {
                error!("Updater attempted to store conflicting update. Existing update: {:?}. New conflicting update: {:?}.", &existing, &update);

                return Err(UpdaterError::ProducerConflictError {
                    existing: existing.update,
                    conflicting: update.update,
                }
                .into());
            }
        } else {
            self.db
                .store_produced_update(update.update.previous_root, update)?;
        }

        Ok(())
    }

    /// Spawn the updater's produce task.
    ///
    /// Note that all data retrieved from either contract calls or the
    /// updater's db are confirmed state in the chain, as both indexed data and
    /// contract state are retrieved with a timelag.
    pub(crate) fn spawn(self) -> Instrumented<JoinHandle<Result<()>>> {
        let span = info_span!("UpdateProducer");
        tokio::spawn(async move {
            loop {
                // We sleep at the top to make continues work fine
                sleep(Duration::from_secs(self.interval_seconds)).await;

                // Get home indexer's latest seen update from home. This call 
                // will only return a root from an update that is confirmed in 
                // the chain, as the updater indexer's timelag will ensure this.
                let current_root = self.find_latest_root()?;

                // The produced update is also confirmed state in the chain, as 
                // updater home timelag ensures this.
                if let Some(suggested) = self.home.produce_update().await? {
                    if suggested.previous_root != current_root {
                        // This either indicates that the indexer is catching
                        // up or that the chain is awaiting a new update. We 
                        // should ignore it.
                        debug!(
                            local = ?suggested.previous_root,
                            remote = ?current_root,
                            "Local root not equal to chain root. Skipping update."
                        );
                        continue;
                    }

                    // Ensure we have not already signed a conflicting update.
                    // Ignore suggested if we have.
                    if let Some(existing) = self.db.retrieve_produced_update(suggested.previous_root)? {
                        if existing.update.new_root != suggested.new_root {
                            info!("Updater ignoring conflicting suggested update. Indicates chain awaiting already produced update. Existing update: {:?}. Suggested conflicting update: {:?}.", &existing, &suggested);
                        }

                        continue;
                    }

                    // If the suggested matches our local view, sign an update
                    // and store it as locally produced
                    let signed = suggested.sign_with(self.signer.as_ref()).await?;

                    self.signed_attestation_count.inc();

                    let hex_signature = format!("0x{}", hex::encode(signed.signature.to_vec()));
                    info!(
                        previous_root = ?signed.update.previous_root,
                        new_root = ?signed.update.new_root,
                        hex_signature = %hex_signature,
                        "Storing new update in DB for broadcast"
                    );

                    // Once we have stored signed update in db, updater can 
                    // never produce a double update building off the same 
                    // previous root (we check db each time we produce new 
                    // signed update)
                    self.store_produced_update(&signed)?
                } else {
                    let committed_root = self.home.committed_root().await?;
                    info!("No updates to sign. Waiting for new root building off of current root {:?}.", committed_root);
                }
            }
        })
        .instrument(span)
    }
}
