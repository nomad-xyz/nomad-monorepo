import * as rinkeby from '../../../config/testnets/rinkeby';
import * as evmostestnet from '../../../config/testnets/evmostestnet';
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

// Enroll milkomedatestnet as spoke to Rinkeby hub
const evmostestnetCoreDeploy = ExistingCoreDeploy.withPath(
  evmostestnet.chain,
  evmostestnet.devConfig,
  path,
);
const evmostestnetBridgeDeploy = new ExistingBridgeDeploy(
  evmostestnet.chain,
  evmostestnet.bridgeConfig,
  path,
);
const evmostestnetDomain = deploysToSDK(
  evmostestnetCoreDeploy,
  evmostestnetBridgeDeploy,
);

// setup SDK
const sdkDomains = [rinkebyDomain, evmostestnetDomain];
const sdk = NomadContext.fromDomains(sdkDomains);
const sdkCores = [rinkebyCoreDeploy, evmostestnetCoreDeploy];
sdkCores.forEach((core) => {
  sdk.registerProvider(core.chain.domain, core.provider);
  sdk.registerSigner(core.chain.domain, core.deployer);
});

// enroll spoke then check enrollment
enrollSpoke(sdk, evmostestnetDomain.id, evmostestnet.devConfig);
