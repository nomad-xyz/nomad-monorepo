import { deploysToSDK } from '../../src/incremental/utils';
import * as rinkeby from '../../config/testnets/rinkeby';
import * as kovan from '../../config/testnets/kovan';
import { deployNewChain } from '../../src/core';
import { deployNewChainBridge } from '../../src/bridge';
import { CoreDeploy, ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import {
  BridgeDeploy,
  ExistingBridgeDeploy,
} from '../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';
import { NomadContext } from '@nomad-xyz/sdk';
import { enrollSpoke } from '../../src/incremental';
import { checkHubToSpokeConnection } from '../../src/incremental/checks';

const path = getPathToDeployConfig('staging');

// Instantiate existing governor deploys on Rinkeby
const rinkebyCoreDeploy = ExistingCoreDeploy.withPath(
  rinkeby.chain,
  rinkeby.stagingConfig,
  path,
);
const rinkebyBridgeDeploy = new ExistingBridgeDeploy(
  rinkeby.chain,
  rinkeby.bridgeConfig,
  path,
);
const rinkebyDomain = deploysToSDK(rinkebyCoreDeploy, rinkebyBridgeDeploy);

// Deploy Kovan core and bridge with Rinkeby hub
const kovanCoreDeploy = new CoreDeploy(kovan.chain, kovan.devConfig);
const kovanBridgeDeploy = new BridgeDeploy(
  kovan.chain,
  kovan.bridgeConfig,
  path,
);
deployNewChain(kovanCoreDeploy, rinkebyCoreDeploy);
deployNewChainBridge(kovanBridgeDeploy, rinkebyBridgeDeploy);

// Enroll Kovan as spoke to Rinkeby hub (reinstantiate kovan objects now with
// addresses)
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
