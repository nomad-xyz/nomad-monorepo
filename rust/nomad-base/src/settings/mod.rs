//! Settings and configuration for Nomad agents
//!
//! ## Introduction
//!
//! Nomad Agents have a shared core, which contains connection info for rpc,
//! relevant contract addresses on each chain, etc. In addition, each agent has
//! agent-specific settings. Be convention, we represent these as a base config
//! per-Home contract, and a "partial" config per agent. On bootup, the agent
//! loads the configuration, establishes RPC connections, and monitors each
//! configured chain.
//!
//! All agents share the [`Settings`] struct in this crate, and then define any
//! additional `Settings` in their own crate. By convention this is done in
//! `settings.rs` using the [`decl_settings!`] macro.
//!
//! ### Configuration
//!
//! Agents read settings from the config files and/or env.
//!
//! Config files are loaded from `rust/config/default` unless specified
//! otherwise. Currently deployment config directories are labeled by the
//! timestamp at which they were deployed
//!
//! Configuration key/value pairs are loaded in the following order, with later
//! sources taking precedence:
//!
//! 1. The config file specified by the `RUN_ENV` and `BASE_CONFIG`
//!    env vars. `$RUN_ENV/$BASE_CONFIG`
//! 2. The config file specified by the `RUN_ENV` env var and the
//!    agent's name. `$RUN_ENV/{agent}-partial.json`.
//!    E.g. `$RUN_ENV/updater-partial.json`
//! 3. Configuration env vars with the prefix `OPT_BASE` intended
//!    to be shared by multiple agents in the same environment
//!    E.g. `export OPT_BASE_REPLICAS_KOVAN_DOMAIN=3000`
//! 4. Configuration env vars with the prefix `OPT_{agent name}`
//!    intended to be used by a specific agent.
//!    E.g. `export OPT_KATHY_CHAT_TYPE="static message"`

use crate::{agent::AgentCore, CachingHome, CachingReplica, CommonIndexers, HomeIndexers, NomadDB};
use color_eyre::{eyre::bail, Report};
use config::{Config, ConfigError, Environment, File};
use ethers::prelude::AwsSigner;
use nomad_core::{db::DB, utils::HexString, Common, ContractLocator, Signers};
use nomad_ethereum::{make_home_indexer, make_replica_indexer};
use rusoto_core::{credential::EnvironmentProvider, HttpClient};
use rusoto_kms::KmsClient;
use serde::Deserialize;
use std::{collections::HashMap, env, sync::Arc};
use tracing::instrument;

/// Chain configuartion
pub mod chains;

pub use chains::{ChainConf, ChainSetup};

/// Tracing subscriber management
pub mod trace;

use crate::settings::trace::TracingConfig;

use once_cell::sync::OnceCell;

static KMS_CLIENT: OnceCell<KmsClient> = OnceCell::new();

/// Agent types
pub enum AgentType {
    /// Kathy
    Kathy,
    /// Updater
    Updater,
    /// Relayer
    Relayer,
    /// Processor
    Processor,
    /// Watcher
    Watcher,
}

/// Ethereum signer types
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum SignerConf {
    /// A local hex key
    HexKey {
        /// Hex string of private key, without 0x prefix
        key: HexString<64>,
    },
    /// An AWS signer. Note that AWS credentials must be inserted into the env
    /// separately.
    Aws {
        /// The UUID identifying the AWS KMS Key
        id: String, // change to no _ so we can set by env
        /// The AWS region
        region: String,
    },
    #[serde(other)]
    /// Assume node will sign on RPC calls
    Node,
}

impl Default for SignerConf {
    fn default() -> Self {
        Self::Node
    }
}

