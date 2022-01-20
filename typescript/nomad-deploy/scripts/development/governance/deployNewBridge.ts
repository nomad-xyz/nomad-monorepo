import * as rinkeby from '../../../config/testnets/rinkeby';
import * as kovan from '../../../config/testnets/kovan';
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

// Deploy Kovan core and bridge with Rinkeby hub
const kovanBridgeDeploy = new BridgeDeploy(
  kovan.chain,
  kovan.bridgeConfig,
  path,
);

deployNewChainBridge(kovanBridgeDeploy, rinkebyBridgeDeploy);
