import express from 'express';
import { DB } from '../core/db';
import * as dotenv from 'dotenv';
dotenv.config({});


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

    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
    });
}