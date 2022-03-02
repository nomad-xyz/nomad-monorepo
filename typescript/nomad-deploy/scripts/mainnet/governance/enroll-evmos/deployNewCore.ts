import * as ethereum from '../../../../config/mainnets/ethereum';
import * as moonbeam from '../../../../config/mainnets/moonbeam';
import * as milkomeda from '../../../../config/mainnets/milkomeda';
import * as evmos from '../../../../config/mainnets/evmos';
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
const existingDeploy2 = ExistingCoreDeploy.withPath(
  milkomeda.chain,
  milkomeda.config,
  path,
);

// Instantiate new milkomeda deploy
const newDeploy = new CoreDeploy(
  evmos.chain,
  evmos.config,
);

// deploy Milkomeda core
deployNewChain(newDeploy, governorDeploy, [existingDeploy1, existingDeploy2]);
