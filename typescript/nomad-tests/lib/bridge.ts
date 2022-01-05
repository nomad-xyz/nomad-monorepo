import { TokenIdentifier } from '@nomad-xyz/sdk/dist/nomad';
import { assert } from 'chai';
import { ethers } from 'ethers';

import * as types from './types';

function byteLength(str: string) {
  return Buffer.from(str, 'utf-8').length;
}

export enum BridgeMessageTypes {
  INVALID = 0,
  TOKEN_ID,
  MESSAGE,
  TRANSFER,
  FAST_TRANSFER,
}

const typeToByte = (type: number): string => `0x0${type}`;

const MESSAGE_LEN = {
  identifier: 1,
  tokenId: 36,
  transfer: 97,
};

export function getDetailsHash(
  name: string,
  symbol: string,
  decimals: number,
): ethers.BytesLike {
  const details: ethers.BytesLike = ethers.utils.solidityPack(
    ['uint', 'string', 'uint', 'string', 'uint8'],
    [byteLength(name), name, byteLength(symbol), symbol, decimals],
  );
  return ethers.utils.solidityKeccak256(['bytes'], [details]);
}

// Formats Transfer Message
export function formatTransfer(
  to: ethers.BytesLike,
  amnt: number | ethers.BytesLike,
  detailsHash: ethers.BytesLike,
  enableFast: boolean,
): ethers.BytesLike {
  const type = enableFast
    ? BridgeMessageTypes.FAST_TRANSFER
    : BridgeMessageTypes.TRANSFER;
  return ethers.utils.solidityPack(
    ['uint8', 'bytes32', 'uint256', 'bytes32'],
    [type, to, amnt, detailsHash],
  );
}

// Formats the Token ID
export function formatTokenId(domain: number, id: string): ethers.BytesLike {
  return ethers.utils.solidityPack(['uint32', 'bytes32'], [domain, id]);
}

export function formatMessage(
  tokenId: ethers.BytesLike,
  action: ethers.BytesLike,
): ethers.BytesLike {
  return ethers.utils.solidityPack(['bytes', 'bytes'], [tokenId, action]);
}

export function serializeTransferAction(
  transferAction: types.TransferAction,
): ethers.BytesLike {
  const { type, recipient, amount, detailsHash } = transferAction;
  assert(type === BridgeMessageTypes.TRANSFER);
  return formatTransfer(recipient, amount, detailsHash, false);
}

export function serializeFastTransferAction(
  transferAction: types.FastTransferAction,
): ethers.BytesLike {
  const { type, recipient, amount, detailsHash } = transferAction;
  assert(type === BridgeMessageTypes.FAST_TRANSFER);
  return formatTransfer(recipient, amount, detailsHash, true);
}

export function serializeAction(action: types.Action): ethers.BytesLike {
  let actionBytes: ethers.BytesLike = [];
  switch (action.type) {
    case BridgeMessageTypes.TRANSFER: {
      actionBytes = serializeTransferAction(action);
      break;
    }
    case BridgeMessageTypes.FAST_TRANSFER: {
      actionBytes = serializeFastTransferAction(action);
      break;
    }
    default: {
      console.error('Invalid action');
      break;
    }
  }
  return actionBytes;
}

export function serializeTokenId(tokenId: TokenIdentifier): ethers.BytesLike {
  if (typeof tokenId.domain !== 'number' || typeof tokenId.id !== 'string') {
    throw new Error('!types');
  }
  return formatTokenId(tokenId.domain as number, tokenId.id as string);
}

export function serializeMessage(message: types.Message): ethers.BytesLike {
  const tokenId = serializeTokenId(message.tokenId);
  const action = serializeAction(message.action);
  return formatMessage(tokenId, action);
}

export const bridge: types.HardhatBridgeHelpers = {
  BridgeMessageTypes,
  typeToByte,
  MESSAGE_LEN,
  serializeTransferAction,
  serializeFastTransferAction,
  serializeAction,
  serializeTokenId,
  serializeMessage,
  getDetailsHash,
};
