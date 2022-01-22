use ethers::core::types::H256;
use nomad_core::{DoubleUpdate, SignedUpdate};

#[derive(Debug, Clone)]
pub struct Dispatch {
    pub(crate) message_hash: H256,
    pub(crate) leaf_index: u32,
    pub(crate) destination: u32,
    pub(crate) nonce: u32,
    pub(crate) committed_root: H256,
    pub(crate) message: Vec<u8>,
}

#[derive(Debug, Clone)]
pub enum HomeEvents {
    Dispatch(Dispatch),
    ImproperUpdate {
        old_root: H256,
        new_root: H256,
        signature: Vec<u8>,
    },
    UpdaterSlashed {
        updater: H256,
        reporter: H256,
    },
    NewUpdaterManager {
        updater_manager: H256,
    },

    // Nomad Base
    Update(SignedUpdate),
    DoubleUpdate(DoubleUpdate),
    NewUpdater {
        old_updater: H256,
        new_updater: H256,
    },
}
