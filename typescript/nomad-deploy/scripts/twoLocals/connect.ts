import * as tom from '../../config/local/tom';
import * as daffy from '../../config/local/jerry';
import { ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';
import { ExistingBridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { enrollSpoke } from '../../src/incremental';
import { NomadContext } from '@nomad-xyz/sdk';

let environment = deployEnvironment();

const path =
  process.env.DEPLOY_PATH || environment === 'staging'
    ? '../../rust/config/staging'
    : '../../rust/config/development';

// Instantiate Governor Deploy Tom
const tomConfig = environment === 'staging' ? tom.stagingConfig : tom.devConfig;
const tomCoreDeploy = ExistingCoreDeploy.withPath(tom.chain, tomConfig, path);

// Instantiate New Deploy, which is already existing at this moment
let daffyConfig =
  environment === 'staging' ? daffy.stagingConfig : daffy.devConfig;
const daffyCoreDeploy = ExistingCoreDeploy.withPath(
  daffy.chain,
  daffyConfig,
  path,
);

// Instantiate Existing Bridge Deploys
const tomBridgeDeploy = new ExistingBridgeDeploy(
  tom.chain,
  tom.bridgeConfig,
  path,
);

// Instantiate New Bridge Deploy, which is already existing at this moment
const daffyBridgeDeploy = new ExistingBridgeDeploy(
  daffy.chain,
  daffy.bridgeConfig,
  path,
);

const tomDomain = {
  id: tomCoreDeploy.chain.domain,
  name: tomCoreDeploy.chain.name,
  bridgeRouter: tomBridgeDeploy.contracts.bridgeRouter!.proxy.address,
  tokenRegistry: tomBridgeDeploy.contracts.tokenRegistry!.proxy.address,
  ethHelper: tomBridgeDeploy.contracts.ethHelper?.address,
  home: tomCoreDeploy.contracts.home!.proxy.address,
  replicas: Object.entries(tomCoreDeploy.contracts.replicas).map(
    ([domain, replica]) => ({
      domain: parseInt(domain),
      address: replica.proxy.address,
    }),
  ),
  governanceRouter: tomCoreDeploy.contracts.governance!.proxy.address,
  xAppConnectionManager: tomCoreDeploy.contracts.xAppConnectionManager!.address,
  safeService: 'todo',
};

const daffyDomain = {
  id: daffyCoreDeploy.chain.domain,
  name: daffyCoreDeploy.chain.name,
  bridgeRouter: daffyBridgeDeploy.contracts.bridgeRouter!.proxy.address,
  tokenRegistry: daffyBridgeDeploy.contracts.tokenRegistry!.proxy.address,
  ethHelper: daffyBridgeDeploy.contracts.ethHelper?.address,
  home: daffyCoreDeploy.contracts.home!.proxy.address,
  replicas: Object.entries(daffyCoreDeploy.contracts.replicas).map(
    ([domain, replica]) => ({
      domain: parseInt(domain),
      address: replica.proxy.address,
    }),
  ),
  governanceRouter: daffyCoreDeploy.contracts.governance!.proxy.address,
  xAppConnectionManager:
    daffyCoreDeploy.contracts.xAppConnectionManager!.address,
  safeService: 'todo',
};

const sdk = NomadContext.fromDomains([tomDomain, daffyDomain]);

enrollSpoke(sdk, daffyDomain.id, []);
