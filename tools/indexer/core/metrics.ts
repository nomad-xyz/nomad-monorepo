import { Gauge, Histogram } from "prom-client";
import Logger from "bunyan";

import { register } from "prom-client";
import express, { Response } from "express";

const buckets = [
  1 * 60, // 1 min
  5 * 60, // 5 min
  10 * 60, // 10 min
  20 * 60, // 20 min
  30 * 60, // 30 min
  60 * 60, // 1 hr
  120 * 60, // 2 hrs
  240 * 60, // 4 hrs
  480 * 60, // 8 hrs
  960 * 60, // 16 hrs
  1920 * 60, // 32 hrs
];

export class MetricsCollector {
  readonly environment: string;
  private readonly logger: Logger;

  constructor(environment: string, logger: Logger) {
    this.environment = environment;
    this.logger = logger;
  }

  /**
   * Starts a server that exposes metrics in the prometheus format
   */
  startServer(port: number) {
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      throw Error(`Invalid PrometheusPort value: ${port}`);
    }
    const server = express();
    server.get("/metrics", async (_, res: Response) => {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    });

    this.logger.info(
      {
        endpoint: `http://0.0.0.0:${port}/metrics`,
      },
      "Prometheus metrics exposed"
    );
    server.listen(port);
  }
}

const prefix = `fancy_monitor`;

export class IndexerCollector extends MetricsCollector {
  private numDispatchedGauge: Gauge<string>;
  private numUpdatedGauge: Gauge<string>;
  private numRelayedGauge: Gauge<string>;
  private numProcessedGauge: Gauge<string>;

  private meanUpdateTimeGauge: Gauge<string>;
  private meanRelayTimeGauge: Gauge<string>;
  private meanProcessTimeGauge: Gauge<string>;
  private meanEndToEndTimeGauge: Gauge<string>;

  private updateLatency: Histogram<string>;
  private relayLatency: Histogram<string>;
  private processLatency: Histogram<string>;
  private end2EndLatency: Histogram<string>;

  private dispatchGasUsage: Histogram<string>;
  private updateGasUsage: Histogram<string>;
  private relayGasUsage: Histogram<string>;
  private receiveGasUsage: Histogram<string>;
  private processGasUsage: Histogram<string>;

  private homeFailedGauge: Gauge<string>;

