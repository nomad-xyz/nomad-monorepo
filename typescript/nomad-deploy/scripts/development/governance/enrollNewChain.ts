import * as rinkeby from '../../../config/testnets/rinkeby';
import * as kovan from '../../../config/testnets/kovan';
import { ExistingCoreDeploy } from '../../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';
import { deploysToSDK } from '../../../src/incremental/utils';
import { enrollSpoke } from '../../../src/incremental';
import { checkHubToSpokeConnection } from '../../../src/incremental/checks';
import { NomadContext } from '@nomad-xyz/sdk';

const path = getPathToDeployConfig('dev');

// Instantiate existing governor deploy on Rinkeby
const rinkebyCoreDeploy = ExistingCoreDeploy.withPath(
  rinkeby.chain,
  rinkeby.devConfig,
  path,
);
const rinkebyBridgeDeploy = new ExistingBridgeDeploy(
  rinkeby.chain,
  rinkeby.bridgeConfig,
  path,
);
const rinkebyDomain = deploysToSDK(
  rinkebyCoreDeploy,
  rinkebyBridgeDeploy,
);

// Enroll Kovan as spoke to Rinkeby hub
const kovanCoreDeploy = ExistingCoreDeploy.withPath(
  kovan.chain,
  kovan.devConfig,
  path,
);
const kovanBridgeDeploy = new ExistingBridgeDeploy(
  kovan.chain,
  kovan.bridgeConfig,
  path,
);
const kovanDomain = deploysToSDK(
  kovanCoreDeploy,
  kovanBridgeDeploy,
);

// setup SDK
const sdkDomains = [rinkebyDomain, kovanDomain];
const sdk = NomadContext.fromDomains(sdkDomains);
sdkDomains.map(core => {
    sdk.registerProvider(core.chain.domain, core.provider);
    sdk.registerSigner(core.chain.domain, core.deployer);
});

// enroll spoke then check enrollment
(async () => {
  await enrollSpoke(sdk, kovanDomain.id, kovan.stagingConfig.watchers);
  await checkHubToSpokeConnection(
    sdk,
    kovanDomain.id,
    kovan.stagingConfig.watchers,
  );
})();

