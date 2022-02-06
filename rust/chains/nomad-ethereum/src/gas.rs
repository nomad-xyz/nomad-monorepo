use ethers::providers::{FromErr, Middleware};
use ethers::types::{transaction::eip2718::TypedTransaction, BlockId, U256};
use std::fmt;
use thiserror::Error;

/// Closure that will be used for gas calculation. Takes existing gas
type GasPolicy = Box<dyn Fn(U256) -> U256 + Send + Sync>;

/// Middleware used for adjusting gas using predefined policy
pub struct GasAdjusterMiddleware<M> {
    inner: M,
    gas_estimate_policy: GasPolicy,
    gas_price_policy: GasPolicy,
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
    pub fn new(inner: M, gas_estimate_policy: GasPolicy, gas_price_policy: GasPolicy) -> Self {
        Self {
            inner,
            gas_estimate_policy,
            gas_price_policy,
        }
    }

    pub fn with_default_policy(inner: M, chain_id: u64) -> Self {
        // triple gas estimate
        let gas_estimate_policy = move |gas| gas * 3;

        // 1.5x gas price for ethereum, 2x elsewhere
        let is_ethereum = chain_id == 1;
        let gas_price_policy = move |price| {
            if is_ethereum {
                price + price / 2
            } else {
                price * 2
            }
        };

        Self::new(
            inner,
            Box::new(gas_estimate_policy),
            Box::new(gas_price_policy),
        )
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

        let adjusted_gas = self.estimate_gas(tx).await?;
        let adjusted_price = self.get_gas_price().await?;

        tx.set_gas(adjusted_gas);
        tx.set_gas_price(adjusted_price);

        Ok(())
    }

    async fn get_gas_price(&self) -> Result<U256, Self::Error> {
        self.inner()
            .get_gas_price()
            .await
            .map(&self.gas_price_policy)
            .map_err(FromErr::from)
    }

    async fn estimate_gas(&self, tx: &TypedTransaction) -> Result<U256, Self::Error> {
        self.inner()
            .estimate_gas(tx)
            .await
            .map(&self.gas_estimate_policy)
            .map_err(FromErr::from)
    }
}
