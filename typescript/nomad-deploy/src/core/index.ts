import { assert } from 'console';
import fs from 'fs';
import { ethers } from 'ethers';
import * as proxyUtils from '../proxyUtils';
import { CoreDeploy } from './CoreDeploy';
import * as contracts from '@nomad-xyz/contract-interfaces/core';
import { checkCoreDeploy } from './checks';
import { CallData, formatCall } from '../utils';
import { getPathToDeployConfig } from '../verification/readDeployOutput';
import { canonizeId } from '@nomad-xyz/sdk/utils';

function log(isTest: boolean, str: string) {
  if (!isTest) {
    console.log(str);
  }
}

function warn(text: string, padded: boolean = false) {
  if (padded) {
    const padding = '*'.repeat(text.length + 8);
    console.log(
      `
      ${padding}
      *** ${text.toUpperCase()} ***
      ${padding}
      `,
    );
  } else {
    console.log(`**** ${text.toUpperCase()} ****`);
  }
}

function getGovernorDeploy(deploys: CoreDeploy[]): CoreDeploy {
  const isTest: boolean = deploys.filter((c) => c.test).length > 0;
  if (isTest) return deploys[0];

  const govDeploy = deploys.find((d) => d.config.governor != undefined);
  if (!govDeploy)
    throw new Error(
      `Deploy with governing domain was not found in array of old deploys ${deploys}`,
    );

  return govDeploy;
}

function getNonGovernorDeploys(deploys: CoreDeploy[]): CoreDeploy[] {
  const isTest: boolean = deploys.filter((c) => c.test).length > 0;
  if (isTest) return deploys.slice(1);

  return deploys.filter((d) => d.config.governor == undefined);
}

export async function deployUpgradeBeaconController(deploy: CoreDeploy) {
  let factory = new contracts.UpgradeBeaconController__factory(deploy.deployer);
  deploy.contracts.upgradeBeaconController = await factory.deploy(
    deploy.overrides,
  );
  assert(deploy.contracts.upgradeBeaconController);
  await deploy.contracts.upgradeBeaconController.deployTransaction.wait(
    deploy.chain.confirmations,
  );

  // add contract information to Etherscan verification array
  deploy.verificationInput.push({
    name: 'UpgradeBeaconController',
    address: deploy.contracts.upgradeBeaconController.address,
    constructorArguments: [],
  });
}

/**
 * Deploys the UpdaterManager on the chain of the given deploy and updates
 * the deploy instance with the new contract.
 *
 * @param deploy - The deploy instance
 */
export async function deployUpdaterManager(deploy: CoreDeploy) {
  let factory = new contracts.UpdaterManager__factory(deploy.deployer);
  deploy.contracts.updaterManager = await factory.deploy(
    deploy.config.updater,
    deploy.overrides,
  );
  await deploy.contracts.updaterManager.deployTransaction.wait(
    deploy.chain.confirmations,
  );

  // add contract information to Etherscan verification array
  deploy.verificationInput.push({
    name: 'UpdaterManager',
    address: deploy.contracts.updaterManager!.address,
    constructorArguments: [deploy.config.updater],
  });
}

/**
 * Deploys the XAppConnectionManager on the chain of the given deploy and updates
 * the deploy instance with the new contract.
 *
 * @param deploy - The deploy instance
 */
export async function deployXAppConnectionManager(deploy: CoreDeploy) {
  const isTestDeploy: boolean = deploy.test;
  if (isTestDeploy) warn('deploying test XAppConnectionManager');

  const deployer = deploy.deployer;
  const factory = isTestDeploy
    ? new contracts.TestXAppConnectionManager__factory(deployer)
    : new contracts.XAppConnectionManager__factory(deployer);

  deploy.contracts.xAppConnectionManager = await factory.deploy(
    deploy.overrides,
  );
  await deploy.contracts.xAppConnectionManager.deployTransaction.wait(
    deploy.chain.confirmations,
  );

  // add contract information to Etherscan verification array
  deploy.verificationInput.push({
    name: 'XAppConnectionManager',
    address: deploy.contracts.xAppConnectionManager!.address,
    constructorArguments: [],
  });
}

