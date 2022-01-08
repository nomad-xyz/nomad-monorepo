import { ethers } from 'ethers';
import { Call } from '.';

export function byteLength(bytesLike: ethers.utils.BytesLike): number {
  return ethers.utils.arrayify(bytesLike).length;
}

export function serializeCall(call: Call): string {
  const { to, data } = call;
  const dataLen = byteLength(data);

  if (!to || !data) {
    throw new Error(`Missing data in Call: \n  ${call}`);
  }

  return ethers.utils.solidityPack(
    ['bytes32', 'uint32', 'bytes'],
    [to, dataLen, data],
  );
}

export function serializeCalls(batch: Call[]): string {
  return ethers.utils.hexConcat([
    [batch.length % 256],
    ...batch.map(serializeCall), // each serialized call in turn
  ]);
}

export function batchHash(callsData: Call[]): string {
  return ethers.utils.keccak256(serializeCalls(callsData));
}
