mod encode;
mod home;
mod indexer;
mod replica;
mod xapp;

use async_trait::async_trait;
use color_eyre::Result;
use ethers::{
    contract::ContractError,
    core::types::{TransactionReceipt, H256},
    providers::{Middleware, ProviderError},
};
use std::{error::Error as StdError, fmt::Display};

use crate::{db::DbError, NomadError, SignedUpdate};

pub use encode::*;
pub use home::*;
pub use indexer::*;
pub use replica::*;
pub use xapp::*;

/// Contract states
#[derive(Debug, PartialEq, Eq)]
pub enum State {
    /// Contract uninitialized
    Uninitialized,
    /// Contract is active
    Active,
    /// Contract has failed
    Failed,
}

/// Returned by `check_double_update` if double update exists
#[derive(Debug, Clone, PartialEq)]
pub struct DoubleUpdate(pub SignedUpdate, pub SignedUpdate);

impl Display for DoubleUpdate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "DoubleUpdate {{ ")?;
        write!(f, "left: {} ", &self.0)?;
        write!(f, "right: {} ", &self.1)?;
        write!(f, " }}")
    }
}

/// The result of a transaction
#[derive(Debug, Clone, Copy)]
pub struct TxOutcome {
    /// The txid
    pub txid: H256,
    /// True if executed, false otherwise (reverted, etc.)
    pub executed: bool,
    // TODO: more? What can be abstracted across all chains?
}

impl From<TransactionReceipt> for TxOutcome {
    fn from(t: TransactionReceipt) -> Self {
        Self {
            txid: t.transaction_hash,
            executed: t.status.unwrap().low_u32() == 1,
        }
    }
}

/// ChainCommunicationError contains errors returned when attempting to
/// call a chain or dispatch a transaction
#[derive(Debug, thiserror::Error)]
pub enum ChainCommunicationError {
    /// Nomad Error
    #[error("{0}")]
    NomadError(#[from] NomadError),
    /// Contract Error
    #[error("{0}")]
    ContractError(Box<dyn StdError + Send + Sync>),
    /// Provider Error
    #[error("{0}")]
    ProviderError(#[from] ProviderError),
    /// A transaction was dropped from the mempool
    #[error("Transaction dropped from mempool {0:?}")]
    DroppedError(H256),
    /// Any other error
    #[error("{0}")]
    CustomError(#[from] Box<dyn StdError + Send + Sync>),
}

impl<M> From<ContractError<M>> for ChainCommunicationError
where
    M: Middleware + 'static,
{
    fn from(e: ContractError<M>) -> Self {
        Self::ContractError(Box::new(e))
    }
}

/// Interface for attributes shared by Home and Replica
#[async_trait]
pub trait Common: Sync + Send + std::fmt::Debug {
    /// Return an identifier (not necessarily unique) for the chain this
    /// contract is running on.
    fn name(&self) -> &str;

    /// Get the status of a transaction.
    async fn status(&self, txid: H256) -> Result<Option<TxOutcome>, ChainCommunicationError>;

    /// Fetch the current updater value
    async fn updater(&self) -> Result<H256, ChainCommunicationError>;

    /// Fetch the current state.
    async fn state(&self) -> Result<State, ChainCommunicationError>;

    /// Fetch the current root.
    async fn committed_root(&self) -> Result<H256, ChainCommunicationError>;

    /// Submit a signed update for inclusion
    async fn update(&self, update: &SignedUpdate) -> Result<TxOutcome, ChainCommunicationError>;

    /// Submit a double update for slashing
    async fn double_update(
        &self,
        double: &DoubleUpdate,
    ) -> Result<TxOutcome, ChainCommunicationError>;
}

/// Interface for retrieving event data emitted by both the home and replica
#[async_trait]
pub trait CommonEvents: Common + Send + Sync + std::fmt::Debug {
    /// Fetch the first signed update building off of `old_root`. If `old_root`
    /// was never accepted or has never been updated, this will return `Ok(None )`.
    /// This should fetch events from the chain API
    async fn signed_update_by_old_root(
        &self,
        old_root: H256,
    ) -> Result<Option<SignedUpdate>, DbError>;

    /// Fetch the first signed update with a new root of `new_root`. If update
    /// has not been produced, this will return `Ok(None)`. This should fetch
    /// events from the chain API
    async fn signed_update_by_new_root(
        &self,
        new_root: H256,
    ) -> Result<Option<SignedUpdate>, DbError>;
}
