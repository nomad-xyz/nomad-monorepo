import * as rinkeby from '../../../config/testnets/rinkeby';
import * as kovan from '../../../config/testnets/kovan';
import { ExistingCoreDeploy } from '../../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';
import { deploysToSDK } from '../../../src/incremental/utils';
import { enrollSpoke } from '../../../src/incremental';
import { NomadContext } from '@nomad-xyz/sdk/src';
import { checkHubToSpokeConnection } from '../../../src/incremental/checks';

const path = getPathToDeployConfig('dev');

// Instantiate existing governor deploy on Rinkeby
const rinkebyExistingCoreDeploy = ExistingCoreDeploy.withPath(
  rinkeby.chain,
  rinkeby.devConfig,
  path,
);
const rinkebyExistingBridgeDeploy = new ExistingBridgeDeploy(
  rinkeby.chain,
  rinkeby.bridgeConfig,
  path,
);
const rinkebyDomain = deploysToSDK(
  rinkebyExistingCoreDeploy,
  rinkebyExistingBridgeDeploy,
);

// Enroll Kovan as spoke to Rinkeby hub
const kovanExistingCoreDeploy = ExistingCoreDeploy.withPath(
  kovan.chain,
  kovan.devConfig,
  path,
);
const kovanExistingBridgeDeploy = new ExistingBridgeDeploy(
  kovan.chain,
  kovan.bridgeConfig,
  path,
);
const kovanDomain = deploysToSDK(
  kovanExistingCoreDeploy,
  kovanExistingBridgeDeploy,
);

const sdk = NomadContext.fromDomains([rinkebyDomain, kovanDomain]);

(async () => {
  await enrollSpoke(sdk, kovanDomain.id, kovan.stagingConfig.watchers);
  await checkHubToSpokeConnection(
    sdk,
    kovanDomain.id,
    kovan.stagingConfig.watchers,
  );
})();
