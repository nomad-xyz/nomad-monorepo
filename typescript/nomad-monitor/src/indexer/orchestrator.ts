import { NomadContext } from '@nomad-xyz/sdk';
import { Consumer } from './consumer';
import { Indexer } from './indexer';
import { EventEmitter } from 'events';
import { sleep } from './utils';

export class Orchestrator extends EventEmitter {
  sdk: NomadContext;
  consumer: Consumer;
  indexers: Map<number, Indexer>;
  gov: number;
  done: boolean;
  freshStart: boolean;

  constructor(sdk: NomadContext, c: Consumer, gov: number) {
    super();
    this.sdk = sdk;
    this.consumer = c;
    this.indexers = new Map();
    this.gov = gov;
    this.done = false;
    this.freshStart = true;

    this.initIndexers()

    this.initalFeedConsumer()
  }

  async indexAll() {
    const events = (await Promise.all(
      this.sdk.domainNumbers.map((domain: number) => this.index(domain)),
    )).flat();
    events.sort((a, b) => a.ts-b.ts);
    this.consumer.consume(...events);
  }

  async index(domain: number) {
    let indexer = this.indexers.get(domain)!;

    let replicas = []
    if (domain === this.gov) {
      replicas = this.sdk.domainNumbers.filter((d) => d != this.gov)
    } else {
      replicas = [this.gov];
    }

    return await indexer.updateAll(replicas);
  }

  initalFeedConsumer() {
    const events = Array.from(this.indexers.values()).map(indexer => indexer.persistance.allEvents()).flat();
    events.sort((a, b) => a.ts-b.ts);
    this.consumer.consume(...events);
  }

  initIndexers() {
    for (const domain of this.sdk.domainNumbers) {
      const indexer = new Indexer(domain, this.sdk, this);
      this.indexers.set(domain, indexer);
    }
  }

  async startConsuming() {
    while (!this.done) {
      console.log(`Started to reindex`)
      const start = new Date().valueOf();
      await this.indexAll()
      console.log(`Finished reindexing after seconds:`, (new Date().valueOf() - start) / 1000);

      this.consumer.stats();
      
      await sleep(30000);
    }
  }

  stop() {
    this.done = true;
  }
}
