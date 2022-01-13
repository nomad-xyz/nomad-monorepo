import * as ethers from 'ethers';

import { NomadContext } from '@nomad-xyz/sdk/src';

function toCall(t: ethers.ethers.PopulatedTransaction) {
  return { to: t.to!, data: ethers.utils.toUtf8Bytes(t.data!) };
}

export async function enrollSpoke(
  sdk: NomadContext,
  spokeDomain: number,
  watchers: string[],
) {
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
      batch.pushLocal(toCall(call));
    }),
  );

  // enroll replica
  const newReplicaAtOldChainAddress = hubCore.getReplica(spokeDomain)?.address;
  const enrollReplicaCall =
    await hubCore.xAppConnectionManager.populateTransaction.ownerEnrollReplica(
      newReplicaAtOldChainAddress!,
      spokeDomain,
    );
  batch.pushLocal(toCall(enrollReplicaCall));
  // set router remote
  const setRouterCall =
    await hubCore.governanceRouter.populateTransaction.setRouterLocal(
      spokeDomain,
      spokeCore.governanceRouter.address,
    );
  batch.pushLocal(toCall(setRouterCall));
  // enroll bridge
  const enrollBridgeCall =
    await hubBridge.bridgeRouter.populateTransaction.enrollRemoteRouter(
      spokeDomain,
      spokeBridge.bridgeRouter.address,
    );
  batch.pushLocal(toCall(enrollBridgeCall));

  // turn into a tx request
  await batch.build();
  // send to the chain
  await batch.execute();
}
