import { Orchestrator } from "./orchestrator";
import { NomadContext } from "@nomad-xyz/sdk/dist";
import { getEvents } from "@nomad-xyz/sdk/dist/nomad/events/fetch"
import fs from "fs";
import { ContractType, EventType, NomadEvent, EventSource } from "./event";
import { Home, Replica } from "@nomad-xyz/contract-interfaces/core";
import { ethers } from "ethers";
import { KVCache, replacer, retry, reviver } from "./utils";
import { BridgeRouter } from "@nomad-xyz/contract-interfaces/bridge";
import pLimit from 'p-limit';
import { TypedEvent } from "@nomad-xyz/contract-interfaces/core/commons";
import { Result } from "ethers/lib/utils";

type ShortTx = {
  gasPrice?: ethers.BigNumber,
  timestamp: number,
  from: string,
  to?: string,
  gasLimit: ethers.BigNumber,
};

function txEncode(tx: ShortTx): string  {
  const {
    gasPrice, // ?
    timestamp,
    from,
    to, // ?
    gasLimit, 
  } = tx as ShortTx;
  return JSON.stringify({
    gasPrice, // ?
    timestamp,
    from,
    to, // ?
    gasLimit, 
  }, replacer)
}

function txDecode(encoded: string): ShortTx {
  return JSON.parse(encoded, reviver)
}

type ShortTxReceipt = {
  effectiveGasPrice: ethers.BigNumber,
  cumulativeGasUsed: ethers.BigNumber,
  gasUsed: ethers.BigNumber,
  from: string,
  to: string,
  status?: number,
};

function txReceiptEncode(receipt: ethers.providers.TransactionReceipt): string  {
  const {
    effectiveGasPrice,
    cumulativeGasUsed,
    from,
    to,
    gasUsed,
    status,
  } = receipt as ShortTxReceipt;
  return JSON.stringify({
    effectiveGasPrice,
    cumulativeGasUsed,
    from,
    to,
    gasUsed,
    status, 
  }, replacer)
}

function txReceiptDecode(encoded: string): ShortTxReceipt {
  return JSON.parse(encoded, reviver)
}


const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 2000;
const RETRIES = 100;


export class Indexer {
  domain: number;
  sdk: NomadContext;
  orchestrator: Orchestrator;
  persistance: Persistance;
  blockCache: KVCache;
  blockTimestampCache: KVCache;
  txCache: KVCache;
  txReceiptCache: KVCache;
  limit: pLimit.Limit;
  lastBlock: number;

  eventCallback: undefined | ((event: NomadEvent) => void);

  constructor(domain: number, sdk: NomadContext, orchestrator: Orchestrator) {
    this.domain = domain;
    this.sdk = sdk;
    this.orchestrator = orchestrator;
    this.persistance = new RamPersistance(
      `/tmp/persistance_${this.domain}.json`
    );
    this.blockCache = new KVCache('b_' + String(this.domain), this.orchestrator.db);
    this.blockTimestampCache = new KVCache('bts_' + String(this.domain), this.orchestrator.db);
    this.txCache = new KVCache('tx_' + String(this.domain), this.orchestrator.db);
    this.txReceiptCache = new KVCache('txr_' + String(this.domain), this.orchestrator.db);
    // 20 concurrent requests per indexer
    this.limit = pLimit(100);
    this.lastBlock = 0;
  }

  get provider(): ethers.providers.Provider {
    return this.sdk.getProvider(this.domain)!;
  }