/**
 * Deploys the Home proxy on the chain of the given deploy and updates
 * the deploy instance with the new contract.
 *
 * @param deploy - The deploy instance
 */
export async function deployHome(deploy: CoreDeploy) {
  const isTestDeploy: boolean = deploy.test;
  if (isTestDeploy) warn('deploying test Home');
  const homeFactory = isTestDeploy
    ? contracts.TestHome__factory
    : contracts.Home__factory;

  let { updaterManager } = deploy.contracts;
  let initData = homeFactory
    .createInterface()
    .encodeFunctionData('initialize', [updaterManager!.address]);

  deploy.contracts.home = await proxyUtils.deployProxy<contracts.Home>(
    'Home',
    deploy,
    new homeFactory(deploy.deployer),
    initData,
    deploy.chain.domain,
  );
}

/**
 * Deploys the GovernanceRouter proxy on the chain of the given deploy and updates
 * the deploy instance with the new contract.
 *
 * @param deploy - The deploy instance
 */
export async function deployGovernanceRouter(deploy: CoreDeploy) {
  const isTestDeploy: boolean = deploy.test;
  if (isTestDeploy) warn('deploying test GovernanceRouter');
  const governanceRouter = isTestDeploy
    ? contracts.TestGovernanceRouter__factory
    : contracts.GovernanceRouter__factory;

  let { xAppConnectionManager } = deploy.contracts;
  const recoveryManager = deploy.config.recoveryManager;
  const recoveryTimelock = deploy.config.recoveryTimelock;

  let initData = governanceRouter
    .createInterface()
    .encodeFunctionData('initialize', [
      xAppConnectionManager!.address,
      recoveryManager,
    ]);

  deploy.contracts.governance =
    await proxyUtils.deployProxy<contracts.GovernanceRouter>(
      'Governance',
      deploy,
      new governanceRouter(deploy.deployer),
      initData,
      deploy.chain.domain,
      recoveryTimelock,
    );
}

/**
 * Deploys an unenrolled Replica proxy on the local chain and updates the local
 * deploy instance with the new contract.
 *
 * @param local - The local deploy instance
 * @param remote - The remote deploy instance
 */
export async function deployUnenrolledReplica(
  local: CoreDeploy,
  remote: CoreDeploy,
) {
  const isTestDeploy: boolean = remote.test;
  if (isTestDeploy) warn('deploying test Replica');

  const replica = isTestDeploy
    ? contracts.TestReplica__factory
    : contracts.Replica__factory;

  let initData = replica.createInterface().encodeFunctionData('initialize', [
    remote.chain.domain,
    remote.config.updater,
    ethers.constants.HashZero, // TODO: allow configuration in case of recovery
    remote.config.optimisticSeconds,
  ]);

  // if we have no replicas, deploy the whole setup.
  // otherwise just deploy a fresh proxy
  let proxy;
  if (Object.keys(local.contracts.replicas).length === 0) {
    log(
      isTestDeploy,
      `${local.chain.name}: deploying initial Replica for ${remote.chain.name}`,
    );
    proxy = await proxyUtils.deployProxy<contracts.Replica>(
      'Replica',
      local,
      new replica(local.deployer),
      initData,
      local.chain.domain,
      local.config.processGas,
      local.config.reserveGas,
    );
  } else {
    log(
      isTestDeploy,
      `${local.chain.name}: deploying additional Replica for ${remote.chain.name}`,
    );
    const prev = Object.entries(local.contracts.replicas)[0][1];
    proxy = await proxyUtils.duplicate<contracts.Replica>(
      'Replica',
      local,
      prev,
      initData,
    );
  }
  local.contracts.replicas[remote.chain.domain] = proxy;
  log(
    isTestDeploy,
    `${local.chain.name}: replica deployed for ${remote.chain.name}`,
  );
}

/**
 * Deploys the entire nomad suite of contracts on the chain of the given deploy
 * and updates the deploy instance with the new contracts.
 *
 * @param deploy - The deploy instance
 */
