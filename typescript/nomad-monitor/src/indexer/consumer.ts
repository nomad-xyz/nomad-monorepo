import { ethers } from "ethers";
import { EventType, NomadEvent } from "./event";
import fs from 'fs';
import { replacer } from "./utils";

export abstract class Consumer {
    abstract consume(event: NomadEvent): void;
    abstract stats(): void;
}

function xxx(s: string) {
    fs.appendFileSync('/tmp/lol.txt', s+'\n');
}

// function toBigNumber(c: TypedContainer | ethers.BigNumber): ethers.BigNumber | undefined {
//     if (c instanceof ethers.BigNumber) {
//         return c
//     } else {
//         if (c.type === 'BigNumber' && c.hex) {
//             return ethers.BigNumber.from(c.hex)
//         }
//         return undefined
//     }
// }

// type TypedContainer = {
//     type: string;
//     hex?: string;
// }


// type HomeDispatchEvent = {
//     committedRoot: string;
//     messageHash: string;
//     leafIndex: ethers.BigNumber;
//     destinationAndNonce: ethers.BigNumber;
//     message: string;
//   };
  
//   type HomeUpdateEvent = {
//     homeDomain: number;
//     oldRoot: string;
//     newRoot: string;
//     signature: string;
//   };
  
//   type ReplicaUpdateEvent = {
//     homeDomain: number;
//     oldRoot: string;
//     newRoot: string;
//     signature: string;
//   };
  
//   type ReplicaProcessEvent = {
//     messageHash: string;
//     success: boolean;
//     returnData: string;
//   };
  
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
      message: string
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
    msgByOriginAndRoot: Map<string, number>;
    consumed: number; // for debug

    constructor() {
        super();
        this.messages = [];
        this.msgToIndex = new Map();
        this.msgByOriginAndRoot = new Map();
        this.consumed = 0;
    }

    consume(event: NomadEvent): void {

        this.kek(event);

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

    kek(event: NomadEvent) {
        if (event.eventData.messageHash === '0x12079a921d759348aa6c300c02376d66eadfac53015ba9a7db0c243826ba402c') {
            xxx(`${this.consumed} matched hash: ${JSON.stringify(event, replacer)}`)
        } else if (event.eventData.oldRoot === '0xe0115dc26c3c8632490cd9c6c2ce8426ab0ba0cc29fa060be691267f68571ce3') {
            xxx(`${this.consumed} matched root: ${JSON.stringify(event, replacer)}`)
        }
    }

    dispatched(e: NomadEvent) {
        // const b = e.eventData as HomeDispatchEvent;
        const m = new NomadMessage(
          e.domain,
          e.destination(),
          e.eventData.committedRoot!,
          e.eventData.messageHash!,
          e.eventData.leafIndex!,
          e.eventData.destinationAndNonce!,
          e.eventData.message!
        );
        this.add(m);
    }

    homeUpdate(e: NomadEvent) {
        // const b = e.eventData as HomeUpdateEvent;
        const m = this.getMsgByOriginAndRoot(e.domain, e.eventData.oldRoot!);
        if (m) m.state = MsgState.Updated;
    }
    
    replicaUpdate(e: NomadEvent) {
        // const b = e.eventData as ReplicaUpdateEvent;
        const m = this.getMsgByOriginAndRoot(e.replicaOrigin, e.eventData.oldRoot!);
        if (m) m.state = MsgState.Relayed;
    }
    
    process(e: NomadEvent) {
        // const b = e.eventData as ReplicaProcessEvent;
        const m = this.getMsg(e.eventData.messageHash!);
        if (m) m.state = MsgState.Processed;
    }

    add(m: NomadMessage) {
        const index = this.messages.length;
        this.msgToIndex.set(m.hash, index);
        this.msgByOriginAndRoot.set(m.originAndRoot, index);
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
    
      mustGetMsg(id: string | number): NomadMessage {
        const m = this.getMsg(id);
        if (!m) throw new Error(`Message not found`);
        return m;
      }
    
      getMsgByOriginAndRoot(
        origin: number,
        root: string
      ): NomadMessage | undefined {
        const originAndRoot = `${origin}${root}`;
        const msgIndex = this.msgByOriginAndRoot.get(originAndRoot);
        if (msgIndex) return this.messages[msgIndex];
        return undefined;
      }
    
      mustGetMsgByOriginAndRoot(origin: number, root: string): NomadMessage {
        const m = this.getMsgByOriginAndRoot(origin, root);
        if (!m) throw new Error(`Msg not found by origin and root`);
        return m;
      }

    //   run() {
    //     while (true) {
    //       const event = this.r.next();
    //       if (!event) {
    //         break;
    //       } else if (event.eventType === EventType.HomeDispatched) {
    //         this.dispatched(event);
    //       } else if (event.eventType === EventType.HomeUpdated) {
    //         this.homeUpdate(event);
    //       } else if (event.eventType === EventType.ReplicaUpdated) {
    //         this.replicaUpdate(event);
    //       } else if (event.eventType === EventType.ReplicaProcessed) {
    //         this.process(event);
    //       }
    //     }
    //   }

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
          processed
        );

        console.log(this.getMsg('0x12079a921d759348aa6c300c02376d66eadfac53015ba9a7db0c243826ba402c'))

        console.log(this.messages.filter(m => m.state == MsgState.Updated).slice(0,5).map(m=> m.hash))
    
        // console.log(`x->\n`, this.messages.filter(m => m.state === MsgState.Dispatched)[0]);
        // console.log(`1650811245->\n`, this.messages.filter(m => m.origin === 1650811245));
        // console.log(`6648936->\n`, this.messages.filter(m => m.origin === 6648936).length);
      }
}



export class Logger extends Consumer {
    i: number;

    constructor() {
        super();
        this.i = 0;
    }

    consume(event: NomadEvent): void {
        // console.log(this.i ++, '---->', event);
    }

    stats(): void {console.log(`this.i:`, this.i)}
}