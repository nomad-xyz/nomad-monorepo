use tokio::{sync::mpsc, task::JoinHandle};

use crate::instructions::Instruction;

#[async_trait::async_trait]
pub trait Dispatcher<I>: Send + Sync
where
    I: Instruction,
{
    // convert an instruction into a transaction
    // dispatch that action to the chain
    // manage its lifecycle
    async fn dispatch(&mut self, inst: I);
}

#[derive(Debug)]
pub struct Reconciliation<T, I> {
    chain: T,
    instructions: mpsc::Receiver<I>,
}

impl<T, I> Reconciliation<T, I>
where
    T: Dispatcher<I> + 'static,
    I: Instruction,
{
    pub fn spawn(mut self) -> JoinHandle<()> {
        tokio::spawn(async move {
            loop {
                let inst = self.instructions.recv().await;
                match inst {
                    Some(inst) => self.chain.dispatch(inst).await,
                    None => break,
                }
            }
        })
    }
}