impl SignerConf {
    /// Try to convert the ethereum signer to a local wallet
    #[instrument(err)]
    pub async fn try_into_signer(&self) -> Result<Signers, Report> {
        match self {
            SignerConf::HexKey { key } => Ok(Signers::Local(key.as_ref().parse()?)),
            SignerConf::Aws { id, region } => {
                let client = KMS_CLIENT.get_or_init(|| {
                    KmsClient::new_with_client(
                        rusoto_core::Client::new_with(
                            EnvironmentProvider::default(),
                            HttpClient::new().unwrap(),
                        ),
                        region.parse().expect("invalid region"),
                    )
                });

                let signer = AwsSigner::new(client, id, 0).await?;
                Ok(Signers::Aws(signer))
            }
            SignerConf::Node => bail!("Node signer"),
        }
    }
}

/// Home indexing settings
#[derive(Debug, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IndexSettings {
    /// The height at which to start indexing the Home contract
    from: Option<String>,
    /// The number of blocks to query at once at which to start indexing the Home contract
    chunk: Option<String>,
}

impl IndexSettings {
    /// Get the `from` setting
    pub fn from(&self) -> u32 {
        self.from
            .as_ref()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or_default()
    }

    /// Get the `chunk_size` setting
    pub fn chunk_size(&self) -> u32 {
        self.chunk
            .as_ref()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(1999)
    }
}

/// Settings. Usually this should be treated as a base config and used as
/// follows:
///
/// ```
/// use nomad_base::*;
/// use serde::Deserialize;
///
/// pub struct OtherSettings { /* anything */ };
///
/// #[derive(Debug, Deserialize)]
/// pub struct MySettings {
///     #[serde(flatten)]
///     base_settings: Settings,
///     #[serde(flatten)]
///     other_settings: (),
/// }
///
/// // Make sure to define MySettings::new()
/// impl MySettings {
///     fn new() -> Self {
///         unimplemented!()
///     }
/// }
/// ```
#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    /// The path to use for the DB file
    pub db: String,
    /// Port to listen for prometheus scrape requests
    pub metrics: Option<String>,
    /// Settings for the home indexer
    #[serde(default)]
    pub index: IndexSettings,
    /// Whether or not agent should use timelag
    #[serde(default)]
    pub use_timelag: bool,
    /// The home configuration
    pub home: ChainSetup,
    /// The replica configurations
    pub replicas: HashMap<String, ChainSetup>,
    /// The tracing configuration
    pub tracing: TracingConfig,
    /// Transaction signers
    pub signers: HashMap<String, SignerConf>,
}

impl Settings {
    /// Private to preserve linearity of AgentCore::from_settings -- creating an agent consumes the settings.
    fn clone(&self) -> Self {
        Self {
            db: self.db.clone(),
            metrics: self.metrics.clone(),
            index: self.index.clone(),
            use_timelag: self.use_timelag,
            home: self.home.clone(),
            replicas: self.replicas.clone(),
            tracing: self.tracing.clone(),
            signers: self.signers.clone(),
        }
    }
}

impl Settings {
    /// Try to get a signer instance by name
    pub async fn get_signer(&self, name: &str) -> Option<Signers> {
        self.signers.get(name)?.try_into_signer().await.ok()
    }

    /// Set timelag on/off
    pub fn use_timelag_for_indexing(&mut self, use_lag: bool) {
        self.use_timelag = use_lag;
    }

    /// Get optional indexing timelag enum for home
    pub fn home_indexing_timelag(&self) -> Option<u8> {
        if self.use_timelag {
            Some(self.home.timelag)
        } else {
            None
        }
    }

    /// Get optional indexing timelag for a replica
    pub fn replica_indexing_timelag(&self, replica_name: &str) -> Option<u8> {
        if self.use_timelag {
            let replica_timelag = self.replicas.get(replica_name).expect("!replica").timelag;
            Some(replica_timelag)
        } else {
            None
        }
    }

