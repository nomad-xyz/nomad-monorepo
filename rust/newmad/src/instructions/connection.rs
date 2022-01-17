use nomad_core::SignedFailureNotification;

pub enum ConnectionInstructions {
    UnenrollReplica(SignedFailureNotification),
}
