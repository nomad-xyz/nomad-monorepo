import { mainnet } from '@nomad-xyz/sdk';
import { evmId } from '@nomad-xyz/sdk/utils';
import { getEvents } from '@nomad-xyz/sdk/nomad/events/fetch';
import { BridgeRouter } from '@nomad-xyz/contract-interfaces/bridge';
import { ethers } from 'ethers';
import { prepareContext } from './config';

// Pick up Send events from BridgeRouter
// Send GLMR to recepient address

const ONE_KWEI = ethers.utils.parseEther('0.001');

class DustMonitor {
  bridgeRouter: BridgeRouter;
  origin: string;
  originProvider: ethers.providers.Provider;
  latestSeenBlock: number; // has 10 block time lag
  intervalSeconds: number = 10 * 1000; // 10 second interval

  constructor(origin: string) {
    this.origin = origin;
    this.latestSeenBlock = 0;

    prepareContext();
    this.originProvider = mainnet.mustGetProvider(origin);

    const privKey = process.env.DUSTER_KEY!;
    const signer = new ethers.Wallet(privKey, this.originProvider);
    mainnet.registerSigner('moonbeam', signer);

    this.bridgeRouter = mainnet.mustGetBridge(origin).bridgeRouter;
  }

  async initialize() {
    const latestBlock = await this.getLatestBlockWithLag();
    this.latestSeenBlock = latestBlock - 10; // 20 blocks behind tip
  }

  async getLatestBlockWithLag() {
    const latestBlock = await this.originProvider.getBlockNumber();
    return latestBlock - 10;
  }

  async run() {
    const sendFilter = this.bridgeRouter.filters.Send();
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, this.intervalSeconds));

      const startBlock = this.latestSeenBlock + 1;
      const toBlock = await this.getLatestBlockWithLag();
      if (toBlock <= startBlock) {
        continue;
      }

      console.log(
        `Indexing blocks ${startBlock}..${toBlock} on ${this.origin} for Send events.`,
      );
      const sendEvents = await getEvents(
        mainnet,
        this.origin,
        this.bridgeRouter,
        sendFilter,
        startBlock,
        toBlock,
      );
      this.latestSeenBlock = toBlock;

      for (const sendEvent of sendEvents) {
        console.log(
          `Dusting for send event on ${this.origin} with tx hash ${sendEvent.transactionHash}.`,
        );
        const toDomain = sendEvent.args.toDomain;
        const recipient = evmId(sendEvent.args.toId);

        const signer = mainnet.getSigner(toDomain);
        if (!signer) {
          throw new Error(`No signer for domain ${toDomain}!`);
        }

        console.log(
          `Sending one kwei to ${recipient} on ${mainnet.resolveDomainName(
            toDomain,
          )}...`,
        );
        const tx = await signer.sendTransaction({
          to: recipient,
          value: ONE_KWEI,
        });
        tx.wait(2);
        console.log(`Sent!\n`);
      }
    }
  }
}

(async () => {
  console.log('Starting duster...\n');
  const duster = new DustMonitor('ethereum');
  await duster.initialize();
  await duster.run();
})();