  async getBlockInfoLegacy(
    blockNumber: number
  ): Promise<[number, Map<string, string>]> {
    const possibleBlock = await this.blockCache.get(String(blockNumber));
    if (possibleBlock) {
      const [ts, txs] = possibleBlock.split(".");
      const x: string[] = txs.split(",");
      const senders2hashes: Map<string, string> = new Map(
        x.map((tx) => tx.split(":") as [string, string])
      );
      return [parseInt(ts), senders2hashes];
    }

    const [block, error] = await retry(
      async () => {
        return await this.limit(() => this.provider.getBlockWithTransactions(blockNumber))
      },
      RETRIES,
      (error: any) =>
        this.orchestrator.logger.warn(
          `Retrying after RPC Error... Block: ${blockNumber}, Domain: ${this.domain}, Error: ${error.code}`
        )
    );
    if (!block) {
      throw new Error(
        `An RPC foo error occured, retried exhausted. Block: ${blockNumber} Domain: ${this.domain}, Error: ${error}`
      );
    }
    const time = block.timestamp * 1000;
    const senders2hashes: Map<string, string> = new Map(
      block.transactions.map((tx) => [tx.from, tx.hash])
    );
    const senders2hashesStr = Array.from(senders2hashes.entries())
      .map(([from, hash]) => `${from}:${hash}`)
      .join(",");
    await this.blockCache.set(
      String(blockNumber),
      `${time}.${senders2hashesStr}`
    );
    // await this.block2timeCache.set(String(blockNumber), String(block.transactions.map(tx => tx.from).join(',')));
    return [time, senders2hashes];
  }

  async getBlockTimestamp(blockNumber: number): Promise<number> {
    const possible = await this.blockTimestampCache.get(String(blockNumber));
    if (possible) {
      // this.orchestrator.logger.debug(`Gound transaction receipt in DB: ${hash}`);
      return parseInt(possible)
    }

    const [block, error] = await retry(
      async () => {
        return await this.limit(() => this.provider.getBlock(blockNumber))
      },
      RETRIES,
      (error: any) =>
        this.orchestrator.logger.warn(
          `Retrying after RPC Error... Block number: ${blockNumber}, Domain: ${this.domain}, Error: ${error.code}`
        )
    );
    if (!block) {
      throw new Error(
        `An RPC foo error occured, retried exhausted. Block number: ${blockNumber} Domain: ${this.domain}, Error: ${error}`
      );
    }

    const timestamp = block.timestamp * 1000;

    await this.blockTimestampCache.set(
      String(blockNumber),
      String(timestamp)
    );

    // this.orchestrator.logger.debug(`Finished transaction receipt fetch: ${hash}`);

    return timestamp
  }

  

  async getTransaction(hash: string, forceTimestamp=false): Promise<ShortTx> {
    const possible = await this.txCache.get(hash);
    if (possible) {
      // this.orchestrator.logger.debug(`Gound transaction in DB: ${hash}`);
      return txDecode(possible)
    }

    const [tx, error] = await retry(
      async () => {
        return await this.limit(() => this.provider.getTransaction(hash))
      },
      RETRIES,
      (error: any) =>
        this.orchestrator.logger.warn(
          `Retrying after RPC Error... TX hash: ${hash}, Domain: ${this.domain}, Error: ${error.code}`
        )
    );
    if (!tx) {
      throw new Error(
        `An RPC foo error occured, retried exhausted. TX hash: ${hash} Domain: ${this.domain}, Error: ${error}`
      );
    }

    let timestamp: number;

    if (forceTimestamp) {
      this.orchestrator.logger.debug(`Using real time timestamp for: ${hash}, ${forceTimestamp} || ${tx.timestamp}`);

      timestamp = new Date().valueOf()
    } else if (!tx.timestamp) {

      if (!tx.blockNumber) throw new Error(
        `An RPC foo error occured. TX hash: ${hash} has no blockNumber. WTF?`
      );

      timestamp = await this.getBlockTimestamp(tx.blockNumber!)
    } else {
      timestamp = tx.timestamp! * 1000;
    }

    let shortTx = {
      gasPrice: tx.gasPrice,
      timestamp,
      from: tx.from,
      to: tx.to,
      gasLimit: tx.gasLimit,
    };


    await this.txCache.set(
      hash,
      txEncode(shortTx)
    );

    // this.orchestrator.logger.debug(`Finished transaction fetch: ${hash}`);

    return shortTx;
  }

