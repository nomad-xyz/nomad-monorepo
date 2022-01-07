import { CoreDeploy } from '../core/CoreDeploy';
import { BridgeDeploy } from '../bridge/BridgeDeploy';
import {
  getEnrollWatchersCall,
  getEnrollReplicaCall,
  getSetRouterLocalCall,
} from '../core';
import { getEnrollBridgeCall } from '../bridge';
import { CallData } from '../utils';

function prepareCoreCalls(remote: CoreDeploy, local: CoreDeploy): CallData[] {
  return [
    ...getEnrollWatchersCall(remote, local),
    getEnrollReplicaCall(remote, local),
    getSetRouterLocalCall(remote, local),
  ];
}

function prepareBridgeCalls(remote: BridgeDeploy, local: BridgeDeploy): CallData[] {
  return [
    getEnrollBridgeCall(remote, local),
  ];
}

export type GovernanceActions = [CallData[], number[], CallData[][]];

/**
 * Creates set of (*hub&spoke*) governance action calls
 * to be sent to governance router at hub.
 * Will connect hub to a spoke
 *
 * @param hubCore core deploy of hub network
 * @param hubBridge bridge deploy of hub network
 * @param spokeCore core deploy of spoke network
 * @param spokeBridge bridge deploy of spoke network
 */
export function connectionGovernanceActions(
  hubCore: CoreDeploy,
  hubBridge: BridgeDeploy,
  spokeCore: CoreDeploy,
  spokeBridge: BridgeDeploy,
): GovernanceActions {

  const calls: CallData[] = [
    ...prepareCoreCalls(spokeCore, hubCore),
    ...prepareBridgeCalls(spokeBridge, hubBridge)
  ];

  return [calls, [], []]
}

export async function executeGovernanceActions(
  hubCore: CoreDeploy,
  calls: GovernanceActions
) {
  const governingRouter = hubCore.contracts.governance!.proxy;
  const tx = await governingRouter.executeGovernanceActions(...calls);
  return await tx.wait(hubCore.chain.domain);
}

/**
 * Creates set of (*hub&spoke*) governance action calls
 * to be sent to governance router at hub.
 * Will connect spoke to another spoke
 *
 * @param spokeACore core deploy of spoke A network
 * @param spokeABridge bridge deploy of spoke A network
 * @param spokeBCore core deploy of spoke B network
 * @param spokeBBridge bridge deploy of spoke B network
 */
export function crossConnectionGovernanceActions(
  spokeACore: CoreDeploy,
  spokeABridge: BridgeDeploy,
  spokeBCore: CoreDeploy,
  spokeBBridge: BridgeDeploy,
): GovernanceActions {

  // We have a set of calls, but only here we know where they go. If we meld them into gnosis safe
  const callsA2B = [...prepareCoreCalls(spokeACore, spokeBCore), ...prepareBridgeCalls(spokeABridge, spokeBBridge)];
  const callsB2A = [...prepareCoreCalls(spokeBCore, spokeACore), ...prepareBridgeCalls(spokeBBridge, spokeABridge)];

  return [
    [],
    [spokeBCore.chain.domain, spokeACore.chain.domain],
    [callsA2B, callsB2A],
  ];
}



// /**
//  * Creates new (*mesh*) connection between mentioned old
//  * deployed (including governing) chains
//  * and newly deployed one.
//  *
//  * @param newDeploy tuple of new `[core, bridge]` deploys
//  * @param oldDeploys set of tuples of old `[core, bridge]` deploys.
//  * *Must include governing*
//  */
// export async function addCrossConnection(
//   hubCore: CoreDeploy,
//   spokeACore: CoreDeploy,
//   spokeABridge: BridgeDeploy,
//   spokeBCore: CoreDeploy,
//   spokeBBridge: BridgeDeploy,
// ) {

//   if (spokeACore == hubCore || spokeBCore == hubCore) throw new Error(`Spokes cannot be hubs`)

//   const governingRouter = hubCore.contracts.governance!.proxy;

//   const coreToCalls: [CoreDeploy, CallData[]][] = [];

//   // We have a set of calls, but only here we know where they go. If we meld them into gnosis safe
//   const callsA2B = [...prepareCoreCalls(spokeACore, spokeBCore), ...prepareBridgeCalls(spokeABridge, spokeBBridge)];
//   const callsB2A = [...prepareCoreCalls(spokeBCore, spokeACore), ...prepareBridgeCalls(spokeBBridge, spokeABridge)];

//   // const calls: CallData[] = [
//   //   ...callsA2B,
//   //   ...callsB2A,
//   // ];

//   coreToCalls.push([spokeBCore, callsA2B]);
//   coreToCalls.push([spokeACore, callsB2A]);

//   await governingRouter.executeGovernanceActions(
//     [],
//     [spokeBCore.chain.domain, spokeACore.chain.domain],
//     [callsA2B, callsB2A],
//   );
//   console.log(`Finished the call governing router call`);

//   await Promise.all(
//     coreToCalls.map(async ([deploy, calls]) => {
//       const localGov = deploy.contracts.governance!.proxy;

//       const callsHash = batchHash(
//         calls.map((c) => ({ to: c.to.toString(), data: c.data.toString() })),
//       );
//       await new Promise((resolve, reject) => {
//         const timeout = setTimeout(
//           () => reject('Timedout waiting for received batches'),
//           180_000,
//         );
//         localGov.once(localGov.filters.BatchReceived(callsHash), (data) => {
//           resolve(data);
//           clearTimeout(timeout);
//         });
//       });

//       console.log(
//         `Found new batch call with hash ${callsHash} at`,
//         deploy.chain.domain,
//       );
//       const execBatchCall = await localGov.executeCallBatch(calls);

//       await execBatchCall.wait(hubCore.chain.confirmations);
//       console.log(`Successfully executed batch call at`, deploy.chain.domain);
//     }),
//   );

//   const remoteDomains = [spokeBCore.chain.domain];
//   await checkCoreDeploy(
//     spokeACore,
//     remoteDomains,
//     hubCore.chain.domain,
//   );
//   await checkBridgeDeploy(spokeABridge, remoteDomains);
//   await checkIncrementalDeploy(spokeACore, spokeABridge, [[spokeBCore, spokeBBridge]]); //TODO
// }
