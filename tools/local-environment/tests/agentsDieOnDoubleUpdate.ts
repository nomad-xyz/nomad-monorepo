import { ethers } from "ethers";
import { Key, utils } from "../src";

import { Waiter } from "../src/utils";
import { setupTwo, waitAgentFailure } from "./common";

(async () => {
  let success = false;

  const { tom, jerry, n } = await setupTwo();

  const updaterWaiter: Waiter<true> = await waitAgentFailure(n, tom, "updater");
  const processorWaiter: Waiter<true> = await waitAgentFailure(
    n,
    tom,
    "processor"
  );

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

    await (
      await home.update(committedRoot, fraudRoot, improperSignature)
    ).wait();

    console.log(`Submitted fraud update!`);

    let testControlValue: true | undefined, testTimedOut: boolean;
    [testControlValue, testTimedOut] = await updaterWaiter.wait();

    if (!testTimedOut)
      throw new Error(`Updater test reached timeout without success`);
    if (!testControlValue)
      throw new Error(`Updater test didn't return success`);

    [testControlValue, testTimedOut] = await processorWaiter.wait();

    if (!testTimedOut)
      throw new Error(`Processor test reached timeout without success`);
    if (!testControlValue)
      throw new Error(`Processor test didn't return success`);

    success = testTimedOut && testControlValue;
  } catch (e) {
    console.log(`Faced an error:`, e);
  }

  // Teardown

  await n.end();

  await Promise.all([tom.down(), jerry.down()]);

  if (!success) process.exit(1);
})();
