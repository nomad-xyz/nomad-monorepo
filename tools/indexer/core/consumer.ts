import { parseMessage } from "@nomad-xyz/sdk/dist/nomad/messages/NomadMessage";
import { ethers } from "ethers";
import { EventType, NomadEvent } from "./event";
import { Statistics } from "./types";
import { parseBody } from "@nomad-xyz/sdk/dist/nomad/messages/BridgeMessage";
import { parseAction } from "@nomad-xyz/sdk/dist/nomad/messages/GovernanceMessage";
import { DB } from "./db";
import Logger from "bunyan";

class StatisticsCollector {
  s: Statistics;
  constructor(domains: number[]) {
    this.s = new Statistics(domains);
  }

  addDispatched(domain: number) {
    this.s.counts.total.dispatched += 1;
    this.s.counts.domainStatistics.get(domain)!.dispatched += 1;
  }

  addUpdated(domain: number) {
    this.s.counts.total.updated += 1;
    this.s.counts.domainStatistics.get(domain)!.updated += 1;
  }

  addRelayed(domain: number) {
    this.s.counts.total.relayed += 1;
    this.s.counts.domainStatistics.get(domain)!.relayed += 1;
  }

  addReceived(domain: number) {
    this.s.counts.total.received += 1;
    this.s.counts.domainStatistics.get(domain)!.received += 1;
  }

  addProcessed(domain: number) {
    this.s.counts.total.processed += 1;
    this.s.counts.domainStatistics.get(domain)!.processed += 1;
  }

  contributeUpdateTimings(m: NomadMessage) {
    const inUpdateStat = m.timings.inUpdated();
    if (inUpdateStat) {
      this.s.timings.total.meanUpdate.add(inUpdateStat);
      this.s.timings.domainStatistics
        .get(m.origin)!
        .meanUpdate.add(inUpdateStat);
    }
  }

  contributeRelayTimings(m: NomadMessage) {
    this.contributeUpdateTimings(m);
    const inRelayStat = m.timings.inRelayed();
    if (inRelayStat) {
      this.s.timings.total.meanRelay.add(inRelayStat);
      this.s.timings.domainStatistics.get(m.origin)!.meanRelay.add(inRelayStat);
    }
  }

  contributeReceiveTimings(m: NomadMessage) {
    this.contributeRelayTimings(m);
    const inReceiveStat = m.timings.inReceived();
    if (inReceiveStat) {
      this.s.timings.total.meanReceive.add(inReceiveStat);
      this.s.timings.domainStatistics
        .get(m.origin)!
        .meanReceive.add(inReceiveStat);
    }
  }

  contributeProcessTimings(m: NomadMessage) {
    this.contributeReceiveTimings(m);
    const inProcessStat = m.timings.inProcessed();
    if (inProcessStat) {
      this.s.timings.total.meanProcess.add(inProcessStat);
      this.s.timings.domainStatistics
        .get(m.origin)!
        .meanProcess.add(inProcessStat);
    }

    const e2e = m.timings.e2e();
    if (e2e) {
      this.s.timings.total.meanE2E.add(e2e);
      this.s.timings.domainStatistics.get(m.origin)!.meanE2E.add(e2e);
    }
  }

  contributeToCount(m: NomadMessage) {
    switch (m.state) {
      case MsgState.Dispatched:
        this.addDispatched(m.origin);
        break;
      case MsgState.Updated:
        this.addUpdated(m.origin);
        break;
      case MsgState.Relayed:
        this.addRelayed(m.origin);
        break;
      case MsgState.Received:
        this.addReceived(m.origin);
        break;
      case MsgState.Processed:
        this.addProcessed(m.origin);
        break;
      default:
        break;
    }
  }

  contributeToTime(m: NomadMessage) {
    switch (m.state) {
      case MsgState.Updated:
        this.contributeUpdateTimings(m);
        break;
      case MsgState.Relayed:
        this.contributeRelayTimings(m);
        break;
      case MsgState.Received:
        this.contributeReceiveTimings(m);
        break;
      case MsgState.Processed:
        this.contributeProcessTimings(m);
        break;
      default:
        break;
    }
  }

  stats(): Statistics {
    return this.s;
  }
}

export abstract class Consumer {
  abstract consume(...evens: NomadEvent[]): Promise<void>;
  abstract stats(): Statistics;
}

enum MsgState {
  Dispatched,
  Updated,
  Relayed,
  Received,
  Processed,
}

