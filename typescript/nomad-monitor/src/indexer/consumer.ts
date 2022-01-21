import { parseMessage } from '@nomad-xyz/sdk/src/nomad/messages/NomadMessage';
import { ethers } from 'ethers';
import { EventType, NomadEvent } from './event';
import { Statistics } from './types';

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

  contributeProcessTimings(m: NomadMessage) {
    this.contributeRelayTimings(m);
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
  Processed,
}

class Timings {
  dispatchedAt: number;
  updatedAt: number;
  relayedAt: number;
  processedAt: number;

  constructor(ts: number) {
    this.dispatchedAt = ts;
    this.updatedAt = 0;
    this.relayedAt = 0;
    this.processedAt = 0;
  }

  updated(ts: number) {
    this.updatedAt = ts;
  }

  relayed(ts: number) {
    this.relayedAt = ts;
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

  inProcessed(): number | undefined {
    if (this.processedAt) {
      return (
        this.processedAt -
        (this.relayedAt || this.updatedAt || this.dispatchedAt)
      ); // because of the problem with time that it is not ideal from RPC we could have skipped some stages. we take the last available
    }
    return undefined;
  }

  e2e(): number | undefined {
    if (this.processedAt) {
      return (
        this.processedAt -
        (this.dispatchedAt || this.updatedAt || this.relayedAt)
      ); // same as for .inRelayed() and .inProcessed() but opposit order
    }
    return undefined;
  }
}

function bytes32ToAddress(s: string) {
  return '0x'+s.slice(26)
}

class NomadMessage {
  origin: number;
  destination: number;
  root: string;
  hash: string;
  leafIndex: ethers.BigNumber;
  destinationAndNonce: ethers.BigNumber;
  raw: string;
  nomadSender: string;
  nomadRecipient: string;
  bridgeMsgType?: string;
  bridgeMsgTo?: string;
  bridgeMsgAmount?: ethers.BigNumber;
  bridgeMsgAllowFast?: boolean;
  bridgeMsgDetailsHash?: string;
  bridgeMsgTokenDomain?: number;
  bridgeMsgTokenId?: string;
  state: MsgState;
  timings: Timings;

  constructor(
    origin: number,
    destination: number,
    root: string,
    hash: string,
    leafIndex: ethers.BigNumber,
    destinationAndNonce: ethers.BigNumber,
    message: string,
    createdAt: number,
  ) {
    this.origin = origin;
    this.destination = destination;
    this.root = root;
    this.hash = hash;
    this.leafIndex = leafIndex;
    this.destinationAndNonce = destinationAndNonce;
    this.raw = message;
    const parsed = parseMessage(message);
    this.nomadSender = parsed.sender;
    this.nomadRecipient = parsed.recipient;
    try {
      const bridgeMessage = parseBody(parsed.body);
      this.bridgeMsgType = bridgeMessage.action.type as string;
      this.bridgeMsgTo = bridgeMessage.action.to;
      this.bridgeMsgAmount = bridgeMessage.action.amount;
      this.bridgeMsgAllowFast = bridgeMessage.action.allowFast;
      this.bridgeMsgDetailsHash = bridgeMessage.action.detailsHash;
      this.bridgeMsgTokenDomain = bridgeMessage.token.domain as number;
      this.bridgeMsgTokenId = bridgeMessage.token.id as string;
    } catch(e) {
      // pass
    }
    
    this.state = MsgState.Dispatched;
    this.timings = new Timings(createdAt);
  }

  get originAndRoot(): string {
    return `${this.origin}${this.root}`;
  }

  intoDB(): [string, number, number, string, string, string, number, number, number, number, number, string | undefined, string | undefined, string | undefined, boolean | undefined, string | undefined , number | undefined, string | undefined
  ] {
    return [
      this.hash,
      this.origin,
      this.destination,
      bytes32ToAddress(this.nomadSender),
      bytes32ToAddress(this.nomadRecipient),
      this.root,
      this.state,
      this.timings.dispatchedAt,
      this.timings.updatedAt,
      this.timings.relayedAt,
      this.timings.processedAt,
      this.bridgeMsgType,
      this.bridgeMsgTo ? bytes32ToAddress(this.bridgeMsgTo): undefined,
      this.bridgeMsgAmount?.toString(),
      this.bridgeMsgAllowFast,
      this.bridgeMsgDetailsHash,
      this.bridgeMsgTokenDomain,
      this.bridgeMsgTokenId ? bytes32ToAddress(this.bridgeMsgTokenId): undefined,
    ]
  }
}

import {Pool} from 'pg';
import { parseBody } from '@nomad-xyz/sdk/src/nomad/messages/BridgeMessage';

// expand(3, 2) returns "($1, $2), ($3, $4), ($5, $6)" 
function expand(rowCount: number, columnCount: number, startAt=1){
  var index = startAt
  return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ")
}

class DBDriver {
  pool: Pool;
  syncedOnce: boolean;

  constructor() {
    this.pool = new Pool();
    this.syncedOnce = false;
  }

  async connect() {
    await this.pool.connect()
  }

  get startupSync() {
    const value = this.syncedOnce;
    this.syncedOnce = true;
    return !value;
  }

  async insert(messages: NomadMessage[]) {
    const rows = messages.length;
    if (!rows) return ;
    const columns = 18;
    const query = `INSERT INTO messages (hash, origin, destination, sender, recipient, root, state, dispatched_at, updated_at, relayed_at, processed_at, bridge_msg_type, bridge_msg_to, bridge_msg_amount, bridge_msg_allow_fast, bridge_msg_details_hash, bridge_msg_token_domain, bridge_msg_token_id) VALUES ${expand(rows, columns)};`;
    const values = messages.map(m => m.intoDB()).flat();
    return await this.pool.query(query, values)
  }

