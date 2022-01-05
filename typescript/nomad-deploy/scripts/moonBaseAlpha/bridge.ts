import { getPathToLatestDeploy } from '../../src/verification/readDeployOutput';
import { deployBridges } from '../../src/bridge';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';

// get the path to the latest core system deploy
const path = getPathToLatestDeploy();

const kovanDeploy = new BridgeDeploy(kovan.chain, kovan.bridgeConfig, path);

const moonBaseAlphaDeploy = new BridgeDeploy(
  moonbasealpha.chain,
  moonbasealpha.bridgeConfig,
  path,
);

deployBridges([
  kovanDeploy,
  moonBaseAlphaDeploy,
]);
