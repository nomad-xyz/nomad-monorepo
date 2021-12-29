import * as tom from '../../config/local/tom';
import * as jerry from '../../config/local/jerry';
import * as daffy from '../../config/local/daffy';
import { deployNewChainBridge } from '../../src/bridge';
import {
  BridgeDeploy,
  ExistingBridgeDeploy,
} from '../../src/bridge/BridgeDeploy';
import { deployEnvironment } from '../../src/chain';

let environment = deployEnvironment();

const path =
  process.env.DEPLOY_PATH || environment === 'staging'
    ? '../../rust/config/staging'
    : '../../rust/config/development';

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
