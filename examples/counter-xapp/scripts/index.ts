import { ethers } from "hardhat";
import { CounterRouter } from "../typechain";
import { toBytes32 } from "./utils";

// Chain-specific identifiers arbitrarily chosen by Nomad team (do not change)
const KOVAN_DOMAIN = 3000;
const RINKEBY_DOMAIN = 2000;

// Provider/signer info
const KOVAN_URL = process.env.KOVAN_URL;
const RINKEBY_URL = process.env.RINKEBY_URL;
const KOVAN_DEPLOYER_KEY = process.env.KOVAN_DEPLOYER_KEY;
const RINKEBY_DEPLOYER_KEY = process.env.RINKEBY_DEPLOYER_KEY;

interface Deploys {
  kovanRouter: CounterRouter;
  rinkebyRouter: CounterRouter;
}

async function main() {
  const deploys = await deploy();
  await enrollRemoteRouters(deploys);
  await sendMessages(deploys);
}

// Deploy Counter routers on both Kovan and Rinkeby.
async function deploy(): Promise<Deploys> {
  // Addresses of Nomad XAppConnectionManager contracts on Kovan and Rinkeby
  const kovanXAppConnectionManagerAddress =
    "0xfF1B322995fee7F71ac5AD495d61aD7910655300";
  const rinkebyXAppConnectionManagerAddress =
    "0x011b839eadcc1cb8a70d0b23BCe3F8819D410732";

  // Instantiate and connect signers for each chain
  const kovanProvider = new ethers.providers.JsonRpcProvider(KOVAN_URL);
  const kovanSigner = new ethers.Wallet(
    KOVAN_DEPLOYER_KEY!.toString(),
    kovanProvider
  );
  const rinkebyProvider = new ethers.providers.JsonRpcProvider(RINKEBY_URL);
  const rinkebySigner = new ethers.Wallet(
    RINKEBY_DEPLOYER_KEY!.toString(),
    rinkebyProvider
  );

  // Deploy routers to each chain
  const KovanCounterRouter = await ethers.getContractFactory(
    "CounterRouter",
    kovanSigner
  );
  let kovanRouter = await KovanCounterRouter.deploy(
    kovanXAppConnectionManagerAddress
  );
  const RinkebyCounterRouter = await ethers.getContractFactory(
    "CounterRouter",
    rinkebySigner
  );
  let rinkebyRouter = await RinkebyCounterRouter.deploy(
    rinkebyXAppConnectionManagerAddress
  );

  // Wait for deployments to finish
  console.log("\nDeploying routers to Kovan and Rinkeby...");
  [kovanRouter, rinkebyRouter] = await Promise.all([
    kovanRouter.deployed(),
    rinkebyRouter.deployed(),
  ]).then(([kovan, rinkeby]) => {
    console.log(`Kovan router deployed to address: ${kovan.address}`);
    console.log(`Rinkeby router deployed to address: ${rinkeby.address}`);

    return [kovan, rinkeby];
  });

  return {
    kovanRouter,
    rinkebyRouter,
  };
}

// Enroll Rinkeby router on Kovan router and Kovan router on Rinkeby router.
// Enrolling a remote router on a local router allows the local router to
// accept messages from the remote router. Note that addresses are formatted as
// bytes 32 (prepend 0s to 20-byte Ethereum address).
async function enrollRemoteRouters(deploys: Deploys) {
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

// Send increment message from Kovan to Rinkeby (~5 min). Note that sending a
// message from Rinkeby to Kovan (other direction) will take approximately 50
// min for the message  to process on Rinkeby. The long delay is due to
// Rinkeby's slow finality and frequency of reorgs.
async function sendMessages(deploys: Deploys) {
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
  console.log(
    `Kovan --> Rinkeby Dispatch tx hash: ${kovanDispatchToRinkebyTx.hash}`
  );

  console.log(
    `\nThe Kovan --> Rinkeby message should be processed on Rinkeby within ~5 min. \nTrack the status of your message at: https://development.app.nomad.xyz/transaction/kovan/${kovanDispatchToRinkebyTx.hash}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
