use std::{collections::HashMap, thread::JoinHandle};

pub mod models;
pub mod observer;
pub mod reconciliation;

pub struct RunningSystem {
    home_observer: JoinHandle<()>,
    replica_observers: HashMap<u32, JoinHandle<()>>,

    core: JoinHandle<()>,

    home_reconciliation: JoinHandle<()>,
    replica_reconciliations: HashMap<u32, JoinHandle<()>>,
}
