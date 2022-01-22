use std::{collections::HashMap, thread::JoinHandle};

use crate::error::Result;

pub mod models;
pub mod observer;
pub mod reconciliation;

pub struct RunningSystem {
    home_observer: JoinHandle<Result<()>>,
    replica_observers: HashMap<u32, JoinHandle<Result<()>>>,

    core: JoinHandle<Result<()>>,

    home_reconciliation: JoinHandle<Result<()>>,
    replica_reconciliations: HashMap<u32, JoinHandle<Result<()>>>,
}
