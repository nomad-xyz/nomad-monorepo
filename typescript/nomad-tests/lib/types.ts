import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TokenIdentifier } from '@nomad-xyz/sdk/nomad';
import { BytesLike, ethers } from 'ethers';
import { BridgeMessageTypes } from './bridge';

/********* HRE *********/

export interface HardhatNomadHelpers {
  formatMessage: Function;
  governance: {
    serializeCall: Function;
    serializeCalls: Function;
    formatTransferGovernor: Function;
    formatSetRouter: Function;
    formatBatch: Function;
  };
  messageHash: Function;
  ethersAddressToBytes32: Function;
  domainAndNonce: Function;
  domainHash: Function;
  signedFailureNotification: Function;
}

export interface HardhatBridgeHelpers {
  BridgeMessageTypes: typeof BridgeMessageTypes;
  typeToByte: Function;
  MESSAGE_LEN: MessageLen;
  serializeTransferAction: Function;
  serializeFastTransferAction: Function;
  serializeAction: Function;
  serializeTokenId: Function;
  serializeMessage: Function;
  getDetailsHash: Function;
}

declare module 'hardhat/types/runtime' {
  interface HardhatRuntimeEnvironment {
    nomad: HardhatNomadHelpers;
    bridge: HardhatBridgeHelpers;
  }
}

/********* BASIC TYPES *********/
export type Domain = number;
export type Address = string;
export type AddressBytes32 = string;
export type HexString = string;
export type Signer = SignerWithAddress;
export type BytesArray = [
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
  BytesLike,
];

/********* NOMAD CORE *********/
export type Update = {
  oldRoot: string;
  newRoot: string;
  signature: string;
};

export type CallData = {
  to: Address;
  data: string;
};

export type FailureNotification = {
  domainCommitment: string;
  domain: number;
  updaterBytes32: string;
};

export type SignedFailureNotification = {
  failureNotification: FailureNotification;
  signature: string;
};

/********* TOKEN BRIDGE *********/

export type MessageLen = {
  identifier: number;
  tokenId: number;
  transfer: number;
};

export type Action = TransferAction | FastTransferAction;

export type Message = {
  tokenId: TokenIdentifier;
  action: Action;
};

export type TransferAction = {
  type: BridgeMessageTypes.TRANSFER;
  recipient: ethers.BytesLike;
  amount: number | ethers.BytesLike;
  detailsHash: ethers.BytesLike;
};

export type FastTransferAction = {
  type: BridgeMessageTypes.FAST_TRANSFER;
  recipient: ethers.BytesLike;
  amount: number | ethers.BytesLike;
  detailsHash: ethers.BytesLike;
};
