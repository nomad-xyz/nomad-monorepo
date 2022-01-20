import { NomadContext } from '@nomad-xyz/sdk/';
import { canonizeId } from '@nomad-xyz/sdk/utils';
import { CoreConfig } from '../core/CoreDeploy';
import { writeBatchOutput } from './utils';

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
  spokeConfig: CoreConfig,
): Promise<void> {
  let hubCore = await sdk.governorCore();
  let hubBridge = sdk.mustGetBridge(hubCore.domain);

  let spokeCore = await sdk.mustGetCore(spokeDomain);
  let spokeBridge = await sdk.mustGetBridge(spokeDomain);
  let batch = await hubCore.newGovernanceBatch();

  // enroll watchers
  await Promise.all(
    spokeConfig.watchers.map(async (watcher) => {
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

  if (spokeConfig.environment === 'dev') {
    // in dev, execute the batch directly
    await batch.execute();
  } else {
    // in staging and prod, output batch to a file
    const built = await batch.build();
    const unbuiltStr = JSON.stringify(
      { local: batch.local, remote: batch.remote },
      null,
      2,
    );
    const builtStr = JSON.stringify(built, null, 2);

    writeBatchOutput(builtStr, unbuiltStr, spokeConfig.environment);
    // TODO: send to gnosis safe directly
  }
}
