import { deployBridgesComplete } from '../../src/bridge';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as milkomedaTestnet from '../../config/testnets/milkomedaTestnet';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';

// get the path to the latest core system deploy
const path = getPathToDeployConfig('dev');

const rinkebyDeploy = new BridgeDeploy(
  rinkeby.chain,
  rinkeby.bridgeConfig,
  path,
);

const milkomedaTestnetDeploy = new BridgeDeploy(
  milkomedaTestnet.chain,
  milkomedaTestnet.bridgeConfig,
  path,
);

deployBridgesComplete([rinkebyDeploy, milkomedaTestnetDeploy]);
