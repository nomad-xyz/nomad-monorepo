import * as rinkeby from '../../../config/testnets/rinkeby';
import * as evmostestnet from '../../../config/testnets/evmostestnet';
import {
  BridgeDeploy,
  ExistingBridgeDeploy,
} from '../../../src/bridge/BridgeDeploy';
import { deployNewChainBridge } from '../../../src/bridge';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';

const path = getPathToDeployConfig('dev');

// Instantiate existing governor deploys on Rinkeby
const rinkebyBridgeDeploy = new ExistingBridgeDeploy(
  rinkeby.chain,
  rinkeby.bridgeConfig,
  path,
);

// make new evmostestnet bridge Deploy
const evmostestnetBridgeDeploy = new BridgeDeploy(
  evmostestnet.chain,
  evmostestnet.bridgeConfig,
  path,
);

// Deploy Kovan bridge with Rinkeby hub
deployNewChainBridge(evmostestnetBridgeDeploy, rinkebyBridgeDeploy);
