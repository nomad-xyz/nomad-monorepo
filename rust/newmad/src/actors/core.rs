use std::collections::HashMap;

use tokio::{select, sync::mpsc, task::JoinHandle};

use crate::{
    events::{home::HomeEvents, replica::ReplicaEvents},
    instructions::{home::HomeInstructions, replica::ReplicaInstructions},
    models::{home::HomeModel, replica::ReplicaModel},
};

type E = String;
type Result<T> = std::result::Result<T, E>;

pub struct CoreModel<T> {
    logic: T,

    home: HomeModel,
    replicas: HashMap<u32, ReplicaModel>,

    home_events: mpsc::Receiver<HomeEvents>,
    replica_events: mpsc::Receiver<(u32, ReplicaEvents)>,

    home_instructions: mpsc::Sender<HomeInstructions>,
    replica_instructions: HashMap<u32, mpsc::Sender<ReplicaInstructions>>,
}

pub trait Logic {
    fn evaluate_home(&mut self, home: &HomeModel) -> Vec<HomeInstructions>;
    fn evaluate_replica(
        &mut self,
        home: &HomeModel,
        replica: &ReplicaModel,
    ) -> Vec<ReplicaInstructions>;
}

impl<T> CoreModel<T>
where
    T: Logic + Send + Sync + 'static,
{
    fn issue_instructions(&mut self) -> std::result::Result<bool, Box<dyn std::error::Error>> {
        for inst in self.logic.evaluate_home(&self.home) {
            self.home_instructions.try_send(inst)?;
        }

        for (domain, replica) in self.replicas.iter() {
            let outbound = self.replica_instructions.get_mut(domain).unwrap();
            for inst in self.logic.evaluate_replica(&self.home, replica) {
                outbound.try_send(inst)?;
            }
        }
        Ok(true)
    }

    pub fn spawn(mut self) -> JoinHandle<Result<()>> {
        tokio::spawn(async move {
            loop {
                let res = select!(
                    Some(event) = self.home_events.recv() => {
                        self.home.handle(event)
                    }
                    Some((domain, event)) = self.replica_events.recv() => {
                        self.replicas.get_mut(&domain).unwrap().handle(event)
                    }
                    // issue instructions if there are no new events in the queues
                    else => self.issue_instructions()
                );
                res.map_err(|e| format!("{}", e))?;
            }
        })
    }
}
