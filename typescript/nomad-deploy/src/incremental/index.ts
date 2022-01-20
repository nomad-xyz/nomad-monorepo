import { NomadContext } from '@nomad-xyz/sdk/';
import { canonizeId } from '@nomad-xyz/sdk/utils';

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
        await hubCore.xAppConnectionManager.populateTransaction.setWatcherPermission(
          watcher,
          spokeDomain,
          true,
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
  const built = await batch.build();

  console.log("unbuilt:");
  console.log(JSON.stringify({local: batch.local, remote: batch.remote}, null, 2));

  console.log("built:");
  console.log(JSON.stringify(built, null, 2));

  // TODO: output governance transaction to a file
  // TODO: output information needed to execute transaction to a file
  // TODO: for staging and prod, send to gnosis safe instead of executing
  // if(staging || prod) {await gnosis.send(batch);} else {await batch.execute();}
  // send to the chain
  // await batch.execute();
}
