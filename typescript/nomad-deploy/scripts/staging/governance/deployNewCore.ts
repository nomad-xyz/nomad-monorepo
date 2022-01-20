import * as rinkeby from '../../../config/testnets/rinkeby';
import * as kovan from '../../../config/testnets/kovan';
import { CoreDeploy, ExistingCoreDeploy } from '../../../src/core/CoreDeploy';
import { deployNewChain } from '../../../src/core';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';

const path = getPathToDeployConfig('staging');

// Instantiate existing governor deploy on Rinkeby
const rinkebyCoreDeploy = ExistingCoreDeploy.withPath(
    rinkeby.chain,
    rinkeby.stagingConfig,
    path,
);

// Deploy Knew ovan core and bridge with Rinkeby hub
const kovanCoreDeploy = new CoreDeploy(kovan.chain, kovan.devConfig);

deployNewChain(kovanCoreDeploy, rinkebyCoreDeploy);