class Timings {
  dispatchedAt: number;
  updatedAt: number;
  relayedAt: number;
  processedAt: number;
  receivedAt: number;

  constructor(ts: number) {
    this.dispatchedAt = ts;
    this.updatedAt = 0;
    this.relayedAt = 0;
    this.processedAt = 0;
    this.receivedAt = 0;
  }

  updated(ts: number) {
    this.updatedAt = ts;
  }

  relayed(ts: number) {
    this.relayedAt = ts;
  }

  received(ts: number) {
    this.receivedAt = ts;
  }

  processed(ts: number) {
    this.processedAt = ts;
  }

  inUpdated(): number | undefined {
    if (this.updatedAt) {
      return this.updatedAt - this.dispatchedAt;
    }
    return undefined;
  }

  inRelayed(): number | undefined {
    if (this.relayedAt) {
      return this.relayedAt - (this.updatedAt || this.dispatchedAt); // because of the problem with time that it is not ideal from RPC we could have skipped some stages. we take the last available
    }
    return undefined;
  }

  inReceived(): number | undefined {
    if (this.receivedAt) {
      return (
        this.receivedAt -
        (this.relayedAt || this.updatedAt || this.dispatchedAt)
      ); // because of the problem with time that it is not ideal from RPC we could have skipped some stages. we take the last available
    }
    return undefined;
  }

  inProcessed(): number | undefined {
    if (this.processedAt) {
      return (
        this.processedAt -
        (this.receivedAt ||
          this.relayedAt ||
          this.updatedAt ||
          this.dispatchedAt)
      ); // because of the problem with time that it is not ideal from RPC we could have skipped some stages. we take the last available
    }
    return undefined;
  }

  e2e(): number | undefined {
    if (this.processedAt) {
      return (
        this.processedAt -
        (this.dispatchedAt ||
          this.updatedAt ||
          this.relayedAt ||
          this.receivedAt)
      ); // same as for .inRelayed() and .inProcessed() but opposit order
    }
    return undefined;
  }
}

function bytes32ToAddress(s: string) {
  return "0x" + s.slice(26);
}

enum MessageType {
  NoMessage,
  TransferMessage,
  GovernanceMessage,
}

export class NomadMessage {
  origin: number;
  destination: number;
  nonce: number;
  root: string;
  hash: string;
  leafIndex: ethers.BigNumber;
  raw: string;
  sender?: string;
  nomadSender: string;
  nomadRecipient: string;
  hasMessage: MessageType;
  bridgeMsgType?: string;
  bridgeMsgTo?: string;
  bridgeMsgAmount?: ethers.BigNumber;
  bridgeMsgAllowFast?: boolean;
  bridgeMsgDetailsHash?: string;
  bridgeMsgTokenDomain?: number;
  bridgeMsgTokenId?: string;
  state: MsgState;
  timings: Timings;
  block: number;
  evm?: string;

  constructor(
    origin: number,
    destination: number,
    nonce: number,
    root: string,
    hash: string,
    leafIndex: ethers.BigNumber,
    // destinationAndNonce: ethers.BigNumber,
    message: string,
    createdAt: number,
    block: number
  ) {
    this.origin = origin;
    this.destination = destination;
    this.nonce = nonce;
    this.root = root.toLowerCase();
    this.hash = hash.toLowerCase();
    this.leafIndex = leafIndex;
    // this.destinationAndNonce = destinationAndNonce;
    this.raw = message;
    const parsed = parseMessage(message);
    this.nomadSender = bytes32ToAddress(parsed.sender);
    this.nomadRecipient = bytes32ToAddress(parsed.recipient);
    this.hasMessage = MessageType.NoMessage;

    this.tryParseMessage(parsed.body);

    this.state = MsgState.Dispatched;
    this.timings = new Timings(createdAt);
    this.block = block;
  }

  toObject() {
    return {
      origin: this.origin,
      destination: this.destination,
      nonce: this.nonce,
      root: this.root,
      hash: this.hash,
      leafIndex: this.leafIndex,
      sender: this.sender,
      nomadSender: this.nomadSender,
      nomadRecipient: this.nomadRecipient,
      hasMessage: this.hasMessage,
      bridgeMsgType: this.bridgeMsgType,
      bridgeMsgTo: this.bridgeMsgTo,
      bridgeMsgAmount: this.bridgeMsgAmount,
      bridgeMsgAllowFast: this.bridgeMsgAllowFast,
      bridgeMsgDetailsHash: this.bridgeMsgDetailsHash,
      bridgeMsgTokenDomain: this.bridgeMsgTokenDomain,
      bridgeMsgTokenId: this.bridgeMsgTokenId,
      state: this.state,
      timings: this.timings,
      tx: this.evm,
    };
  }

