import * as rinkeby from '../../../config/testnets/rinkeby';
import * as milkomedaTestnet from '../../../config/testnets/milkomedaTestnet';
import { ExistingCoreDeploy } from '../../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';
import { deploysToSDK } from '../../../src/incremental/utils';
import { enrollSpoke } from '../../../src/incremental';
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
const rinkebyDomain = deploysToSDK(rinkebyCoreDeploy, rinkebyBridgeDeploy);

// Enroll milkomedaTestnet as spoke to Rinkeby hub
const milkomedaTestnetCoreDeploy = ExistingCoreDeploy.withPath(
  milkomedaTestnet.chain,
  milkomedaTestnet.devConfig,
  path,
);
const milkomedaTestnetBridgeDeploy = new ExistingBridgeDeploy(
  milkomedaTestnet.chain,
  milkomedaTestnet.bridgeConfig,
  path,
);
const milkomedaTestnetDomain = deploysToSDK(
  milkomedaTestnetCoreDeploy,
  milkomedaTestnetBridgeDeploy,
);

// setup SDK
const sdkDomains = [rinkebyDomain, milkomedaTestnetDomain];
const sdk = NomadContext.fromDomains(sdkDomains);
const sdkCores = [rinkebyCoreDeploy, milkomedaTestnetCoreDeploy];
sdkCores.forEach((core) => {
  sdk.registerProvider(core.chain.domain, core.provider);
  sdk.registerSigner(core.chain.domain, core.deployer);
});

// enroll spoke then check enrollment
enrollSpoke(sdk, milkomedaTestnetDomain.id, milkomedaTestnet.devConfig);
