import { deployHubAndSpoke } from '../../src/core';
import * as jerry from '../../config/local/jerry';
import * as tom from '../../config/local/tom';
import { CoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';

let environment = deployEnvironment();

let tomConfig = environment === 'staging' ? tom.stagingConfig : tom.devConfig;
let jerryConfig =
  environment === 'staging' ? jerry.stagingConfig : jerry.devConfig;

const tomDeploy = new CoreDeploy(tom.chain, tomConfig);
const jerryDeploy = new CoreDeploy(jerry.chain, jerryConfig);

deployHubAndSpoke(tomDeploy, [jerryDeploy]);
