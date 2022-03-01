import { ChainJson, toChain } from '../../src/chain';
import * as dotenv from 'dotenv';
import { CoreConfig } from '../../src/core/CoreDeploy';
import { BridgeConfig } from '../../src/bridge/BridgeDeploy';

dotenv.config();

const rpc = process.env.EVMOS_RPC;
if (!rpc) {
  throw new Error('Missing RPC URI');
}

export const chainJson: ChainJson = {
  name: 'evmos',
  rpc,
  deployerKey: process.env.EVMOS_DEPLOYER_KEY,
  domain: 0x65766d6f73, // b'evmos' interpreted as an int
  gas: { price: '150000000000' }, // evmos set minimum gas to 100 gwei; we will default to 150 gwei
  chunk: 2000,
  timelag: 20,
};

export const chain = toChain(chainJson);

export const config: CoreConfig = {
  environment: 'prod',
  updater: '0xC8e344D4698B6462187C88B9bb58F26ca3B5ed31',
  recoveryTimelock: 60 * 60 * 24, // 1 day
  recoveryManager: '0xea24Ac04DEFb338CA8595C3750E20166F3b4998A',
  optimisticSeconds: 60 * 30, // 30 minutes
  watchers: ['0x9E8e7eb5886A9C77E955Fd5D717581556eb7F98D'],
  processGas: 850_000,
  reserveGas: 15_000,
};

export const bridgeConfig: BridgeConfig = {
  weth: 'TODO // WAITING ON CANONICAL WETH DEPLOYMENT',
};
