import { dev, mainnet, staging } from '@nomad-xyz/sdk';

export function setRpcProviders(rpcs: any) {
  // register mainnet
  mainnet.registerRpcProvider('celo', rpcs.celoRpc);
  mainnet.registerRpcProvider('ethereum', rpcs.ethereumRpc);
  mainnet.registerRpcProvider('polygon', rpcs.polygonRpc);

  // register staging
  staging.registerRpcProvider('alfajores', rpcs.alfajoresRpc);
  staging.registerRpcProvider('kovan', rpcs.kovanRpc);
  staging.registerRpcProvider('rinkeby', rpcs.rinkebyRpc);

  // register dev
  dev.registerRpcProvider('alfajores', rpcs.alfajoresRpc);
  dev.registerRpcProvider('kovan', rpcs.kovanRpc);
  dev.registerRpcProvider('rinkeby', rpcs.rinkebyRpc);
  dev.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);
}

export { mainnet, staging, dev };
