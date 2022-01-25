import { mainnet } from '@nomad-xyz/sdk/src';
import { Processor } from './consumer';
import { Orchestrator } from './orchestrator';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { IndexerCollector } from './metrics';
import Logger from 'bunyan';
import { DB } from './db';
dotenv.config({});

const infuraKey = process.env.INFURA_KEY!;
const moonbeamRPC = process.env.MOONBEAM_RPC!;
const environment = process.env.ENVIRONMENT!;

export async function run(db: DB) {
  const ctx = mainnet;

  const ethereumId = ctx.mustGetDomain('ethereum').id;
  const infura = new ethers.providers.InfuraProvider('homestead', infuraKey);
  ctx.registerProvider(ethereumId, infura);

  const moonbeamId = ctx.mustGetDomain('moonbeam').id;
  ctx.registerRpcProvider(moonbeamId, moonbeamRPC);
  const logger = createLogger('indexer', environment);

  const c = new Processor(db, logger);
  const m = new IndexerCollector(environment, logger);

  const o = new Orchestrator(
    mainnet,
    c,
    mainnet.domainNumbers[0],
    m,
    logger,
    db,
  );
  await o.init();

  await o.startConsuming();
}

function createLogger(name: string, environment: string) {
  return Logger.createLogger({
    name,
    serializers: Logger.stdSerializers,
    level: 'debug',
    environment: environment,
  });
}
