#[cfg(feature = "output")]
use nomad_core::test_output::output_functions::*;

fn main() {
    #[cfg(feature = "output")]
    {
        output_merkle_proof();
    }
}
