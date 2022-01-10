import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';
import { deployBridgesComplete } from '../../src/bridge';
import * as jerry from '../../config/local/jerry';
import * as tom from '../../config/local/tom';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { deployEnvironment } from '../../src/chain';

// get the path to the latest core system deploy
let environment = deployEnvironment();
const path = getPathToDeployConfig(environment);

const tomDeploy = new BridgeDeploy(tom.chain, tom.bridgeConfig, path);
const jerryDeploy = new BridgeDeploy(jerry.chain, jerry.bridgeConfig, path);

deployBridgesComplete([tomDeploy, jerryDeploy]);