  static fromDB(
    origin: number,
    destination: number,
    nonce: number,
    root: string,
    hash: string,
    leafIndex: ethers.BigNumber,
    message: string,
    createdAt: number,
    updatedAt: number,
    relayedAt: number,
    receivedAt: number,
    processedAt: number,
    block: number,
    sender: string,
    evm: string
  ): NomadMessage {
    const m = new NomadMessage(
      origin,
      destination,
      nonce,
      root,
      hash,
      leafIndex,
      message,
      createdAt,
      block
    );
    m.timings.updated(updatedAt);
    m.timings.relayed(relayedAt);
    m.timings.received(receivedAt);
    m.timings.processed(processedAt);
    m.updateSender(sender);
    m.evm = evm;
    return m;
  }

  tryParseMessage(body: string) {
    this.tryParseTransferMessage(body) || this.tryParseGovernanceMessage(body);
  }

  tryParseTransferMessage(body: string): boolean {
    try {
      const bridgeMessage = parseBody(body);
      this.bridgeMsgType = bridgeMessage.action.type as string;
      this.bridgeMsgTo = bytes32ToAddress(
        bridgeMessage.action.to
      ).toLowerCase();
      this.bridgeMsgAmount = bridgeMessage.action.amount;
      this.bridgeMsgAllowFast = bridgeMessage.action.allowFast;
      this.bridgeMsgDetailsHash = bridgeMessage.action.detailsHash;
      this.bridgeMsgTokenDomain = bridgeMessage.token.domain as number;
      this.bridgeMsgTokenId = bytes32ToAddress(
        bridgeMessage.token.id as string
      ).toLowerCase();
      this.hasMessage = MessageType.TransferMessage;
      return true;
    } catch (e) {
      return false;
    }
  }

  tryParseGovernanceMessage(body: string): boolean {
    try {
      const message = parseAction(body);
      if (message.type == "batch") {
        message.batchHash;
      } else {
        message.address;
        message.domain;
      }
      this.bridgeMsgType = message.type;
      this.hasMessage = MessageType.GovernanceMessage;
      return true;
    } catch (e) {
      return false;
    }
  }

  updateSender(sender: string) {
    this.sender = sender;
  }

  get originAndRoot(): string {
    return `${this.origin}${this.root}`;
  }

  intoDB(): [
    string,
    number,
    number,
    number,
    string,
    string,
    string,
    number,
    number,
    number,
    number,
    number,
    number,
    string | undefined,
    string | undefined,
    string | undefined,
    boolean | undefined,
    string | undefined,
    number | undefined,
    string | undefined,
    string | undefined,
    string,
    string,
    number,
    string | undefined
  ] {
    return [
      this.hash.toLowerCase(),
      this.origin,
      this.destination,
      this.nonce,
      this.nomadSender.toLowerCase(),
      this.nomadRecipient.toLowerCase(),
      this.root.toLowerCase(),
      this.state,
      this.timings.dispatchedAt,
      this.timings.updatedAt,
      this.timings.relayedAt,
      this.timings.receivedAt,
      this.timings.processedAt,
      this.bridgeMsgType?.toLowerCase(),
      this.bridgeMsgTo?.toLowerCase(),
      this.bridgeMsgAmount?.toString(),
      this.bridgeMsgAllowFast,
      this.bridgeMsgDetailsHash?.toLowerCase(),
      this.bridgeMsgTokenDomain,
      this.bridgeMsgTokenId?.toLowerCase(),
      this.sender?.toLowerCase(),
      this.raw,
      this.leafIndex.toString(),
      this.block,
      this.evm?.toLowerCase(),
    ];
  }
}

class SenderLostAndFound {
  p: Processor;
  dispatchEventsWithMessages: [NomadEvent, NomadMessage][];
  bridgeRouterSendEvents: NomadEvent[];
  constructor(p: Processor) {
    this.p = p;
    this.dispatchEventsWithMessages = [];
    this.bridgeRouterSendEvents = [];
  }

