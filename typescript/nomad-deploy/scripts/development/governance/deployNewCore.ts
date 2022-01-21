import * as rinkeby from '../../../config/testnets/rinkeby';
import * as kovan from '../../../config/testnets/kovan';
import * as moonbasealpha from '../../../config/testnets/moonbasealpha';
import { CoreDeploy, ExistingCoreDeploy } from '../../../src/core/CoreDeploy';
import { deployNewChain } from '../../../src/core';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';

const path = getPathToDeployConfig('dev');

// Instantiate existing governor deploy on Rinkeby
const rinkebyCoreDeploy = ExistingCoreDeploy.withPath(
  rinkeby.chain,
  rinkeby.devConfig,
  path,
);

// instantiate other existing deploys
const moonbaseAlphaCoreDeploy = ExistingCoreDeploy.withPath(
  moonbasealpha.chain,
  moonbasealpha.devConfig,
  path,
);

// make new Kovan core Deploy
const kovanCoreDeploy = new CoreDeploy(kovan.chain, kovan.devConfig);

// deploy Kovan core
deployNewChain(kovanCoreDeploy, rinkebyCoreDeploy, [moonbaseAlphaCoreDeploy]);
