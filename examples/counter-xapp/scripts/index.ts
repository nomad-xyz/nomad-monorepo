import * as dotenv from "dotenv";
import { ethers } from "hardhat";
import { CounterRouter } from "../typechain";
import { toBytes32 } from "./utils";
import { dev, NomadMessage } from "@nomad-xyz/sdk";
import { MessageStatus } from "@nomad-xyz/sdk/nomad";
import {
  XAppConnectionManager,
  XAppConnectionManager__factory,
} from "@nomad-xyz/contract-interfaces/core";

dotenv.config();

// Chain-specific identifiers arbitrarily chosen by Nomad team (do not change)
const RINKEBY_DOMAIN = 2000;
const KOVAN_DOMAIN = 3000;

// Provider/signer info
const KOVAN_URL = process.env.KOVAN_RPC!;
const RINKEBY_URL = process.env.RINKEBY_RPC!;
const KOVAN_DEPLOYER_KEY = process.env.KOVAN_DEPLOYER_KEY!;
const RINKEBY_DEPLOYER_KEY = process.env.RINKEBY_DEPLOYER_KEY!;

interface XAppConnectionManagerDeploys {
  kovan: XAppConnectionManager;
  rinkeby: XAppConnectionManager;
}

interface RouterDeploys {
  kovanRouter: CounterRouter;
  rinkebyRouter: CounterRouter;
}

async function main() {
  instantiateNomad();

  const xAppConnectionManagerDeploys = await deployXAppConnectionManagers();

  const routerDeploys = await deployRouters(xAppConnectionManagerDeploys);
  await enrollRemoteRouters(routerDeploys);

  const txHash = await sendMessage(routerDeploys);
  await trackMessageStatus(txHash);

  console.log("\n Finished!");
}

function instantiateNomad() {
  console.log("\nInstantiating Nomad object...\n");
  dev.registerRpcProvider("kovan", KOVAN_URL);
  dev.registerRpcProvider("rinkeby", RINKEBY_URL);

  const kovanProvider = new ethers.providers.JsonRpcProvider(KOVAN_URL);
  const kovanSigner = new ethers.Wallet(KOVAN_DEPLOYER_KEY, kovanProvider);

  const moonbaseProvider = new ethers.providers.JsonRpcProvider(RINKEBY_URL);
  const rinkebySigner = new ethers.Wallet(
    RINKEBY_DEPLOYER_KEY,
    moonbaseProvider
  );

  dev.registerSigner("kovan", kovanSigner);
  dev.registerSigner("rinkeby", rinkebySigner);
}

// A XAppConnectionManager is a contract that keeps track of which replicas your
// xapp router can receive messages from. In order for the counter xapp router on
// chain A to be able to receive a message from the counter xapp router on chain
// B, chain A's XAppConnectionManager must enroll the replica for chain B's
// home. You will see the steps for deploying and setting up a
// XAppConnectionManager below.
async function deployXAppConnectionManagers(): Promise<XAppConnectionManagerDeploys> {
  let kovanFactory = new XAppConnectionManager__factory(dev.getSigner("kovan"));
  const kovanXAppConnectionManager = await kovanFactory.deploy();

  let rinkebyFactory = new XAppConnectionManager__factory(
    dev.getSigner("rinkeby")
  );
  const rinkebyXAppConnectionManager = await rinkebyFactory.deploy();

  // Wait for XAppConnectionManager deployments to finish
  console.log("Deploying Kovan XAppConnectionManager...");
  await kovanXAppConnectionManager.deployed();
  console.log(
    `Kovan XAppConnectionManager deployed to address: ${kovanXAppConnectionManager.address}`
  );

  console.log("Deploying Rinkeby XAppConnectionManager...");
  await rinkebyXAppConnectionManager.deployed();
  console.log(
    `Rinkeby router deployed to address: ${rinkebyXAppConnectionManager.address}`
  );

  console.log(
    "Enrolling rinkeby --> kovan replica on the kovan XAppConnectionManager"
  );
  const rinkebyReplicaOnKovan = dev
    .mustGetCore("kovan")
    .getReplica(RINKEBY_DOMAIN)!;
  const kovanEnrollTx = await kovanXAppConnectionManager.ownerEnrollReplica(
    rinkebyReplicaOnKovan.address,
    RINKEBY_DOMAIN
  );
  await kovanEnrollTx.wait(2);

  console.log(
    "Enrolling kovan --> rinkeby replica on the rinkeby XAppConnectionManager"
  );
  const kovanReplicaOnMoonbaseAlpha = dev
    .mustGetCore("rinkeby")
    .getReplica(KOVAN_DOMAIN)!;
  const rinkebyEnrollTx = await rinkebyXAppConnectionManager.ownerEnrollReplica(
    kovanReplicaOnMoonbaseAlpha.address,
    KOVAN_DOMAIN
  );
  await rinkebyEnrollTx.wait(2);

  return {
    kovan: kovanXAppConnectionManager,
    rinkeby: rinkebyXAppConnectionManager,
  };
}

