# Nomad Xapp Tutorial

## **Overview**

For building new applications on top of the Nomad arbitrary messaging channel, you will be integrating with [solidity/nomad-core](https://github.com/nomad-xyz/nomad-monorepo/tree/main/solidity/nomad-core). This section of our repo contains the home/replica contracts, which are the core components that cross-chain applications are built on. TL;DR, the home contract lives on the sending chain. Message senders enqueue messages on the home so they can be dispatched to a replica on a receiving chain. Replica contracts live on receiving chains. Messages are relayed replicas them from a sending chain's home contract.

If you want to run a cross-chain app that can send and receive messages across chains, you must deploy xapp router contracts on both sides. Xapp routers are contracts that use the home and replica to send and receive application specific messages. A xapp router will be configured to point to a home contract so it can enqueue messages to be dispatched to remote chains. In practice, this means exposing several dispatch methods that allow users to send different types of cross-chain messages. A xapp router will also enroll one or more replicas, which allow it to receive incoming messages from remote chains. The xapp router must implement a `handle` method, which describes how it should react to incoming messages.

Our off-chain agents will handle all the steps between enqueuing a message and processing it on the receiving chain (i.e. relaying messages from the home to the replica and calling the xapp router's `handle` function).

<br>

## **General Steps to Building Your Own XApp**

Building a xapp on top of Nomad requires writing two main components:

- A custom message library that describes how to encode/decode your app-specific of messages you want to send.
- A router that exposes a `handle` method, which inspects an incoming custom message and acts on it accordingly based on the message's type and data.

<br>

## **Getting Started With A Basic Counter XApp**

For writing your own xapp contracts, please refer to `/contracts/CounterMessage.sol` and `/contracts/CounterRouter.sol`. These contain example code and in-depth documentation on how to write a message library and xapp router contract (see in-file comments.

Once you are comfortable with the general idea of how the message library and xapp router work, please refer to the walkthrough below. This will demonstrate how to deploy your Counter xapp contracts to Kovan and Rinkeby, send messages between the two networks, and use our SDK to track inflight message progress.

## **Walkthrough**

### High Level Overview

At a high level, we will be going through the following steps:

- instantiate a `NomadContext` object, which will be connected to the existing cross-chain development setup
- deploy `XAppConnectionManagers` on Kovan and Rinkeby for our counter xapp routers (more context below)
- deploy `CounterRouters` to Kovan and Rinkeby
- send an `Increment` message from Kovan to Rinkeby to bump the counter on the Rinkeby `CounterRouter`
- track the progress of your inflight `Increment` message until it has been processed

You can see the skeleton code for all these steps below.

```ts
instantiateNomad();

const xAppConnectionManagerDeploys = await deployXAppConnectionManagers();

const routerDeploys = await deployRouters(xAppConnectionManagerDeploys);
await enrollRemoteRouters(routerDeploys);

const txHash = await sendMessage(routerDeploys);
await trackMessageStatus(txHash);

console.log("\n Finished!");
```

### Steps

To instantiate a `NomadContext` object, you must register RPC URLs and signers for the necessary networks. Also note that we are using the `dev` object imported from the Nomad SDK npm package.

```ts
import { dev, NomadMessage } from "@nomad-xyz/sdk";

...

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

```

The next step is to deploy `XAppConnectionManager` contracts to Kovan and Rinkeby for our `CounterRouter` contracts to use. For context, a XAppConnectionManager is a contract that keeps track of which replicas your xapp router can receive messages from. Your `CounterRouter` contracts will hold references to these `XAppConnectionManager` contracts.

```ts
...

let kovanFactory = new XAppConnectionManager__factory(dev.getSigner("kovan"));
const kovanXAppConnectionManager = await kovanFactory.deploy();

let rinkebyFactory = new XAppConnectionManager__factory(
dev.getSigner("rinkeby")
);
const rinkebyXAppConnectionManager = await rinkebyFactory.deploy();

...

await kovanXAppConnectionManager.deployed();

...

await rinkebyXAppConnectionManager.deployed();

...
```

In order for the counter xapp router on chain A to be able to receive a message from the counter xapp router on chain B, xapp router A's `XAppConnectionManager` must enroll the replica which receives messages from chain B's home. Below, we go through the enrollment step.

```ts
...

const rinkebyReplicaOnKovan = dev
    .mustGetCore("kovan")
    .getReplica(RINKEBY_DOMAIN)!;
const kovanEnrollTx = await kovanXAppConnectionManager.ownerEnrollReplica(
    rinkebyReplicaOnKovan.address,
    RINKEBY_DOMAIN
);
await kovanEnrollTx.wait(2);

...

const kovanReplicaOnMoonbaseAlpha = dev
  .mustGetCore("rinkeby")
  .getReplica(KOVAN_DOMAIN)!;
const rinkebyEnrollTx = await rinkebyXAppConnectionManager.ownerEnrollReplica(
  kovanReplicaOnMoonbaseAlpha.address,
  KOVAN_DOMAIN
);
await rinkebyEnrollTx.wait(2);

...
```

After deploying our `XAppConnectionManagers`, we are ready deploy our `CounterRouter` contracts!

```ts
...

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

...

await kovanRouter.deployed();

...

await rinkebyRouter.deployed();

...
```

Now that our routers are enrolled, we have just one more setup step before we can send messages. We must enroll the Rinkeby router on the Kovan Router and the Kovan router on the Rinkeby router. This essentially gives the routers permissions to send and receive messages from each other. Note that addresses are formatted as bytes 32 (prepend 0s to 20-byte Ethereum address).

```ts
...

const kovanEnrollTx = await kovanRouter.enrollRemoteRouter(
  RINKEBY_DOMAIN,
  toBytes32(rinkebyRouter.address)
);
await kovanEnrollTx.wait(2);


const rinkebyEnrollTx = await rinkebyRouter.enrollRemoteRouter(
  KOVAN_DOMAIN,
  toBytes32(kovanRouter.address)
);
await rinkebyEnrollTx.wait(2);

...
```

Finally, all our boilerplate setup is done! We can now send a cross-chain message! Sending a message from Kovan to increment the Rinkeby router's `count` is as simple as below :)

```ts
const kovanDispatchToRinkebyTx = await kovanRouter.dispatchIncrement(
  RINKEBY_DOMAIN,
  incrementAmount
);
```

Now that our cross-chain message is inflight, we'd like to track its lifecycle.

There are four stages a message will go through:

- Dispatched: message has been dispatched on the sending chain
- Included: message has been included in a signed update
- Relayed: signed update containing the message has been relayed to the destination chain
- Processed: message has been processed on the destination chain

Some simple code for tracking the status of the message is shown below. This lifecycle-tracking code works for any arbitrary message sent through the Nomad system. All it requires is the transaction hash of the original dispatch transaction.

```ts
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
```

You've now seen the general process from contract deploy to message sending to message tracking. We hope this equips you well in your own cross-chain dev endeavours. If you have any additional questions, feel free to reach out to us on [Discord](https://discord.gg/RurtmJApqm)!
