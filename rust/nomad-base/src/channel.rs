use crate::{CachingHome, CachingReplica, NomadDB};
use std::sync::Arc;

#[derive(Debug, Clone)]
/// Commmon data needed for a single agent channel
pub struct ChannelBase {
    /// Home
    pub home: Arc<CachingHome>,
    /// Replica
    pub replica: Arc<CachingReplica>,
    /// NomadDB keyed by home
    pub db: NomadDB,
}

#[macro_export]
/// Declare a new channel block
/// ### Usage
///
/// ```ignore
/// decl_agent!(Relayer {
///     updates_relayed_counts: prometheus::IntCounterVec,
///     interval: u64,
/// });

/// ```
macro_rules! decl_channel {
    (
        $name:ident {
            $($(#[$tags:meta])* $prop:ident: $type:ty,)*
        }
    ) => {
        paste::paste! {
            #[derive(Debug, Clone)]
            #[doc = "Channel for `" $name]
            pub struct [<$name Channel>] {
                pub(crate) base: nomad_base::ChannelBase,
                $(
                    $(#[$tags])*
                    pub(crate) $prop: $type,
                )*
            }

            impl AsRef<nomad_base::ChannelBase> for [<$name Channel>] {
                fn as_ref(&self) -> &nomad_base::ChannelBase {
                    &self.base
                }
            }

            impl [<$name Channel>] {
                pub fn home(&self) -> Arc<CachingHome> {
                    self.as_ref().home.clone()
                }

                pub fn replica(&self) -> Arc<CachingReplica> {
                    self.as_ref().replica.clone()
                }

                pub fn db(&self) -> nomad_base::NomadDB {
                    self.as_ref().db.clone()
                }
            }
        }
    }
}
