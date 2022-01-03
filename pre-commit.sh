#!/bin/bash

# Specifying minimum versions
MIN_GIT=2.25.0
MIN_CARGO=1.51.0

# prevent envy from borking
export ETHERSCAN_API_KEY=""

echo_abort ()
{
    echo >&2 '
***************
*** ABORTED ***
***************
'
}

ensure()
{
    if ! command -v "$1" &> /dev/null
    then
        echo_abort
        echo "command '$1' could not be found."
        echo "please ensure it is installed."
        exit 1
    fi
}

echo "Making pre-run checks"
ensure npm
ensure cargo
ensure jq
ensure npx

# TODO: DRY these
if (echo min version $MIN_GIT; git --version) | sort -Vk3 | tail -1 | grep -q git
then
    echo "git version 👌"
else
    echo_abort
    echo "Upgrade to git $MIN_GIT or later."
    exit 1
fi

if (echo min $MIN_CARGO; cargo --version) | sort -Vk2 | tail -1 | grep -q cargo
then
    echo "cargo version 👌"
else
    echo_abort
    echo "Upgrade to cargo $MIN_CARGO or later."
    exit 1
fi

echo "Pre-run checks complete"

# Stash uncommitted changes
echo "Stashing changes not staged for commit"
git stash push --keep-index

abort()
{
    echo_abort
    echo "An error occurred. Please review your code and try again" >&2
    git stash pop
    exit 1
}

trap 'abort' 0

set -e
git update-index -q --refresh

# Rust vector output must conditionally run BEFORE Solidity tests
# Conditionally run Rust bins to output into vector JSON files
if ! git diff-index --quiet HEAD -- ./rust/nomad-core/src/lib.rs; then
    echo "+Running lib vector generation"
    cd ./rust/nomad-core
    echo '+cargo run --bin lib_test_output --features output'
    cargo run --bin lib_test_output --features output
    cd ../..
else
    echo "+Skipping lib vector generation"
fi

# Conditionally run Rust bins to output into vector JSON files
if ! git diff-index --quiet HEAD -- ./rust/nomad-core/src/utils.rs; then
    echo "+Running utils vector generation"
    cd ./rust/nomad-core
    echo '+cargo run --bin utils_test_output --features output'
    cargo run --bin utils_test_output --features output
    cd ../..
else
    echo "+Skipping utils vector generation"
fi

# Lint and compile nomad-core
if ! git diff-index --quiet HEAD -- ./solidity/nomad-core; then
    echo "+Updating core ABIs, generating typechain, linting"
    cd ./solidity/nomad-core
    npm run lint
    npm run compile
    # add abis, typechain
    cd ../..
    git add rust/chains/nomad-ethereum/abis
    git add typescript/typechain
    # add linter modified files
    git add solidity/nomad-core/contracts
    git add solidity/nomad-core/libs
    git add solidity/nomad-core/interfaces
else
    echo "+Skipping core ABI updates, typechain generation and lint"
fi

# Lint and compile nomad-xapps
if ! git diff-index --quiet HEAD -- ./solidity/nomad-xapps; then
    echo "+Updating xapps ABIs, generating typechain, linting"
    cd ./solidity/nomad-xapps
    npm run lint
    npm run compile
    # add typechain
    cd ../..
    git add typescript/typechain
    # add linter modified files
    git add solidity/nomad-xapps/contracts
    git add solidity/nomad-xapps/interfaces
else
    echo "+Skipping xapps ABI updates, typechain generation and lint"
fi

# Run rust tests, clippy, and formatting
if ! git diff-index --quiet HEAD -- ./rust; then
    echo "+Running rust tests"
    cd ./rust
    echo '+cargo fmt -- --check'
    cargo fmt -- --check
    echo '+cargo clippy -- -D warnings'
    cargo clippy -- -D warnings
    echo '+cargo test -- -q'
    cargo test -- -q
    cd ..
else
    echo "+Skipping rust tests"
fi

# Test solidity contracts
if ! git diff-index --quiet HEAD -- ./solidity/nomad-core ./solidity/nomad-xapps ./typescript/nomad-tests ./typescript/nomad-deploy; then
    echo "+Running solidity tests"
    cd ./typescript/nomad-tests
    npm run test
    cd ../..
else
    echo "+Skipping solidity tests"
fi

# Git add abis if updated
abis_dir=./rust/chains/nomad-ethereum/abis/
if ! git diff-index --quiet HEAD -- $abis_dir; then
    echo "+git add $abis_dir\*"
    git add $abis_dir/*
else
    echo "+Skipping git add ABIs"
fi

# Git add rust contract bindings if updated
bindings_dir=./rust/chains/nomad-ethereum/src/bindings/
if ! git diff-index --quiet HEAD -- $bindings_dir; then
    echo "+git add $bindings_dir\*"
    git add $bindings_dir/*
else
    echo "+Skipping git add contract bindings"
fi

# Format and git add JSON files if updated
if ! git diff-index --quiet HEAD -- ./vectors; then
    for file in vectors/*.json; do
        temp=$(mktemp)
        jq . "$file" > "$temp"
        mv -f "$temp" "$file"
    done

    echo '+git add ./vectors/*'
    git add ./vectors/*
else
    echo "+Skipping git add vectors"
fi

trap : 0

echo >&2 '
************
*** DONE ***
************
'

git stash pop -q
