use nomad_core::SignedFailureNotification;

#[derive(Debug, Clone)]
pub enum ConnectionInstructions {
    UnenrollReplica(SignedFailureNotification),
}