export async function deployNomad(deploy: CoreDeploy) {
  const isTestDeploy: boolean = deploy.test;
  if (isTestDeploy) {
    warn('deploying test contracts', true);
  }

  log(isTestDeploy, `${deploy.chain.name}: awaiting deploy UBC(deploy);`);
  await deployUpgradeBeaconController(deploy);

  log(
    isTestDeploy,
    `${deploy.chain.name}: awaiting deploy UpdaterManager(deploy);`,
  );
  await deployUpdaterManager(deploy);

  log(
    isTestDeploy,
    `${deploy.chain.name}: awaiting deploy XappConnectionManager(deploy);`,
  );
  await deployXAppConnectionManager(deploy);

  log(isTestDeploy, `${deploy.chain.name}: awaiting deploy Home(deploy);`);
  await deployHome(deploy);

  log(
    isTestDeploy,
    `${deploy.chain.name}: awaiting XAppConnectionManager.setHome(...);`,
  );
  await deploy.contracts.xAppConnectionManager!.setHome(
    deploy.contracts.home!.proxy.address,
    deploy.overrides,
  );

  log(
    isTestDeploy,
    `${deploy.chain.name}: awaiting updaterManager.setHome(...);`,
  );
  await deploy.contracts.updaterManager!.setHome(
    deploy.contracts.home!.proxy.address,
    deploy.overrides,
  );

  log(
    isTestDeploy,
    `${deploy.chain.name}: awaiting deploy GovernanceRouter(deploy);`,
  );
  await deployGovernanceRouter(deploy);

  log(isTestDeploy, `${deploy.chain.name}: initial chain deploy completed`);
}

/**
 * Transfers ownership to the GovernanceRouter.
 *
 * @param deploy - The deploy instance
 */
export async function relinquish(deploy: CoreDeploy) {
  const isTestDeploy = deploy.test;
  const govRouter = await deploy.contracts.governance!.proxy.address;

  log(isTestDeploy, `${deploy.chain.name}: Relinquishing control`);
  await deploy.contracts.updaterManager!.transferOwnership(
    govRouter,
    deploy.overrides,
  );

  log(
    isTestDeploy,
    `${deploy.chain.name}: Dispatched relinquish updatermanager`,
  );

  await deploy.contracts.xAppConnectionManager!.transferOwnership(
    govRouter,
    deploy.overrides,
  );

  log(
    isTestDeploy,
    `${deploy.chain.name}: Dispatched relinquish XAppConnectionManager`,
  );

  await deploy.contracts.upgradeBeaconController!.transferOwnership(
    govRouter,
    deploy.overrides,
  );

  log(
    isTestDeploy,
    `${deploy.chain.name}: Dispatched relinquish upgradeBeaconController`,
  );

  const replicaEntries = Object.entries(deploy.contracts.replicas);
  for (let replicaEntry of replicaEntries) {
    const remoteDomain = replicaEntry[0];
    const replica = replicaEntry[1];
    await replica!.proxy.transferOwnership(govRouter, deploy.overrides);
    log(
      isTestDeploy,
      `${deploy.chain.name}: Dispatched relinquish Replica for ${remoteDomain}`,
    );
  }

  let tx = await deploy.contracts.home!.proxy.transferOwnership(
    govRouter,
    deploy.overrides,
  );

  log(isTestDeploy, `${deploy.chain.name}: Dispatched relinquish home`);

  await tx.wait(deploy.chain.confirmations);
  log(isTestDeploy, `${deploy.chain.name}: Control relinquished`);
}

/**
 * Enrolls a remote replica on the local chain.
 *
 * @param local - The local deploy instance
 * @param remote - The remote deploy instance
 */
export async function enrollReplica(local: CoreDeploy, remote: CoreDeploy) {
  const isTestDeploy = local.test;
  log(isTestDeploy, `${local.chain.name}: starting replica enrollment`);

  let tx = await local.contracts.xAppConnectionManager!.ownerEnrollReplica(
    local.contracts.replicas[remote.chain.domain].proxy.address,
    remote.chain.domain,
    local.overrides,
  );
  await tx.wait(local.chain.confirmations);

  log(isTestDeploy, `${local.chain.name}: replica enrollment done`);
}

/**
 * Enrolls a remote watcher on the local chain.
 *
 * @param local - The local deploy instance
 * @param remote - The remote deploy instance
 */
