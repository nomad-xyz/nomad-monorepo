use nomad_core::{Message, SignedUpdate};

#[derive(Debug, Clone)]
pub enum HomeInstructions {
    Update(SignedUpdate),
    Dispatch(Message),
    Improper(SignedUpdate),
}
