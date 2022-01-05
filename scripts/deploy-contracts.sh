#!/bin/bash
set -e

cd ./typescript/nomad-deploy
npm run deploy-core
npm run deploy-bridge
cd ../../solidity/nomad-core
npm run verify
cd ../nomad-xapps
npm run verify