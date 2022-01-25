import express from 'express';
import { DB, MsgRequest } from '../core/db';
import * as dotenv from 'dotenv';
dotenv.config({});


function fail(res: any, code: number, reason: string) {
    return res.status(code).json({error: reason});
}


const PORT = process.env.PORT;

export async function run(db: DB) {
    const app = express();

    app.get('/healthcheck', (req,res) => res.send('OK!'));

    app.get('/tx/:tx', async (req,res) => {
        const message = await db.getMessageByEvm(req.params.tx);
        return res.json(message.toObject())
    });

    app.get('/hash/:hash', async (req,res) => {
        const message = await db.getMessageByHash(req.params.hash);
        return res.json(message.toObject())
    });

    app.get('/tx', async (req: express.Request<{}, {}, {}, MsgRequest>,res) => {

        const {size, } = req.query; // page, destination, origin, receiver, sender

        if (size && size > 30) return fail(res, 403, 'maximum size is 30')

        const messages = await db.getMessages(req.query);

        // const message = await db.getMessageByHash(req.params.hash);
        return res.json(messages)
    });

    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
    });
}