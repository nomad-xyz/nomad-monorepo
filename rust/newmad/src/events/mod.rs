pub mod home;
pub mod replica;

// Marker trait
pub trait Events: std::fmt::Debug + Send + Sync {}
impl Events for home::HomeEvents {}
impl Events for replica::ReplicaEvents {}
