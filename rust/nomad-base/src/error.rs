use ethers::prelude::H256;
use nomad_core::{db::DbError, ChainCommunicationError, NomadError, Update};

/// DB Error type
#[derive(thiserror::Error, Debug)]
pub enum BaseError {
    /// Index is above tree max size
    #[error("{0}")]
    AgentError(#[from] AgentError),
    /// Bubbled up from underlying
    #[error("{0}")]
    ChainCommunicationError(#[from] ChainCommunicationError),
    /// Bubbled up from underlying
    #[error("{0}")]
    DbError(#[from] DbError),
    /// Bubbled up from underlying
    #[error("{0}")]
    NomadError(#[from] NomadError),
}

/// Agent specific
#[derive(thiserror::Error, Debug)]
pub enum AgentError {
    /// Error originated in Updater
    #[error("{0}")]
    UpdaterError(#[from] UpdaterError),
    /// Error originated in Processor
    #[error("{0}")]
    ProcessorError(#[from] ProcessorError),
}

/// Error that happened in Updater
#[derive(Debug, thiserror::Error)]
pub enum UpdaterError {
    /// Error on conflict
    #[error("Updater attempted to store conflicting signed update. Existing: {existing:?}. New conflicting: {conflicting:?}.")]
    ProducerConflictError {
        /// Existing signed update
        existing: Update,
        /// Conflicting signed update
        conflicting: Update,
    },
}

/// Error that happened in Processor
#[derive(Debug, thiserror::Error)]
pub enum ProcessorError {
    /// UpdaterConflictError
    #[error("Updater attempted to store conflicting signed update.  Index: {index:?}. Calculated: {calculated_leaf:?}. Prover: {prover_leaf:?}.")]
    ConflictingUpdateAttemptError {
        /// Leaf index
        index: u32,
        /// Conflicting message leaf
        calculated_leaf: H256,
        /// Prover leaf
        prover_leaf: H256,
    },
}
