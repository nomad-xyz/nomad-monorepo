import * as ethers from 'ethers';

import { NomadContext } from '@nomad-xyz/sdk/src';

export async function enrollRemoteDomain(sdk: NomadContext, spokeDomain: number) {
    let hubCore = await sdk.governorCore();
    let spokeCore = await sdk.mustGetCore(spokeDomain);
    let spokeBridge = await sdk.mustGetBridge(spokeDomain);
    let batch = await hubCore.newGovernanceBatch();

    let hubBridge = sdk.mustGetBridge(hubCore.domain);
    let watchers = ['TODO'];

    function toCall(t: ethers.ethers.PopulatedTransaction) {
        return {to: t.to!, data: ethers.utils.toUtf8Bytes(t.data!)}
    }

    // enroll watchers
    await Promise.all(watchers.map(async (watcher) => {
        const call = await hubCore.xAppConnectionManager.populateTransaction.watcherPermission(watcher, spokeDomain);
        batch.pushLocal( 
            toCall(call)
        )
    }))
    
    // enroll replica
const newReplicaAtOldChainAddress = hubCore.getReplica(spokeDomain)?.address;
    const call1 = await hubCore.xAppConnectionManager.populateTransaction.ownerEnrollReplica(newReplicaAtOldChainAddress!, spokeDomain);
        batch.pushLocal( 
            toCall(call1)
        )
    // set router remote
    const call2 = await hubCore.governanceRouter.populateTransaction.setRouterLocal(spokeDomain, spokeCore.governanceRouter.address);
        batch.pushLocal( 
            toCall(call2)
        )
    // enroll bridge
    const call3 = await hubBridge.bridgeRouter.populateTransaction.enrollRemoteRouter(spokeDomain, spokeBridge.bridgeRouter.address);
    batch.pushLocal( 
        toCall(call3)   
    )

    // for (const domain of sdk.domainNumbers) {
    //     batch.pushRemote(
    //         domain,
    //         sdk.mustGetBridge(domain).bridgeRouter.populateTransaction.enrollRemoteRouter(/*...*/)
    //     )
    // }

    // turn into a tx request
    await batch.build();
    // send to the chain
    await batch.execute();
}