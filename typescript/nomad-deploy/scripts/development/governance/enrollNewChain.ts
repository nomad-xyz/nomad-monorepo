import * as kovan from '../../../config/testnets/kovan';
import * as moonbaseAlpha from '../../../config/testnets/moonbaseAlpha';
import { ExistingCoreDeploy } from '../../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../../src/bridge/BridgeDeploy';
import { getPathToDeployConfig } from '../../../src/verification/readDeployOutput';
import { deploysToSDK } from '../../../src/incremental/utils';
import { enrollSpoke } from '../../../src/incremental';
import { NomadContext } from '@nomad-xyz/sdk/src';

const path = getPathToDeployConfig('staging');

// Instantiate existing governor deploy on Kovan
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

// Enroll Moonbase Alpha as spoke to Kovan hub
const moonbaseAlphaCoreDeploy = ExistingCoreDeploy.withPath(
    moonbaseAlpha.chain,
    moonbaseAlpha.stagingConfig,
    path,
);
const moonbaseAlphaBridgeDeploy = new ExistingBridgeDeploy(
    moonbaseAlpha.chain,
    moonbaseAlpha.bridgeConfig,
    path,
);
const moonbaseAlphaDomain = deploysToSDK(moonbaseAlphaCoreDeploy, moonbaseAlphaBridgeDeploy);

const sdk = NomadContext.fromDomains([moonbaseAlphaDomain, kovanDomain]);

enrollSpoke(sdk, moonbaseAlphaDomain.id, moonbaseAlpha.stagingConfig.watchers);
