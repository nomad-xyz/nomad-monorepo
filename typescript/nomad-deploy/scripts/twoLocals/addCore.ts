import * as tom from '../../config/local/tom';
import * as jerry from '../../config/local/jerry';
import * as daffy from '../../config/local/daffy';
import { deployNewChain } from '../../src/core';
import { CoreDeploy, ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';

let environment = deployEnvironment();

const path =
  process.env.DEPLOY_PATH || environment === 'staging'
    ? '../../rust/config/staging'
    : '../../rust/config/development';

// Instantiate Existing Bridge Deploys
const tomDeploy = ExistingCoreDeploy.withPath(
  tom.chain,
  environment === 'staging' ? tom.stagingConfig : tom.devConfig,
  path,
);
const jerryDeploy = ExistingCoreDeploy.withPath(
  jerry.chain,
  environment === 'staging' ? jerry.stagingConfig : jerry.devConfig,
  path,
);

// Instantiate New Bridge Deploy
const daffyDeploy = new CoreDeploy(
  daffy.chain,
  environment === 'staging' ? daffy.stagingConfig : daffy.devConfig,
);

deployNewChain(daffyDeploy, [tomDeploy, jerryDeploy]);
