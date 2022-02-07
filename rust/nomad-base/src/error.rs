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
    #[error("Home contract is in failed state")]
    FailedHome,
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
    /// Update producer attampted to store conflicting updates
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
    /// Processor stored leaf conflicts with the message for the same index
    #[error("Processor stored leaf and message hash are not equal for leaf index: {index:?}. Calculated: {calculated_leaf:?}. Prover: {proof_leaf:?}.")]
    ProverConflictError {
        /// Leaf index
        index: u32,
        /// Conflicting message leaf
        calculated_leaf: H256,
        /// Prover leaf
        proof_leaf: H256,
    },
    /// Processor stored leaf conflicts with the message for the same index
    #[error("Process transaction {tx:?} was reverted.")]
    ProcessTransactionReverted {
        /// Hash of transaction that got reverted
        tx: H256,
    },
}
