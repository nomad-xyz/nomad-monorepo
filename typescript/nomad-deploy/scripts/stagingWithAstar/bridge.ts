import { deployBridgesComplete } from '../../src/bridge';
import * as kovan from '../../config/testnets/kovan';
import * as astar from '../../config/mainnets/astar';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';

// get the path to the latest core system deploy
const path = getPathToDeployConfig('dev');

const kovanDeploy = new BridgeDeploy(kovan.chain, kovan.bridgeConfig, path);

const astarDeploy = new BridgeDeploy(astar.chain, astar.bridgeConfig, path);

deployBridgesComplete([kovanDeploy, astarDeploy]);
