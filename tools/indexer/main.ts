import * as core from "./core";
import * as api from "./api";
import { DB } from "./core/db";
import { createLogger } from "./core/utils";

export type NomadEnvironment = 'development' | 'staging' | 'production';
export type Program = 'api' | 'core';

const environment = process.env.ENVIRONMENT! as NomadEnvironment;
const program = process.env.PROGRAM! as Program;

(async () => {
  const db = new DB();
  await db.connect();

  const logger = createLogger("indexer", environment);

  if (program === "api") {
    await api.run(db, logger);
  } else if (program === "core") {
    await core.run(db, environment, logger);
  }
})();
