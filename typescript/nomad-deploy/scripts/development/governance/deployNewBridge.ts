import * as rinkeby from '../../../config/testnets/rinkeby';
import * as milkomedaTestnet from '../../../config/testnets/milkomedaTestnet';
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

// make new milkomedaTestnet bridge Deploy
const milkomedaTestnetBridgeDeploy = new ExistingBridgeDeploy(
  milkomedaTestnet.chain,
  milkomedaTestnet.bridgeConfig,
  path,
);

// Deploy Kovan bridge with Rinkeby hub
deployNewChainBridge(milkomedaTestnetBridgeDeploy, rinkebyBridgeDeploy);