  async getTransactionReceipt(hash: string): Promise<ShortTxReceipt> {
    const possible = await this.txReceiptCache.get(hash);
    if (possible) {
      // this.orchestrator.logger.debug(`Gound transaction receipt in DB: ${hash}`);
      return txReceiptDecode(possible)
    }

    const [receipt, error] = await retry(
      async () => {
        return await this.limit(() => this.provider.getTransactionReceipt(hash))
      },
      RETRIES,
      (error: any) =>
        this.orchestrator.logger.warn(
          `Retrying after RPC Error... TX hash: ${hash}, Domain: ${this.domain}, Error: ${error.code}`
        )
    );
    if (!receipt) {
      throw new Error(
        `An RPC foo error occured, retried exhausted. TX hash: ${hash} Domain: ${this.domain}, Error: ${error}`
      );
    }

    await this.txReceiptCache.set(
      hash,
      txReceiptEncode(receipt)
    );

    // this.orchestrator.logger.debug(`Finished transaction receipt fetch: ${hash}`);

    return receipt
  }

  async getAdditionalInfo(hash: string): Promise<{timestamp: number, gasUsed: ethers.BigNumber, from: string}> {
    const {timestamp} = await this.getTransaction(hash, !this.orchestrator.chaseMode);

    const {gasUsed, from} = await this.getTransactionReceipt(hash);

    // this.orchestrator.logger.debug(`Done with TX: ${hash}`);

    return {timestamp, gasUsed, from}
  }

  async init() {
    await this.blockCache.init();
    await this.persistance.init();
  }

  get height(): number {
    return this.persistance.height;
  }

  get from(): number {
    return this.persistance.from;
  }

  home(): Home {
    return this.sdk.getCore(this.domain)!.home;
  }

  bridgeRouter(): BridgeRouter {
    return this.sdk.getBridge(this.domain)!.bridgeRouter;
  }

  replicaForDomain(domain: number): Replica {
    return this.sdk.getReplicaFor(domain, this.domain)!;
  }

  async updateAll(replicas: number[]) {
    let from = Math.max(
      this.lastBlock,
      this.persistance.height,
      this.sdk.getDomain(this.domain)?.paginate?.from || 0
    );
    const [to, error] = await retry(
      async () => {
        return await this.provider.getBlockNumber()
      },
      RETRIES,
      (error: any) =>
        this.orchestrator.logger.warn(
          `Retrying after RPC Error on .getBlockNumber() method... Error: ${error}`
        )
    );
    if (!to) {
      throw new Error(
        `Retrying .getBlockNumber() method... exhausted maximum retry count. Throwing: ${error}`
      );
    }

    this.orchestrator.logger.info(
      `Fetching events for domain ${this.domain} from: ${from}, to: ${to}`
    );

    const fetchEvents = async (from: number, to: number): Promise<NomadEvent[]> => {
      const homeEvents = await this.fetchHome(from, to);
      const replicasEvents = (
        await Promise.all(
          replicas.map((r) => this.fetchReplica(r, from, to))
        )
      ).flat();
      const bridgeRouterEvents = await this.fetchBridgeRouter(from, to);

      return [...homeEvents, ...replicasEvents, ...bridgeRouterEvents];
    };

    const allEvents: NomadEvent[] = [];

    const batchSize = BATCH_SIZE;
    let batchFrom = from;
    let batchTo = Math.min(to, from + batchSize);

    while (true) {
      const done = Math.floor((batchTo-from)/(to-from) * 100);
      this.orchestrator.logger.debug(
        `Fetching batch of events for domain ${this.domain} from: ${batchFrom}, to: ${batchTo}, [${done}%]`
      );
      const events = await fetchEvents(batchFrom, batchTo);
      if (!events) throw new Error(`KEk`);
      events.sort((a, b) => a.ts - b.ts);
      this.persistance.store(...events);
      try {
        this.dummyTestEventsIntegrity(batchTo);
        this.orchestrator.logger.debug(`Integrity test PASSED for ${this.domain} between ${batchFrom} and ${batchTo}`);
      } catch(e) {
        const pastFrom = batchFrom;
        const pastTo = batchTo;
        batchFrom = batchFrom - batchSize/2;
        batchTo = batchFrom + batchSize;
        this.orchestrator.logger.warn(`Integrity test not passed for ${this.domain} between ${pastFrom} and ${pastTo}, recollecting between ${batchFrom} and ${batchTo}: ${e}`);
        continue;
      }
      allEvents.push(...events.filter(newEvent => allEvents.every(oldEvent => newEvent.uniqueHash() !== oldEvent.uniqueHash())));
      if (batchTo >= to) break;
      batchFrom = batchTo + 1;
      batchTo = Math.min(to, batchFrom + batchSize);
    }

    if (!allEvents) throw new Error("kek");

    allEvents.sort((a, b) => a.ts - b.ts);

    this.dummyTestEventsIntegrity();
    this.orchestrator.logger.info(`Fetched all for domain ${this.domain}`);
    this.lastBlock = to;

    return allEvents;
  }

