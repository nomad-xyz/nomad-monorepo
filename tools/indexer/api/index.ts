import express from "express";
import { DB, MsgRequest } from "../core/db";
import * as dotenv from "dotenv";
import Logger from "bunyan";
dotenv.config({});

function fail(res: any, code: number, reason: string) {
  return res.status(code).json({ error: reason });
}

const PORT = process.env.PORT;

export async function run(db: DB, logger: Logger) {
  const app = express();

  const log = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.info(`request to ${req.url}`);
    next();
  };

  app.get("/healthcheck", log, (req, res) => {
    res.send("OK!");
  });

  app.get("/tx/:tx", log, async (req, res) => {
    const message = await db.getMessageByEvm(req.params.tx);
    return res.json(message.toObject());
  });

  app.get("/hash/:hash", log, async (req, res) => {
    const message = await db.getMessageByHash(req.params.hash);
    return res.json(message.toObject());
  });

  app.get(
    "/tx",
    log,
    async (req: express.Request<{}, {}, {}, MsgRequest>, res) => {
      const { size } = req.query;

      if (size && size > 30) return fail(res, 403, "maximum page size is 30");

      const messages = await db.getMessages(req.query);

      return res.json(messages);
    }
  );

  app.listen(PORT, () => {
    logger.info(`Server is running at https://localhost:${PORT}`);
  });
}
