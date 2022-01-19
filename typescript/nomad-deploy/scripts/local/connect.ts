import * as tom from '../../config/local/tom';
import * as daffy from '../../config/local/jerry';
import { enrollSpoke } from '../../src/incremental';
import {getPathToDeployConfig} from "../../src/verification/readDeployOutput";
import {CoreDeploy, ExistingCoreDeploy} from '../../src/core/CoreDeploy';
import {BridgeDeploy, ExistingBridgeDeploy} from '../../src/bridge/BridgeDeploy';
import { NomadContext } from '@nomad-xyz/sdk';

const path = getPathToDeployConfig("dev");

// Instantiate Governor Deploy Tom
const tomCoreDeploy = ExistingCoreDeploy.withPath(tom.chain, tom.devConfig, path);
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

enrollSpoke(sdk, daffyDomain.id, daffy.devConfig.watchers);

// TODO: move this elsewhere
function deploysToSDK(core: CoreDeploy, bridge: BridgeDeploy) {
  return {
    id: core.chain.domain,
    name: core.chain.name,
    bridgeRouter: bridge.contracts.bridgeRouter!.proxy.address,
    tokenRegistry: bridge.contracts.tokenRegistry!.proxy.address,
    ethHelper: bridge.contracts.ethHelper?.address,
    home: core.contracts.home!.proxy.address,
    replicas: Object.entries(core.contracts.replicas).map(
        ([domain, replica]) => ({
          domain: parseInt(domain),
          address: replica.proxy.address,
        }),
    ),
    governanceRouter: core.contracts.governance!.proxy.address,
    xAppConnectionManager: core.contracts.xAppConnectionManager!.address,
    safeService: 'todo',
  }
}
