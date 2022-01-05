# Script for resolving typechain conflicts
# Run from root (./scripts/resolve-typechain-conflicts.sh)
cd ./solidity/nomad-core
npm run compile
cd ../nomad-xapps
npm run compile
cd ../..
git add typescript/typechain
