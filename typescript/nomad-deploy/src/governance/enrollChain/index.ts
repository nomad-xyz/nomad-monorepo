import { NomadContext } from '@nomad-xyz/sdk/';
import { CallBatch } from '@nomad-xyz/sdk/nomad';
import { canonizeId } from '@nomad-xyz/sdk/utils';
import { CoreDeploy } from '../../core/CoreDeploy';
import { executeBatch } from '../';

/**
 * Prepares and executes necessary calls to governing
 * router for enrolling a spoke after core and
 * bridge have been deployed
 * @param sdk SDK containing new spoke domain
 * @param spokeDeploy the spoke CoreDeploy
 */
export async function enrollSpoke(
  sdk: NomadContext,
  spokeDeploy: CoreDeploy,
): Promise<void> {
  let hubCore = await sdk.governorCore();
  let hubBridge = sdk.mustGetBridge(hubCore.domain);

  const { domain: spokeDomain, name } = spokeDeploy.chain;
  const { watchers, environment } = spokeDeploy.config;
  let spokeCore = await sdk.mustGetCore(spokeDomain);
  let spokeBridge = await sdk.mustGetBridge(spokeDomain);
  let batch = await CallBatch.fromContext(sdk);

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
  // execute the call batch
  await executeBatch(batch, environment, `enroll-${name}`);
}