export async function enrollWatchers(left: CoreDeploy, right: CoreDeploy) {
  const isTestDeploy = left.test;
  log(isTestDeploy, `${left.chain.name}: starting watcher enrollment`);

  await Promise.all(
    left.config.watchers.map(async (watcher) => {
      const tx =
        await left.contracts.xAppConnectionManager!.setWatcherPermission(
          watcher,
          right.chain.domain,
          true,
          left.overrides,
        );
      await tx.wait(left.chain.confirmations);
    }),
  );

  log(isTestDeploy, `${left.chain.name}: watcher enrollment done`);
}

/**
 * Enrolls a remote GovernanceRouter on the local chain.
 *
 * @param local - The local deploy instance
 * @param remote - The remote deploy instance
 */
export async function enrollGovernanceRouter(
  local: CoreDeploy,
  remote: CoreDeploy,
) {
  const isTestDeploy = local.test;
  log(
    isTestDeploy,
    `${local.chain.name}: starting enroll ${remote.chain.name} governance router`,
  );
  let tx = await local.contracts.governance!.proxy.setRouterLocal(
    remote.chain.domain,
    canonizeId(remote.contracts.governance!.proxy.address),
    local.overrides,
  );
  await tx.wait(local.chain.confirmations);
  log(
    isTestDeploy,
    `${local.chain.name}: enrolled ${remote.chain.name} governance router`,
  );
}

/**
 * Enrolls a remote Replica, GovernanceRouter and Watchers on the local chain.
 *
 * @param local - The local deploy instance
 * @param remote - The remote deploy instance
 */
export async function enrollRemote(local: CoreDeploy, remote: CoreDeploy) {
  await deployUnenrolledReplica(local, remote);
  await enrollReplica(local, remote);
  await enrollWatchers(local, remote);
  await enrollGovernanceRouter(local, remote);
}

/**
 * Transfers governorship to the governing chain's GovernanceRouter.
 *
 * @param gov - The governor chain deploy instance
 * @param non - The non-governor chain deploy instance
 */
export async function transferGovernorship(gov: CoreDeploy, non: CoreDeploy) {
  log(gov.test, `${non.chain.name}: transferring governorship`);
  let governorAddress = await gov.contracts.governance!.proxy.governor();
  let tx = await non.contracts.governance!.proxy.transferGovernor(
    gov.chain.domain,
    governorAddress,
    non.overrides,
  );
  await tx.wait(gov.chain.confirmations);
  log(gov.test, `${non.chain.name}: governorship transferred`);
}

/**
 * Appints the intended ultimate governor in that domain's Governance Router.
 * If the governor address is not configured, it will remain the deployer
 * address.
 * @param gov - The governor chain deploy instance
 */
export async function appointGovernor(gov: CoreDeploy) {
  let governor = gov.config.governor;
  if (governor) {
    log(
      gov.test,
      `${gov.chain.name}: transferring root governorship to ${governor.domain}:${governor.address}`,
    );
    const tx = await gov.contracts.governance!.proxy.transferGovernor(
      governor.domain,
      governor.address,
      gov.overrides,
    );
    await tx.wait(gov.chain.confirmations);
    log(gov.test, `${gov.chain.name}: root governorship transferred`);
  }
}

/**
 * Deploys the entire nomad suite of contracts on two chains.
 *
 * @notice `gov` has the governance capability after setup
 *
 * @param gov - The governor chain deploy instance
 * @param non - The non-governor chain deploy instance
 */
