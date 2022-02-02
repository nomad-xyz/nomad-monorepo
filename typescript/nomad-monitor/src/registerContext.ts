import { dev, mainnet, staging } from '@nomad-xyz/sdk';

export function setRpcProviders(rpcs: any) {
  // register mainnet
  mainnet.registerRpcProvider('ethereum', rpcs.ethereumRpc);
  mainnet.registerRpcProvider('moonbeam', rpcs.moonbeamRpc);

  // register staging
  staging.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);
  staging.registerRpcProvider('kovan', rpcs.kovanRpc);
  staging.registerRpcProvider('rinkeby', rpcs.rinkebyRpc);

  // register dev
  dev.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);
  dev.registerRpcProvider('kovan', rpcs.kovanRpc);
  dev.registerRpcProvider('rinkeby', rpcs.rinkebyRpc);
  dev.registerRpcProvider('milkomedatestnet', rpcs.rinkebyRpc);
}

export { mainnet, staging, dev };
