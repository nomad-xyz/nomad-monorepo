import * as core from './core';
import * as api from './api';
import { DB } from './core/db';

console.log(process.argv[2]);

(async () => {
    const db = new DB();
    await db.connect();

    if (process.argv[2] === 'api') {
        await api.run(db)
    } else {
        await core.run(db);
    }
    
})()