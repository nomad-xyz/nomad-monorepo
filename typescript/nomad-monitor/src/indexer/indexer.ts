import { Orchestrator } from './orchestrator';
import { NomadContext } from '@nomad-xyz/sdk';
import fs from 'fs';
import { ContractType, EventType, NomadEvent, EventSource } from './event';
import { Home, Replica } from '@nomad-xyz/contract-interfaces/core';
import { ethers } from 'ethers';
import { KVCache, replacer, retry, reviver } from './utils';

export class Indexer {
  domain: number;
  sdk: NomadContext;
  orchestrator: Orchestrator;
  persistance: Persistance;
  block2timeCache: KVCache<number, number>;
  eventCallback: undefined | ((event: NomadEvent) => void);

  constructor(domain: number, sdk: NomadContext, orchestrator: Orchestrator) {
    this.domain = domain;
    this.sdk = sdk;
    this.orchestrator = orchestrator;
    this.persistance = new RamPersistance(
      `/tmp/persistance_${this.domain}.json`,
    );
    this.block2timeCache = new KVCache(
      `/tmp/persistance_blocktime_cache_${this.domain}`,
    );
  }

  get provider(): ethers.providers.Provider {
    return this.sdk.getProvider(this.domain)!;
  }

  async getBlockTimestamp(blockNumber: number): Promise<number> {
    const possibleTime = this.block2timeCache.get(blockNumber);
    if (possibleTime) return possibleTime;
    const [block, error] = await retry(
      async () => await this.provider.getBlock(blockNumber),
      5,
    );
    if (!block) {
      throw (
        error ||
        new Error(
          `Some error happened at retrying getting the block ${blockNumber} for ${this.domain}`,
        )
      );
    }
    const time = block.timestamp * 1000;
    this.block2timeCache.set(blockNumber, time);
    return time;
  }

  async init() {
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

  replicaForDomain(domain: number): Replica {
    return this.sdk.getReplicaFor(domain, this.domain)!;
  }

  async updateAll(replicas: number[]) {
    let from = Math.max(
      this.persistance.height + 1,
      this.sdk.getDomain(this.domain)?.paginate?.from || 0,
    );
    const to = await this.provider.getBlockNumber();

    this.orchestrator.logger.info(
      `Fetching events for domain ${this.domain} from: ${from}, to: ${to}`,
    );
    const [fetchedEvents, error] = await retry(async () => {
      const homeEvents = await this.fetchHome(from, to);
      const replicasEvents = (
        await Promise.all(replicas.map((r) => this.fetchReplica(r, from, to)))
      ).flat();
      return [...homeEvents, ...replicasEvents];
    }, 5);

    if (error) throw error;
    if (!fetchedEvents) throw new Error('kek');

    fetchedEvents.sort((a, b) => a.ts - b.ts);
    this.persistance.store(...fetchedEvents);

    this.dummyTestEventsIntegrity();
    this.orchestrator.logger.info(`Fetched all for domain ${this.domain}`);

    return fetchedEvents;
  }

  dummyTestEventsIntegrity() {
    // TODO: either drop or make better
    const h = new Map<string, string>();
    const r = new Map<string, string>();

    let h1 = '';
    let ht = Number.MAX_VALUE;
    let r1 = '';
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
              await this.getBlockTimestamp(event.blockNumber),
              {
                messageHash: event.args[0],
                leafIndex: event.args[1],
                destinationAndNonce: event.args[2],
                committedRoot: event.args[3],
                message: event.args[4],
              },
              event.blockNumber,
              EventSource.Fetch,
            ),
        ),
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
              await this.getBlockTimestamp(event.blockNumber),
              {
                homeDomain: event.args[0],
                oldRoot: event.args[1],
                newRoot: event.args[2],
                signature: event.args[3],
              },
              event.blockNumber,
              EventSource.Fetch,
            ),
        ),
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
        to,
      );
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.ReplicaUpdate,
              ContractType.Replica,
              domain,
              await this.getBlockTimestamp(event.blockNumber),
              {
                homeDomain: event.args[0],
                oldRoot: event.args[1],
                newRoot: event.args[2],
                signature: event.args[3],
              },
              event.blockNumber,
              EventSource.Fetch,
            ),
        ),
      );
      fetchedEvents.push(...parsedEvents);
    }

    {
      const events = await replica.queryFilter(
        replica.filters.Process(),
        from,
        to,
      );
      const parsedEvents = await Promise.all(
        events.map(
          async (event) =>
            new NomadEvent(
              this.domain,
              EventType.ReplicaProcess,
              ContractType.Replica,
              domain,
              await this.getBlockTimestamp(event.blockNumber),
              {
                messageHash: event.args[0],
                success: event.args[1],
                returnData: event.args[2],
              },
              event.blockNumber,
              EventSource.Fetch,
            ),
        ),
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
  abstract init(): Promise<boolean>;
  abstract sortSorage(): void;
  abstract allEvents(): NomadEvent[];
  abstract persist(): void;
}

export class FilePersistance extends Persistance {
  path: string;
  constructor(path: string) {
    super();
    this.path = path;
  }

  store(...events: NomadEvent[]): void {}
  async init(): Promise<boolean> {
    if (fs.existsSync(this.path)) {
      this.from = 13;
      this.height = 14;
      return true;
    } else {
      return false;
    }
  }
  sortSorage() {}
  allEvents(): NomadEvent[] {
    return [];
  }
  persist(): void {}
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
    try {
      this.load();
    } catch (_) {}
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
  async init(): Promise<boolean> {
    return true;
  }
  sortSorage() {
    this.blocks = this.blocks.sort();
  }

  iter(): EventsRange {
    return new EventsRange(this);
  }

  persist() {
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
        replacer,
      ),
    );
  }

  load() {
    const object = JSON.parse(
      fs.readFileSync(this.storePath, 'utf8'),
      reviver,
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