  bridgeRouterSend(e: NomadEvent): string | undefined {
    // check if we have dispatch events with block >= current && block <= current + 4;
    const hash = this.findMatchingDispatchAndUpdateAndRemove(e);
    if (hash) {
      return hash;
    } else {
      //add event for further fixing from dispatch side
      this.bridgeRouterSendEvents.push(e);
      return undefined;
    }
  }
  findMatchingDispatchAndUpdateAndRemove(
    brSend: NomadEvent
  ): string | undefined {
    const index = this.dispatchEventsWithMessages.findIndex(([dispatch, m]) =>
      this.match(dispatch, brSend, m)
    );

    if (index >= 0) {
      const some = this.dispatchEventsWithMessages.at(index);
      if (some) {
        const [_, msg] = some;
        msg.updateSender(brSend.eventData.from!);
        msg.evm = brSend.eventData.evmHash!;
        this.dispatchEventsWithMessages.splice(index, 1);
        return msg.hash;
      }
    }
    return undefined;
  }

  match(dispatch: NomadEvent, brSend: NomadEvent, m: NomadMessage): boolean {
    return (
      brSend.eventData.toDomain! === m.destination && //brSend.eventData.token?.toLowerCase() === m.bridgeMsgTokenId?.toLowerCase() &&
      bytes32ToAddress(brSend.eventData.toId!).toLowerCase() ===
        m.bridgeMsgTo?.toLowerCase() &&
      brSend.eventData.amount!.eq(m.bridgeMsgAmount!) &&
      brSend.block === dispatch.block //&&  // (dispatch.block - brSend.block <= 2 || brSend.block - dispatch.block <= 30)
    );
  }

  findMatchingBRSendUpdateAndRemove(
    dispatch: NomadEvent,
    m: NomadMessage
  ): boolean {
    const index = this.bridgeRouterSendEvents.findIndex((brSend) =>
      this.match(dispatch, brSend, m)
    );
    if (index >= 0) {
      const brSend = this.bridgeRouterSendEvents.at(index);
      if (brSend) {
        m.updateSender(brSend.eventData.from!);
        m.evm = brSend.eventData.evmHash!;
      }
      this.bridgeRouterSendEvents.splice(index, 1);
      return true;
    }
    return false;
  }

  dispatch(e: NomadEvent, m: NomadMessage): boolean {
    if (m.hasMessage !== MessageType.TransferMessage) return false;

    if (this.findMatchingBRSendUpdateAndRemove(e, m)) {
      return true;
    } else {
      this.dispatchEventsWithMessages.push([e, m]);
      return false;
    }
  }
}

export class Processor extends Consumer {
  messages: NomadMessage[];
  msgToIndex: Map<string, number>;
  msgByOriginAndRoot: Map<string, number[]>;
  consumed: number; // for debug
  domains: number[];
  syncQueue: string[];
  db: DB;
  logger: Logger;
  senderRegistry: SenderLostAndFound;

  constructor(db: DB, logger: Logger) {
    super();
    this.messages = [];
    this.msgToIndex = new Map();
    this.msgByOriginAndRoot = new Map();
    this.consumed = 0;
    this.domains = [];
    this.syncQueue = [];
    this.senderRegistry = new SenderLostAndFound(this);

    this.db = db;
    this.logger = logger;
  }

  async consume(...events: NomadEvent[]): Promise<void> {
    for (const event of events) {
      if (event.eventType === EventType.HomeDispatch) {
        this.dispatched(event);
      } else if (event.eventType === EventType.HomeUpdate) {
        this.homeUpdate(event);
      } else if (event.eventType === EventType.ReplicaUpdate) {
        this.replicaUpdate(event);
      } else if (event.eventType === EventType.ReplicaProcess) {
        this.process(event);
      } else if (event.eventType === EventType.BridgeRouterSend) {
        this.bridgeRouterSend(event);
      } else if (event.eventType === EventType.BridgeRouterReceive) {
        this.bridgeRouterReceive(event);
      }

      this.consumed += 1;
    }

    await this.sync();
  }

  async sync() {
    const [inserts, updates] = await this.getMsgForSync();

    this.logger.info(
      `Inserting ${inserts.length} messages and updating ${updates.length}`
    );

    await Promise.all([
      this.db.insertMessage(inserts),
      this.db.updateMessage(updates),
    ]);
  }

  addToSyncQueue(hash: string) {
    if (this.syncQueue.indexOf(hash) < 0) this.syncQueue.push(hash);
  }

