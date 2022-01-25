import { CoreContracts } from "@nomad-xyz/sdk/nomad";
import { ethers } from "ethers";
import { LocalNetwork, Nomad, Key, utils } from "../src";

import { sleep } from "../src/utils";

async function improperUpdateCase(homeOrReplica: string) {
    let success = false;

  const tom = new LocalNetwork("tom", 1000, "http://localhost:9545");
  const jerry = new LocalNetwork("jerry", 2000, "http://localhost:9546");

  const updaterKey = new Key();
  const watcherKey = new Key();
  const jerryDeployerKey = new Key();
  const jerrySignerKey = new Key();
  const tomDeployerKey = new Key();
  const tomSignerKey = new Key();

  tom.addKeys(updaterKey, watcherKey, tomDeployerKey, tomSignerKey);
  jerry.addKeys(updaterKey, watcherKey, jerryDeployerKey, jerrySignerKey);

  await Promise.all([tom.up(), jerry.up()]);

  console.log(`Started both`);

  const n = new Nomad(tom);
  n.addNetwork(jerry);

  n.setUpdater(tom, updaterKey);
  n.setWatcher(tom, watcherKey);
  n.setDeployer(tom, tomDeployerKey);
  n.setSigner(tom, tomSignerKey);

  n.setUpdater(jerry, updaterKey); // Need for an update like updater
  n.setWatcher(jerry, watcherKey); // Need for the watcher
  n.setDeployer(jerry, jerryDeployerKey); // Need to deploy all
  n.setSigner(jerry, jerrySignerKey); // Need for home.dispatch

  await n.deploy({ injectSigners: true });

  const tomWatcher = await n.getAgent("watcher", tom);
  await tomWatcher.connect();
  await tomWatcher.start();

  try {
    const address = new Key().toAddress();

    const home = n.getCore(tom).home;
    if (!home) throw new Error(`no home`);

    const replica = n.getCore(jerry).getReplica(tom.domain)!;
    if (!replica) throw new Error(`no replica`);

    const xapp = await n.getXAppConnectionManager(jerry);

    await (
      await home.dispatch(
        jerry.domain,
        ethers.utils.hexZeroPad(address, 32),
        Buffer.from(`01234567890123456789012345678`, "utf8")
      )
    ).wait();

    console.log(`Dispatched test transaction to home`);

    const [committedRoot, newRoot] = await home.suggestUpdate();

    const updater = await n.getUpdater(tom);

    const { signature } = await updater.signUpdate(committedRoot, newRoot);

    await (await home.update(committedRoot, newRoot, signature)).wait();

    console.log(`Submitted valid update to home`);

    const [newCommittedRoot, _] = await home.suggestUpdate();
    const fraudRoot =
      "0x8bae0a4ab4517a16816ef67120f0e3350d595e014158ba72c3626d8c66b67e53";

    const { signature: improperSignature } = await updater.signUpdate(
      committedRoot,
      fraudRoot
    );
    
    if (homeOrReplica === "home") {
        await (
            await home.update(committedRoot, fraudRoot, improperSignature)
          ).wait();
    } else if (homeOrReplica === "replica") {
        await (
            await replica.update(committedRoot, fraudRoot, improperSignature)
          ).wait();
    } else {
        throw new Error("Must specify 'home' or 'replica' for improper update test case")
    }

    // Waiting for home to be failed and for connection managers to be disconnected from replicas
    const waiter = new utils.Waiter(
      async () => {
        const [homeState, domainToReplica, replicaToDomain] =
          await Promise.all([
            home.state(), // update should always be submitted to home so should be failed
            xapp.domainToReplica(tom.domain),
            xapp.replicaToDomain(replica.address),
          ]);

        if (
          homeState === 2 && // Waiting till Home state will be failed (2)
          domainToReplica !== replica.address && // Waiting till XAppConnectionManager will stop pointing at replica's address for jerry's domian
          replicaToDomain !== tom.domain // Waiting till XAppConnectionManager will stop pointing at jerry's domian for replica's address
        ) {
          return true;
        }
      },
      3 * 60_000,
      2_000
    );

    [, success] = await waiter.wait();

    if (!success) throw new Error(`Fraud was not prevented in time!`);
  } catch (e) {
    console.log(`Faced an error:`, e);
  }

  // Teardown

  await n.end();

  await Promise.all([tom.down(), jerry.down()]);

  if (!success) process.exit(1);
}

  (async () => {
    // Run sequentially in case of port conflicts
    await improperUpdateCase("home");
    await improperUpdateCase("replica");
  })()