import {deployBridgesComplete} from '../../src/bridge';
import * as kovan from '../../config/testnets/kovan';
import * as ropsten from '../../config/testnets/ropsten';
import * as moonbasealpha from '../../config/testnets/moonbasealpha';
import * as shibuya from '../../config/testnets/shibuya';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';

// get the path to the latest core system deploy
const path = getPathToDeployConfig('dev');

const moonBaseAlphaDeploy = new BridgeDeploy(
  moonbasealpha.chain,
  moonbasealpha.bridgeConfig,
  path,
);

const shibuyaDeploy = new BridgeDeploy(
  shibuya.chain, 
  shibuya.bridgeConfig, 
  path
);

const kovanDeploy = new BridgeDeploy(
  kovan.chain, 
  kovan.bridgeConfig, 
  path
);

const ropstenDeploy = new BridgeDeploy(
  ropsten.chain, 
  ropsten.bridgeConfig, 
  path
);

deployBridgesComplete([kovanDeploy, ropstenDeploy, shibuyaDeploy, moonBaseAlphaDeploy]);