  constructor(environment: string, logger: Logger) {
    super(environment, logger);

    // Count

    this.numDispatchedGauge = new Gauge({
      name: prefix + "_number_messages_dispatched",
      help: "Gauge that indicates how many messages have been dispatched for a network.",
      labelNames: ["network", "environment"],
    });

    this.numUpdatedGauge = new Gauge({
      name: prefix + "_number_messages_updated",
      help: "Gauge that indicates how many messages have been updated for a network.",
      labelNames: ["network", "environment"],
    });

    this.numRelayedGauge = new Gauge({
      name: prefix + "_number_messages_relayed",
      help: "Gauge that indicates how many messages have been relayed for a network.",
      labelNames: ["network", "environment"],
    });

    this.numProcessedGauge = new Gauge({
      name: prefix + "_number_messages_processed",
      help: "Gauge that indicates how many messages have been processed for a network.",
      labelNames: ["network", "environment"],
    });

    // Time Gauges

    this.meanUpdateTimeGauge = new Gauge({
      name: prefix + "_mean_update_time",
      help: "Gauge that indicates how long does it take to move from dispatched to updated.",
      labelNames: ["network", "environment"],
    });

    this.meanRelayTimeGauge = new Gauge({
      name: prefix + "_mean_relay_time",
      help: "Gauge that indicates how long does it take to move from updated to relayed.",
      labelNames: ["network", "environment"],
    });

    this.meanProcessTimeGauge = new Gauge({
      name: prefix + "_mean_process_time",
      help: "Gauge that indicates how long does it take to move from relayed to processed.",
      labelNames: ["network", "environment"],
    });

    this.meanEndToEndTimeGauge = new Gauge({
      name: prefix + "_mean_e2e_time",
      help: "Gauge that indicates how long does it take to move from dispatched to processed.",
      labelNames: ["network", "environment"],
    });


    // Time Histograms

    this.updateLatency = new Histogram({
      name: prefix + "_update_latency",
      help: "Histogram that tracks latency of how long does it take to move from dispatched to updated.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.relayLatency = new Histogram({
      name: prefix + "_relay_latency",
      help: "Histogram that tracks latency of how long does it take to move from updated to relayed.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.processLatency = new Histogram({
      name: prefix + "_process_latency",
      help: "Histogram that tracks latency of how long does it take to move from relayed to processed.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.end2EndLatency = new Histogram({
      name: prefix + "_end2end_latency",
      help: "Histogram that tracks latency of how long does it take to move from dispatched to processed.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    // Gas

    this.dispatchGasUsage = new Histogram({
      name: prefix + "_dispatch_gas_usage",
      help: "Histogram that tracks gas usage of a transaction that initiated dispatch stage.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.updateGasUsage = new Histogram({
      name: prefix + "_update_gas_usage",
      help: "Histogram that tracks gas usage of a transaction that initiated update stage.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.relayGasUsage = new Histogram({
      name: prefix + "_relay_gas_usage",
      help: "Histogram that tracks gas usage of a transaction that initiated relay stage.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.receiveGasUsage = new Histogram({
      name: prefix + "_receive_gas_usage",
      help: "Histogram that tracks gas usage of a transaction that initiated receive stage.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    this.processGasUsage = new Histogram({
      name: prefix + "_process_gas_usage",
      help: "Histogram that tracks gas usage of a transaction that initiated process stage.",
      labelNames: ["home", "replica", "environment"],
      buckets,
    });

    // Home Health

    this.homeFailedGauge = new Gauge({
      name: "nomad_monitor_home_failed",
      help: "Gauge that indicates if home of a network is in failed state.",
      labelNames: ["network", "environment"],
    });
  }

  /**
   * Sets the state for a bridge.
   */
  setNetworkState(
    network: string,
    dispatched: number,
    updated: number,
    relayed: number,
    processed: number,
    updateTime: number,
    relayTime: number,
    processTime: number,
    e2eTime: number,
    homeFailed: boolean
  ) {
    this.numDispatchedGauge.set(
      { network, environment: this.environment },
      dispatched
    );

    this.numUpdatedGauge.set(
      { network, environment: this.environment },
      updated
    );

    this.numRelayedGauge.set(
      { network, environment: this.environment },
      relayed
    );

    this.numProcessedGauge.set(
      { network, environment: this.environment },
      processed
    );

    this.meanUpdateTimeGauge.set(
      { network, environment: this.environment },
      updateTime
    );

    this.meanRelayTimeGauge.set(
      { network, environment: this.environment },
      relayTime
    );

    this.meanProcessTimeGauge.set(
      { network, environment: this.environment },
      processTime
    );

    this.meanEndToEndTimeGauge.set(
      { network, environment: this.environment },
      e2eTime
    );

    this.homeFailedGauge.set(
      { network, environment: this.environment },
      homeFailed ? 1 : 0
    );
  }

  observeUpdateLatency(home: string, replica: string, ms: number) {
    this.updateLatency.labels(home, replica, this.environment).observe(ms)
  }
  observeRelayLatency(home: string, replica: string, ms: number) {
    this.relayLatency.labels(home, replica, this.environment).observe(ms)
  }
  observeProcessLatency(home: string, replica: string, ms: number) {
    this.processLatency.labels(home, replica, this.environment).observe(ms)
  }
  observeE2ELatency(home: string, replica: string, ms: number) {
    this.end2EndLatency.labels(home, replica, this.environment).observe(ms)
  }

  observeDispatchGasUsage(home: string, replica: string, gas: number) {
    this.dispatchGasUsage.labels(home, replica, this.environment).observe(gas)
  }
  observeUpdateGasUsage(home: string, replica: string, gas: number) {
    this.updateGasUsage.labels(home, replica, this.environment).observe(gas)
  }
  observeRelayGasUsage(home: string, replica: string, gas: number) {
    this.relayGasUsage.labels(home, replica, this.environment).observe(gas)
  }
  observeReceiveGasUsage(home: string, replica: string, gas: number) {
    this.receiveGasUsage.labels(home, replica, this.environment).observe(gas)
  }
  observeProcessGasUsage(home: string, replica: string, gas: number) {
    this.processGasUsage.labels(home, replica, this.environment).observe(gas)
  }

}
