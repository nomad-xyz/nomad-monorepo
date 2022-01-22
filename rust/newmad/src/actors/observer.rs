use async_trait::async_trait;
use tokio::{sync::mpsc, task::JoinHandle};

use crate::{error::Result, events::Events};

#[async_trait]
pub trait Poller<E>: std::fmt::Debug + Send + Sync {
    async fn poll(&self) -> Result<Vec<E>>;
}

pub struct Observer<P, E>
where
    P: Poller<E>,
    E: Events,
{
    poller: P,
    domain: u32,
    outbound: mpsc::UnboundedSender<(u32, E)>,
}

impl<P, E> Observer<P, E>
where
    P: Poller<E> + 'static,
    E: Events + 'static,
{
    pub fn spawn(self) -> JoinHandle<Result<()>> {
        tokio::spawn(async move {
            loop {
                let events = self.poller.poll().await?;
                for event in events {
                    if self.outbound.send((self.domain, event)).is_err() {
                        // receiver is gone
                        break;
                    };
                }
            }
        })
    }
}
