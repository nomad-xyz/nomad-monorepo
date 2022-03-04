import { getMonitorMetrics, writeUnprocessedMessages } from '../print';
import { HealthMetricsCollector } from './healthMetrics';
import { EventType, IndexType, MonitorSingle } from '../monitorSingle';
import { MonitorConfig } from '../config';

export class BridgeHealthMonitor extends MonitorSingle {
  dispatchLogs: any[];
  processLogs: any[];

  constructor(config: MonitorConfig) {
    super(config);

    this.dispatchLogs = [];
    this.processLogs = [];
  }

  async start(): Promise<void> {
    await super.reportInLoop(this, this.reportHealth, 120);
  }

  async reportHealth() {
    super.logInfo(`Checking ${this.origin}`);
    super.logInfo(`Get Dispatch logs from ${this.origin}`);
    let dispatchLogs;
    try {
      dispatchLogs = await super.query(
        this.origin,
        EventType.Dispatch,
        IndexType.Incremental,
      );
    } catch (e) {
      super.logError(
        `Encountered error while fetching Dispatch logs for ${this.origin}, bailing: ${e}`,
      );
      return;
    }
    this.dispatchLogs.push(...dispatchLogs);

    for (const remote of this.remotes) {
      super.logInfo(`Get Process logs from ${remote} for ${this.origin}`);
      let processLogs;
      try {
        processLogs = await super.query(
          remote,
          EventType.Process,
          IndexType.Incremental,
        );
      } catch (e) {
        super.logError(
          `Encountered error while fetching Process logs from ${remote} for ${this.origin}, bailing: ${e}`,
        );
        return;
      }
      this.processLogs.push(...processLogs);
    }

    const unprocessedDetails = await this.getUnprocessedDetails(
      this.origin,
      this.dispatchLogs,
      this.processLogs,
    );

    const summary = getMonitorMetrics(
      this.origin,
      this.dispatchLogs,
      this.processLogs,
      unprocessedDetails,
    );
    super.logInfo(`${JSON.stringify(summary)}\n ${this.origin} Summary`);

    (this.metrics as HealthMetricsCollector).setBridgeState(
      this.origin,
      this.dispatchLogs.length,
      this.processLogs.length,
      unprocessedDetails.length,
    );

    // write details to file
    writeUnprocessedMessages(unprocessedDetails, this.origin);
  }

  getUnprocessedDetails(
    origin: string,
    dispatchLogs: any[],
    processedLogs: any[],
  ) {
    const processedMessageHashes = processedLogs.map(
      (log: any) => log.args.messageHash,
    );
    const unprocessedMessages = dispatchLogs.filter(
      (log: any) => !processedMessageHashes.includes(log.args.messageHash),
    );
    const promises = unprocessedMessages.map(async (log) => {
      const transaction = await log.getTransaction();
      return {
        chain: origin,
        transactionHash: transaction.hash,
        messageHash: log.args[0],
        leafIndex: log.args[1].toNumber(),
      };
    });
    return Promise.all(promises);
  }
}
