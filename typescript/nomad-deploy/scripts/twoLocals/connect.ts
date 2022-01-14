import * as tom from '../../config/local/tom';
import * as daffy from '../../config/local/jerry';
import { ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';
import { ExistingBridgeDeploy } from '../../src/bridge/BridgeDeploy';
import {
  connectionGovernanceActions,
  executeGovernanceActions,
} from '../../src/incremental';

let environment = deployEnvironment();

const path =
  process.env.DEPLOY_PATH || environment === 'staging'
    ? '../../rust/config/staging'
    : '../../rust/config/development';

// Instantiate Governor Deploy Tom
const tomConfig = environment === 'staging' ? tom.stagingConfig : tom.devConfig;
const tomCoreDeploy = ExistingCoreDeploy.withPath(tom.chain, tomConfig, path);

// Instantiate New Deploy, which is already existing at this moment
let daffyConfig =
  environment === 'staging' ? daffy.stagingConfig : daffy.devConfig;
const daffyCoreDeploy = ExistingCoreDeploy.withPath(
  daffy.chain,
  daffyConfig,
  path,
);

// Instantiate Existing Bridge Deploys
const tomBridgeDeploy = new ExistingBridgeDeploy(
  tom.chain,
  tom.bridgeConfig,
  path,
);

// Instantiate New Bridge Deploy, which is already existing at this moment
const daffyBridgeDeploy = new ExistingBridgeDeploy(
  daffy.chain,
  daffy.bridgeConfig,
  path,
);

const actions = connectionGovernanceActions(
  tomCoreDeploy,
  tomBridgeDeploy,
  daffyCoreDeploy,
  daffyBridgeDeploy,
);

executeGovernanceActions(tomCoreDeploy, actions);