  dummyTestEventsIntegrity(blockTo?: number) {
    let allEvents = this.persistance.allEvents();
    if (blockTo) allEvents = allEvents.filter(e => e.block <= blockTo);
    if (allEvents.length === 0) {
      this.orchestrator.logger.debug(`No events to test integrity!!!`);
      return ;
    }

    const homeRoots = new Map<string, string>();
    let initialHomeRoot = "";
    let initialHomeTimestamp = Number.MAX_VALUE;
    let homeRootsTotal = 0;

    type ReplicaDomainInfo = {root: string, ts: number, roots: Map<string, string>, total: number};

    const initialReplica: Map<number, ReplicaDomainInfo> = new Map();

    for (const event of allEvents) {
      if (event.eventType == EventType.HomeUpdate) {
        const { oldRoot, newRoot } = event.eventData as { oldRoot: string; newRoot: string };
        homeRoots.set(oldRoot, newRoot);
        homeRootsTotal += 1;
        if (event.ts < initialHomeTimestamp) {
          initialHomeTimestamp = event.ts;
          initialHomeRoot = oldRoot;
        }
      } else if (event.eventType == EventType.ReplicaUpdate) {
        const { oldRoot, newRoot } = event.eventData as { oldRoot: string; newRoot: string };
        const domain = event.replicaOrigin;
        if (!initialReplica.has(domain)) {
          initialReplica.set(domain, {root: '', ts: Number.MAX_VALUE, roots: new Map(), total: 0});
        }
        const replica = initialReplica.get(domain)!;
        replica.roots.set(oldRoot, newRoot);
        replica.total += 1;
        if (event.ts < replica.ts) {
          replica.ts = event.ts;
          replica.root = oldRoot;
        }
      }
    }

    while (true) {
      let newRoot = homeRoots.get(initialHomeRoot);
      if (newRoot) {
        initialHomeRoot = newRoot;
        homeRootsTotal -= 1;
      } else {
        break;
      }
    }
    if (homeRootsTotal !== 0) throw new Error(`${this.domain}: Left roots for home supposed to be 0, but is ${homeRootsTotal}`);

    for (const [domain, replica] of initialReplica) {
      let root = replica.root;
      let total = replica.total;
      while (true) {
        let newRoot = replica.roots.get(root);
        if (newRoot) {
          root = newRoot;
          total -= 1;
        } else {
          break;
        }
      }
      if (total !== 0) throw new Error(`${this.domain}: Left roots for replica ${domain} supposed to be 0, but is ${total} replica for domain ${domain}`)
    }
  }

  savePersistance() {
    this.persistance.persist();
  }

