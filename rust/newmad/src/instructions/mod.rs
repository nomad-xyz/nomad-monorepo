pub mod connection;
pub mod home;
pub mod replica;

// marker trait
pub trait Instruction: Send + Sync + 'static {}
impl Instruction for home::HomeInstructions {}
impl Instruction for replica::ReplicaInstructions {}
impl Instruction for connection::ConnectionInstructions {}
