import { Orchestrator } from "./orchestrator";
import { NomadContext } from "@nomad-xyz/sdk/dist";
import fs from "fs";
import { ContractType, EventType, NomadEvent, EventSource } from "./event";
import { Home, Replica } from "@nomad-xyz/contract-interfaces/core";
import { ethers } from "ethers";
import { KVCache, replacer, retry, reviver } from "./utils";
import { BridgeRouter } from "@nomad-xyz/contract-interfaces/bridge";

export class Indexer {
  domain: number;
  sdk: NomadContext;
  orchestrator: Orchestrator;
  persistance: Persistance;
  blockCache: KVCache;
  eventCallback: undefined | ((event: NomadEvent) => void);

  constructor(domain: number, sdk: NomadContext, orchestrator: Orchestrator) {
    this.domain = domain;
    this.sdk = sdk;
    this.orchestrator = orchestrator;
    this.persistance = new RamPersistance(
      `/tmp/persistance_${this.domain}.json`
    );
    this.blockCache = new KVCache(String(this.domain), this.orchestrator.db);
  }

  get provider(): ethers.providers.Provider {
    return this.sdk.getProvider(this.domain)!;
  }

  async getBlockInfo(
    blockNumber: number
  ): Promise<[number, Map<string, string>]> {
    const possibleBlock = this.blockCache.get(String(blockNumber));
    if (possibleBlock) {
      const [ts, txs] = possibleBlock.split(".");
      const x: string[] = txs.split(",");
      const senders2hashes: Map<string, string> = new Map(
        x.map((tx) => tx.split(":") as [string, string])
      );
      return [parseInt(ts), senders2hashes];
    }

    const [block, error] = await retry(
      async () => await this.provider.getBlockWithTransactions(blockNumber),
      6
    );
    if (!block) {
      throw (
        new Error(
          `Some error happened at retrying getting the block ${blockNumber} for ${this.domain}, error: ${error}`
        )
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
      this.persistance.height + 1,
      this.sdk.getDomain(this.domain)?.paginate?.from || 0
    );
    const to = await this.provider.getBlockNumber();

    this.orchestrator.logger.info(
      `Fetching events for domain ${this.domain} from: ${from}, to: ${to}`
    );

    const fetchEvents = async (from: number, to: number) => {
      const [fetchedEvents, error] = await retry(async () => {
        const homeEvents = await this.fetchHome(from, to);
        const replicasEvents = (
          await Promise.all(replicas.map((r) => this.fetchReplica(r, from, to)))
        ).flat();
        const bridgeRouterEvents = await this.fetchBridgeRouter(from, to);

        return [...homeEvents, ...replicasEvents, ...bridgeRouterEvents];
      }, 7);

      if (error) throw new Error(
        `Some error happened at retrying getting logs between blocks ${from} and ${to} for ${this.domain} domain, error: ${error}`
      );
      return fetchedEvents;
    };

    const allEvents = [];

    const batchSize = 20000;
    let batchFrom = from;
    let batchTo = from + batchSize;

    while (true) {
      const events = await fetchEvents(batchFrom, batchTo);
      if (!events) throw new Error(`KEk`);
      allEvents.push(...events);
      if (batchTo >= to) break;
      batchFrom = batchTo + 1;
      batchTo = Math.min(to, batchFrom + batchSize);
    }

    if (!allEvents) throw new Error("kek");

    allEvents.sort((a, b) => a.ts - b.ts);
    this.persistance.store(...allEvents);

    this.dummyTestEventsIntegrity();
    this.orchestrator.logger.info(`Fetched all for domain ${this.domain}`);

    return allEvents;
  }

  dummyTestEventsIntegrity() {
    // TODO: either drop or make better
    const h = new Map<string, string>();
    const r = new Map<string, string>();

    let h1 = "";
    let ht = Number.MAX_VALUE;
    let r1 = "";
    let rt = Number.MAX_VALUE;
    let rtotal = 0;
    let htotal = 0;

    let allEvents = this.persistance.allEvents();
    if (allEvents.length === 0) {
      this.orchestrator.logger.warn(`No events to test integrity!!!`);
      return;
    }

    for (const event of allEvents) {
      if (event.eventType == EventType.HomeUpdate) {
        const e = event.eventData as { oldRoot: string; newRoot: string };
        h.set(e.oldRoot, e.newRoot);
        htotal += 1;
        if (event.ts < ht) {
          ht = event.ts;
          h1 = e.oldRoot;
        }
      } else if (event.eventType == EventType.ReplicaUpdate) {
        const e = event.eventData as { oldRoot: string; newRoot: string };
        r.set(e.oldRoot, e.newRoot);
        rtotal += 1;
        if (event.ts < rt) {
          rt = event.ts;
          r1 = e.oldRoot;
        }
      }
    }

    if (htotal <= 0) throw new Error(`THis is not supposed to be 0`);
    if (rtotal <= 0) throw new Error(`THis is not supposed to be 0`);

    while (true) {
      let newRoot = h.get(h1);
      if (newRoot) {
        h1 = newRoot;
        htotal -= 1;
      } else {
        break;
      }
    }
    while (true) {
      let newRoot = r.get(r1);
      if (newRoot) {
        r1 = newRoot;
        rtotal -= 1;
      } else {
        break;
      }
    }

    if (htotal !== 0) throw new Error(`THis supposed to be 0`);
    if (rtotal !== 0) throw new Error(`THis supposed to be 0`);
  }

  savePersistance() {
    this.persistance.persist();
  }

  async fetchBridgeRouter(from: number, to: number) {
    const br = this.bridgeRouter();
    const allEvents = [];
    {
      const events = await br.queryFilter(br.filters.Send(), from, to);
      const parsedEvents = await Promise.all(
        events.map(async (event) => {
          const [ts, senders2hashes] = await this.getBlockInfo(
            event.blockNumber
          );
          return new NomadEvent(
            this.domain,
            EventType.BridgeRouterSend,
            ContractType.BridgeRouter,
            0,
            ts,
            {
              token: event.args[0],
              from: event.args[1],
              toDomain: event.args[2],
              toId: event.args[3],
              amount: event.args[4],
              fastLiquidityEnabled: event.args[5],
              evmHash: senders2hashes.get(event.args[1])!,
            },
            event.blockNumber,
            EventSource.Fetch
          );
        })
      );
      allEvents.push(...parsedEvents);
    }

    {
      const events = await br.queryFilter(br.filters.Receive(), from, to);
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.BridgeRouterReceive,
              ContractType.BridgeRouter,
              0,
              (
                await this.getBlockInfo(event.blockNumber)
              )[0],
              {
                originAndNonce: event.args[0],
                token: event.args[1],
                recipient: event.args[2],
                liquidityProvider: event.args[3],
                amount: event.args[4],
              },
              event.blockNumber,
              EventSource.Fetch
            )
        )
      );
      allEvents.push(...parsedEvents);
    }

    return allEvents;
  }

  async fetchHome(from: number, to: number) {
    let fetchedEvents: NomadEvent[] = [];

    const home = this.home();
    {
      const events = await home.queryFilter(home.filters.Dispatch(), from, to);
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.HomeDispatch,
              ContractType.Home,
              0,
              (
                await this.getBlockInfo(event.blockNumber)
              )[0],
              {
                messageHash: event.args[0],
                leafIndex: event.args[1],
                destinationAndNonce: event.args[2],
                committedRoot: event.args[3],
                message: event.args[4],
              },
              event.blockNumber,
              EventSource.Fetch
            )
        )
      );
      fetchedEvents.push(...parsedEvents);
    }

    {
      const events = await home.queryFilter(home.filters.Update(), from, to);
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.HomeUpdate,
              ContractType.Home,
              0,
              (
                await this.getBlockInfo(event.blockNumber)
              )[0],
              {
                homeDomain: event.args[0],
                oldRoot: event.args[1],
                newRoot: event.args[2],
                signature: event.args[3],
              },
              event.blockNumber,
              EventSource.Fetch
            )
        )
      );
      fetchedEvents.push(...parsedEvents);
    }

    return fetchedEvents;
  }

  async fetchReplica(domain: number, from: number, to: number) {
    let fetchedEvents: NomadEvent[] = [];

    const replica = this.replicaForDomain(domain);
    {
      const events = await replica.queryFilter(
        replica.filters.Update(),
        from,
        to
      );
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.ReplicaUpdate,
              ContractType.Replica,
              domain,
              (
                await this.getBlockInfo(event.blockNumber)
              )[0],
              {
                homeDomain: event.args[0],
                oldRoot: event.args[1],
                newRoot: event.args[2],
                signature: event.args[3],
              },
              event.blockNumber,
              EventSource.Fetch
            )
        )
      );
      fetchedEvents.push(...parsedEvents);
    }

    {
      const events = await replica.queryFilter(
        replica.filters.Process(),
        from,
        to
      );
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.ReplicaProcess,
              ContractType.Replica,
              domain,
              (
                await this.getBlockInfo(event.blockNumber)
              )[0],
              {
                messageHash: event.args[0],
                success: event.args[1],
                returnData: event.args[2],
              },
              event.blockNumber,
              EventSource.Fetch
            )
        )
      );
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
    events.forEach((event) => {
      this.updateFromTo(event.block);
      const block = this.block2events.get(event.block);
      if (block) {
        block.push(event);
      } else {
        this.block2events.set(event.block, [event]);
      }
      if (this.blocks.indexOf(event.block) < 0) {
        this.blocks.push(event.block);
        this.blocks = this.blocks.sort();
      }
    });
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
