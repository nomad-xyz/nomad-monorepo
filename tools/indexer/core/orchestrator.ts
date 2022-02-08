import { Home } from "@nomad-xyz/contract-interfaces/core";
import { NomadContext } from "@nomad-xyz/sdk/dist";
import Logger from "bunyan";
import { Consumer } from "./consumer";
import { DB } from "./db";
import { Indexer } from "./indexer";
import { IndexerCollector } from "./metrics";
import { Statistics } from "./types";
import { replacer, sleep } from "./utils";

class HomeHealth {
  home: Home;
  domain: number;
  healthy: boolean;
  logger: Logger;

  constructor(domain: number, ctx: NomadContext, logger: Logger) {
    this.domain = domain;
    this.home = ctx.mustGetCore(domain).home;
    this.healthy = true;
    this.logger = logger;
  }

  async updateHealth(): Promise<void> {
    try {
      const state = await this.home.state();
      if (state !== 1) {
        this.healthy = false;
      } else {
        this.healthy = true;
      }
    } catch (e: any) {
      this.logger.warn(
        `Couldn't collect home state for ${this.domain} domain. Error: ${e.message}`
      );
    }
  }

  get failed(): boolean {
    return !this.healthy;
  }
}

export class Orchestrator {
  sdk: NomadContext;
  consumer: Consumer;
  indexers: Map<number, Indexer>;
  healthCheckers: Map<number, HomeHealth>;
  gov: number;
  done: boolean;
  chaseMode: boolean;
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
    this.healthCheckers = new Map();
    this.gov = gov;
    this.done = false;
    this.chaseMode = true;
    this.metrics = metrics;
    this.logger = logger;
    this.db = db;
  }

  async init() {
    await this.initIndexers();
    await this.initHealthCheckers();
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

  async checkAllHealth() {
    await Promise.all(
      this.sdk.domainNumbers.map((domain: number) => this.checkHealth(domain))
    );
  }

  async checkHealth(domain: number) {
    await this.healthCheckers.get(domain)!.updateHealth();
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

  async initHealthCheckers() {
    for (const domain of this.sdk.domainNumbers) {
      const checker = new HomeHealth(domain, this.sdk, this.logger);
      await checker.updateHealth();
      this.healthCheckers.set(domain, checker);
    }
  }

  subscribeStatisticEvents() {
    this.consumer.on('updated', (home: number, replica: number ,ms: number) => {
      const homeName = this.domain2name(home);
      const replicaName = this.domain2name(replica);
      this.metrics.observeUpdate(homeName, replicaName, ms)
    })

    this.consumer.on('relayed', (home: number, replica: number ,ms: number) => {
      const homeName = this.domain2name(home);
      const replicaName = this.domain2name(replica);
      this.metrics.observeRelayed(homeName, replicaName, ms)
    })

    this.consumer.on('processed', (home: number, replica: number ,ms: number, e2e: number) => {
      const homeName = this.domain2name(home);
      const replicaName = this.domain2name(replica);
      this.metrics.observeProcessed(homeName, replicaName, ms)
      this.metrics.observeE2E(homeName, replicaName, e2e)
    })
  }

  async startConsuming() {
    while (!this.done) {
      this.logger.info(`Started to reindex`);
      const start = new Date().valueOf();
      await Promise.all([this.indexAll(), this.checkAllHealth()]);
      if (this.chaseMode) {
        this.chaseMode = false;
        this.subscribeStatisticEvents()
      }
      
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

  domain2name(domain: number): string {
    return this.sdk.getDomain(domain)!.name
  }

  reportMetrics(domain: number, statistics: Statistics) {
    const {
      counts: { dispatched, updated, relayed, processed },
      timings: { meanUpdate, meanRelay, meanProcess, meanE2E },
    } = statistics.forDomain(domain);

    const homeFailed = this.healthCheckers.get(domain)!.failed;
    this.metrics.setNetworkState(
      this.domain2name(domain),
      dispatched,
      updated,
      relayed,
      processed,
      meanUpdate,
      meanRelay,
      meanProcess,
      meanE2E,
      homeFailed
    );
  }

  stop() {
    this.done = true;
  }
}
