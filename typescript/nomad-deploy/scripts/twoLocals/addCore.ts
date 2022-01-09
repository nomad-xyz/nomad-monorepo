import * as tom from '../../config/local/tom';
import * as jerry from '../../config/local/jerry';
import * as daffy from '../../config/local/daffy';
import { deployNewChain } from '../../src/core';
import { CoreDeploy, ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';
import {getPathToDeployConfig} from "../../src/verification/readDeployOutput";

let environment = deployEnvironment();
const path = getPathToDeployConfig(environment);

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
