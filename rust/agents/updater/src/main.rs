//! The updater signs updates and submits them to the home chain.
//!
//! This updater polls the Home for queued updates at a regular interval.
//! It signs them and submits them back to the home chain.

#![forbid(unsafe_code)]
#![warn(missing_docs)]
#![warn(unused_extern_crates)]

mod produce;
mod settings;
mod submit;
mod updater;

use color_eyre::Result;

use nomad_base::NomadAgent;

use crate::{settings::UpdaterSettings as Settings, updater::Updater};

#[allow(unused_must_use)]
async fn _main() -> Result<()> {
    color_eyre::install()?;
    let settings = Settings::new()?;

    let agent = Updater::from_settings(settings).await?;

    agent
        .as_ref()
        .settings
        .tracing
        .start_tracing(agent.metrics().span_duration())?;

    let _ = agent.metrics().run_http_server();

    agent.run("").await?
}

fn main() -> Result<()> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(_main())
}
