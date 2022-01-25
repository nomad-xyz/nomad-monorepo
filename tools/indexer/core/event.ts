import { ethers } from "ethers";

export enum ContractType {
  Home = "home",
  Replica = "replica",
  BridgeRouter = "bridgeRouter",
}

export enum EventType {
  HomeDispatch = "homeDispatch",
  HomeUpdate = "homeUpdate",
  ReplicaUpdate = "replicaUpdate",
  ReplicaProcess = "replicaProcess",
  BridgeRouterSend = "bridgeRouterSend",
  BridgeRouterReceive = "bridgeRouterReceive",
}

export enum EventSource {
  Fetch = "fetch",
  Storage = "storage",
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
  // Bridge router options
  token?: string;
  from?: string;
  toDomain?: number;
  toId?: string;
  amount?: ethers.BigNumber;
  fastLiquidityEnabled?: boolean;
  originAndNonce?: ethers.BigNumber;
  recipient?: string;
  liquidityProvider?: string;
  evmHash?: string;
};

export class NomadEvent {
  domain: number;
  eventType: EventType;
  contractType: ContractType;
  replicaOrigin: number;
  ts: number;
  eventData: EventData;
  block: number;
  source: EventSource;

  constructor(
    domain: number,
    eventType: EventType,
    contractType: ContractType,
    replicaOrigin: number,
    ts: number,
    eventData: EventData,
    block: number,
    source: EventSource
  ) {
    this.domain = domain;
    this.eventType = eventType;
    this.contractType = contractType;
    this.replicaOrigin = replicaOrigin;
    this.ts =
      /*source === EventSource.Fetch && */ contractType == ContractType.Home ||
      contractType == ContractType.BridgeRouter
        ? ts - 45000
        : ts; // if the event was fetched from RPC for past (we asked RPC when event happened) happened on another chain we want to make sure that event at chain of origin happened before it was relayed to destination
    this.eventData = eventData;
    this.block = block;
    this.source = source;
  }

  destinationAndNonce(): [number, number] {
    if (this.eventType !== EventType.HomeDispatch) {
      throw new Error(
        `Destination method is not availiable for non home-dispatch`
      );
    }
    const [destination, nonce] = parseDestinationAndNonce(
      this.eventData.destinationAndNonce!
    );
    return [destination, nonce];
  }

  originAndNonce(): [number, number] {
    if (this.eventType !== EventType.BridgeRouterReceive) {
      throw new Error(
        `Destination method is not availiable for non BridgeRouterReceive`
      );
    }
    const [origin, nonce] = parseDestinationAndNonce(
      this.eventData.originAndNonce!
    );
    return [origin, nonce];
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
    };
  }

  static fromObject(v: any): NomadEvent {
    const e = v as {
      domain: number;
      eventType: EventType;
      contractType: ContractType;
      replicaOrigin: number;
      ts: number;
      eventData: EventData;
      block: number;
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
    );
  }
}

function parseDestinationAndNonce(
  h: ethers.BigNumber | { hex?: string; _hex?: string }
): [number, number] {
  let hexString = "";
  if (h instanceof ethers.BigNumber) {
    hexString = h.toHexString();
  } else {
    const hex = h.hex || h._hex;
    if (!hex) throw new Error(`Has no hex: ${JSON.stringify(h)}`);
    hexString = hex;
  }

  const without0x = hexString.slice(2);
  const destinationLength = without0x.length - 8;
  const destinationHex = ethers.BigNumber.from(
    "0x" + without0x.slice(0, destinationLength)
  );
  const nonceHex = ethers.BigNumber.from(
    "0x" + without0x.slice(destinationLength)
  );
  return [destinationHex.toNumber(), nonceHex.toNumber()];
}