    /// Try to get all replicas from this settings object
    pub async fn try_caching_replicas(
        &self,
        db: DB,
    ) -> Result<HashMap<String, Arc<CachingReplica>>, Report> {
        let mut result = HashMap::default();
        for (k, v) in self.replicas.iter().filter(|(_, v)| v.disabled.is_none()) {
            if k != &v.name {
                bail!(
                    "Replica key does not match replica name:\n key: {}  name: {}",
                    k,
                    v.name
                );
            }
            let signer = self.get_signer(&v.name).await;
            let replica_timelag = self.replica_indexing_timelag(k);

            let replica = v.try_into_replica(signer, replica_timelag).await?;
            let indexer = Arc::new(self.try_replica_indexer(v, replica_timelag).await?);
            let nomad_db = NomadDB::new(replica.name(), db.clone());
            result.insert(
                v.name.clone(),
                Arc::new(CachingReplica::new(replica, nomad_db, indexer)),
            );
        }
        Ok(result)
    }

    /// Try to get a home object
    pub async fn try_caching_home(&self, db: DB) -> Result<CachingHome, Report> {
        let signer = self.get_signer(&self.home.name).await;
        let home_timelag = self.home_indexing_timelag();

        let home = self.home.try_into_home(signer, home_timelag).await?;
        let indexer = Arc::new(self.try_home_indexer(home_timelag).await?);
        let nomad_db = NomadDB::new(home.name(), db);
        Ok(CachingHome::new(home, nomad_db, indexer))
    }

    /// Try to get an indexer object for a home
    pub async fn try_home_indexer(&self, timelag: Option<u8>) -> Result<HomeIndexers, Report> {
        let signer = self.get_signer(&self.home.name).await;

        match &self.home.chain {
            ChainConf::Ethereum(conn) => Ok(HomeIndexers::Ethereum(
                make_home_indexer(
                    conn.clone(),
                    &ContractLocator {
                        name: self.home.name.clone(),
                        domain: self.home.domain.parse().expect("invalid uint"),
                        address: self.home.address.parse::<ethers::types::Address>()?.into(),
                    },
                    signer,
                    timelag,
                    self.index.from(),
                    self.index.chunk_size(),
                )
                .await?,
            )),
        }
    }

    /// Try to get an indexer object for a replica
    pub async fn try_replica_indexer(
        &self,
        setup: &ChainSetup,
        timelag: Option<u8>,
    ) -> Result<CommonIndexers, Report> {
        let signer = self.get_signer(&setup.name).await;

        match &setup.chain {
            ChainConf::Ethereum(conn) => Ok(CommonIndexers::Ethereum(
                make_replica_indexer(
                    conn.clone(),
                    &ContractLocator {
                        name: setup.name.clone(),
                        domain: setup.domain.parse().expect("invalid uint"),
                        address: setup.address.parse::<ethers::types::Address>()?.into(),
                    },
                    signer,
                    timelag,
                    self.index.from(),
                    self.index.chunk_size(),
                )
                .await?,
            )),
        }
    }

    /// Try to generate an agent core for a named agent
    pub async fn try_into_core(&self, name: &str) -> Result<AgentCore, Report> {
        let metrics = Arc::new(crate::metrics::CoreMetrics::new(
            name,
            self.metrics
                .as_ref()
                .map(|v| v.parse::<u16>().expect("metrics port must be u16")),
            Arc::new(prometheus::Registry::new()),
        )?);

        let db = DB::from_path(&self.db)?;
        let home = Arc::new(self.try_caching_home(db.clone()).await?);
        let replicas = self.try_caching_replicas(db.clone()).await?;

        Ok(AgentCore {
            home,
            replicas,
            db,
            settings: self.clone(),
            metrics,
            indexer: self.index.clone(),
        })
    }

    /// Read settings from the config file
    pub fn new() -> Result<Self, ConfigError> {
        let mut s = Config::new();

        s.merge(File::with_name("config/default"))?;

        let env = env::var("RUN_MODE").unwrap_or_else(|_| "development".into());
        s.merge(File::with_name(&format!("config/{}", env)).required(false))?;

        // Add in settings from the environment (with a prefix of NOMAD)
        // Eg.. `NOMAD_DEBUG=1 would set the `debug` key
        s.merge(Environment::with_prefix("NOMAD"))?;

        s.try_into()
    }
}
