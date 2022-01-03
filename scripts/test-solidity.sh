# script for running solidity tests locally
# Run from root (./scripts/test-solidity.sh)

set -e

# skip compileation steps if any arg is passed
if [ $# -eq 0 ]; then
    pwd=`pwd`
    # compile contracts
    cd ./solidity/nomad-core
    npm run compile
    cd ../nomad-xapps
    npm run compile
    # build typechain
    cd ../../typescript/typechain
    npm run build
    # run tests
    cd $pwd
fi

cd typescript/nomad-tests
npm i
npm run testNoCompile
cd ../..