export async function deployTwoChains(gov: CoreDeploy, non: CoreDeploy) {
  const isTestDeploy: boolean = gov.test || non.test;

  log(isTestDeploy, 'Beginning Two Chain deploy process');
  log(isTestDeploy, `Deploy env is ${gov.config.environment}`);
  log(isTestDeploy, `${gov.chain.name} is governing`);
  log(
    isTestDeploy,
    `Updater for ${gov.chain.name} Home is ${gov.config.updater}`,
  );
  log(
    isTestDeploy,
    `Updater for ${non.chain.name} Home is ${non.config.updater}`,
  );

  log(isTestDeploy, 'awaiting provider ready');
  await Promise.all([gov.ready(), non.ready()]);
  log(isTestDeploy, 'done readying');

  await Promise.all([deployNomad(gov), deployNomad(non)]);

  log(isTestDeploy, 'initial deploys done');

  await Promise.all([
    deployUnenrolledReplica(gov, non),
    deployUnenrolledReplica(non, gov),
  ]);

  log(isTestDeploy, 'replica deploys done');

  await Promise.all([enrollReplica(gov, non), enrollReplica(non, gov)]);

  log(isTestDeploy, 'replica enrollment done');

  await Promise.all([enrollWatchers(gov, non), enrollWatchers(non, gov)]);

  await Promise.all([
    enrollGovernanceRouter(gov, non),
    enrollGovernanceRouter(non, gov),
  ]);

  if (gov.config.governor) {
    log(isTestDeploy, `appoint governor: ${gov.config.governor}`);
    await appointGovernor(gov);
  }

  await transferGovernorship(gov, non);

  await Promise.all([relinquish(gov), relinquish(non)]);

  // checks deploys are correct
  const govDomain = gov.chain.domain;
  const nonDomain = non.chain.domain;
  await checkCoreDeploy(gov, [nonDomain], govDomain);
  await checkCoreDeploy(non, [govDomain], govDomain);

  if (!isTestDeploy) {
    writeDeployOutput([gov, non]);
  }
}

function containsDuplicateDomains(array: any): boolean {
  return new Set(array).size !== array.length;
}

/**
 * Deploy the entire suite of Nomad contracts
 * on each chain within the chainConfigs array
 * including the upgradable Home, Replicas, and GovernanceRouter
 * that have been deployed, initialized, and configured
 * according to the deployNomad script
 *
 * @dev The first chain in the array will be the governing chain
 *
 * @param deploys - An array of chain deploys
 */
export async function deployComplete(deploys: CoreDeploy[]) {
  const domains = deploys.map((deploy) => deploy.chain.domain);
  if (containsDuplicateDomains(domains)) {
    throw new Error(
      'You have specified multiple deploys with the same domain. Check your config.',
    );
  }

  if (deploys.length == 0) {
    throw new Error('Must pass at least one deploy config');
  }

  // there exists any chain marked test
  const isTestDeploy: boolean = deploys.filter((c) => c.test).length > 0;

  log(isTestDeploy, `Beginning ${deploys.length} Chain deploy process`);
  log(isTestDeploy, `Deploy env is ${deploys[0].config.environment}`);
  log(isTestDeploy, `${deploys[0].chain.name} is governing`);
  deploys.forEach((deploy) => {
    log(
      isTestDeploy,
      `Updater for ${deploy.chain.name} Home is ${deploy.config.updater}`,
    );
  });

  const govChain = getGovernorDeploy(deploys);
  const nonGovChains = getNonGovernorDeploys(deploys);

  log(isTestDeploy, 'awaiting provider ready');
  await Promise.all([
    deploys.map(async (deploy) => {
      await deploy.ready();
    }),
  ]);
  log(isTestDeploy, 'done readying');

  // store block numbers for each chain, so that agents know where to start
  await Promise.all(deploys.map((d) => d.recordFromBlock()));

  // deploy nomad on each chain
  await Promise.all(
    deploys.map(async (deploy) => {
      await deployNomad(deploy);
    }),
  );

  // enroll remotes on every chain
  //
  //    NB: do not use Promise.all for this block. It introduces a race condition
  //    which results in multiple replica implementations on the home chain.
  //
  for (let local of deploys) {
    const remotes = deploys.filter(
      (d) => d.chain.domain !== local.chain.domain,
    );
    for (let remote of remotes) {
      log(
        isTestDeploy,
        `connecting ${remote.chain.name} on ${local.chain.name}`,
      );
      await enrollRemote(local, remote);
      log(
        isTestDeploy,
        `connected ${remote.chain.name} on ${local.chain.name}`,
      );
    }
  }

  // appoint the configured governance account as governor
  if (govChain.config.governor) {
    log(
      isTestDeploy,
      `appoint governor: ${govChain.config.governor.address} at ${govChain.config.governor.domain}`,
    );
    await appointGovernor(govChain);
  }

  await Promise.all(
    nonGovChains.map(async (non) => {
      await transferGovernorship(govChain, non);
    }),
  );

  // relinquish control of all chains
  await Promise.all(deploys.map(relinquish));

  // checks deploys are correct
  const govDomain = govChain.chain.domain;
  for (var i = 0; i < deploys.length; i++) {
    const localDomain = deploys[i].chain.domain;
    const remoteDomains = deploys
      .map((deploy) => deploy.chain.domain)
      .filter((domain) => {
        return domain != localDomain;
      });
    await checkCoreDeploy(deploys[i], remoteDomains, govDomain);
  }

  // write config outputs
  if (!isTestDeploy) {
    writeDeployOutput(deploys);
  }
}

