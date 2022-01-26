import { CoreDeploy } from '../../core/CoreDeploy';
import {
  AnyBridgeDeploy,
  deployBridgeRouterImplementation,
} from '../../bridge';
import { NomadContext } from '@nomad-xyz/sdk';
import { CallBatch } from '@nomad-xyz/sdk/nomad';
import { executeBatch } from '../index';

export async function upgradeBridgeRouter(
  sdk: NomadContext,
  coreDeploy: CoreDeploy,
  bridgeDeploy: AnyBridgeDeploy,
  reason: string,
) {
  // deploy new bridge router implementation
  const newBridgeImplementation = await deployBridgeRouterImplementation(
    bridgeDeploy,
  );
  // TODO: update config with new implementation address (rust, sdk)
  // TODO: update verification inputs
  // construct governance batch
  const batch = await CallBatch.fromContext(sdk);
  // construct transaction to upgrade bridge router to new implementation
  const bridgeUpgradeBeacon =
    bridgeDeploy.contracts.bridgeRouter!.beacon.address;
  const upgradeTx =
    await coreDeploy.contracts.upgradeBeaconController!.populateTransaction.upgrade(
      bridgeUpgradeBeacon,
      newBridgeImplementation.address,
    );
  batch.pushRemote(coreDeploy.chain.domain, upgradeTx);
  // execute the call batch
  await executeBatch(batch, coreDeploy.config.environment, reason);
}
