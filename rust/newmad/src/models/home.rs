use crate::events::home::{Dispatch, HomeEvents};
use ethers::core::types::H256;
use nomad_core::{accumulator::merkle::MerkleTree, Decode, NomadMessage, SignedUpdate};
use std::collections::{BTreeMap, VecDeque};
use tokio::{sync::mpsc, task::JoinHandle};

pub struct HomeModel {
    local_domain: u32,
    updater: H256,
    updater_manager: H256,
    failed: bool,
    committed_root: H256,
    leaf_count: u32,
    tree: MerkleTree,
    queue: VecDeque<H256>,
    messages: BTreeMap<u32, BTreeMap<u32, NomadMessage>>,
}

type E = Box<dyn std::error::Error>;
type Result<T> = std::result::Result<T, E>;

// Getters
impl HomeModel {
    /// Get a reference to the home model's local domain.
    pub fn local_domain(&self) -> u32 {
        self.local_domain
    }

    /// Get a reference to the home model's updater.
    pub fn updater(&self) -> H256 {
        self.updater
    }

    /// Get a reference to the home model's failed.
    pub fn failed(&self) -> bool {
        self.failed
    }

    /// Get a reference to the home model's committed root.
    pub fn committed_root(&self) -> H256 {
        self.committed_root
    }

    /// Get a reference to the home model's tree.
    pub fn tree(&self) -> &MerkleTree {
        &self.tree
    }

    /// Get a reference to the home model's queue.
    pub fn queue(&self) -> &VecDeque<H256> {
        &self.queue
    }

    /// Store a message in the messages map
    pub fn insert_message(
        &mut self,
        destination: u32,
        nonce: u32,
        message: NomadMessage,
    ) -> Result<()> {
        self.messages
            .entry(destination)
            .or_default()
            .insert(nonce, message);
        Ok(())
    }

    pub fn get_message(&self, destination: u32, nonce: u32) -> Option<&NomadMessage> {
        self.messages.get(&destination)?.get(&nonce)
    }
}

// Business
impl HomeModel {
    fn handle_dispatch(&mut self, dispatch: Dispatch) -> Result<()> {
        if self.committed_root != dispatch.committed_root {
            panic!("out of order events");
        }
        if dispatch.leaf_index != self.leaf_count {
            panic!("missing leaves");
        }

        let message = NomadMessage::read_from(&mut &dispatch.message[..])?;
        if message.to_leaf() != dispatch.message_hash
            || dispatch.nonce != message.nonce
            || dispatch.destination != message.destination
            || message.origin != self.local_domain
        {
            panic!("invalid dispatch");
        }
        self.insert_message(message.destination, message.nonce, message)?;
        self.tree.push_leaf(dispatch.message_hash, 32)?;
        self.queue.push_back(self.tree.hash());
        Ok(())
    }

    fn handle_update(&mut self, signed_update: SignedUpdate) -> Result<()> {
        if self.failed {
            panic!("update while in failed state");
        }

        let new_root = signed_update.update.new_root;

        if !self.queue.contains(&signed_update.update.new_root) {
            self.failed = true;
            return Ok(());
        }

        // pop off the queue until we've removed new_root
        while self.queue.pop_front() != Some(new_root) {}
        self.committed_root = new_root;

        Ok(())
    }

    pub fn handle_event(&mut self, event: HomeEvents) -> Result<()> {
        match event {
            HomeEvents::Dispatch(dispatch) => self.handle_dispatch(dispatch),
            HomeEvents::Update(update) => self.handle_update(update),
            HomeEvents::ImproperUpdate { .. } => {
                self.failed = true;
                Ok(())
            }
            HomeEvents::UpdaterSlashed { .. } => {
                self.failed = true;
                Ok(())
            }
            HomeEvents::NewUpdaterManager { updater_manager } => {
                self.updater_manager = updater_manager;
                Ok(())
            }
            HomeEvents::DoubleUpdate { .. } => {
                self.failed = true;
                Ok(())
            }
            HomeEvents::NewUpdater {
                old_updater,
                new_updater,
            } => {
                assert_eq!(
                    old_updater, self.updater,
                    "old updater does not match current"
                );
                self.updater = new_updater;
                Ok(())
            }
        }
    }
}

impl HomeModel {
    // Spawn a home model
    pub fn spawn(mut self, mut events: mpsc::Receiver<HomeEvents>) -> JoinHandle<()> {
        tokio::spawn(async move {
            loop {
                match events.recv().await {
                    Some(e) => self.handle_event(e).unwrap(),
                    None => return (),
                }
            }
        })
    }
}
