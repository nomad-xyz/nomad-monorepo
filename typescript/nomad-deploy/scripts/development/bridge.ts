import { deployBridgesHubAndSpoke } from '../../src/bridge';
import * as kovan from '../../config/testnets/kovan';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';

// get the path to the latest core system deploy
const path = getPathToDeployConfig('dev');

const moonBaseAlphaDeploy = new BridgeDeploy(
  moonbasealpha.chain,
  moonbasealpha.bridgeConfig,
  path,
);

const kovanDeploy = new BridgeDeploy(kovan.chain, kovan.bridgeConfig, path);

deployBridgesHubAndSpoke(kovanDeploy, [moonBaseAlphaDeploy]);
