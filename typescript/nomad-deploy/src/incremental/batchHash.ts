// TODO: thats a copy-paste from tests. Remove after James moves it into SDK

import { ethers } from 'ethers';

export type CallData = {
  to: string;
  data: string;
};

export function getHexStringByteLength(hexStr: string) {
  let len = hexStr.length;

  // check for prefix, remove if necessary
  if (hexStr.slice(0, 2) == '0x') {
    len -= 2;
  }

  // divide by 2 to get the byte length
  return len / 2;
}

function serializeCall(call: CallData): string {
  const { to, data } = call;
  const dataLen = getHexStringByteLength(data);

  if (!to || !data) {
    throw new Error(`Missing data in Call: \n  ${call}`);
  }

  return ethers.utils.solidityPack(
    ['bytes32', 'uint32', 'bytes'],
    [to, dataLen, data],
  );
}

function serializeCalls(batch: CallData[]): string {
  return ethers.utils.hexConcat([
    [batch.length % 256], // length in a 1-element Uint8Array
    ...batch.map(serializeCall), // each serialized call in turn
  ]);
}

export function batchHash(callsData: CallData[]): string {
  return ethers.utils.keccak256(serializeCalls(callsData));
}
