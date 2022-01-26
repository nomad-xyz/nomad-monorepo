import * as rinkeby from '../../../../config/testnets/rinkeby';
import * as kovan from '../../../../config/testnets/kovan';
import { ExistingCoreDeploy } from '../../../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../../../src/bridge/BridgeDeploy';
import { deploysToSDK } from '../../../../src/governance/utils';
import { getPathToDeployConfig } from '../../../../src/verification/readDeployOutput';
import { NomadContext } from '@nomad-xyz/sdk';
import { upgradeBridgeRouter } from '../../../../src/governance/upgrade';
import { ENVIRONMENT, REASON } from './constants';

// TODO: REPEATING THIS BOILERPLATE EVERYWHERE IS DRIVING ME CRAZY. need to fix.
const path = getPathToDeployConfig(ENVIRONMENT);

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
const kovanDomain = deploysToSDK(kovanCoreDeploy, kovanBridgeDeploy);

// setup SDK
const sdkDomains = [rinkebyDomain, kovanDomain];
const sdk = NomadContext.fromDomains(sdkDomains);
const sdkCores = [rinkebyCoreDeploy, kovanCoreDeploy];
sdkCores.forEach((core) => {
  sdk.registerProvider(core.chain.domain, core.provider);
  sdk.registerSigner(core.chain.domain, core.deployer);
});

// upgrade the bridge router on Kovan
upgradeBridgeRouter(sdk, kovanCoreDeploy, kovanBridgeDeploy, REASON);
