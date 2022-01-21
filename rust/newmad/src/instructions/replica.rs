use nomad_core::{accumulator::merkle::Proof, NomadMessage};

#[derive(Debug, Clone)]
pub enum ReplicaInstructions {
    Prove(Proof),
    Process(NomadMessage),
    ProveAndProcess { proof: Proof, message: NomadMessage },
}
