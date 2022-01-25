import { NomadContext } from "@nomad-xyz/sdk/dist";
import Logger from "bunyan";
import { Consumer } from "./consumer";
import { DB } from "./db";
import { Indexer } from "./indexer";
import { IndexerCollector } from "./metrics";
import { Statistics } from "./types";
import { replacer, sleep } from "./utils";

export class Orchestrator {
  sdk: NomadContext;
  consumer: Consumer;
  indexers: Map<number, Indexer>;
  gov: number;
  done: boolean;
  freshStart: boolean;
  metrics: IndexerCollector;
  logger: Logger;
  db: DB;

  constructor(
    sdk: NomadContext,
    c: Consumer,
    gov: number,
    metrics: IndexerCollector,
    logger: Logger,
    db: DB
  ) {
    this.sdk = sdk;
    this.consumer = c;
    this.indexers = new Map();
    this.gov = gov;
    this.done = false;
    this.freshStart = true;
    this.metrics = metrics;
    this.logger = logger;
    this.db = db;
  }

  async init() {
    await this.initIndexers();
    await this.initalFeedConsumer();
  }

  async indexAll() {
    const events = (
      await Promise.all(
        this.sdk.domainNumbers.map((domain: number) => this.index(domain))
      )
    ).flat();
    events.sort((a, b) => a.ts - b.ts);
    this.logger.info(`Received ${events.length} events after reindexing`);
    await this.consumer.consume(...events);
  }

  async index(domain: number) {
    let indexer = this.indexers.get(domain)!;

    let replicas = [];
    if (domain === this.gov) {
      replicas = this.sdk.domainNumbers.filter((d) => d != this.gov);
    } else {
      replicas = [this.gov];
    }

    return await indexer.updateAll(replicas);
  }

  async initalFeedConsumer() {
    const events = Array.from(this.indexers.values())
      .map((indexer) => indexer.persistance.allEvents())
      .flat();
    events.sort((a, b) => a.ts - b.ts);
    await this.consumer.consume(...events);
  }

  async initIndexers() {
    for (const domain of this.sdk.domainNumbers) {
      const indexer = new Indexer(domain, this.sdk, this);
      await indexer.init();
      this.indexers.set(domain, indexer);
    }
  }

  async startConsuming() {
    while (!this.done) {
      this.logger.info(`Started to reindex`);
      const start = new Date().valueOf();
      await this.indexAll();
      this.logger.info(
        `Finished reindexing after ${
          (new Date().valueOf() - start) / 1000
        } seconds`
      );

      const stats = this.consumer.stats();
      this.logger.debug(JSON.stringify(stats, replacer));

      this.reportAllMetrics(stats);

      await sleep(30000);
    }
  }

  reportAllMetrics(statistics: Statistics) {
    for (const domain of this.sdk.domainNumbers) {
      this.reportMetrics(domain, statistics);
    }
  }

  reportMetrics(domain: number, statistics: Statistics) {
    const {
      counts: { dispatched, updated, relayed, processed },
      timings: { meanUpdate, meanRelay, meanProcess, meanE2E },
    } = statistics.forDomain(domain);
    this.metrics.setNetworkState(
      this.sdk.getDomain(domain)!.name,
      dispatched,
      updated,
      relayed,
      processed,
      meanUpdate,
      meanRelay,
      meanProcess,
      meanE2E
    );
  }

  stop() {
    this.done = true;
  }
}
