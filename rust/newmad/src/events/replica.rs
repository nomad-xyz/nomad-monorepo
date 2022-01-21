use ethers::core::types::{H256, U256};
use nomad_core::{DoubleUpdate, SignedUpdate};

pub enum ReplicaEvents {
    Process {
        message_hash: H256,
        success: bool,
        return_data: Vec<u8>,
    },
    SetOptimisticTimeout {
        timeout: U256,
    },
    SetConfirmation {
        root: H256,
        previous_confirm_at: U256,
        new_confirm_at: U256,
    },
    // Nomad Base
    Update {
        update: SignedUpdate,
        logged_at: U256,
    },
    DoubleUpdate(DoubleUpdate),
    NewUpdater {
        old_updater: H256,
        new_updater: H256,
    },
}
