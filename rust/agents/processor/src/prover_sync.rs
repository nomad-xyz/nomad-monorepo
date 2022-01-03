use crate::prover::{Prover, ProverError};
use color_eyre::eyre::{bail, Result};
use ethers::core::types::H256;
use nomad_base::NomadDB;
use nomad_core::{accumulator::INITIAL_ROOT, db::DbError, ChainCommunicationError};
use std::{fmt::Display, time::Duration};
use tokio::{
    task::JoinHandle,
    time::{sleep, timeout},
};
use tracing::{debug, error, info, info_span, instrument, instrument::Instrumented, Instrument};

/// Struct to sync prover.
#[derive(Debug)]
pub struct ProverSync {
    db: NomadDB,
    prover: Prover,
}

impl Display for ProverSync {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ProverSync {{ ")?;
        write!(
            f,
            "prover: {{ root: {:?}, size: {} }} ",
            self.prover.root(),
            self.prover.count()
        )?;
        write!(f, "}}")?;
        Ok(())
    }
}

/// ProverSync errors
#[derive(Debug, thiserror::Error)]
pub enum ProverSyncError {
    /// Local tree up-to-date but root does not match signed update"
    #[error("Local tree up-to-date but root does not match update. Local root: {local_root}. Update root: {new_root}. WARNING: this could indicate malicious updater and/or long reorganization process!")]
    MismatchedRoots {
        /// Root of prover's local merkle tree
        local_root: H256,
        /// New root contained in signed update
        new_root: H256,
    },
    /// Local root was never signed by updater and submitted to Home.
    #[error("Local root {local_root:?} was never signed by updater and submitted to Home.")]
    InvalidLocalRoot {
        /// Root of prover's local merkle tree
        local_root: H256,
    },
    /// New root observed but leaf under root not found
    #[error("ProverSync found new root {new_root} but could not find leaf under it. Leaf index of missing leaf: {leaf_index}.")]
    LeafNotFound {
        /// New root containing missing leaf
        new_root: H256,
        /// Leaf index for missing leaf
        leaf_index: usize,
    },
    /// ProverSync attempts Prover operation and receives ProverError
    #[error(transparent)]
    ProverError(#[from] ProverError),
    /// ProverSync receives ChainCommunicationError from chain API
    #[error(transparent)]
    ChainCommunicationError(#[from] ChainCommunicationError),
    /// DB Error
    #[error("{0}")]
    DbError(#[from] DbError),
}

impl ProverSync {
    // The current canonical local root. This is the root that the full
    // prover currently has. If that root is the initial root, it is 0.
    fn local_root(&self) -> H256 {
        let root = self.prover.root();
        if root == *INITIAL_ROOT {
            H256::zero()
        } else {
            root
        }
    }

    fn store_proof(&self, leaf_index: u32) -> Result<(), ProverSyncError> {
        match self.prover.prove(leaf_index as usize) {
            Ok(proof) => {
                self.db.store_proof(leaf_index, &proof)?;
                info!(
                    leaf_index,
                    root = ?self.prover.root(),
                    "Storing proof for leaf {}",
                    leaf_index
                );
                Ok(())
            }
            // ignore the storage request if it's out of range (e.g. leaves
            // up-to-date but no update containing leaves produced yet)
            Err(ProverError::ZeroProof { index: _, count: _ }) => Ok(()),
            // bubble up any other errors
            Err(e) => Err(e.into()),
        }
    }

    /// Given rocksdb handle `db` containing merkle tree leaves,
    /// instantiates new `ProverSync` and fills prover's merkle tree
    #[instrument(level = "debug", skip(db))]
    pub fn from_disk(db: NomadDB) -> Self {
        // Ingest all leaves in db into prover tree
        let mut prover = Prover::default();

        if let Some(root) = db.retrieve_prover_latest_committed().expect("db error") {
            for i in 0.. {
                match db.leaf_by_leaf_index(i) {
                    Ok(Some(leaf)) => {
                        debug!(leaf_index = i, "Ingesting leaf from_disk");
                        prover.ingest(leaf).expect("!tree full");
                        if prover.root() == root {
                            break;
                        }
                    }
                    Ok(None) => break,
                    Err(e) => {
                        error!(error = %e, "Error in ProverSync::from_disk");
                        panic!("Error in ProverSync::from_disk");
                    }
                }
            }
            info!(target_latest_root = ?root, root = ?prover.root(), "Reloaded ProverSync from disk");
        }

        let sync = Self { prover, db };

        // Ensure proofs exist for all leaves
        for i in 0..sync.prover.count() as u32 {
            match (
                sync.db.leaf_by_leaf_index(i).expect("db error"),
                sync.db.proof_by_leaf_index(i).expect("db error"),
            ) {
                (Some(_), None) => sync.store_proof(i).expect("db error"),
                (None, _) => break,
                _ => {}
            }
        }

        sync
    }

    /// Given new root, update prover tree with leaves until prover tree root
    /// matches new_root
    #[instrument(level = "debug", skip(self))]
    async fn update_prover_tree(&mut self, new_root: H256) -> Result<(), ProverSyncError> {
        // Update in-memory prover tree
        while self.prover.root() != new_root {
            let tree_size = self.prover.count();
            let leaf_fut = self.db.wait_for_leaf(tree_size as u32);

            // Wait for leaf for 60 seconds and error out if not found
            info!("Waiting for leaf at index {}...", tree_size);
            let leaf = match timeout(Duration::from_secs(60), leaf_fut).await {
                Ok(res) => res.map_err(ProverSyncError::DbError),
                Err(_) => Err(ProverSyncError::LeafNotFound {
                    new_root,
                    leaf_index: tree_size,
                }),
            }?;

            info!(
                index = tree_size,
                leaf = ?leaf,
                "Ingesting leaf at index {}. Leaf: {}.",
                tree_size,
                leaf
            );
            self.prover.ingest(leaf).expect("!tree_full");
        }

        Ok(())
    }

    /// Consume self and poll for signed updates at regular interval. Update
    /// local merkle tree with all leaves between local root and
    /// new root. Use short interval for bootup syncing and longer
    /// interval for regular polling.
    pub fn spawn(mut self) -> Instrumented<JoinHandle<Result<()>>> {
        let span = info_span!("ProverSync", self = %self);
        tokio::spawn(async move {
            loop {
                // Try to retrieve new signed update
                let local_root = self.local_root();
                let signed_update_opt = self.db.update_by_previous_root(local_root)?;

                if let Some(signed_update) = signed_update_opt {
                    let previous_root = signed_update.update.previous_root;
                    let new_root = signed_update.update.new_root;

                    info!(
                        previous_root = ?previous_root,
                        new_root = ?new_root,
                        "Have signed update from {} to {}",
                        previous_root,
                        new_root
                    );

                    // Update in-memory prover tree until local tree root
                    // matches newly found new_root
                    let pre_update_size = self.prover.count();
                    self.update_prover_tree(new_root).await?;

                    // Double check that update new root now equals current prover root
                    let current_root = self.prover.root();
                    if current_root != new_root {
                        bail!(ProverSyncError::MismatchedRoots {
                            local_root: current_root,
                            new_root,
                        });
                    }

                    // Ensure there is a proof in the db for all leaves
                    for idx in pre_update_size..self.prover.count() {
                        if self.db.proof_by_leaf_index(idx as u32)?.is_none() {
                            self.store_proof(idx as u32)?;
                        }
                    }

                    // Store latest root for which we know we have all leaves/
                    // proofs for
                    self.db.store_prover_latest_committed(new_root)?;
                } else if !local_root.is_zero() && self.db.update_by_new_root(local_root)?.is_none()
                {
                    bail!(ProverSyncError::InvalidLocalRoot { local_root });
                }

                // kludge
                sleep(Duration::from_millis(100)).await;
            }
        })
        .instrument(span)
    }
}
