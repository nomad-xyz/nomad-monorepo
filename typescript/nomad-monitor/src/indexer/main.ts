import { mainnet } from '@nomad-xyz/sdk';
import { Processor } from './consumer';
import { Orchestrator } from './orchestrator';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { IndexerCollector } from './metrics';
import Logger from 'bunyan';
dotenv.config({
  // path: '/Users/daniilnaumetc/code/tmp/monitor/typescript/nomad-monitor/src/indexer/.env'
});

const signer = process.env.SIGNER!;
const alchemyKey = process.env.ALCHEMY_KEY!;
const infuraKey = process.env.INFURA_KEY!;

console.log(signer, alchemyKey);

const moonbeamRPC = 'https://moonbeam.api.onfinality.io/public'; //"https://rpc.api.moonbeam.network";
// const ethereumRPC = `https://eth-mainnet.alchemyapi.io/v2/${alchemyKey}`;

(async () => {
  const ctx = mainnet; //NomadContext.fromDomains([ethereum, moonbeam]);
  const ethereumId = ctx.mustGetDomain('ethereum').id;
  const moonbeamId = ctx.mustGetDomain('moonbeam').id;
  const p = new ethers.providers.InfuraProvider('homestead', infuraKey);

  ctx.registerProvider(ethereumId, p);
  ctx.registerWalletSigner(ethereumId, signer);

  ctx.registerRpcProvider(moonbeamId, moonbeamRPC);
  ctx.registerWalletSigner(moonbeamId, signer);
  const c = new Processor();
  const m = new IndexerCollector('development', createLogger('indexer', 'development'))

  const o = new Orchestrator(mainnet, c, mainnet.domainNumbers[0], m);

  await o.startConsuming();
})();

function createLogger(name: string, environment: string) {
  return Logger.createLogger({
    name,
    serializers: Logger.stdSerializers,
    level: 'debug',
    environment: environment,
  });
}