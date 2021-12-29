import { LocalNetwork, Nomad, Key, utils, Network } from "../src";
import type { TokenIdentifier } from "@nomad-xyz/sdk/nomad/tokens";
import { ERC20 } from "@nomad-xyz/contracts/dist/bridge/ERC20";
import { ethers } from "ethers";
import fs from "fs";
import { TransferMessage } from "@nomad-xyz/sdk/nomad";
import { getCustomToken } from "./utils/token/deployERC20";
import { randomTokens } from "../src/utils";
import { sendTokensAndConfirm } from "./common";

(async () => {
  const tom = new LocalNetwork("tom", 1000, "http://localhost:9545");
  const jerry = new LocalNetwork("jerry", 2000, "http://localhost:9546");

  const sender = new Key();
  const receiver = new Key();

  const t = utils.generateDefaultKeys();
  const j = utils.generateDefaultKeys();

  tom.addKeys(
    sender,
    t.updater,
    t.watcher,
    t.deployer,
    t.signer.base,
    t.signer.updater,
    t.signer.watcher,
    t.signer.relayer,
    t.signer.processor
  );
  jerry.addKeys(
    receiver,
    j.updater,
    j.watcher,
    j.deployer,
    j.signer.base,
    j.signer.updater,
    j.signer.watcher,
    j.signer.relayer,
    j.signer.processor
  );

  await Promise.all([tom.up(), jerry.up()]);

  const n = new Nomad(tom);
  n.addNetwork(jerry);

  n.setUpdater(jerry, j.updater); // Need for an update like updater
  n.setWatcher(jerry, j.watcher); // Need for the watcher
  n.setDeployer(jerry, j.deployer); // Need to deploy all
  n.setSigner(jerry, j.signer.base); // Need for home.dispatch
  n.setSigner(jerry, j.signer.updater, "updater"); // Need for home.dispatch
  n.setSigner(jerry, j.signer.relayer, "relayer"); // Need for home.dispatch
  n.setSigner(jerry, j.signer.watcher, "watcher"); // Need for home.dispatch
  n.setSigner(jerry, j.signer.processor, "processor"); // Need for home.dispatch

  n.setUpdater(tom, t.updater); // Need for an update like updater
  n.setWatcher(tom, t.watcher); // Need for the watcher
  n.setDeployer(tom, t.deployer); // Need to deploy all
  n.setSigner(tom, t.signer.base); // Need for home.dispatch
  n.setSigner(tom, t.signer.updater, "updater"); // Need for home.dispatch
  n.setSigner(tom, t.signer.relayer, "relayer"); // Need for home.dispatch
  n.setSigner(tom, t.signer.watcher, "watcher"); // Need for home.dispatch
  n.setSigner(tom, t.signer.processor, "processor"); // Need for home.dispatch

  await n.deploy({ injectSigners: true });
  await n.startAllAgents();

  fs.writeFileSync("/tmp/nomad.json", JSON.stringify(n.toObject()));

  // Scenario

  let success = false;

  try {
    // Deploying a custom ERC20 contract
    const tokenFactory = getCustomToken();
    const tokenOnTom = await tom.deployToken(
      tokenFactory,
      sender.toAddress(),
      "MyToken",
      "MTK"
    );

    const token: TokenIdentifier = {
      domain: tom.domain,
      id: tokenOnTom.address,
    };

    const ctx = n.getMultiprovider();

    // Default multiprovider comes with signer (`o.setSigner(jerry, signer);`) assigned
    // to each domain, but we change it to allow sending from different signer
    ctx.registerWalletSigner(tom.name, sender.toString());
    ctx.registerWalletSigner(jerry.name, receiver.toString());

    // get 3 random amounts which will be bridged
    const amount1 = randomTokens();
    const amount2 = randomTokens();
    const amount3 = randomTokens();

    const [successTom2Jerry, _] = await sendTokensAndConfirm(
      n,
      tom,
      jerry,
      token,
      receiver.toAddress(),
      [amount1, amount2, amount3]
    );

    if (!successTom2Jerry)
      throw new Error(`Tokens transfer from jerry to tom failed`);
    console.log(`Tokens arrived at Tom`);

    const [successJerry2Tom, tokenContract] = await sendTokensAndConfirm(
      n,
      jerry,
      tom,
      token,
      new Key().toAddress(),
      [amount3, amount2, amount1]
    );
    if (!successJerry2Tom)
      throw new Error(`Tokens transfer from tom to jerry failed`);
    console.log(`Tokens arrived at Jerry`);

    if (
      tokenContract.address.toLowerCase() !== token.id.toString().toLowerCase()
    ) {
      throw new Error(
        `Resolved asset at destination Jerry is not the same as the token`
      );
    }

    success = true;
  } catch (e) {
    console.error(`Test failed:`, e);
  }

  // Teardown

  await n.end();

  await Promise.all([tom.down(), jerry.down()]);

  if (!success) process.exit(1);
})();
