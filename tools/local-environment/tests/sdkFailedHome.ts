import { ethers } from "ethers";
import { Key, utils } from "../src";

import { setupTwo } from "./common";

async function improperUpdateCase(homeOrReplica: string) {
  let success = false;

  const { tom, jerry, tomActor, jerryActor, n } = await setupTwo();

  // Spawn watch tasks on NomadContext
  console.log("Spawning NomadContext watch intervals...");
  const nomadContext = n.multiprovider!;
  nomadContext.spawnWatchTasks([tom.domain, jerry.domain]);

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

    const [committedRoot] = await home.suggestUpdate();

    const updater = await n.getUpdater(tom);

    const fraudRoot =
      "0x8bae0a4ab4517a16816ef67120f0e3350d595e014158ba72c3626d8c66b67e53";

    const { signature: improperSignature } = await updater.signUpdate(
      committedRoot,
      fraudRoot
    );

    // Submit fraud to home
    await (
      await home.update(committedRoot, fraudRoot, improperSignature)
    ).wait();

    console.log(`Submitted fraud update!`);

    const start = new Date().valueOf();
    // Waiting for home to be failed and for connection managers to be disconnected from replicas
    const waiter = new utils.Waiter(
      async () => {
        const [homeState, blacklist] = await Promise.all([
          home.state(),
          nomadContext.blacklist(),
        ]);

        if (homeState === 2 && blacklist.has(tom.domain)) {
          return true;
        }
      },
      6 * 60_000,
      2_000
    );

    [, success] = await waiter.wait();

    console.log(
      `Identified in ${(new Date().valueOf() - start) / 1000} seconds`
    );

    nomadContext.killWatchTasks();

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
})();
