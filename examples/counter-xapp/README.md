# Nomad Xapp Tutorial

### **Overview**

For building new applications on top of the Nomad arbitrary messaging channel, you will be integrating with [solidity/optics-core](https://github.com/nomad-xyz/nomad-monorepo/tree/main/solidity/nomad-core). This section of our repo contains the home/replica contracts, which are the core components that cross-chain applications are built on. TL;DR, the home contract lives on the sending chain. Message senders enqueue messages on the home so they can be dispatched to a replica on a receiving chain. Replica contracts live on receiving chains. Messages are relayed replicas them from a sending chain's home contract.

If you want to run a cross-chain app that can send and receive messages across chains, you must deploy xapp router contracts on both sides. Xapp routers are contracts that use the home and replica to send and receive application specific messages. A xapp router will be configured to point to a home contract so it can enqueue messages to be dispatched to remote chains. In practice, this means exposing several dispatch methods that allow users to send different types of cross-chain messages. A xapp router will also enroll one or more replicas, which allow it to receive incoming messages from remote chains. The xapp router must implement a `handle` method, which describes how it should react to incoming messages.

Our off-chain agents will handle all the steps between enqueuing a message and processing it on the receiving chain (i.e. relaying messages from the home to the replica and calling the xapp router's `handle` function).

<br>

### **Steps to Building Your Own XApp**

Building a xapp on top of Nomad requires writing two main components:

- A custom message library that describes how to encode/decode your app-specific of messages you want to send.
- A router that exposes a `handle` method, which inspects an incoming custom message and acts on it accordingly based on the message's type and data.

<br>

### **Getting Started With A Basic Counter XApp**

For an comprehensive tutorial on how to setup your own xapp that passes messages between Kovan and Rinkeby, refer to the simple Counter XApp tutorial in this project. Please refer to `/contracts/CounterMessage.sol` and `/contracts/CounterRouter.sol` for example code and in-depth documentation on how to write a message library and xapp router contract. Once you are comfortable with the general idea of how the message library and xapp router work, please refer to `/scripts/index.ts` for an walk-through that deploys the Counter xapp contracts to Kovan and Rinkeby and demonstrates how to send messages between the two networks.
