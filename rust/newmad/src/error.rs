use nomad_core::{accumulator::merkle::MerkleTreeError, NomadError};

#[derive(Debug, thiserror::Error)]
pub enum NewmadError {
    #[error("{0}")]
    MerkleTree(#[from] MerkleTreeError),

    #[error("MPSC channel issue: {0}")]
    Channel(String),

    // todo: unroll these into this type later
    #[error("{0}")]
    NomadError(#[from] NomadError),
}

impl<T> From<tokio::sync::mpsc::error::SendError<T>> for NewmadError
where
    T: std::fmt::Debug,
{
    fn from(e: tokio::sync::mpsc::error::SendError<T>) -> Self {
        Self::Channel(format!("{:?}", e))
    }
}

pub type Result<T> = std::result::Result<T, NewmadError>;
