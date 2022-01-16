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

export class NomadEvent {
    domain: number;
    eventType: EventType;
    contractType: ContractType;
    replicaOrigin: number;
    ts: number;
    eventData: Object;
    block: number;

    constructor(domain: number, eventType: EventType, contractType: ContractType, replicaOrigin: number, ts: number, eventData: Object, block: number) {
        this.domain = domain;
        this.eventType = eventType;
        this.contractType = contractType;
        this.replicaOrigin = replicaOrigin;
        this.ts = ts;
        this.eventData = eventData;
        this.block = block;
        console.log(`New event at block`, block, new Date(ts));
    }
}