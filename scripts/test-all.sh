#!/bin/sh
# Script for testing entire nomad monorepo unconditionally
# Run from root (./scripts/test-all.sh)

set -xe

# update ABIs
(
    cd ./solidity

    echo "+Lint and compile core"
    cd ./nomad-core
    npm run lint
    npm run compile

    echo "+Lint and compile xApps"
    cd ../nomad-xapps
    npm run lint
    npm run compile
)

# run Rust bins to output into vector JSON files
(
    cd ./rust/nomad-core

    echo "+Running lib vector generation"
    echo '+cargo run --bin lib_test_output --features output'
    cargo run --bin lib_test_output --features output

    echo "+Running utils vector generation"
    echo '+cargo run --bin utils_test_output --features output'
    cargo run --bin utils_test_output --features output

    cd ..

    # Run rust tests, clippy, and formatting
    echo "+Running rust tests"
    echo '+cargo fmt -- --check'
    cargo fmt -- --check
    echo '+cargo clippy -- -D warnings'
    cargo clippy -- -D warnings
    echo '+cargo test -- -q'
    cargo test -- -q
)

# Run solidity tests
echo "+Running solidity tests"
cd ./typescript/nomad-tests
npm run testNoCompile