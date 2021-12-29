use ethers::providers::{FromErr, Middleware};
use ethers::types::{transaction::eip2718::TypedTransaction, BlockId, U256};
use std::fmt;
use thiserror::Error;

/// Closure that will be used for gas calculation. Takes existing gas
type GasPolicy = Box<dyn Fn(U256) -> U256 + Send + Sync>;

/// Middleware used for adjusting gas using predefined policy
pub struct GasAdjusterMiddleware<M> {
    inner: M,
    policy: GasPolicy,
}

impl<M> fmt::Debug for GasAdjusterMiddleware<M>
where
    M: Middleware,
{
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("GasAdjusterMiddleware")
            .field("inner", &self.inner)
            .finish()
    }
}

impl<M> GasAdjusterMiddleware<M>
where
    M: Middleware,
{
    /// Instantiates the gas multiplier middleware. Policy takes gas
    /// estimate to calculates new gas which will be used for transaction
    pub fn new(inner: M, policy: GasPolicy) -> Self {
        Self { inner, policy }
    }

    pub fn with_default_policy(inner: M, chain_id: u64) -> Self {
        let is_ethereum = chain_id == 1;
        let policy = move |price| {
            if is_ethereum {
                price + price / 2
            } else {
                price * 2
            }
        };

        Self::new(inner, Box::new(policy))
    }
}

#[derive(Error, Debug)]
/// Thrown when an error happens at the Gas Multiplier Middleware
pub enum GasAdjusterMiddlewareError<M: Middleware> {
    /// Thrown when the internal middleware errors
    #[error("{0}")]
    MiddlewareError(M::Error),
}

/// Convert inner Middleware error into GasAdjusterMiddlewareError
impl<M: Middleware> FromErr<M::Error> for GasAdjusterMiddlewareError<M> {
    fn from(src: M::Error) -> Self {
        GasAdjusterMiddlewareError::MiddlewareError(src)
    }
}

#[async_trait::async_trait]
impl<M> Middleware for GasAdjusterMiddleware<M>
where
    M: Middleware,
{
    type Error = GasAdjusterMiddlewareError<M>;
    type Provider = M::Provider;
    type Inner = M;

    fn inner(&self) -> &M {
        &self.inner
    }

    async fn fill_transaction(
        &self,
        tx: &mut TypedTransaction,
        block: Option<BlockId>,
    ) -> Result<(), Self::Error> {
        self.inner
            .fill_transaction(tx, block)
            .await
            .map_err(FromErr::from)?;

        let adjusted_price = self.get_gas_price().await?;
        tx.set_gas_price(adjusted_price);

        Ok(())
    }

    async fn get_gas_price(&self) -> Result<U256, Self::Error> {
        self.inner()
            .get_gas_price()
            .await
            .map(&self.policy)
            .map_err(FromErr::from)
    }
}
