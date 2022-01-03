import { getPathToLatestDeploy } from '../../src/verification/readDeployOutput';
import { deployBridges } from '../../src/bridge';
import * as jerry from '../../config/local/jerry';
import * as tom from '../../config/local/tom';
import { BridgeDeploy } from '../../src/bridge/BridgeDeploy';

// get the path to the latest core system deploy
const path = getPathToLatestDeploy();

const tomDeploy = new BridgeDeploy(tom.chain, tom.bridgeConfig, path);
const jerryDeploy = new BridgeDeploy(jerry.chain, jerry.bridgeConfig, path);

deployBridges([tomDeploy, jerryDeploy]);
