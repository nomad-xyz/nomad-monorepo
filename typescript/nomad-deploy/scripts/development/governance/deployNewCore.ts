import * as rinkeby from '../../../config/testnets/rinkeby';
import * as kovan from '../../../config/testnets/kovan';
import * as moonbasealpha from '../../../config/testnets/moonbasealpha';
import * as milkomedaTestnet from '../../../config/testnets/milkomedaTestnet';
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

const kovanCoreDeploy = ExistingCoreDeploy.withPath(
  kovan.chain,
  kovan.devConfig,
  path,
);

// Instantiate new milkomeda deploy
const milkomedaTestnetCoreDeploy = new CoreDeploy(
  milkomedaTestnet.chain,
  milkomedaTestnet.devConfig,
);

// deploy Milkomeda core
deployNewChain(milkomedaTestnetCoreDeploy, rinkebyCoreDeploy, [
  moonbaseAlphaCoreDeploy,
  kovanCoreDeploy,
]);
