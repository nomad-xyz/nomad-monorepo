// import * as dotenv from "dotenv";
import { ethers } from "hardhat";
import { CounterRouter } from "../typechain";
import { toBytes32 } from "./utils";
import { dev } from "@nomad-xyz/sdk/dist";

// Chain-specific identifiers arbitrarily chosen by Nomad team (do not change)
const KOVAN_DOMAIN = 3000;
const MOONBASEALPHA_DOMAIN = 5000;

// Provider/signer info
const KOVAN_URL = process.env.KOVAN_RPC;
const MOONBASEALPHA_URL = process.env.MOONBASEALPHA_RPC;
const KOVAN_DEPLOYER_KEY = process.env.KOVAN_DEPLOYER_KEY;
const MOONBASEALPHA_DEPLOYER_KEY = process.env.MOONBASEALPHA_DEPLOYER_KEY;

interface Deploys {
  kovanRouter: CounterRouter;
  moonbasealphaRouter: CounterRouter;
}

async function main() {
  instantiateNomad();
  const deploys = await deploy();
  await enrollRemoteRouters(deploys);
  const txHash = await sendMessage(deploys);
}

function instantiateNomad() {
  dev.registerRpcProvider("kovan", KOVAN_URL!);
  dev.registerRpcProvider("moonbasealpha", MOONBASEALPHA_URL!);

  const kovanSigner = new ethers.Wallet(
    KOVAN_DEPLOYER_KEY!.toString(),
    new ethers.providers.JsonRpcProvider(KOVAN_URL)
  );
  const moonbasealphaSigner = new ethers.Wallet(
    MOONBASEALPHA_DEPLOYER_KEY!.toString(),
    new ethers.providers.JsonRpcProvider(MOONBASEALPHA_URL)
  );

  dev.registerSigner("kovan", kovanSigner);
  dev.registerSigner("moonbasealpha", moonbasealphaSigner);
}

// Deploy Counter routers on both Kovan and Moonbasealpha.
async function deploy(): Promise<Deploys> {
  // Addresses of Nomad XAppConnectionManager contracts on Kovan and Moonbasealpha
  const kovanXAppConnectionManagerAddress =
    dev.mustGetCore("kovan")._xAppConnectionManager;
  const moonbasealphaXAppConnectionManagerAddress =
    dev.mustGetCore("moonbasealpha")._xAppConnectionManager;

  // const kovanSigner = dev.getSigner("kovan");
  // const moonbasealphaSigner = dev.getSigner("moonbasealpha");

  // Deploy routers to each chain
  const KovanCounterRouter = await ethers.getContractFactory(
    "CounterRouter",
    dev.getSigner("kovan")
  );
  let kovanRouter = await KovanCounterRouter.deploy(
    kovanXAppConnectionManagerAddress
  );
  const MoonbasealphaCounterRouter = await ethers.getContractFactory(
    "CounterRouter",
    dev.getSigner("moonbasealpha")
  );
  let moonbasealphaRouter = await MoonbasealphaCounterRouter.deploy(
    moonbasealphaXAppConnectionManagerAddress
  );

  // Wait for deployments to finish
  console.log("Deploying Kovan router...");
  kovanRouter = await kovanRouter.deployed();
  console.log(`Kovan router deployed to address: ${kovanRouter.address}`);

  console.log("Deploying Moonbasealpha router...");
  moonbasealphaRouter = await moonbasealphaRouter.deployed();
  console.log(
    `Moonbasealpha router deployed to address: ${moonbasealphaRouter.address}`
  );

  return {
    kovanRouter,
    moonbasealphaRouter,
  };
}

// Enroll Moonbasealpha router on Kovan router and Kovan router on Moonbasealpha
// router. Enrolling a remote router on a local router allows the local router
// to accept messages from the remote router. Note that addresses are formatted
// as bytes 32 (prepend 0s to 20-byte Ethereum address).
async function enrollRemoteRouters(deploys: Deploys) {
  const { kovanRouter, moonbasealphaRouter } = deploys;

  console.log("\nEnrolling Moonbasealpha router on Kovan router...");
  const kovanEnrollTx = await kovanRouter.enrollRemoteRouter(
    MOONBASEALPHA_DOMAIN,
    toBytes32(moonbasealphaRouter.address)
  );
  await kovanEnrollTx.wait(2);
  console.log(
    "Kovan router can now accept messages from Moonbasealpha router."
  );

  console.log("\nEnrolling Kovan router on Moonbasealpha router...");
  const moonbasealphaEnrollTx = await moonbasealphaRouter.enrollRemoteRouter(
    KOVAN_DOMAIN,
    toBytes32(kovanRouter.address)
  );
  await moonbasealphaEnrollTx.wait(2);
  console.log(
    "Moonbasealpha router can now accept messages from Kovan router."
  );
}

// Send increment message from Kovan to Moonbasealpha (~5 min)
async function sendMessage(deploys: Deploys): Promise<string> {
  const { kovanRouter } = deploys;
  const incrementAmount = 100;

  // Send an increment message from Kovan to Moonbasealpha. Should increment the
  // Moonbasealpha router's count by 100. Will take approximately 5 min for the
  // message to process on Moonbasealpha.
  console.log(
    `\nDispatching Increment(${incrementAmount}) message from Kovan --> Moonbasealpha. This will increment the Moonbasealpha router's count by ${incrementAmount}.`
  );
  const kovanDispatchToMoonbasealphaTx = await kovanRouter.dispatchIncrement(
    MOONBASEALPHA_DOMAIN,
    incrementAmount
  );
  console.log(
    `Kovan --> Moonbasealpha Dispatch tx hash: ${kovanDispatchToMoonbasealphaTx.hash}`
  );

  return kovanDispatchToMoonbasealphaTx.hash;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
