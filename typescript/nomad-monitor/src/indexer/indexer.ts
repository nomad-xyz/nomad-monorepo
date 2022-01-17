import { Orchestrator } from "./orchestrator";
import { NomadContext } from '@nomad-xyz/sdk';
import fs from 'fs';
import { ContractType, EventType, NomadEvent, EventSource } from "./event";
import { Home, Replica } from "@nomad-xyz/contract-interfaces/core";
import { ethers } from "ethers";
import { replacer, retry, reviver, sleep } from "./utils";


function xxx(s: string) {
    fs.appendFileSync('/tmp/kek.txt', s+'\n');
}

class KVCache<K, V> {
    m: Map<K, V>;
    path: string;

    constructor(path: string) {
        this.m = new Map();
        this.path = path;
        this.tryLoad();
    }

    save() {
        fs.writeFileSync(this.path, JSON.stringify(this.m, replacer));
    }

    tryLoad() {
        try {
            this.m = JSON.parse(fs.readFileSync(this.path, 'utf8'), reviver);
        } catch(_) {

        }
    }

    set(k: K, v: V) {
        this.m.set(k, v);
        this.save()
    }

    get(k: K): V | undefined {
        return this.m.get(k);
    }
}

export class Indexer {
    domain: number;
    sdk: NomadContext;
    orchestrator: Orchestrator;
    persistance: Persistance;
    block2timeCache: KVCache<number, number>;
    provider: ethers.providers.Provider;
    upToDate: boolean;
    eventCallback: undefined | ((event: NomadEvent) => void);

    constructor(domain: number, sdk: NomadContext, orchestrator: Orchestrator) {
        this.domain = domain;
        this.sdk = sdk;
        this.orchestrator = orchestrator;
        const loadPersistance = fs.existsSync(`/tmp/persistance_${this.domain}.json`); // true;
        this.persistance = loadPersistance ? this.loadPersistance() : new RamPersistance(`/tmp/persistance_${this.domain}.json`);
        // console.log(`Persistance:`, this.persistance);
        const it = (this.persistance as RamPersistance).iter();
        let i = 0;
        for (const _ of it) {
            // console.log(`---> ${event.ts} - ${event.block} - ${event.domain} - ${event.eventType} - ${event.replicaOrigin}`, new Date(event.ts*1000));
            i += 1;
        }
        console.log(`events found:`, i)
        this.block2timeCache = new KVCache(`/tmp/blocktime_cache_${this.domain}`);
        this.provider = this.sdk.getProvider(domain)!;
        this.upToDate = false;
    }

    async getTimeForBlock(blockNumber: number) {
        const possibleTime = this.block2timeCache.get(blockNumber);
        if (possibleTime) return possibleTime;
        const [block, error] = await retry(async () => await this.provider.getBlock(blockNumber), 5);
        if (!block) {
            throw error || new Error(`Some error happened at retrying getting the block ${blockNumber} for ${this.domain}`);
        }
        // const block = await this.provider.getBlock(blockNumber)
        const time = (block).timestamp * 1000;
        this.block2timeCache.set(blockNumber, time);
        return time;
    }

    stop() {
        // TODO: this should close all listeners
    }

    async init() {
        await this.persistance.init();
    }

    get height(): number {
        return this.persistance.height;
    }

    get from(): number {
        return this.persistance.from
        // return this.persistance.from === -1 ? this.sdk.getDomain(this.domain)?.paginate?.from || this.persistance.from + 1 : this.persistance.from; //.getFrom(this.domain);
    }

    processEvent(event: NomadEvent) {
        if (this.eventCallback != undefined) this.eventCallback(event);
        this.persistance.store(event)
    }

