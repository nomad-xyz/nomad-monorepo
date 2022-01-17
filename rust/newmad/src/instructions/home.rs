use nomad_core::{Message, SignedUpdate};

pub enum HomeInstructions {
    Update(SignedUpdate),
    Dispatch(Message),
    Improper(SignedUpdate),
}
