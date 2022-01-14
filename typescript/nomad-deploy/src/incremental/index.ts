import { NomadContext } from '@nomad-xyz/sdk';
import { canonizeId } from '@nomad-xyz/sdk/utils';
import { CoreDeploy } from '../core/CoreDeploy';
import { BridgeDeploy } from '../bridge/BridgeDeploy';
import {
  getEnrollWatchersCall,
  getEnrollReplicaCall,
  getSetRouterLocalCall,
} from '../core';
import { getEnrollBridgeCall } from '../bridge';
import { CallData } from '../utils';

/**
 * Prepares and executes necessary calls to governing
 * router for enrolling a spoke after core and
 * bridge have been deployed
 * @param sdk SDK containing new spoke domain
 * @param spokeDomain domain of the spoke
 * @param watchers set of watchers to be enrolled
 */
export async function enrollSpoke(
  sdk: NomadContext,
  spokeDomain: number,
  watchers: string[],
): Promise<void> {
  let hubCore = await sdk.governorCore();
  let hubBridge = sdk.mustGetBridge(hubCore.domain);

  let spokeCore = await sdk.mustGetCore(spokeDomain);
  let spokeBridge = await sdk.mustGetBridge(spokeDomain);
  let batch = await hubCore.newGovernanceBatch();

  // enroll watchers
  await Promise.all(
    watchers.map(async (watcher) => {
      const call =
        await hubCore.xAppConnectionManager.populateTransaction.watcherPermission(
          watcher,
          spokeDomain,
        );
      batch.pushLocal(call);
    }),
  );

  // enroll replica
  const hubReplicaOfSpoke = hubCore.getReplica(spokeDomain)?.address;
  const enrollReplicaCall =
    await hubCore.xAppConnectionManager.populateTransaction.ownerEnrollReplica(
      hubReplicaOfSpoke!,
      spokeDomain,
    );
  batch.pushLocal(enrollReplicaCall);
  // set router remote
  const setRouterCall =
    await hubCore.governanceRouter.populateTransaction.setRouterLocal(
      spokeDomain,
      canonizeId(spokeCore.governanceRouter.address),
    );
  batch.pushLocal(setRouterCall);
  // enroll bridge
  const enrollBridgeCall =
    await hubBridge.bridgeRouter.populateTransaction.enrollRemoteRouter(
      spokeDomain,
      canonizeId(spokeBridge.bridgeRouter.address),
    );
  batch.pushLocal(enrollBridgeCall);

  // turn into a tx request
  await batch.build();
  // send to the chain
  await batch.execute();
}



function prepareCoreCalls(remote: CoreDeploy, local: CoreDeploy): CallData[] {
  return [
    ...getEnrollWatchersCall(remote, local),
    getEnrollReplicaCall(remote, local),
    getSetRouterLocalCall(remote, local),
  ];
}

function prepareBridgeCalls(
  remote: BridgeDeploy,
  local: BridgeDeploy,
): CallData[] {
  return [getEnrollBridgeCall(remote, local)];
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
    ...prepareBridgeCalls(spokeBridge, hubBridge),
  ];

  return [calls, [], []];
}

export async function executeGovernanceActions(
  hubCore: CoreDeploy,
  calls: GovernanceActions,
) {
  const governingRouter = hubCore.contracts.governance!.proxy;
  const tx = await governingRouter.executeGovernanceActions(...calls);
  return await tx.wait(hubCore.chain.confirmations);
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
  const callsA2B = [
    ...prepareCoreCalls(spokeACore, spokeBCore),
    ...prepareBridgeCalls(spokeABridge, spokeBBridge),
  ];
  const callsB2A = [
    ...prepareCoreCalls(spokeBCore, spokeACore),
    ...prepareBridgeCalls(spokeBBridge, spokeABridge),
  ];

  return [
    [],
    [spokeBCore.chain.domain, spokeACore.chain.domain],
    [callsA2B, callsB2A],
  ];
}
