# script for running solidity tests locally
# Run from root (./scripts/test-solidity.sh)

set -e

# compile contracts
cd ./solidity/nomad-core
npm run compile
cd ../nomad-xapps
npm run compile
# build typechain
cd ../../typescript/typechain
npm run build
# run tests
cd ../nomad-tests
npm i
npm run testNoCompile
cd ../..