/**
 * Deploy the entire suite of Nomad contracts
 * on each chain within the chainConfigs array
 * including the upgradable Home, Replicas, and GovernanceRouter
 * that have been deployed, initialized, and configured
 * according to the deployNomad script
 *
 * @dev The first chain in the array will be the governing chain
 *
 * @param deploys - An array of chain deploys
 */
export async function deployHubAndSpoke(hub: CoreDeploy, spokes: CoreDeploy[]) {
  if (!hub) {
    throw new Error('Must pass hub config');
  } else if (spokes.length == 0) {
    throw new Error('Must pass at least one spoke config');
  }

  // setup array of all deploys
  const deploys = [hub, ...spokes];
  const domains = deploys.map((deploy) => deploy.chain.domain);
  if (containsDuplicateDomains(domains)) {
    throw new Error(
      'You have specified multiple deploys with the same domain. Check your config.',
    );
  }

  // there exists any chain marked test
  const isTestDeploy: boolean = deploys.filter((c) => c.test).length > 0;

  log(isTestDeploy, 'awaiting provider ready');
  await Promise.all([
    deploys.map(async (deploy) => {
      await deploy.ready();
    }),
  ]);
  log(isTestDeploy, 'done readying');

  log(
    isTestDeploy,
    `Beginning 1 Hub, ${spokes.length} Spoke${
      spokes.length > 1 ? 's' : ''
    } deploy process`,
  );
  log(isTestDeploy, `Deploy env is ${hub.config.environment}`);
  log(isTestDeploy, `${hub.chain.name} is governing hub`);
  log(
    isTestDeploy,
    `${JSON.stringify(spokes.map((deploy) => deploy.chain.name))} ${
      spokes.length > 1 ? 'are spokes' : 'is spoke'
    }`,
  );
  deploys.forEach((deploy) => {
    log(
      isTestDeploy,
      `Updater for ${deploy.chain.name} Home is ${deploy.config.updater}`,
    );
  });

  // ensure that the hub has a governor config
  if (!isTestDeploy && !hub.config.governor) {
    throw new Error(`Hub has no governor config`);
  }

  // store block numbers for each chain, so that agents know where to start
  await Promise.all(deploys.map((d) => d.recordFromBlock()));

  // deploy nomad on each chain
  await Promise.all(
    deploys.map(async (deploy) => {
      await deployNomad(deploy);
    }),
  );

  // enroll hub on all spoke chains
  await Promise.all(
    spokes.map(async (spoke) => {
      log(
        isTestDeploy,
        `connecting Spoke ${spoke.chain.name} to Hub ${hub.chain.name}`,
      );
      await enrollRemote(spoke, hub);
      log(
        isTestDeploy,
        `connected Spoke ${spoke.chain.name} to Hub ${hub.chain.name}`,
      );
    }),
  );

  // enroll spokes on hub chain
  //    NB: do not use Promise.all for this block. It introduces a race condition
  //    which results in multiple replica implementations on the home chain.
  //
  for (let spoke of spokes) {
    log(
      isTestDeploy,
      `connecting Hub ${hub.chain.name} to Spoke ${spoke.chain.name}`,
    );
    await enrollRemote(hub, spoke);
    log(
      isTestDeploy,
      `connected Hub ${hub.chain.name} to Spoke ${spoke.chain.name}`,
    );
  }

  // appoint the configured governance account as governor
  if (hub.config.governor) {
    log(
      isTestDeploy,
      `appoint governor: ${hub.config.governor.address} at ${hub.config.governor.domain}`,
    );
    // TODO: governor chain should never transfer to another domain...
    await appointGovernor(hub);
  }

  await Promise.all(
    spokes.map(async (spoke) => {
      await transferGovernorship(hub, spoke);
    }),
  );

  // relinquish control of all chains
  await Promise.all(deploys.map(relinquish));

  // checks spoke deploys are correct
  for (let spoke of spokes) {
    await checkCoreDeploy(spoke, [hub.chain.domain], hub.chain.domain);
  }

  // check hub deploy is correct
  await checkCoreDeploy(
    hub,
    spokes.map((spoke) => spoke.chain.domain),
    hub.chain.domain,
  );

  // write config outputs
  if (!isTestDeploy) {
    writeHubAndSpokeOutput(hub, spokes);
  }
}
/**
 * Deploy the entire suite of Nomad contracts
 * on a single new chain
 * including the upgradable Home, Replicas, and GovernanceRouter
 * that have been deployed, initialized, and configured
 * according to the deployNomad script
 *
 * @param newDeploy - A single chain deploy for the new chain being added
 * @param hubDeploy - A governing (hub) deploy of already-deployed chain, including chain, config, and deploy.contracts.governance.proxy
 */
