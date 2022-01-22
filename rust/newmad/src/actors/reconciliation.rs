use tokio::{sync::mpsc, task::JoinHandle};

use crate::instructions::Instruction;

#[async_trait::async_trait]
pub trait Dispatcher<I>: Send + Sync
where
    I: Instruction,
{
    type Tx: std::fmt::Debug + Send + Sync;

    /// Translate an instruction to a transaction
    fn translate(&self, inst: I) -> Self::Tx;

    // dispatch a transaction to the chain and
    // manage its lifecycle
    async fn dispatch(&mut self, tx: Self::Tx);

    // convert an instruction into a transaction, then dispatch it
    async fn execute(&mut self, inst: I) {
        let tx = self.translate(inst);
        self.dispatch(tx).await
    }
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
                    Some(inst) => self.chain.execute(inst).await,
                    None => break,
                }
            }
        })
    }
}
