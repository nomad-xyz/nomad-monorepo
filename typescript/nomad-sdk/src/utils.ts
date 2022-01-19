import { arrayify, BytesLike, hexlify } from '@ethersproject/bytes';
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk';
import {
  SafeEthersSigner,
  SafeEthersSignerOptions,
  SafeService,
} from '@gnosis.pm/safe-ethers-adapters';
import { ethers } from 'ethers';

export type Address = string;

// Hex domains calculated using `getHexDomainFromString`
const chainIdToDomainMapping: Map<number, number> = new Map([
  [1, 0x657468], // Ethereum ('eth interpreted as int)
  [1284, 0x6265616d], // Moonbeam ('beam interpreted as int)
]);

/**
 * Converts a chain id (listed at at chainlist.org) to a Nomad domain.
 *
 * @param chainId A chain id number
 * @returns A Nomad domain number in decimal
 */
export function chainIdToDomain(chainId: number): number {
  const domain = chainIdToDomainMapping.get(chainId);
  if (!domain)
    throw new Error(
      `Cannot find corresponding Nomad domain for chainId ${chainId}`,
    );

  return domain;
}

/**
 * Converts a string (e.g. "eth" for Ethereum) to a Nomad domain displayed as
 * a hex string.
 * @dev Interprets string bytes as int.
 * @param name The chain string
 * @returns A 0x prefixed Nomad domain in hex (string)
 */
export function getHexDomainFromString(name: string): string {
  const domain = getDomainFromString(name);
  return '0x' + domain.toString(16);
}

/**
 * Converts a string (e.g. "eth" for Ethereum) to a decimal formatted Nomad
 * domain.
 * @dev Interprets string bytes as int.
 * @param name The chain string
 * @returns A Nomad domain number in decimal
 */
export function getDomainFromString(name: string): number {
  const buf = Buffer.alloc(4);
  const offset = 4 - name.length;
  buf.write(name, offset > 0 ? offset : 0, 'utf8');
  return buf.readUInt32BE(0);
}

/**
 * Converts a 20-byte (or other length) ID to a 32-byte ID.
 * Ensures that a bytes-like is 32 long. left-padding with 0s if not.
 *
 * @param data A string or array of bytes to canonize
 * @returns A Uint8Array of length 32
 * @throws if the input is undefined, or not exactly 20 or 32 bytes long
 */
export function canonizeId(data?: BytesLike): Uint8Array {
  if (!data) throw new Error('Bad input. Undefined');

  const buf = ethers.utils.arrayify(data);
  if (buf.length > 32) throw new Error('Too long');
  if (buf.length !== 20 && buf.length != 32) {
    throw new Error('bad input, expect address or bytes32');
  }
  return ethers.utils.zeroPad(buf, 32);
}

/**
 * Converts an Nomad ID of 20 or 32 bytes to the corresponding EVM Address.
 *
 * For 32-byte IDs this enforces the EVM convention of using the LAST 20 bytes.
 *
 * @param data The data to truncate
 * @returns A 20-byte, 0x-prepended hex string representing the EVM Address
 * @throws if the data is not 20 or 32 bytes
 */
export function evmId(data: BytesLike): Address {
  const u8a = arrayify(data);

  if (u8a.length === 32) {
    return hexlify(u8a.slice(12, 32));
  } else if (u8a.length === 20) {
    return hexlify(u8a);
  } else {
    throw new Error(`Invalid id length. expected 20 or 32. Got ${u8a.length}`);
  }
}

/**
 * Sleep async for some time.
 *
 * @param ms the number of milliseconds to sleep
 * @returns A delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap an ethers Signer in a Gnosis Safe signer
 * @param safeAddress The address of the Gnosis Safe
 * @param signer The ethers signer to wrap. This signer SHOULD have ownership
 * rights over the safe.
 * @param serviceUrl The URL of the gnosis transaction service
 * @param options { pollingDelay?: number; }
 * @returns An ethers Signer connected to a gnosis safe
 */
export async function toSafeSigner(
  safeAddress: Address,
  signer: ethers.Signer,
  serviceUrl: string,
  options?: SafeEthersSignerOptions,
): Promise<SafeEthersSigner> {
  if (!signer.provider) throw new Error('No provider specified');
  const service = new SafeService(serviceUrl);
  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });
  const safe = await Safe.create({ ethAdapter, safeAddress });
  return new SafeEthersSigner(safe, service, signer.provider, options);
}
