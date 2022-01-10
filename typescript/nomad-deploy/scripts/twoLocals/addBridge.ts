import * as tom from '../../config/local/tom';
import * as jerry from '../../config/local/jerry';
import * as daffy from '../../config/local/daffy';
import { deployNewChainBridge } from '../../src/bridge';
import {
  BridgeDeploy,
  ExistingBridgeDeploy,
} from '../../src/bridge/BridgeDeploy';
import { deployEnvironment } from '../../src/chain';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';

let environment = deployEnvironment();
const path = getPathToDeployConfig(environment);

// Instantiate Existing Bridge Deploys
const tomDeploy = new ExistingBridgeDeploy(tom.chain, tom.bridgeConfig, path);
const jerryDeploy = new ExistingBridgeDeploy(
  jerry.chain,
  jerry.bridgeConfig,
  path,
);

// Instantiate New Bridge Deploy
const daffyDeploy = new BridgeDeploy(daffy.chain, daffy.bridgeConfig, path);

deployNewChainBridge(daffyDeploy, [tomDeploy, jerryDeploy]);