    subscribeHome() {
        const home = this.home();
        home.on(home.filters.Dispatch(), async (
            messageHash,
            leafIndex,
            destinationAndNonce,
            committedRoot,
            message,
            ev) => {
            
            const eventPrepared = new NomadEvent(
                this.domain,
                EventType.HomeDispatch,
                ContractType.Home,
                0, new Date().valueOf(), {
                    messageHash,
                    leafIndex,
                    destinationAndNonce,
                    committedRoot,
                    message,
                }, ev.blockNumber, EventSource.New
            )
            
            this.processEvent(eventPrepared)
        });

        home.on(home.filters.Update(), async (
            homeDomain,
            oldRoot,
            newRoot,
            signature,
            ev) => {
            
            const eventPrepared = new NomadEvent(
                this.domain,
                EventType.HomeUpdate,
                ContractType.Home,
                0, new Date().valueOf(), {
                    homeDomain,
                    oldRoot,
                    newRoot,
                    signature,
                }, ev.blockNumber, EventSource.New
            )
            this.processEvent(eventPrepared)
        })
    }

    subscribeReplica(domain: number) {
        const replica = this.replicaForDomain(domain);
        replica.on(replica.filters.Update(), async (
            homeDomain,
            oldRoot,
            newRoot,
            signature,
            ev) => {
            
            const eventPrepared = new NomadEvent(
                this.domain,
                EventType.ReplicaUpdate,
                ContractType.Replica,
                domain, new Date().valueOf(), {
                    homeDomain,
                    oldRoot,
                    newRoot,
                    signature,
                }, ev.blockNumber, EventSource.New
            )
            this.processEvent(eventPrepared)
        });

        replica.on(replica.filters.Process(), async (
                messageHash, success, returnData,ev
            ) => {
            
            const eventPrepared = new NomadEvent(
                this.domain,
                EventType.ReplicaProcess,
                ContractType.Replica,
                domain, new Date().valueOf(), {
                    messageHash, success, returnData,
                }, ev.blockNumber, EventSource.New
            )
            this.processEvent(eventPrepared)
        })
    }

    async startAll(replicas: number[]) { // , past: number
        let from = Math.max(this.persistance.height + 1, this.sdk.getDomain(this.domain)?.paginate?.from || 0);
        const to = await this.provider.getBlockNumber();
        // from = to - past;
        console.log(`Want to fetch from`, from, `to`, to, `for`, this.domain);
        // console.log(this.domain, `starting from height`, from, `but actually from to`, to, `- 1000`, to - 1000);
        this.subscribeAll(replicas);
        await this.fetchAll(from, to, replicas);

    }

    subscribeAll(replicas: number[]) {
        this.subscribeHome();
        replicas.forEach(r => this.subscribeReplica(r))
    }

    home(): Home {
        return this.sdk.getCore(this.domain)!.home; //getHomeAtDomain(this.domain);
    }

    replicaForDomain(domain: number): Replica {
        return this.sdk.getReplicaFor(domain, this.domain)!;
    }

