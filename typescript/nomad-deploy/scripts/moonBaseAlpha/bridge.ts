import { getPathToLatestDeploy } from '../../src/verification/readDeployOutput';
import { deployBridges } from '../../src/bridge';
import * as alfajores from '../../config/testnets/alfajores';
import * as kovan from '../../config/testnets/kovan';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';

// get the path to the latest core system deploy
const path = getPathToLatestDeploy();

const alfajoresDeploy = new BridgeDeploy(
  alfajores.chain,
  alfajores.bridgeConfig,
  path,
);
const kovanDeploy = new BridgeDeploy(
  kovan.chain, 
  kovan.bridgeConfig, 
  path
);

const rinkebyDeploy = new BridgeDeploy(
  rinkeby.chain,
  rinkeby.bridgeConfig,
  path,
);

const moonBaseAlphaDeploy = new BridgeDeploy(
  moonbasealpha.chain,
  moonbasealpha.bridgeConfig,
  path,
);

deployBridges([
  kovanDeploy, 
  alfajoresDeploy, 
  rinkebyDeploy, 
  moonBaseAlphaDeploy
]);
