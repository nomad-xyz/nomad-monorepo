import * as dotenv from 'dotenv';

import { ChainJson, toChain } from '../../src/chain';
import { CoreConfig } from '../../src/core/CoreDeploy';
import { BridgeConfig } from '../../src/bridge/BridgeDeploy';

dotenv.config();

const rpc = process.env.RINKEBY_RPC;
if (!rpc) {
  throw new Error('Missing RPC URI');
}

const chainJson: ChainJson = {
  name: 'rinkeby',
  rpc,
  deployerKey: process.env.RINKEBY_DEPLOYER_KEY,
  domain: 2000,
  gas: {
    price: {
      maxFeePerGas: '20000000000', // 20 gwei
      maxPriorityFeePerGas: '2000000000', // 2 gwei
    },
  },
  chunk: 2000,
  timelag: 100,
};

export const chain = toChain(chainJson);

export const devConfig: CoreConfig = {
  environment: 'dev',
  updater: '0x4177372FD9581ceb2367e0Ce84adC5DAD9DF8D55',
  watchers: ['0x20aC2FD664bA5406A7262967C34107e708dCb18E'],
  recoveryManager: '0x24F6c874F56533d9a1422e85e5C7A806ED11c036',
  governor: {
    domain: chainJson.domain,
    address: '0xa4849f1D96B26066f9C631FCdc8F1457D27Fb5EC',
  },
  optimisticSeconds: 10,
  recoveryTimelock: 180, // 3 minutes
  processGas: 850_000,
  reserveGas: 15_000,
};

export const stagingConfig: CoreConfig = {
  environment: 'staging',
  updater: '0x201dd86063Dc251cA5a576d1b7365C38e5fB4CD5',
  watchers: ['0x22B2855635154Baa41C306BcA979C8c9a077A180'],
  recoveryManager: '0x24F6c874F56533d9a1422e85e5C7A806ED11c036',
  governor: {
    domain: chainJson.domain,
    address: '0xa4849f1D96B26066f9C631FCdc8F1457D27Fb5EC',
  },
  optimisticSeconds: 60 * 30, // 30 minutes
  recoveryTimelock: 180, // 3 minutes
  processGas: 850_000,
  reserveGas: 15_000,
};

export const bridgeConfig: BridgeConfig = {
  weth: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
};
