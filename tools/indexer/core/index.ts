import { mainnet, staging, dev, NomadContext } from "@nomad-xyz/sdk/dist";
import { Processor } from "./consumer";
import { Orchestrator } from "./orchestrator";
import * as dotenv from "dotenv";
import { IndexerCollector } from "./metrics";
import { DB } from "./db";
import Logger from "bunyan";
dotenv.config({});

export async function run(db: DB, environment: string, logger: Logger) {
  let ctx: NomadContext;
  if (environment === 'production') {
    ctx = mainnet
  } else if (environment === 'staging') {
    ctx = staging;
  } else {
    ctx = dev;
  }

  ctx.domainNumbers.forEach(domain => {
    const name = ctx.mustGetDomain(domain).name.toUpperCase();
    const rpcEnvKey = `${name}_RPC`;
    const rpc = process.env[rpcEnvKey];

    if (!rpc) throw new Error(`RPC url for domain ${domain} is empty. Please provide as '${rpcEnvKey}=http://...' ENV variable`)

    ctx.registerRpcProvider(domain, rpc);
  })

  const c = new Processor(db, logger);
  const m = new IndexerCollector(environment, logger);

  console.log(ctx)
  const o = new Orchestrator(
    ctx,
    c,
    ctx.domainNumbers[0],
    m,
    logger,
    db
  );
  m.startServer(3000);
  await o.init();
  await o.startConsuming();
}
