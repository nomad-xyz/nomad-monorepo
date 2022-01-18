import { ethers } from 'ethers';
import { EventType, NomadEvent } from './event';

export abstract class Consumer {
  abstract consume(...evens: NomadEvent[]): void;
  abstract stats(): void;
}

enum MsgState {
  Dispatched,
  Updated,
  Relayed,
  Processed,
}

class NomadMessage {
  origin: number;
  destination: number;
  root: string;
  hash: string;
  leafIndex: ethers.BigNumber;
  destinationAndNonce: ethers.BigNumber;
  message: string;

  state: MsgState;

  constructor(
    origin: number,
    destination: number,
    root: string,
    hash: string,
    leafIndex: ethers.BigNumber,
    destinationAndNonce: ethers.BigNumber,
    message: string,
  ) {
    this.origin = origin;
    this.destination = destination;
    this.root = root;
    this.hash = hash;
    this.leafIndex = leafIndex;
    this.destinationAndNonce = destinationAndNonce;
    this.message = message;

    this.state = MsgState.Dispatched;
  }

  get originAndRoot(): string {
    return `${this.origin}${this.root}`;
  }
}

export class Processor extends Consumer {
  messages: NomadMessage[];
  msgToIndex: Map<string, number>;
  msgByOriginAndRoot: Map<string, number[]>;
  consumed: number; // for debug

  constructor() {
    super();
    this.messages = [];
    this.msgToIndex = new Map();
    this.msgByOriginAndRoot = new Map();
    this.consumed = 0;
  }

  consume(...events: NomadEvent[]): void {
    console.log(`Going to consume`, events.length, `events`);
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
    );
    this.add(m);
  }

  homeUpdate(e: NomadEvent) {
    const ms = this.getMsgsByOriginAndRoot(e.domain, e.eventData.oldRoot!);
    if (ms.length) ms.forEach(m => {
        if (m.state < MsgState.Updated) m.state = MsgState.Updated;
    });
  }

  replicaUpdate(e: NomadEvent) {
    const ms = this.getMsgsByOriginAndRoot(e.replicaOrigin, e.eventData.oldRoot!);
    if (ms.length) ms.forEach(m => {
        if (m.state < MsgState.Relayed) m.state = MsgState.Relayed
    });
  }

  process(e: NomadEvent) {
    const m = this.getMsg(e.eventData.messageHash!);
    if (m) {
        if (m.state < MsgState.Processed) m.state = MsgState.Processed;
    }
  }

  add(m: NomadMessage) {
    const index = this.messages.length;
    this.msgToIndex.set(m.hash, index);
    const x = this.msgByOriginAndRoot.get(m.originAndRoot);
    if (x) {
        x.push(index)
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

  getMsgsByOriginAndRoot(
    origin: number,
    root: string,
  ): NomadMessage[] {
    const originAndRoot = `${origin}${root}`;
    const msgIndexs = this.msgByOriginAndRoot.get(originAndRoot);
    if (msgIndexs) return msgIndexs.map(msgIndex => this.messages[msgIndex])
    return [];
  }

  stats(): void {
    let dispatched = 0;
    let updated = 0;
    let relayed = 0;
    let processed = 0;

    this.messages.forEach((m) => {
      switch (m.state) {
        case MsgState.Dispatched:
          dispatched += 1;
          break;
        case MsgState.Updated:
          updated += 1;
          break;
        case MsgState.Relayed:
          relayed += 1;
          break;
        case MsgState.Processed:
          processed += 1;
          break;
        default:
          break;
      }
    });
    console.log(
      `D:`,
      dispatched,
      `U:`,
      updated,
      `R:`,
      relayed,
      `P:`,
      processed,
    );
  }
}

export class Logger extends Consumer {
  i: number;

  constructor() {
    super();
    this.i = 0;
  }

  consume(event: NomadEvent): void {}

  stats(): void {
    console.log(`this.i:`, this.i);
  }
}
