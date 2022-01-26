import { getPathToDeployConfig } from '../../../../src/verification/readDeployOutput';
import { ExistingCoreDeploy } from '../../../../src/core/CoreDeploy';
import * as rinkeby from '../../../../config/testnets/rinkeby';
import { ExistingBridgeDeploy } from '../../../../src/bridge/BridgeDeploy';
import { deploysToSDK } from '../../../../src/governance/utils';
import * as kovan from '../../../../config/testnets/kovan';
import { NomadContext } from '@nomad-xyz/sdk';
import { executeRemoteBatches } from '../../../../src/governance';
import { ENVIRONMENT, REASON } from './constants';

// BOILERPLATE
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

executeRemoteBatches(sdk, ENVIRONMENT, REASON);
