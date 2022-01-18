import { MetricsCollector } from '../metrics';
import { Gauge } from 'prom-client';
import Logger from 'bunyan';

const prefix = `fancy_monitor`

export class IndexerCollector extends MetricsCollector {
  private numDispatchedGauge: Gauge<string>;
  private numUpdatedGauge: Gauge<string>;
  private numRelayedGauge: Gauge<string>;
  private numProcessedGauge: Gauge<string>;

  private meanUpdateTimeGauge: Gauge<string>;
  private meanRelayTimeGauge: Gauge<string>;
  private meanProcessTimeGauge: Gauge<string>;
  private meanEndToEndTimeGauge: Gauge<string>;

  constructor(environment: string, logger: Logger) {
    super(environment, logger);

    // Count

    this.numDispatchedGauge = new Gauge({
      name: prefix + '_number_messages_dispatched',
      help: 'Gauge that indicates how many messages have been dispatched for a network.',
      labelNames: ['network', 'environment'],
    });

    this.numUpdatedGauge = new Gauge({
      name: prefix + '_number_messages_updated',
      help: 'Gauge that indicates how many messages have been updated for a network.',
      labelNames: ['network', 'environment'],
    });

    this.numRelayedGauge = new Gauge({
        name: prefix + '_number_messages_relayed',
        help: 'Gauge that indicates how many messages have been relayed for a network.',
        labelNames: ['network', 'environment'],
    });

    this.numProcessedGauge = new Gauge({
        name: prefix + '_number_messages_processed',
        help: 'Gauge that indicates how many messages have been processed for a network.',
        labelNames: ['network', 'environment'],
    });

    // Time

    this.meanUpdateTimeGauge = new Gauge({
        name: prefix + '_mean_update_time',
        help: 'Gauge that indicates how long does it take to move from dispatched to updated.',
        labelNames: ['network', 'environment'],
    });
  
    this.meanRelayTimeGauge = new Gauge({
        name: prefix + '_mean_relay_time',
        help: 'Gauge that indicates how long does it take to move from updated to relayed.',
        labelNames: ['network', 'environment'],
    });
  
    this.meanProcessTimeGauge = new Gauge({
        name: prefix + '_mean_process_time',
        help: 'Gauge that indicates how long does it take to move from relayed to processed.',
        labelNames: ['network', 'environment'],
    });
  
    this.meanEndToEndTimeGauge = new Gauge({
        name: prefix + '_mean_e2e_time',
        help: 'Gauge that indicates how long does it take to move from dispatched to processed.',
        labelNames: ['network', 'environment'],
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
  ) {
    this.numDispatchedGauge.set(
      { network, environment: this.environment },
      dispatched,
    );
  
    this.numUpdatedGauge.set(
      { network, environment: this.environment },
      updated,
    );
  
    this.numRelayedGauge.set(
      { network, environment: this.environment },
      relayed,
    );

    this.numProcessedGauge.set(
        { network, environment: this.environment },
        processed,
    );

    this.meanUpdateTimeGauge.set(
        { network, environment: this.environment },
        updateTime,
    );

    this.meanRelayTimeGauge.set(
        { network, environment: this.environment },
        relayTime,
    );

    this.meanProcessTimeGauge.set(
        { network, environment: this.environment },
        processTime,
    );

    this.meanEndToEndTimeGauge.set(
        { network, environment: this.environment },
        e2eTime,
    );
  }
}