  async fetchBridgeRouter(from: number, to: number) {
    const br = this.bridgeRouter();
    const allEvents = [];
    {
      // const events = await getEvents(
      //   this.sdk, 
      //   this.domain, 
      //   br, 
      //   br.filters.Send(), 
      //   from, 
      //   to
      // )
      const [events, error] = await retry(async () => {
        return await br.queryFilter(br.filters.Send(), from, to);
      }, RETRIES, (e) => {this.orchestrator.logger.warn(`Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${e.message}`)})
      if (error) {
        this.orchestrator.logger.error(`Couldn't recover the error after ${RETRIES} retries`)
        throw error
      }
      if (events === undefined) {
        throw new Error(`There is no error, but events for some reason are still undefined`);
      }
      const parsedEvents = await Promise.all(
        events.map(async (event) => {

          let {timestamp, gasUsed} = await this.getAdditionalInfo(event.transactionHash);
          return new NomadEvent(
            this.domain,
            EventType.BridgeRouterSend,
            ContractType.BridgeRouter,
            0,
            timestamp,
            {
              token: event.args[0],
              from: event.args[1],
              toDomain: event.args[2],
              toId: event.args[3],
              amount: event.args[4],
              fastLiquidityEnabled: event.args[5],
              evmHash: event.transactionHash,
            },
            event.blockNumber,
            EventSource.Fetch,
            gasUsed,
            event.transactionHash
          );
        })
      );
      allEvents.push(...parsedEvents);
    }

    {
      // const events = await getEvents(
      //   this.sdk, 
      //   this.domain, 
      //   br, 
      //   br.filters.Receive(), 
      //   from, 
      //   to
      // )

      const [events, error] = await retry(async () => {
        return await br.queryFilter(br.filters.Receive(), from, to);
      }, RETRIES, (e) => {this.orchestrator.logger.warn(`Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${e.message}`)})
      if (error) {
        this.orchestrator.logger.error(`Couldn't recover the error after ${RETRIES} retries`)
        throw error
      }
      if (events === undefined) {
        throw new Error(`There is no error, but events for some reason are still undefined`);
      }
      const parsedEvents = await Promise.all(
        events.map(
          async (event) => 
            {
              let {timestamp, gasUsed, } = await this.getAdditionalInfo(event.transactionHash);
              return new NomadEvent(
              this.domain,
              EventType.BridgeRouterReceive,
              ContractType.BridgeRouter,
              0,
              timestamp,
              {
                originAndNonce: event.args[0],
                token: event.args[1],
                recipient: event.args[2],
                liquidityProvider: event.args[3],
                amount: event.args[4],
              },
              event.blockNumber,
              EventSource.Fetch,
              gasUsed,
              event.transactionHash,
            )})
        )
      ;
      allEvents.push(...parsedEvents);
    }

    return allEvents;
  }

  

