use std::collections::HashMap;

use tokio::{
    select,
    sync::mpsc::{UnboundedReceiver, UnboundedSender},
    task::JoinHandle,
};

use crate::{
    error::Result,
    events::{home::HomeEvents, replica::ReplicaEvents},
    instructions::{home::HomeInstructions, replica::ReplicaInstructions},
    models::{home::HomeModel, replica::ReplicaModel},
};

pub struct CoreModel<T> {
    logic: T,

    home: HomeModel,
    replicas: HashMap<u32, ReplicaModel>,

    home_events: UnboundedReceiver<(u32, HomeEvents)>,
    replica_events: UnboundedReceiver<(u32, ReplicaEvents)>,

    home_instructions: UnboundedSender<(u32, HomeInstructions)>,
    replica_instructions: HashMap<u32, UnboundedSender<ReplicaInstructions>>,
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
    // TODO: these instructions should be applied _prospectively_ to the local
    // state. That way _future_ evaluations of `issue_instructions` will have
    // access to the in-flight state updates
    fn issue_instructions(&mut self) -> Result<bool> {
        for inst in self.logic.evaluate_home(&self.home) {
            self.home_instructions
                .send((self.home.local_domain(), inst))?;
        }

        for (domain, replica) in self.replicas.iter() {
            let outbound = self.replica_instructions.get_mut(domain).unwrap();
            for inst in self.logic.evaluate_replica(&self.home, replica) {
                outbound.send(inst)?;
            }
        }
        Ok(true)
    }

    pub fn spawn(mut self) -> JoinHandle<Result<()>> {
        tokio::spawn(async move {
            loop {
                select!(
                    Some((_, event)) = self.home_events.recv() => {
                        self.home.handle(event)
                    }
                    Some((domain, event)) = self.replica_events.recv() => {
                        self.replicas.get_mut(&domain).unwrap().handle(event)
                    }
                    // issue instructions if there are no new events in the queues
                    else => self.issue_instructions()
                )?;
            }
        })
    }
}
