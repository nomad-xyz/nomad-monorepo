use std::collections::HashMap;

use crate::events::replica::ReplicaEvents;
use ethers::{core::types::H256, prelude::U256};
use nomad_core::{MessageStatus, SignedUpdate};

type E = Box<dyn std::error::Error>;
type Result<T> = std::result::Result<T, E>;

pub struct ReplicaModel {
    local_domain: u32,
    optimistic_seconds: U256,
    updater: H256,
    failed: bool,
    committed_root: H256,
    message_status: HashMap<H256, MessageStatus>,
    confirm_at: HashMap<H256, U256>,
}

impl ReplicaModel {
    /// Get a reference to the replica model's local domain.
    pub fn local_domain(&self) -> u32 {
        self.local_domain
    }

    /// Get a reference to the replica model's updater.
    pub fn updater(&self) -> H256 {
        self.updater
    }

    /// Get a reference to the replica model's failed.
    pub fn failed(&self) -> bool {
        self.failed
    }

    /// Get a reference to the replica model's committed root.
    pub fn committed_root(&self) -> H256 {
        self.committed_root
    }

    /// Get a reference to the replica model's optimistic seconds.
    pub fn optimistic_seconds(&self) -> U256 {
        self.optimistic_seconds
    }

    /// Look up the model's message status.
    pub fn message_status(&self, message_hash: H256) -> Option<MessageStatus> {
        self.message_status.get(&message_hash).copied()
    }

    /// Look up the confirm time for a root
    pub fn confirm_at(&self, root: H256) -> Option<U256> {
        self.confirm_at.get(&root).copied()
    }
}

impl ReplicaModel {
    fn handle_update(&mut self, logged_at: U256, update: SignedUpdate) -> Result<bool> {
        debug_assert!(!self.failed);
        debug_assert_eq!(update.update.previous_root, self.committed_root);
        let confirm_time = logged_at + self.optimistic_seconds;
        self.confirm_at.insert(update.update.new_root, confirm_time);
        self.committed_root = update.update.new_root;
        Ok(self.failed)
    }

    pub fn handle(&mut self, event: ReplicaEvents) -> Result<bool> {
        match event {
            ReplicaEvents::Process { message_hash, .. } => {
                self.message_status
                    .insert(message_hash, MessageStatus::Processed);
                Ok(self.failed)
            }
            ReplicaEvents::SetOptimisticTimeout { timeout } => {
                self.optimistic_seconds = timeout;
                Ok(self.failed)
            }
            ReplicaEvents::SetConfirmation {
                root,
                new_confirm_at,
                ..
            } => {
                self.confirm_at.insert(root, new_confirm_at);
                Ok(self.failed)
            }
            ReplicaEvents::Update { update, logged_at } => {
                self.handle_update(logged_at, update)?;
                Ok(self.failed)
            }
            ReplicaEvents::DoubleUpdate(_) => {
                self.failed = true;
                Ok(self.failed)
            }
            ReplicaEvents::NewUpdater {
                old_updater,
                new_updater,
            } => {
                debug_assert_eq!(old_updater, self.updater);
                self.updater = new_updater;
                Ok(self.failed)
            }
        }
    }
}
