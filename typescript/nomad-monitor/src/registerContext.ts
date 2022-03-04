import { dev, mainnet, staging } from '@nomad-xyz/sdk';

export function setRpcProviders(rpcs: any) {
  // register mainnet
  mainnet.registerRpcProvider('ethereum', rpcs.ethereumRpc);
  mainnet.registerRpcProvider('moonbeam', rpcs.moonbeamRpc);
  mainnet.registerRpcProvider('milkomedaC1', rpcs.milkomedac1Rpc);

  // register staging
  staging.registerRpcProvider('rinkeby', rpcs.rinkebyRpc);
  staging.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);
  staging.registerRpcProvider('kovan', rpcs.kovanRpc);

  // register dev
  dev.registerRpcProvider('rinkeby', rpcs.rinkebyRpc);
  dev.registerRpcProvider('kovan', rpcs.kovanRpc);
  dev.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);
  dev.registerRpcProvider('milkomedatestnet', rpcs.milkomedatestnetRpc);
  dev.registerRpcProvider('evmostestnet', rpcs.evmostestnetRpc);
}

export { mainnet, staging, dev };
