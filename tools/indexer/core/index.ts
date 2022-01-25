import { mainnet } from "@nomad-xyz/sdk/dist";
import { Processor } from "./consumer";
import { Orchestrator } from "./orchestrator";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { IndexerCollector } from "./metrics";
import { DB } from "./db";
import Logger from "bunyan";
dotenv.config({});

const ethereumRPC = process.env.ETHEREUM_RPC!;
const moonbeamRPC = process.env.MOONBEAM_RPC!;

export async function run(db: DB, environment: string, logger: Logger) {
  const ctx = mainnet;

  const ethereumId = ctx.mustGetDomain("ethereum").id;
  ctx.registerRpcProvider(ethereumId, ethereumRPC);

  const moonbeamId = ctx.mustGetDomain("moonbeam").id;
  ctx.registerRpcProvider(moonbeamId, moonbeamRPC);

  const c = new Processor(db, logger);
  const m = new IndexerCollector(environment, logger);

  const o = new Orchestrator(
    mainnet,
    c,
    mainnet.domainNumbers[0],
    m,
    logger,
    db
  );
  await o.init();

  await o.startConsuming();
}
