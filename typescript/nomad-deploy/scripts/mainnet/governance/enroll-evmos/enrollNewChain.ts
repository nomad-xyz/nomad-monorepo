import * as ethereum from '../../../../config/mainnets/ethereum';
import * as evmos from '../../../../config/mainnets/evmos';
import { ExistingCoreDeploy } from '../../../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../../../src/verification/readDeployOutput';
import { deploysToSDK } from '../../../../src/incremental/utils';
import { enrollSpoke } from '../../../../src/incremental';
import { NomadContext } from '@nomad-xyz/sdk';

const path = getPathToDeployConfig('prod');

// Instantiate existing governor deploy
const governorCore = ExistingCoreDeploy.withPath(
  ethereum.chain,
  ethereum.config,
  path,
);
const governorBridge = new ExistingBridgeDeploy(
  ethereum.chain,
  ethereum.bridgeConfig,
  path,
);
const governorDomain = deploysToSDK(governorCore, governorBridge);

// Enroll new chain as spoke with governing hub
const newCore = ExistingCoreDeploy.withPath(
  evmos.chain,
  evmos.config,
  path,
);
const newBridge = new ExistingBridgeDeploy(
  evmos.chain,
  evmos.bridgeConfig,
  path,
);
const newDomain = deploysToSDK(
  newCore,
  newBridge,
);

// setup SDK
const sdkDomains = [governorDomain, newDomain];
const sdk = NomadContext.fromDomains(sdkDomains);
const sdkCores = [governorCore, newCore];
sdkCores.forEach((core) => {
  sdk.registerProvider(core.chain.domain, core.provider);
  sdk.registerSigner(core.chain.domain, core.deployer);
});

// enroll spoke then check enrollment
enrollSpoke(sdk, newDomain.id, evmos.config);