// Deploy Counter routers on both Kovan and Rinkeby.
async function deployRouters(
  xAppConnectionManagers: XAppConnectionManagerDeploys
): Promise<RouterDeploys> {
  const { kovan, rinkeby } = xAppConnectionManagers;
  const kovanXAppConnectionManagerAddress = kovan.address;
  const rinkebyXAppConnectionManagerAddress = rinkeby.address;

  // Deploy routers to each chain
  const KovanCounterRouter = await ethers.getContractFactory(
    "CounterRouter",
    dev.getSigner("kovan")
  );
  let kovanRouter = await KovanCounterRouter.deploy(
    kovanXAppConnectionManagerAddress
  );

  const RinkebyCounterRouter = await ethers.getContractFactory(
    "CounterRouter",
    dev.getSigner("rinkeby")
  );
  let rinkebyRouter = await RinkebyCounterRouter.deploy(
    rinkebyXAppConnectionManagerAddress
  );

  // Wait for deployments to finish
  console.log("Deploying Kovan router...");
  await kovanRouter.deployed();
  console.log(`Kovan router deployed to address: ${kovanRouter.address}`);

  console.log("Deploying Rinkeby router...");
  await rinkebyRouter.deployed();
  console.log(`Rinkeby router deployed to address: ${rinkebyRouter.address}`);

  return {
    kovanRouter,
    rinkebyRouter,
  };
}

// Enroll Rinkeby router on Kovan router and Kovan router on Rinkeby
// router. Enrolling a remote router on a local router allows the local router
// to accept messages from the remote router. Note that addresses are formatted
// as bytes 32 (prepend 0s to 20-byte Ethereum address).
async function enrollRemoteRouters(deploys: RouterDeploys) {
  const { kovanRouter, rinkebyRouter } = deploys;

  console.log("\nEnrolling Rinkeby router on Kovan router...");
  const kovanEnrollTx = await kovanRouter.enrollRemoteRouter(
    RINKEBY_DOMAIN,
    toBytes32(rinkebyRouter.address)
  );
  await kovanEnrollTx.wait(2);
  console.log("Kovan router can now accept messages from Rinkeby router.");

  console.log("\nEnrolling Kovan router on Rinkeby router...");
  const rinkebyEnrollTx = await rinkebyRouter.enrollRemoteRouter(
    KOVAN_DOMAIN,
    toBytes32(kovanRouter.address)
  );
  await rinkebyEnrollTx.wait(2);
  console.log("Rinkeby router can now accept messages from Kovan router.");
}

// Send increment message from Kovan to Rinkeby (~5 min)
async function sendMessage(deploys: RouterDeploys): Promise<string> {
  const { kovanRouter } = deploys;
  const incrementAmount = 100;

  // Send an increment message from Kovan to Rinkeby. Should increment the
  // Rinkeby router's count by 100. Will take approximately 5 min for the
  // message to process on Rinkeby.
  console.log(
    `\nDispatching Increment(${incrementAmount}) message from Kovan --> Rinkeby. This will increment the Rinkeby router's count by ${incrementAmount}.`
  );
  const kovanDispatchToRinkebyTx = await kovanRouter.dispatchIncrement(
    RINKEBY_DOMAIN,
    incrementAmount
  );
  await kovanDispatchToRinkebyTx.wait(2);
  console.log(
    `Kovan --> Rinkeby Dispatch tx hash: ${kovanDispatchToRinkebyTx.hash}`
  );

  return kovanDispatchToRinkebyTx.hash;
}

// Track the status of your message from kovan to moonbeam
async function trackMessageStatus(txHash: string) {
  const message = await NomadMessage.singleFromTransactionHash(
    dev,
    "kovan",
    txHash
  );

  const interval = 10 * 1000; // 10 second polling interval
  let status = (await message.events()).status;
  while (status != MessageStatus.Processed) {
    await new Promise((resolve) => setTimeout(resolve, interval)); // pause

    status = (await message.events()).status; // update status

    const statusAsString = MessageStatus[status];
    console.log(`Current status: ${statusAsString}`);
  }

  // Print tx hash of transaction that processed transfer on ethereum
  const processTxHash = (await message.getProcess())!.transactionHash;
  console.log(
    `Success! Message processed on Rinkeby with tx hash ${processTxHash}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
