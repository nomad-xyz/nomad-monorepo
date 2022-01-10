import { ChainJson, toChain } from '../../src/chain';
import * as dotenv from 'dotenv';
import { CoreConfig } from '../../src/core/CoreDeploy';
import { BridgeConfig } from '../../src/bridge/BridgeDeploy';

dotenv.config();

const rpc = process.env.MOONBEAM_RPC;
if (!rpc) {
  throw new Error('Missing RPC URI');
}

export const chainJson: ChainJson = {
  name: 'moonbeam',
  rpc,
  deployerKey: process.env.MOONBEAM_DEPLOYER_KEY,
  domain: 0x6265616d,
  gas: {
    price: {
      maxFeePerGas: '40000000000', // 40 gwei TODO: verify
      maxPriorityFeePerGas: '4000000000', // 4 gwei TODO: verify
    },
  },
  chunk: 2000,
  timelag: 20,
};

export const chain = toChain(chainJson);

export const config: CoreConfig = {
  environment: 'prod',
  updater: 'TODO: verify',
  recoveryTimelock: 60 * 60 * 24, // 1 day
  recoveryManager: 'TODO: deploy',
  optimisticSeconds: 60 * 30, // 30 minutes
  watchers: ['TODO: verify'],
  processGas: 850_000, // TODO: verify
  reserveGas: 15_000,
};

export const bridgeConfig: BridgeConfig = {};
