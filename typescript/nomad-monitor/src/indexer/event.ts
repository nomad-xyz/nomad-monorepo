import { ethers } from "ethers";

export enum ContractType {
    Home = 'home',
    Replica = 'replica',
}

export enum EventType {
    HomeDispatch = 'homeDispatch',
    HomeUpdate = 'homeUpdate',
    ReplicaUpdate = 'replicaUpdate',
    ReplicaProcess = 'replicaProcess',
}

export enum EventSource {
    Past = 'past',
    New = 'new',
    Storage = 'storage',
}

export type EventData = {
    messageHash?: string;
    leafIndex?: ethers.BigNumber;
    destinationAndNonce?: ethers.BigNumber;
    committedRoot?: string;
    oldRoot?: string;
    newRoot?: string;
    success?: boolean;
    returnData?: ethers.utils.BytesLike;
    message?: string;
    signature?: string;
    homeDomain?: number;
}

export class NomadEvent {
    domain: number;
    eventType: EventType;
    contractType: ContractType;
    replicaOrigin: number;
    ts: number;
    eventData: EventData;
    block: number;
    source: EventSource

    constructor(domain: number, eventType: EventType, contractType: ContractType, replicaOrigin: number, ts: number, eventData: EventData, block: number, source: EventSource) {
        this.domain = domain;
        this.eventType = eventType;
        this.contractType = contractType;
        this.replicaOrigin = replicaOrigin;
        this.ts = ts;
        this.eventData = eventData;
        this.block = block;
        this.source = source;
        // console.log(`New event '${eventType}' at block`, block, new Date(ts));
    }

    destination(): number {
        if (this.eventType !== EventType.HomeDispatch) {
            throw new Error(`Destination method is not availiable for non home-dispatch`)
        }
        // const eventData = this.eventData as {destinationAndNonce: ethers.BigNumber};
        const [destination] = parseDestinationAndNonce(this.eventData.destinationAndNonce!);
        return destination
    }

    toObject() {
        return {
            domain: this.domain, 
            eventType: this.eventType, 
            contractType: this.contractType, 
            replicaOrigin: this.replicaOrigin, 
            ts: this.ts, 
            eventData: this.eventData, 
            block: this.block, 
            source: EventSource.Storage,
        }
    }

    static fromObject(v: any): NomadEvent {
        const e = v as {
            domain: number,
            eventType: EventType,
            contractType: ContractType,
            replicaOrigin: number,
            ts: number,
            eventData: EventData,
            block: number,
        };
        return new NomadEvent(
            e.domain,
            e.eventType,
            e.contractType,
            e.replicaOrigin,
            e.ts,
            e.eventData,
            e.block,
            EventSource.Storage
        )
    }
}

function parseDestinationAndNonce(h: ethers.BigNumber | { hex: string }): [number, number] {
    let hexString = '';
    if (h instanceof ethers.BigNumber) {
        hexString = h.toHexString();
    } else {
        hexString = h.hex;
    }
    
    const without0x = hexString.slice(2);
    const destinationLength = without0x.length - 8;
    const destinationHex = ethers.BigNumber.from('0x' + without0x.slice(0, destinationLength));
    const nonceHex = ethers.BigNumber.from('0x' + without0x.slice(destinationLength));
    return [destinationHex.toNumber(), nonceHex.toNumber()]
}