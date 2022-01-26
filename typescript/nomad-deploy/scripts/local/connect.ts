import * as tom from '../../config/local/tom';
import * as daffy from '../../config/local/jerry';
import { enrollSpoke } from '../../src/governance/enrollChain';
import { checkHubToSpokeConnectionWithWaiter } from '../../src/governance/enrollChain/checks';
import { deploysToSDK } from '../../src/governance/utils';
import { getPathToDeployConfig } from '../../src/verification/readDeployOutput';
import { ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import { ExistingBridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { NomadContext } from '@nomad-xyz/sdk';

const path = getPathToDeployConfig('dev');

// Instantiate Governor Deploy Tom
const tomCoreDeploy = ExistingCoreDeploy.withPath(
  tom.chain,
  tom.devConfig,
  path,
);
const tomBridgeDeploy = new ExistingBridgeDeploy(
  tom.chain,
  tom.bridgeConfig,
  path,
);
const tomDomain = deploysToSDK(tomCoreDeploy, tomBridgeDeploy);

// Instantiate New Deploy, which is already existing at this moment
const daffyCoreDeploy = ExistingCoreDeploy.withPath(
  daffy.chain,
  daffy.devConfig,
  path,
);
const daffyBridgeDeploy = new ExistingBridgeDeploy(
  daffy.chain,
  daffy.bridgeConfig,
  path,
);
const daffyDomain = deploysToSDK(daffyCoreDeploy, daffyBridgeDeploy);

const sdk = NomadContext.fromDomains([tomDomain, daffyDomain]);

[tomCoreDeploy, daffyCoreDeploy].map((core) => {
  sdk.registerProvider(core.chain.domain, core.provider);
  sdk.registerSigner(core.chain.domain, core.deployer);
});

(async () => {
  await enrollSpoke(sdk, daffyCoreDeploy);
  await checkHubToSpokeConnectionWithWaiter(
    sdk,
    daffyDomain.id,
    daffy.devConfig.watchers,
  );
})();
