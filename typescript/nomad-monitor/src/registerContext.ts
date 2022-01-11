import { dev, mainnet, staging } from '@nomad-xyz/sdk';
import {getRpcsFromEnv} from "./config";

const rpcs = getRpcsFromEnv();

// register mainnet
mainnet.registerRpcProvider('ethereum', rpcs.ethereumRpc);

// register staging
staging.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);
staging.registerRpcProvider('kovan', rpcs.kovanRpc);

// register dev
dev.registerRpcProvider('kovan', rpcs.kovanRpc);
dev.registerRpcProvider('moonbasealpha', rpcs.moonbasealphaRpc);

export { mainnet, staging, dev };