  async fetchHome(from: number, to: number) {
    let fetchedEvents: NomadEvent[] = [];

    const home = this.home();
    {
      // const events = await getEvents(
      //   this.sdk, 
      //   this.domain, 
      //   home, 
      //   home.filters.Dispatch(), 
      //   from, 
      //   to
      // )
      const [events, error] = await retry(async () => {
        return await home.queryFilter(home.filters.Dispatch(), from, to);
      }, RETRIES, (e) => {this.orchestrator.logger.warn(`Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${e.message}`)})
      if (error) {
        this.orchestrator.logger.error(`Couldn't recover the error after ${RETRIES} retries`)
        throw error
      }
      if (events === undefined) {
        throw new Error(`There is no error, but events for some reason are still undefined`);
      }

      const parsedEvents = await Promise.all(
        events.map(
          async (event) => 
            {
              
              let {timestamp, gasUsed} = await this.getAdditionalInfo(event.transactionHash);
              
              return new NomadEvent(
                this.domain,
                EventType.HomeDispatch,
                ContractType.Home,
                0,
                timestamp,
                {
                  messageHash: event.args[0],
                  leafIndex: event.args[1],
                  destinationAndNonce: event.args[2],
                  committedRoot: event.args[3],
                  message: event.args[4],
                },
                event.blockNumber,
                EventSource.Fetch,
                gasUsed,
                event.transactionHash
              )
            })
        );
      
      fetchedEvents.push(...parsedEvents);
    }

    {
      // const events = await getEvents(
      //   this.sdk, 
      //   this.domain, 
      //   home, 
      //   home.filters.Update(), 
      //   from, 
      //   to
      // )
      const [events, error] = await retry(async () => {
        return await home.queryFilter(home.filters.Update(), from, to);
      }, RETRIES, (e) => {this.orchestrator.logger.warn(`Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${e.message}`)})
      if (error) {
        this.orchestrator.logger.error(`Couldn't recover the error after ${RETRIES} retries`)
        throw error
      }
      if (events === undefined) {
        throw new Error(`There is no error, but events for some reason are still undefined`);
      }

      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>  
            {
              let {timestamp, gasUsed} = await this.getAdditionalInfo(event.transactionHash);
              return new NomadEvent(
              this.domain,
              EventType.HomeUpdate,
              ContractType.Home,
              0,
              timestamp,
              {
                homeDomain: event.args[0],
                oldRoot: event.args[1],
                newRoot: event.args[2],
                signature: event.args[3],
              },
              event.blockNumber,
              EventSource.Fetch,
              gasUsed,
              event.transactionHash
            )})
        )
      ;
      fetchedEvents.push(...parsedEvents);
    }

    return fetchedEvents;
  }

  async fetchReplica(domain: number, from: number, to: number) {
    let fetchedEvents: NomadEvent[] = [];

    const replica = this.replicaForDomain(domain);
    {
      const [events, error] = await retry(async () => {
        return await replica.queryFilter(
          replica.filters.Update(),
          from,
          to
        );
      }, RETRIES, (e) => {this.orchestrator.logger.warn(`Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${e.message}`)})
      if (error) {
        this.orchestrator.logger.error(`Couldn't recover the error after ${RETRIES} retries`)
        throw error
      }
      if (events === undefined) {
        throw new Error(`There is no error, but events for some reason are still undefined`);
      }
      // const events = await getEvents(
      //   this.sdk, 
      //   domain, 
      //   replica, 
      //   replica.filters.Update(), 
      //   from, 
      //   to
      // );

      const parsedEvents = await Promise.all(
        events.map(
          async (event) => 
            {
              let {timestamp, gasUsed} = await this.getAdditionalInfo(event.transactionHash);
              return new NomadEvent(
              this.domain,
              EventType.ReplicaUpdate,
              ContractType.Replica,
              domain,
              timestamp,
              {
                homeDomain: event.args[0],
                oldRoot: event.args[1],
                newRoot: event.args[2],
                signature: event.args[3],
              },
              event.blockNumber,
              EventSource.Fetch,
              gasUsed,
              event.transactionHash
            )})
        )
      ;
      fetchedEvents.push(...parsedEvents);
    }

    {
      // const events = await getEvents(
      //   this.sdk, 
      //   domain, 
      //   replica, 
      //   replica.filters.Process(), 
      //   from, 
      //   to
      // )
      const [events, error] = await retry(async () => {
        return await replica.queryFilter(
          replica.filters.Process(),
          from,
          to
        );
      }, RETRIES, (e) => {this.orchestrator.logger.warn(`Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${e.message}`)})
      if (error) {
        this.orchestrator.logger.error(`Couldn't recover the error after ${RETRIES} retries`)
        throw error
      }
      if (events === undefined) {
        throw new Error(`There is no error, but events for some reason are still undefined`);
      }

      const parsedEvents = await Promise.all(
        events.map(
          async (event) => 
            {
              let {timestamp, gasUsed} = await this.getAdditionalInfo(event.transactionHash);
              return new NomadEvent(
              this.domain,
              EventType.ReplicaProcess,
              ContractType.Replica,
              domain,
              timestamp,
              {
                messageHash: event.args[0],
                success: event.args[1],
                returnData: event.args[2],
              },
              event.blockNumber,
              EventSource.Fetch,
              gasUsed,
              event.transactionHash
            )})
        )
      ;
      fetchedEvents.push(...parsedEvents);
    }
    return fetchedEvents;
  }
}

export abstract class Persistance {
  initiated: boolean;
  from: number;
  height: number;
  constructor() {
    this.initiated = false;
    this.from = -1;
    this.height = -1;
  }