  async getMsgForSync(): Promise<[NomadMessage[], NomadMessage[]]> {
    let existingHashes = await this.db.getExistingHashes();

    const insert: string[] = [];
    const update: string[] = [];

    this.syncQueue.forEach((hash) => {
      if (existingHashes.indexOf(hash) < 0) {
        insert.push(hash);
      } else {
        update.push(hash);
      }
    });

    this.syncQueue = [];

    return [this.mapHashesToMessages(insert), this.mapHashesToMessages(update)];
  }

  mapHashesToMessages(hashes: string[]): NomadMessage[] {
    return hashes.map((hash) => this.getMsg(hash)!).filter((m) => !!m);
  }

  dispatched(e: NomadEvent) {
    const m = new NomadMessage(
      e.domain,
      ...e.destinationAndNonce(),
      e.eventData.committedRoot!,
      e.eventData.messageHash!,
      e.eventData.leafIndex!,
      // e.eventData.destinationAndNonce!,
      e.eventData.message!,
      e.ts,
      e.block
    );

    this.senderRegistry.dispatch(e, m);

    this.add(m);
    this.addToSyncQueue(m.hash);

    if (!this.domains.includes(e.domain)) this.domains.push(e.domain);
  }

  homeUpdate(e: NomadEvent) {
    const ms = this.getMsgsByOriginAndRoot(e.domain, e.eventData.oldRoot!);
    if (ms.length)
      ms.forEach((m) => {
        if (m.state < MsgState.Updated) {
          m.state = MsgState.Updated;
          m.timings.updated(e.ts);
          this.addToSyncQueue(m.hash);
        }
      });
  }

  replicaUpdate(e: NomadEvent) {
    const ms = this.getMsgsByOriginAndRoot(
      e.replicaOrigin,
      e.eventData.oldRoot!
    );
    if (ms.length)
      ms.forEach((m) => {
        if (m.state < MsgState.Relayed) {
          m.state = MsgState.Relayed;
          m.timings.relayed(e.ts);
          this.addToSyncQueue(m.hash);
        }
      });
  }

  process(e: NomadEvent) {
    const m = this.getMsg(e.eventData.messageHash!);
    if (m) {
      if (m.state < MsgState.Processed) {
        m.state = MsgState.Processed;
        m.timings.processed(e.ts);
        this.addToSyncQueue(m.hash);
      }
    }
  }

  bridgeRouterSend(e: NomadEvent) {
    const hash = this.senderRegistry.bridgeRouterSend(e);
    if (hash) {
      this.addToSyncQueue(hash);
    }
  }

  bridgeRouterReceive(e: NomadEvent) {
    const m = this.getMsgsByOriginAndNonce(...e.originAndNonce());

    if (m) {
      if (m.state < MsgState.Received) {
        m.state = MsgState.Received;
        m.timings.received(e.ts);
        this.addToSyncQueue(m.hash);
      }
    }
  }

  add(m: NomadMessage) {
    const index = this.messages.length;
    this.msgToIndex.set(m.hash, index);
    const msgByOriginAndRoot = this.msgByOriginAndRoot.get(m.originAndRoot);
    if (msgByOriginAndRoot) {
      msgByOriginAndRoot.push(index);
    } else {
      this.msgByOriginAndRoot.set(m.originAndRoot, [index]);
    }

    this.messages.push(m);
  }

  getMsg(id: string | number): NomadMessage | undefined {
    if (typeof id === "string") {
      const msgIndex = this.msgToIndex.get(id);
      if (msgIndex) return this.messages[msgIndex];
    } else {
      return this.messages[id];
    }
    return undefined;
  }

  getMsgsByOriginAndRoot(origin: number, root: string): NomadMessage[] {
    const originAndRoot = `${origin}${root}`;
    const msgIndexs = this.msgByOriginAndRoot.get(originAndRoot);
    if (msgIndexs) return msgIndexs.map((msgIndex) => this.messages[msgIndex]);
    return [];
  }

  getMsgsByOriginAndNonce(
    origin: number,
    nonce: number
  ): NomadMessage | undefined {
    return this.messages.find((m) => m.nonce === nonce && m.origin === origin);
  }

  stats(): Statistics {
    const collector = new StatisticsCollector(this.domains);

    this.messages.forEach((m) => {
      collector.contributeToCount(m);
    });

    this.messages.slice(this.messages.length - 50).forEach((m) => {
      collector.contributeToTime(m);
    });

    return collector.stats();
  }
}
