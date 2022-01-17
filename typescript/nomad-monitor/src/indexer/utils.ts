import { ethers } from 'ethers';
import { NomadEvent } from './event';
import fs from 'fs';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retry<T>(
  callback: () => Promise<T>,
  tries: number,
): Promise<[T | undefined, any]> {
  let timeout = 3000;
  let lastError: any = undefined;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return [await callback(), undefined];
    } catch (e) {
      lastError = e;
      await sleep(timeout * 2 ** attempt);
    }
  }
  return [undefined, lastError];
}

export function replacer(key: any, value: any): any {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else if (value instanceof NomadEvent) {
    return {
      dataType: 'NomadEvent',
      value: value.toObject(), // or with spread: value: [...value]
    };
  } else if (value instanceof ethers.BigNumber) {
    return {
      dataType: 'BigNumber',
      value: value.toHexString(), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

export function reviver(key: any, value: any): any {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    } else if (value.dataType === 'NomadEvent') {
      return NomadEvent.fromObject(value.value);
    } else if (value.dataType === 'BigNumber') {
      return ethers.BigNumber.from(value.value);
    }
  }
  return value;
}

export class KVCache<K, V> {
  m: Map<K, V>;
  path: string;

  constructor(path: string) {
    this.m = new Map();
    this.path = path;
    this.tryLoad();
  }

  save() {
    fs.writeFileSync(this.path, JSON.stringify(this.m, replacer));
  }

  tryLoad() {
    try {
      this.m = JSON.parse(fs.readFileSync(this.path, 'utf8'), reviver);
    } catch (_) {}
  }

  set(k: K, v: V) {
    this.m.set(k, v);
    this.save();
  }

  get(k: K): V | undefined {
    return this.m.get(k);
  }
}

export function logToFile(s: string) {
  fs.appendFileSync('/tmp/log.log', s + '\n');
}