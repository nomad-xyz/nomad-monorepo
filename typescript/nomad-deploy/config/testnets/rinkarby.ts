import * as dotenv from 'dotenv';

import { ChainJson, toChain } from '../../src/chain';
import { CoreConfig } from '../../src/core/CoreDeploy';
import { BridgeConfig } from '../../src/bridge/BridgeDeploy';

dotenv.config();

const rpc = process.env.RINKARBY_RPC;
if (!rpc) {
  throw new Error('Missing RPC URI');
}

const chainJson: ChainJson = {
  name: 'rinkarby',
  rpc,
  deployerKey: process.env.RINKARBY_DEPLOYER_KEY,
  domain: 4000,
  gasPrice: 0,
  gasLimit: 600_000_000,
  chunk: 2000,
  timelag: 20,
};

export const chain = toChain(chainJson);

export const devConfig: CoreConfig = {
  environment: 'dev',
  updater: '0x4177372FD9581ceb2367e0Ce84adC5DAD9DF8D55',
  watchers: ['0x20aC2FD664bA5406A7262967C34107e708dCb18E'],
  recoveryManager: '0x24F6c874F56533d9a1422e85e5C7A806ED11c036',
  optimisticSeconds: 10,
  recoveryTimelock: 180,
  processGas: 850_000 * 100,
  reserveGas: 15_000 * 100,
};

export const stagingConfig: CoreConfig = {
  environment: 'staging',
  updater: '0x201dd86063Dc251cA5a576d1b7365C38e5fB4CD5',
  watchers: ['0x22B2855635154Baa41C306BcA979C8c9a077A180'],
  recoveryManager: '0x24F6c874F56533d9a1422e85e5C7A806ED11c036',
  optimisticSeconds: 10,
  recoveryTimelock: 180,
  processGas: 850_000 * 100,
  reserveGas: 15_000 * 100,
};

export const bridgeConfig: BridgeConfig = {
  // weth: 'TODO',
};
