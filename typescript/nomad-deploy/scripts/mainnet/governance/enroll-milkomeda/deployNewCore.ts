import * as ethereum from '../../../../config/mainnets/ethereum';
import * as moonbeam from '../../../../config/mainnets/moonbeam';
import * as milkomeda from '../../../../config/mainnets/milkomeda';
import { CoreDeploy, ExistingCoreDeploy } from '../../../../src/core/CoreDeploy';
import { deployNewChain } from '../../../../src/core';
import { getPathToDeployConfig } from '../../../../src/verification/readDeployOutput';

const path = getPathToDeployConfig('prod');

// Instantiate existing governor deploy on Rinkeby
const governorDeploy = ExistingCoreDeploy.withPath(
  ethereum.chain,
  ethereum.config,
  path,
);

// instantiate other existing deploys
const existingDeploy1 = ExistingCoreDeploy.withPath(
  moonbeam.chain,
  moonbeam.config,
  path,
);

// Instantiate new milkomeda deploy
const newDeploy = new CoreDeploy(
  milkomeda.chain,
  milkomeda.config,
);

// deploy Milkomeda core
deployNewChain(newDeploy, governorDeploy, [existingDeploy1]);