    async fetchAll(from: number, to: number, replicas: number[]) {

        if (this.domain === 1337) { // 1650811245
            xxx(`from sdk: ${this.sdk.getDomain(1650811245)?.paginate?.from}, ${this.from}, pf:${this.persistance.from}, plast: ${Array.from((this.persistance as RamPersistance).iter()).reduce((acc, v) => Math.max(acc, v.block), 0)} current: ${await this.provider.getBlockNumber()}`)
            console.log(`Fetching batched for`, this.domain);
            const batchSize = 1500;

            let batchedFrom = from;
            let batchedTo = batchedFrom + batchSize;

            while (batchedTo <= to) {
                if (batchedTo > to) {
                    batchedTo = to
                }
                console.log(`Fetching batch`, batchedFrom, `-`, batchedTo);
                xxx(`Fetching batch ${batchedFrom} - ${batchedTo}`);
                const [_, error] = await retry(async () => {
                    await this.fetchHome(batchedFrom, batchedTo);
                    await Promise.all(replicas.map(r => this.fetchReplica(r, batchedFrom, batchedTo)));
                }, 5);

                if (error) throw error;
                
                batchedFrom += batchSize;
                batchedTo += batchSize;
                await sleep(6000);
            }
        } else {
            console.log(`Fetching norma for`, this.domain);
            // await this.fetchHome(from, to);
            // await Promise.all(replicas.map(r => this.fetchReplica(r, from, to)));
            const [_, error] = await retry(async () => {
                await this.fetchHome(from, to);
                await Promise.all(replicas.map(r => this.fetchReplica(r, from, to)));
            }, 5);

            if (error) throw error;
        }

        
        
        this.persistance.sortSorage();
        this.savePersistance();

        // TODO: either drop or make better
        const p = this.persistance as RamPersistance;
        const h = new Map<string, string>();
        const r = new Map<string, string>();

        let h1 = '';
        let ht = Number.MAX_VALUE;
        let r1 = '';
        let rt = Number.MAX_VALUE;
        let rtotal = 0;
        let htotal = 0;

        for (const event of p.iter()) {
            if (event.eventType == EventType.HomeUpdate) {
                const e = event.eventData as {oldRoot: string, newRoot: string};
                h.set(e.oldRoot, e.newRoot);
                htotal += 1;
                if (event.ts < ht) {
                    ht = event.ts;
                    h1 = e.oldRoot;
                }
            } else if (event.eventType == EventType.ReplicaUpdate) {
                const e = event.eventData as {oldRoot: string, newRoot: string};
                r.set(e.oldRoot, e.newRoot);
                rtotal += 1;
                if (event.ts < rt) {
                    rt = event.ts;
                    r1 = e.oldRoot;
                }
            }
        }

        console.log(this.domain, `Home started with`, htotal, 'unresolved')
        while (true) {
            let newRoot = h.get(h1);
            if (newRoot) {
                h1 = newRoot;
                htotal -= 1;
            } else {
                console.log(this.domain, `Home broke with`, htotal, 'unresolved')
                break
            }
        }
        while (true) {
            let newRoot = r.get(r1);
            if (newRoot) {
                r1 = newRoot;
                rtotal -= 1;
            } else {
                console.log(`Replica broke with`, rtotal, 'unresolved')
                break
            }
        }
        // TODO END

        this.upToDate = true;
        console.log(this.domain, `Fetched all`);
    }

    savePersistance() {
        (this.persistance as RamPersistance).saveToFile();
    }

    loadPersistance(): Persistance {
        const p = RamPersistance.loadFromFile(`/tmp/persistance_${this.domain}.json`);
        p.sortSorage();
        return p;
    }

    async fetchHome(from: number, to: number) {
        const home = this.home();
        {
            const events = await home.queryFilter(home.filters.Dispatch(), from, to);
            const parsedEvents = await Promise.all(events.map(async (event) => 
                new NomadEvent(
                    this.domain,
                    EventType.HomeDispatch,
                    ContractType.Home,
                    0, await this.getTimeForBlock(event.blockNumber), {
                        messageHash: event.args[0],
                        leafIndex: event.args[1],
                        destinationAndNonce: event.args[2],
                        committedRoot: event.args[3],
                        message: event.args[4],
                    }, event.blockNumber, EventSource.Past
                )
            ))
            this.persistance.store(...parsedEvents)
        }

        {
            const events = await home.queryFilter(home.filters.Update(), from, to);
            const parsedEvents = await Promise.all(events.map(async (event) => 
                new NomadEvent(
                    this.domain,
                    EventType.HomeUpdate,
                    ContractType.Home,
                    0, await this.getTimeForBlock(event.blockNumber), {
                        homeDomain: event.args[0],
                        oldRoot: event.args[1],
                        newRoot: event.args[2],
                        signature: event.args[3],
                    }, event.blockNumber, EventSource.Past
                )
            ));
            this.persistance.store(...parsedEvents)
        }
    }

    // throwPastEvents() {
    //     for (const event of (this.persistance as RamPersistance).iter()) {
    //         this.orchestrator.emit('new_event', event);
    //     }
    // }