export async function deployNewChain(
  newDeploy: CoreDeploy,
  hubDeploy: CoreDeploy,
) {
  if (!newDeploy || !hubDeploy) {
    throw new Error('Bad deploy input for deployNewChain');
  }

  // there exists any chain marked test
  const isTestDeploy: boolean = newDeploy.test || hubDeploy.test;

  // log the deploy details
  log(
    isTestDeploy,
    `Beginning New Chain deploy process for ${newDeploy.chain.name}`,
  );
  log(isTestDeploy, `Deploy env is ${newDeploy.config.environment}`);
  log(
    isTestDeploy,
    `Updater for ${newDeploy.chain.name} Home is ${newDeploy.config.updater}`,
  );

  // wait for providers to be ready
  log(isTestDeploy, 'awaiting provider ready');
  await Promise.all([newDeploy.ready(), hubDeploy.ready()]);
  log(isTestDeploy, 'done readying');

  // deploy nomad on the new chain
  await deployNomad(newDeploy);

  // deploy remotes on new spoke chain & hub chain
  log(
    isTestDeploy,
    `connecting ${hubDeploy.chain.name} on ${newDeploy.chain.name}`,
  );
  // deploy and enroll replica for the hub chain on the new chain
  await enrollRemote(newDeploy, hubDeploy);
  log(
    isTestDeploy,
    `connected ${hubDeploy.chain.name} on ${newDeploy.chain.name}`,
  );

  // deploy a replica for the new chain on hub chain
  // note: this will have to be enrolled via Governance messages
  await deployUnenrolledReplica(hubDeploy, newDeploy);

  await transferGovernorship(hubDeploy, newDeploy);

  // relinquish control of new chain
  await relinquish(newDeploy);

  // checks new chain deploy is correct
  await checkCoreDeploy(
    newDeploy,
    [hubDeploy.chain.domain],
    hubDeploy.chain.domain,
  );
}

/**
 * Gets enroll watcher calls from fresh deploy
 * to existing network. Calls
 * should be delegated to governing router.
 *
 * @param newDeploy - Core deploy of newly deployed chain
 * @param oldDeploy - Core deploy of existing chain
 */
export function getEnrollWatchersCall(
  newDeploy: CoreDeploy,
  oldDeploy: CoreDeploy,
): CallData[] {
  // xAppConnectionManager at existing chain
  const oldXAppConnectionManager = oldDeploy.contracts.xAppConnectionManager!;

  // enroll new watchers in XAppConnectionManager at old chain
  return newDeploy.config.watchers.map((watcherAddress) =>
    formatCall(oldXAppConnectionManager, 'setWatcherPermission', [
      watcherAddress,
      newDeploy.chain.domain,
      true,
    ]),
  );
}

