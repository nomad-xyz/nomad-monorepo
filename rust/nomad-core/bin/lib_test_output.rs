#[cfg(feature = "output")]
use nomad_core::test_output::output_functions::*;

fn main() {
    #[cfg(feature = "output")]
    {
        output_signed_updates();
        output_signed_failure_notifications();
        output_message_and_leaf();
    }
}
