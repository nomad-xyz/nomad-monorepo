//! Configuration

use nomad_base::decl_settings;

decl_settings!(Relayer {
    /// The polling interval (in seconds)
    interval: String,
});
