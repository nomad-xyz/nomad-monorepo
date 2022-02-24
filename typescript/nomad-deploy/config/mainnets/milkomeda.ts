import { ChainJson, toChain } from '../../src/chain';
import * as dotenv from 'dotenv';
import { CoreConfig } from '../../src/core/CoreDeploy';
import { BridgeConfig } from '../../src/bridge/BridgeDeploy';

dotenv.config();

const rpc = process.env.MILKOMEDA_RPC;
if (!rpc) {
  throw new Error('Missing RPC URI');
}

export const chainJson: ChainJson = {
  name: 'milkomedaC1',
  rpc,
  deployerKey: process.env.MILKOMEDA_DEPLOYER_KEY,
  domain: 0x6331, // b'c1' interpreted as an int
  gas: { price: '150000000000' }, // milkomeda set minimum gas to 100 gwei; we will default to 150 gwei
  chunk: 2000,
  timelag: 20,
};

export const chain = toChain(chainJson);

export const config: CoreConfig = {
  environment: 'prod',
  updater: '0xE293D129D9Fd291A8115Cb373BB934586055427d',
  recoveryTimelock: 60 * 60 * 24, // 1 day
  recoveryManager: '0xea24Ac04DEFb338CA8595C3750E20166F3b4998A',
  optimisticSeconds: 60 * 30, // 30 minutes
  watchers: ['0x06D8902cfae8235047DC7783875279311798c715'],
  processGas: 850_000,
  reserveGas: 15_000,
};

export const bridgeConfig: BridgeConfig = {
  weth: '0xAE83571000aF4499798d1e3b0fA0070EB3A3E3F9',
};