    startThrowingEvents() {
        this.eventCallback = (event: NomadEvent) => {this.orchestrator.emit('new_event', event)};
        // if (past) this.throwPastEvents();

    }

    async fetchReplica(domain: number, from: number, to: number) {
        const replica = this.replicaForDomain(domain);
        {
            const events = await replica.queryFilter(replica.filters.Update(), from, to);
            const parsedEvents = await Promise.all(events.map(async (event) => 
                new NomadEvent(
                    this.domain,
                    EventType.ReplicaUpdate,
                    ContractType.Replica,
                    domain, await this.getTimeForBlock(event.blockNumber), {
                        homeDomain: event.args[0],
                        oldRoot: event.args[1],
                        newRoot: event.args[2],
                        signature: event.args[3],
                    }, event.blockNumber, EventSource.Past
                )
            ));
            this.persistance.store(...parsedEvents)
        }

        {
            const events = await replica.queryFilter(replica.filters.Process(), from, to);
            const parsedEvents = await Promise.all(events.map(async (event) => 
                new NomadEvent(
                    this.domain,
                    EventType.ReplicaProcess,
                    ContractType.Replica,
                    domain, await this.getTimeForBlock(event.blockNumber), {
                        messageHash: event.args[0],
                        success: event.args[1],
                        returnData: event.args[2],
                    }, event.blockNumber, EventSource.Past
                )
            ));
            this.persistance.store(...parsedEvents)
        }
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
}

export class FilePersistance extends Persistance {
    path: string;
    constructor( path: string) {
        super();
        this.path = path;
    }

    store(...events: NomadEvent[]): void {}
    async init(): Promise<boolean> {
        if (fs.existsSync(this.path)) {
            // load from the storage
            this.from = 13;
            this.height = 14;
            return true;
        } else {
            return false;
        }
    }
    sortSorage(){}
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
        events.forEach(event => {
            this.updateFromTo(event.block);
            const block = this.block2events.get(event.block);
            if (block) {
                block.push(event)
            } else {
                this.block2events.set(event.block, [event]);
            }
            // if (this.height < event.block) {
            //     this.height = event.block;
            //     this.blocks.push(event.block);
            //     this.blocks = this.blocks.sort();
            // }
            if (this.blocks.indexOf(event.block) < 0) {
                this.blocks.push(event.block);
                this.blocks = this.blocks.sort();
            }
        });
        this.saveToFile();
    }
    async init(): Promise<boolean> {
        return true;
    }
    sortSorage(){
        this.blocks = this.blocks.sort();
    }

    iter(): EventsRange {
        return new EventsRange(this);
    }

    saveToFile() {
        fs.writeFileSync(this.storePath, JSON.stringify({
            block2events: this.block2events,
            blocks: this.blocks,
            initiated: this.initiated,
            from: this.from,
            height: this.height,
            storePath: this.storePath,
        }, replacer))
    }

    static loadFromFile(storePath: string): RamPersistance {
        const object = JSON.parse(fs.readFileSync(storePath, 'utf8'), reviver) as {block2events: Map<number, NomadEvent[]>, blocks: number[], initiated: boolean,
            from: number,
            height: number};
        const p = new RamPersistance(storePath);
        p.block2events = object.block2events;
        p.blocks = object.blocks;
        p.initiated = object.initiated;
        p.from = object.from;
        p.height = object.height;
        return p;
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
        return this._p.blocks.at(index)
    }

    next(value?: any): IteratorResult<NomadEvent> {
        if (this.nextDone) return {done: true, value: undefined};
        let done = false;
        const blockNumber = this.cachedBlockIndex(this._cacheBlockIndex);
        if (!blockNumber) {
            return {done: true, value: undefined};
        }
        const block = this._p.block2events.get(blockNumber);
        if (!block) {
            return {done: true, value: undefined};
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
            value: _value
        };
    }

    [Symbol.iterator]() {
        return this;
    }
}
