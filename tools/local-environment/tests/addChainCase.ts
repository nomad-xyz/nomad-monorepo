import { LocalNetwork, Nomad, Key, utils, Network } from "../src";
import fs from "fs";
import { getCustomToken } from "./utils/token/deployERC20";
import { randomTokens, sleep } from "../src/utils";
import { sendTokensAndConfirm } from "./common";

async function setup() {
  const tom = new LocalNetwork("tom", 1000, "http://localhost:9545");
  const jerry = new LocalNetwork("jerry", 2000, "http://localhost:9546");

  const tomActor = new Key();
  const jerryActor = new Key();

  const t = utils.generateDefaultKeys();
  const j = utils.generateDefaultKeys();

  tom.addKeys(
    tomActor,
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
    jerryActor,
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
  await n.startAgents([
    'updater',
    'relayer',
    'processor',
  ]);

  fs.writeFileSync("/tmp/nomad.json", JSON.stringify(n.toObject()));

  return {
    tom,
    jerry,
    tomActor,
    jerryActor,
    n,
  };
}

async function setupDaffy(n: Nomad) {
  const daffy = new LocalNetwork("daffy", 3000, "http://localhost:9547");

  const d = utils.generateDefaultKeys();

  const daffyActor = new Key();

  daffy.addKeys(
    daffyActor,
    d.updater,
    d.watcher,
    d.deployer,
    d.signer.base,
    d.signer.updater,
    d.signer.watcher,
    d.signer.relayer,
    d.signer.processor
  );

  await daffy.up();

  n.addNetwork(daffy);

  n.setUpdater(daffy, d.updater); // Need for an update like updater
  n.setWatcher(daffy, d.watcher); // Need for the watcher
  n.setDeployer(daffy, d.deployer); // Need to deploy all
  n.setSigner(daffy, d.signer.base); // Need for home.dispatch
  n.setSigner(daffy, d.signer.updater, "updater"); // Need for home.dispatch
  n.setSigner(daffy, d.signer.relayer, "relayer"); // Need for home.dispatch
  n.setSigner(daffy, d.signer.watcher, "watcher"); // Need for home.dispatch
  n.setSigner(daffy, d.signer.processor, "processor"); // Need for home.dispatch

  // Another deploy here will automatically determine whether
  // there are new chains to be deployed. Here it will
  // incrementally deploy the "daffy" chain
  await n.deploy({ injectSigners: true });

  await n.stopAllAgents(true);
  await n.startAgents([
    'updater',
    'relayer',
    'processor',
  ]);

  fs.writeFileSync("/tmp/nomad.json", JSON.stringify(n.toObject()));

  return {
    daffy,
    daffyActor,
  };
}

async function sendTokensTriangular(
  a: Network,
  b: Network,
  c: Network,
  aActor: Key,
  bActor: Key,
  cActor: Key,
  n: Nomad
) {
  const tokenFactory = getCustomToken();
  const tokenOnA = await a.deployToken(
    tokenFactory,
    aActor.toAddress(),
    "MyToken",
    "MTK"
  );

  const token = {
    domain: a.domain,
    id: tokenOnA.address,
  };

  const ctx = n.getMultiprovider();

  ctx.registerWalletSigner(a.name, aActor.toString());
  ctx.registerWalletSigner(b.name, bActor.toString());

  ctx.registerWalletSigner(c.name, cActor.toString());

  // get 3 random amounts which will be bridged
  const amount1 = randomTokens();
  const amount2 = randomTokens();
  const amount3 = randomTokens();

  const [successA2B, _] = await sendTokensAndConfirm(
    n,
    a,
    b,
    token,
    bActor.toAddress(),
    [amount1, amount2, amount3]
  );

  if (!successA2B)
    throw new Error(`Tokens transfer from ${a.name} to ${b.name} failed`);
  console.log(`Tokens arrived at ${b.name}`);

  const [successB2C, __] = await sendTokensAndConfirm(
    n,
    b,
    c,
    token,
    cActor.toAddress(),
    [amount3, amount2, amount1]
  );
  if (!successB2C)
    throw new Error(`Tokens transfer from ${b.name} to ${c.name} failed`);
  console.log(`Tokens arrived at ${c.name}`);

  const [successC2A, tokenContract] = await sendTokensAndConfirm(
    n,
    c,
    a,
    token,
    new Key().toAddress(), // to random address
    [amount1, amount3, amount2]
  );

  if (!successC2A)
    throw new Error(`Tokens transfer from ${c.name} to ${a.name} failed`);
  console.log(`Tokens arrived at ${a.name}`);

  if (
    tokenContract.address.toLowerCase() !== token.id.toString().toLowerCase()
  ) {
    throw new Error(
      `Resolved asset at destination Jerry is not the same as the token`
    );
  }
}

async function teardown(n: Nomad) {
  await n.end();

  await Promise.all(n.getNetworks().map((net) => net.down()));
}

(async () => {
  // Normally setup and deploy 2 local networks
  const { tom, jerry, tomActor, jerryActor, n } = await setup();

  let success = false;
  try {
    // Perform incremental deploy of new network daffy
    const { daffy, daffyActor } = await setupDaffy(n);

    await sendTokensTriangular(
      tom,
      jerry,
      daffy,
      tomActor,
      jerryActor,
      daffyActor,
      n
    );
    success = true;
  } catch (e) {
    console.error(`Test failed:`, e);
  }

  await teardown(n);

  if (!success) process.exit(1);
})();