  abstract store(...events: NomadEvent[]): void;
  abstract init(): Promise<void>;
  abstract sortSorage(): void;
  abstract allEvents(): NomadEvent[];
  abstract persist(): void;
}

export class RamPersistance extends Persistance {
  block2events: Map<number, NomadEvent[]>;
  blocks: number[];
  storePath: string;

  constructor(storePath: string) {
    super();
    this.block2events = new Map();
    this.blocks = [];
    this.storePath = storePath;
  }

  updateFromTo(block: number) {
    if (block < this.from || this.from === -1) this.from = block;
    if (block > this.height || this.height === -1) this.height = block;
  }

  store(...events: NomadEvent[]): void {
    for (const event of events) {
      const block = this.block2events.get(event.block);
      if (block) {
        if (block.some(e => e.uniqueHash() === event.uniqueHash())) {
          continue;
        }
        block.push(event);
      } else {
        this.block2events.set(event.block, [event]);
      }
      this.updateFromTo(event.block);
      if (this.blocks.indexOf(event.block) < 0) {
        this.blocks.push(event.block);
        this.blocks = this.blocks.sort();
      }
    };
    this.persist();
  }
  async init(): Promise<void> {
    try {
      await this.load();
    } catch (_) {}
    return;
  }
  sortSorage() {
    this.blocks = this.blocks.sort();
  }

  iter(): EventsRange {
    return new EventsRange(this);
  }

  persistToFile() {
    fs.writeFileSync(
      this.storePath,
      JSON.stringify(
        {
          block2events: this.block2events,
          blocks: this.blocks,
          initiated: this.initiated,
          from: this.from,
          height: this.height,
          storePath: this.storePath,
        },
        replacer
      )
    );
  }

  persistToDB() {}

  persist() {
    this.persistToFile();
    this.persistToDB();
  }

  async load() {
    this.loadFromFile();
  }

  loadFromFile() {
    const object = JSON.parse(
      fs.readFileSync(this.storePath, "utf8"),
      reviver
    ) as {
      block2events: Map<number, NomadEvent[]>;
      blocks: number[];
      initiated: boolean;
      from: number;
      height: number;
    };
    this.block2events = object.block2events;
    this.blocks = object.blocks;
    this.initiated = object.initiated;
    this.from = object.from;
    this.height = object.height;
  }

  allEvents(): NomadEvent[] {
    return Array.from(this.iter());
  }
}

export class EventsRange implements Iterable<NomadEvent> {
  private _p: RamPersistance;
  private _cacheBlockIndex: number;
  private _position: number;
  private nextDone: boolean;

  constructor(p: RamPersistance) {
    this._p = p;
    this._cacheBlockIndex = 0;
    this._position = 0;
    this.nextDone = false;
  }
  cachedBlockIndex(index: number): number | undefined {
    return this._p.blocks.at(index);
  }

  next(value?: any): IteratorResult<NomadEvent> {
    if (this.nextDone) return { done: true, value: undefined };
    let done = false;
    const blockNumber = this.cachedBlockIndex(this._cacheBlockIndex);
    if (!blockNumber) {
      return { done: true, value: undefined };
    }
    const block = this._p.block2events.get(blockNumber);
    if (!block) {
      return { done: true, value: undefined };
    }
    let _value = block.at(this._position)!;

    // calculating next positions
    if (this._position + 1 < block.length) {
      this._position += 1;
    } else {
      const nextIndex = this._cacheBlockIndex + 1;
      const nextBlockNumber = this.cachedBlockIndex(nextIndex);
      if (!nextBlockNumber) {
        this.nextDone = true;
      } else {
        if (this._p.block2events.get(nextBlockNumber)) {
          this._cacheBlockIndex = nextIndex;
          this._position = 0;
        } else {
          this.nextDone = true;
        }
      }
    }

    return {
      done,
      value: _value,
    };
  }

  [Symbol.iterator]() {
    return this;
  }
}
