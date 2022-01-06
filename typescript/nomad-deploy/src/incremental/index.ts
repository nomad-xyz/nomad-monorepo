import { CoreDeploy } from '../core/CoreDeploy';
import { BridgeDeploy } from '../bridge/BridgeDeploy';
import {
  getEnrollWatchersCall,
  getEnrollReplicaCall,
  getSetRouterLocalCall,
} from '../core';
import { getEnrollBridgeCall } from '../bridge';
import { CallData } from '../utils';
import { checkCoreDeploy } from '../core/checks';
import { checkBridgeDeploy } from '../bridge/checks';
import { batchHash } from './batchHash';
import { checkIncrementalDeploy } from './checks';

/**
 * Tuple of Core and Bridge deploys
 */
type FullDeploy = [CoreDeploy, BridgeDeploy];

/**
 * Creates new (*hub&spoke*) connection between govenring and newly deployed chain
 *
 * @param newDeploy tuple of *new* `[core, bridge]` deploys
 * @param govDeploy tuple of *governing* `[core, bridge]` deploys
 */
export async function addConnection(
  newDeploy: FullDeploy,
  govDeploy: FullDeploy,
) {
  const [govCoreDeploy, govBridgeDeploy] = govDeploy;
  const [newCoreDeploy, newBridgeDeploy] = newDeploy;

  const governingRouter = govCoreDeploy.contracts.governance!.proxy;
  const govDomain = govCoreDeploy.chain.domain;

  const calls: CallData[] = [
    ...getEnrollWatchersCall(newCoreDeploy, govCoreDeploy),
    getEnrollBridgeCall(newBridgeDeploy, govBridgeDeploy),
    getEnrollReplicaCall(newCoreDeploy, govCoreDeploy),
    getSetRouterLocalCall(newCoreDeploy, govCoreDeploy),
  ];

  await governingRouter.executeGovernanceActions(calls, [], []);
  console.log(`Finished the call governing router call`);

  await checkCoreDeploy(newCoreDeploy, [govDomain], govDomain);
  await checkBridgeDeploy(newBridgeDeploy, [govDomain]);
  await checkIncrementalDeploy(newCoreDeploy, newBridgeDeploy, []);
}

function getGovernorDeploy(deploys: FullDeploy[]): FullDeploy {
  const isTest: boolean = deploys.filter((c) => c[0].test).length > 0;
  if (isTest) return deploys[0];

  const govDeploy = deploys.find((d) => d[0].config.governor != undefined);
  if (!govDeploy)
    throw new Error(
      `Deploy with governing domain was not found in array of old deploys ${deploys}`,
    );

  return govDeploy;
}

/**
 * Creates new (*mesh*) connection between mentioned old
 * deployed (including governing) chains
 * and newly deployed one.
 *
 * @param newDeploy tuple of new `[core, bridge]` deploys
 * @param oldDeploys set of tuples of old `[core, bridge]` deploys.
 * *Must include governing*
 */
export async function addCrossConnection(
  newDeploy: FullDeploy,
  oldDeploys: FullDeploy[],
) {
  const [govCoreDeploy, _] = getGovernorDeploy(oldDeploys);
  const [newCoreDeploy, newBridgeDeploy] = newDeploy;

  const governingRouter = govCoreDeploy.contracts.governance!.proxy;

  const localCalls: CallData[] = [];
  const domains: number[] = [];
  const remoteCalls: CallData[][] = [];
  const coreToCalls: [CoreDeploy, CallData[]][] = [];
  oldDeploys.forEach(([oldCore, oldBridge]) => {
    // We have a set of calls, but only here we know where they go. If we meld them into gnosis safe
    const calls: CallData[] = [
      ...getEnrollWatchersCall(newCoreDeploy, oldCore),
      getEnrollBridgeCall(newBridgeDeploy, oldBridge),
      getEnrollReplicaCall(newCoreDeploy, oldCore),
      getSetRouterLocalCall(newCoreDeploy, oldCore),
    ];

    if (oldCore == govCoreDeploy) {
      localCalls.push(...calls);
    } else {
      domains.push(oldCore.chain.domain);
      remoteCalls.push(calls);
      coreToCalls.push([oldCore, calls]);
    }
  });

  await governingRouter.executeGovernanceActions(
    localCalls,
    domains,
    remoteCalls,
  );
  console.log(`Finished the call governing router call`);

  await Promise.all(
    coreToCalls.map(async ([deploy, calls]) => {
      const gov = deploy.contracts.governance!.proxy;

      const callsHash = batchHash(
        calls.map((c) => ({ to: c.to.toString(), data: c.data.toString() })),
      );
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject('Timedout waiting for received batches'),
          180_000,
        );
        gov.once(gov.filters.BatchReceived(callsHash), (data) => {
          resolve(data);
          clearTimeout(timeout);
        });
      });

      console.log(
        `Found new batch call with hash ${callsHash} at`,
        deploy.chain.domain,
      );
      const execBatchCall = await gov.executeCallBatch(calls);

      await execBatchCall.wait(2);
      console.log(`Successfully executed batch call at`, deploy.chain.domain);
    }),
  );

  const remoteDomains = Array.from(oldDeploys.map((d) => d[0].chain.domain));
  await checkCoreDeploy(
    newCoreDeploy,
    remoteDomains,
    govCoreDeploy.chain.domain,
  );
  await checkBridgeDeploy(newBridgeDeploy, remoteDomains);
  await checkIncrementalDeploy(newCoreDeploy, newBridgeDeploy, oldDeploys);
}
