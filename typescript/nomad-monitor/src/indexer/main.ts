import { mainnet } from '@nomad-xyz/sdk/src';
import { Processor } from './consumer';
import { Orchestrator } from './orchestrator';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { IndexerCollector } from './metrics';
import Logger from 'bunyan';
import { DBDriver } from './db';

dotenv.config({});

const infuraKey = process.env.INFURA_KEY!;
const moonbeamRPC = process.env.MOONBEAM_RPC!;
const environment = process.env.ENVIRONMENT!;

(async () => {
  const ctx = mainnet;
  const ethereumId = ctx.mustGetDomain('ethereum').id;
  const moonbeamId = ctx.mustGetDomain('moonbeam').id;
  const infura = new ethers.providers.InfuraProvider('homestead', infuraKey);

  ctx.registerProvider(ethereumId, infura);

  ctx.registerRpcProvider(moonbeamId, moonbeamRPC);
  const logger = createLogger('indexer', environment);

  const db = new DBDriver();
  
  const c = new Processor(db);
  const m = new IndexerCollector(environment, logger);

  const o = new Orchestrator(mainnet, c, mainnet.domainNumbers[0], m, logger, db);
  await o.init();

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