  async update(messages: NomadMessage[]) {
    const rows = messages.length;
    if (!rows) return ;
    const promises = messages.map(m => {
      const query = `UPDATE messages SET
      origin = $2,
      destination = $3,
      sender = $4,
      recipient = $5,
      root = $6,
      state = $7,
      dispatched_at = $8,
      updated_at = $9,
      relayed_at = $10,
      processed_at = $11,
      bridge_msg_type = $12,
      bridge_msg_to = $13,
      bridge_msg_amount = $14,
      bridge_msg_allow_fast = $15,
      bridge_msg_details_hash = $16,
      bridge_msg_token_domain = $17,
      bridge_msg_token_id = $18
      WHERE hash = $1
      `;
      return this.pool.query(query, m.intoDB());
    })

    return await Promise.all(promises);
  }

  async getExistingHashes(): Promise<string[]> {
    const res = await this.pool.query(`select hash from messages;`);
    return res.rows.map(r => r.hash) as string[]
  }

}

enum DBAction{
  Insert,
  Update,
}

export class Processor extends Consumer {
  messages: NomadMessage[];
  msgToIndex: Map<string, number>;
  msgByOriginAndRoot: Map<string, number[]>;
  consumed: number; // for debug
  domains: number[];
  syncInsertQueue: string[];
  syncUpdateQueue: string[];
  db: DBDriver;

  constructor() {
    super();
    this.messages = [];
    this.msgToIndex = new Map();
    this.msgByOriginAndRoot = new Map();
    this.consumed = 0;
    this.domains = [];
    this.syncInsertQueue = [];
    this.syncUpdateQueue = [];

    this.db = new DBDriver();
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
      }

      this.consumed += 1;
    }

    await this.sync()
  }

  async sync() {
    const [inserts, updates] = await this.getMsgForSync();
    console.log(inserts.filter(i => !i).length)
    await Promise.all([this.db.insert(inserts), this.db.update(updates)])
  }

  addToSyncQueue(hash: string, action: DBAction) {
    if (this.syncInsertQueue.indexOf(hash) < 0 && this.syncUpdateQueue.indexOf(hash) < 0) {
      if (action == DBAction.Insert) this.syncInsertQueue.push(hash)
      else this.syncUpdateQueue.push(hash)
    }
  }

  async getMsgForSync(): Promise<[NomadMessage[], NomadMessage[]]> {
    let existingHashes: string[] = [];
    if (this.db.startupSync) {
      existingHashes = await this.db.getExistingHashes();
      this.syncUpdateQueue.push(
        ...this.syncInsertQueue.filter(hash => existingHashes.indexOf(hash) >= 0)
      )
    }
    const inserts = this.syncInsertQueue.filter(hash => this.syncUpdateQueue.indexOf(hash) < 0).map(hash => this.getMsg(hash)!).filter(m=>!!m);
    this.syncInsertQueue = [];
    const updates = this.syncUpdateQueue.map(hash => this.getMsg(hash)!).filter(m=>!!m);
    this.syncUpdateQueue = [];
    return [inserts, updates];
  }

  dispatched(e: NomadEvent) {
    const m = new NomadMessage(
      e.domain,
      e.destination(),
      e.eventData.committedRoot!,
      e.eventData.messageHash!,
      e.eventData.leafIndex!,
      e.eventData.destinationAndNonce!,
      e.eventData.message!,
      e.ts,
    );
    this.add(m);
    this.addToSyncQueue(m.hash, DBAction.Insert);

    if (!this.domains.includes(e.domain)) this.domains.push(e.domain);
  }

  homeUpdate(e: NomadEvent) {
    const ms = this.getMsgsByOriginAndRoot(e.domain, e.eventData.oldRoot!);
    if (ms.length)
      ms.forEach((m) => {
        if (m.state < MsgState.Updated) {
          m.state = MsgState.Updated;
          m.timings.updated(e.ts);
          this.addToSyncQueue(m.hash, DBAction.Update);
        }
      });
  }

  replicaUpdate(e: NomadEvent) {
    const ms = this.getMsgsByOriginAndRoot(
      e.replicaOrigin,
      e.eventData.oldRoot!,
    );
    if (ms.length)
      ms.forEach((m) => {
        if (m.state < MsgState.Relayed) {
          m.state = MsgState.Relayed;
          m.timings.relayed(e.ts);
          this.addToSyncQueue(m.hash, DBAction.Update);
        }
      });
  }

  process(e: NomadEvent) {
    const m = this.getMsg(e.eventData.messageHash!);
    if (m) {
      if (m.state < MsgState.Processed) {
        m.state = MsgState.Processed;
        m.timings.processed(e.ts);
        this.addToSyncQueue(m.hash, DBAction.Update);
      }
    }
  }

  add(m: NomadMessage) {
    const index = this.messages.length;
    this.msgToIndex.set(m.hash, index);
    const x = this.msgByOriginAndRoot.get(m.originAndRoot);
    if (x) {
      x.push(index);
    } else {
      this.msgByOriginAndRoot.set(m.originAndRoot, [index]);
    }
    this.messages.push(m);
  }

  getMsg(id: string | number): NomadMessage | undefined {
    if (typeof id === 'string') {
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
