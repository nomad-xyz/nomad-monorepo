import * as core from "./core";
import * as api from "./api";
import { DB } from "./core/db";
import { createLogger } from "./core/utils";

const environment = process.env.ENVIRONMENT!;
const program = process.env.PROGRAM!;

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
