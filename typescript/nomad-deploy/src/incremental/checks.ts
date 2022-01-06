import { CoreDeploy } from '../core/CoreDeploy';
import { BridgeDeploy } from '../bridge/BridgeDeploy';
import { expect, AssertionError } from 'chai';
import { Waiter } from './utils';

export async function checkIncrementalDeploy(
  newCoreDeploy: CoreDeploy,
  newBridgeDeploy: BridgeDeploy,
  zippedDeploys: [CoreDeploy, BridgeDeploy][],
): Promise<void> {
  const newDomain = newCoreDeploy.chain.domain;

  const actualGovRouterAddress =
    newCoreDeploy.contracts.governance!.proxy.address.toLowerCase();

  const actualWatchers = newCoreDeploy.config.watchers.map((w) =>
    w.toLowerCase(),
  );

  const actualBridgeRouterAddress =
    newBridgeDeploy.contracts.bridgeRouter!.proxy.address.toLowerCase();

  let lastError: typeof AssertionError | undefined = undefined;
  const w = new Waiter(
    async () => {
      try {
        for (const [oldCoreDeploy, oldBridgeDeploy] of zippedDeploys) {
          // Checking that all watchers of new deploy are
          // enrolled at one of the old chains' xAppConnectionManager
          for (const wAddress of actualWatchers) {
            const permissionExists =
              await oldCoreDeploy.contracts.xAppConnectionManager!.watcherPermission(
                wAddress,
                newDomain,
              );
            expect(
              permissionExists,
              `No permission exists for watcher '${wAddress}' and domain: ${newDomain}`,
            );
          }

          // Checking that new bridge router of new deploy is
          // enrolled at one of the old chains' bridgeRouter
          const bridgeRouterAddress =
            await oldBridgeDeploy.contracts.bridgeRouter!.proxy.remotes(
              newDomain,
            );
          expect('0x' + bridgeRouterAddress.slice(26).toLowerCase()).to.equal(
            actualBridgeRouterAddress,
            `Wrong remote BridgeRouter address at Domain ${oldCoreDeploy.chain.domain}`,
          );

          // Checking that new replica of the new deploy at old chain is
          // enrolled at one of the old chains' xAppConnectionManager
          const actualReplicaAddress =
            oldCoreDeploy.contracts.replicas[
              newDomain
            ].proxy.address.toLowerCase();
          const replicaAddress =
            await oldCoreDeploy.contracts.xAppConnectionManager!.domainToReplica(
              newDomain,
            );
          expect(replicaAddress.toLowerCase()).to.equal(
            actualReplicaAddress,
            `Wrong Replica address at Domain ${oldCoreDeploy.chain.domain} for ${newDomain}`,
          );

          // Checking that new governance router of the new deploy is
          // enrolled at one of the old chains' governance router
          const govRouterAddress =
            await oldCoreDeploy.contracts.governance!.proxy.routers(newDomain);
          expect('0x' + govRouterAddress.slice(26).toLowerCase()).to.equal(
            actualGovRouterAddress,
            `Wrong remote GovernanceRouter address at Domain ${oldCoreDeploy.chain.domain}`,
          );
        }

        return true;
      } catch (e: any) {
        lastError = e;
        // return undefined means that we want to retry polling this function inside of the `Waiter`
        return undefined;
      }
    },
    800_000, // timeout 800 seconds
    5_000, // polling period 5 seconds
  );

  const [_, success] = await w.wait();
  if (!success)
    throw new Error(`Incremental deploy check failed: '${lastError}'`);
}
