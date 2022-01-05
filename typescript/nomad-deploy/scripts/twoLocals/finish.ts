import {
  getEnrollReplicaCall,
  getEnrollWatchersCall,
} from '../../src/core';
import * as tom from '../../config/local/tom';
import * as jerry from '../../config/local/jerry';
import * as daffy from '../../config/local/jerry';
import { ExistingCoreDeploy } from '../../src/core/CoreDeploy';
import { deployEnvironment } from '../../src/chain';
import { ExistingBridgeDeploy } from '../../src/bridge/BridgeDeploy';
import { getEnrollBridgeCall } from '../../src/bridge';
import { CallData, toBytes32 } from '../../src/utils';
import { checkCoreDeploy } from '../../src/core/checks';
import { checkBridgeDeploy } from '../../src/bridge/checks';

let environment = deployEnvironment();

const path =
  process.env.DEPLOY_PATH || environment === 'staging'
    ? '../../rust/config/staging'
    : '../../rust/config/development';

// Instantiate Governor Deploy Tom
const tomConfig = environment === 'staging' ? tom.stagingConfig : tom.devConfig;
const tomCoreDeploy = ExistingCoreDeploy.withPath(tom.chain, tomConfig, path);

// Instantiate another old deploy Jerry
const jerryConfig =
  environment === 'staging' ? jerry.stagingConfig : jerry.devConfig;
const jerryCoreDeploy = ExistingCoreDeploy.withPath(
  jerry.chain,
  jerryConfig,
  path,
);

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
const jerryBridgeDeploy = new ExistingBridgeDeploy(
  jerry.chain,
  jerry.bridgeConfig,
  path,
);

// Instantiate New Bridge Deploy, which is already existing at this moment
const daffyBridgeDeploy = new ExistingBridgeDeploy(
  daffy.chain,
  daffy.bridgeConfig,
  path,
);

const governingRouter = tomCoreDeploy.contracts.governance!.proxy;

// Collecting deploys for coninience in iterating
const oldDeploys: [ExistingCoreDeploy, ExistingBridgeDeploy][] = [
  [tomCoreDeploy, tomBridgeDeploy],
  [jerryCoreDeploy, jerryBridgeDeploy],
];

const promises = oldDeploys.map(([oldCore, oldBridge]) => {
  // We have a set of calls, but only here we know where they go. If we meld them into gnosis safe
  const calls: CallData[] = [
    getEnrollBridgeCall(daffyBridgeDeploy, oldBridge),
    getEnrollReplicaCall(daffyCoreDeploy, oldCore),
    ...getEnrollWatchersCall(daffyCoreDeploy, oldCore),
  ];

  // If current oldCore is governing (tom is governing)
  if (oldCore == tomCoreDeploy) {
    return governingRouter.callLocal(calls, tomCoreDeploy.overrides);
  } else {
    return governingRouter.callRemote(
      oldCore.chain.domain,
      calls,
      tomCoreDeploy.overrides,
    );
  }
});

const setRouterPromise = governingRouter.setRouterGlobal(
  daffyCoreDeploy.chain.domain,
  toBytes32(daffyCoreDeploy.contracts.governance!.proxy.address),
);
promises.push(setRouterPromise);

Promise.all(promises).then(async () => {
  const remoteDomains = [tomCoreDeploy, jerryCoreDeploy].map(
    (d) => d.chain.domain,
  );
  await checkCoreDeploy(
    daffyCoreDeploy,
    remoteDomains,
    tomCoreDeploy.chain.domain,
  );
  await checkBridgeDeploy(daffyBridgeDeploy, remoteDomains);
});
