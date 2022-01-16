import { NomadContext } from '@nomad-xyz/sdk';
import { Consumer } from './consumer';
import { Indexer } from './indexer';
// import {EventEmmiter} from 'events';
import {EventEmitter} from 'events';
import { NomadEvent } from './event';

// class Database extends EventEmitter {
//     constructor() {
//         super();
//         this.emit('ready');
//     }
// }


export class Orchestrator extends EventEmitter {
    sdk: NomadContext;
    consumer: Consumer;
    indexers: Map<number, Indexer>;
    gov: number;

    constructor(sdk: NomadContext, c: Consumer, gov: number) {
        super();
        this.sdk = sdk;
        this.consumer = c;
        this.indexers = new Map();
        this.gov = gov;

    }

    async indexAll() {
        await Promise.all(this.sdk.domainNumbers.map((domain: number) => this.index(domain)))
    }

    async index(domain: number) {
        const existingIndexer = this.indexers.get(domain);
        if (existingIndexer) {
            existingIndexer.stop();
        }

        const indexer = new Indexer(domain, this.sdk, this);

        if (domain === this.gov) {
            
            await indexer.startAll(this.sdk.domainNumbers.filter(d => d!=this.gov))
        } else {
            await indexer.startAll([this.gov])
        }
        this.indexers.set(domain, indexer);
    }

    startConsuming() {
        this.on('new_event', (event: NomadEvent) => {
            this.consumer.consume(event);
        })
        Array.from(this.indexers.values()).forEach(
            indexer => {
                indexer.startThrowingEvents(true)
            }
        )

    }
}