/**
 * Gets enroll replica call from fresh deploy
 * to existing network. Call
 * should be delegated to governing router.
 *
 * @param newDeploy - Core deploy of newly deployed chain
 * @param oldDeploy - Core deploy of existing chain
 */
export function getEnrollReplicaCall(
  newDeploy: CoreDeploy,
  oldDeploy: CoreDeploy,
): CallData {
  // Newly deployed replica address at existing chain
  const newReplicaAtOldChainAddress =
    oldDeploy.contracts.replicas[newDeploy.chain.domain].proxy.address;
  // xAppConnectionManager at existing chain
  const oldXAppConnectionManager = oldDeploy.contracts.xAppConnectionManager!;

  // enroll new watchers in XAppConnectionManager at old chain
  return formatCall(oldXAppConnectionManager, 'ownerEnrollReplica', [
    newReplicaAtOldChainAddress,
    newDeploy.chain.domain,
  ]);
}

/**
 * Gets setRouterLocal call from fresh deploy
 * to existing network. Call
 * should be delegated to governing router.
 *
 * @param gov - gov chain
 */
export function getSetRouterLocalCall(
  newDeploy: CoreDeploy,
  oldDeploy: CoreDeploy,
): CallData {
  const governingRouter = oldDeploy.contracts.governance!.proxy;

  // call to governing router's setRouterLocal at old chain with
  // details about new chain
  return formatCall(governingRouter, 'setRouterLocal', [
    newDeploy.chain.domain,
    toBytes32(newDeploy.contracts.governance!.proxy.address),
  ]);
}

/**
 * Copies the partial configs from the default directory to the specified directory.
 *
 * @param dir - relative path to folder where partial configs will be written
 */
export function writePartials(dir: string) {
  // make folder if it doesn't exist already
  fs.mkdirSync(dir, { recursive: true });
  const defaultDir = '../../rust/config/default';
  const partialNames = ['kathy', 'processor', 'relayer', 'updater', 'watcher'];
  // copy partial config from default directory to given directory
  for (let partialName of partialNames) {
    const filename = `${partialName}-partial.json`;
    fs.copyFile(`${defaultDir}/${filename}`, `${dir}/${filename}`, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }
}

function writeOutput(local: CoreDeploy, remotes: CoreDeploy[], dir: string) {
  const config = CoreDeploy.buildConfig(local, remotes);
  const sdk = CoreDeploy.buildSDK(local, remotes);
  const name = local.chain.name;

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    `${dir}/${name}_config.json`,
    JSON.stringify(config, null, 2),
  );
  fs.writeFileSync(`${dir}/${name}_sdk.json`, JSON.stringify(sdk, null, 2));
  fs.writeFileSync(
    `${dir}/${name}_contracts.json`,
    JSON.stringify(local.contractOutput, null, 2),
  );
  fs.writeFileSync(
    `${dir}/${name}_verification.json`,
    JSON.stringify(local.verificationInput, null, 2),
  );
}

/**
 * Outputs the values for chains that have been deployed.
 *
 * @param deploys - The array of chain deploys
 */
export function writeDeployOutput(deploys: CoreDeploy[]) {
  log(deploys[0].test, `Have ${deploys.length} deploys`);
  const dir = getPathToDeployConfig(deploys[0].config.environment);
  for (const local of deploys) {
    // get remotes
    const remotes = deploys
      .slice()
      .filter((remote) => remote.chain.domain !== local.chain.domain);

    writeOutput(local, remotes, dir);
  }
  writePartials(dir);
}

/**
 * Outputs the values for chains that have been deployed.
 *
 * @param deploys - The array of chain deploys
 */
export function writeHubAndSpokeOutput(hub: CoreDeploy, spokes: CoreDeploy[]) {
  log(hub.test, `Have 1 Hub and ${spokes.length} Spoke deploys`);

  const dir = getPathToDeployConfig(hub.config.environment);

  // write spoke outputs
  for (let spoke of spokes) {
    writeOutput(spoke, [hub], dir);
  }

  // write hub output
  writeOutput(hub, spokes, dir);

  // write partials
  writePartials(dir);
}
