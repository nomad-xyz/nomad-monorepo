import { NomadContext } from '@nomad-xyz/sdk';
import { Consumer } from './consumer';
import { Indexer } from './indexer';
// import {EventEmmiter} from 'events';

export class Orchestrator {
    sdk: NomadContext;
    consumer: Consumer;
    indexers: Map<number, Indexer>;
    gov: number;
    // emmiter: EventEmmiter;

    constructor(sdk: NomadContext, c: Consumer, gov: number) {
        this.sdk = sdk;
        this.consumer = c;
        this.indexers = new Map();
        this.gov = gov;
    }

    indexAll() {
        this.sdk.domainNumbers.map((domain: number) => {
            this.index(domain)
        })
    }

    index(domain: number) {
        const existingIndexer = this.indexers.get(domain);
        if (existingIndexer) {
            existingIndexer.stop();
        }

        const indexer = new Indexer(domain, this.sdk, this);

        if (domain === this.gov) {
            
            indexer.startAll(this.sdk.domainNumbers.filter(d => d!=this.gov))
        } else {
            indexer.startAll([this.gov])
        }
        this.indexers.set(domain, indexer);
    }
}