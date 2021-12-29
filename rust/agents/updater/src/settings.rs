//! Configuration
use nomad_base::*;

decl_settings!(Updater {
    /// The updater attestation signer
    updater: nomad_base::SignerConf,
    /// The polling interval (in seconds)
    interval: String,
});
