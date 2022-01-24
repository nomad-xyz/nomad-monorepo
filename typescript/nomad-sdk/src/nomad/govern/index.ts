import { ethers } from 'ethers';
import { NomadContext } from '..';
import { CoreContracts } from '../contracts';
import { BatchReceivedEvent } from '../events';

import * as utils from './utils';

export type Address = string;

export interface Call {
  to: Address;
  data: ethers.utils.BytesLike;
}

export interface RemoteContents {
  [domain: string]: Call[];
}

export interface CallBatchContents {
  local: Call[];
  remote: RemoteContents;
}

export class CallBatch {
  readonly local: Readonly<Call>[];
  readonly remote: Map<number, Readonly<Call>[]>;
  private governorCore: CoreContracts;
  private context: NomadContext;
  private built?: ethers.PopulatedTransaction;

  constructor(
    context: NomadContext,
    governorDomain: number,
    callerKnowsWhatTheyAreDoing: boolean,
  ) {
    if (!callerKnowsWhatTheyAreDoing) {
      throw new Error(
        'Please instantiate this class using the fromContext method',
      );
    }
    this.context = context;
    this.governorCore = this.context.mustGetCore(governorDomain);
    this.remote = new Map();
    this.local = [];
  }

  static async fromContext(context: NomadContext): Promise<CallBatch> {
    const governorDomain = await context.governorDomain();
    return new CallBatch(context, governorDomain, true);
  }

  static async fromJSON(
    context: NomadContext,
    batchContents: CallBatchContents,
  ): Promise<CallBatch> {
    const batch = await CallBatch.fromContext(context);
    // push the local calls
    for (const local of batchContents.local) {
      batch.pushLocal(local);
    }
    // push the remote calls
    for (const domain of Object.keys(batchContents.remote)) {
      const calls = batchContents.remote[domain];
      for (const call of calls) {
        batch.pushRemote(parseInt(domain), call);
      }
    }
    // return the constructed batch
    return batch;
  }

  get domains(): number[] {
    return Array.from(this.remote.keys());
  }

  pushLocal(call: Partial<Call>): void {
    if (this.built)
      throw new Error('Batch has been built. Cannot push more calls');
    this.local.push(utils.normalizeCall(call));
  }

  pushRemote(domain: number, call: Partial<Call>): void {
    if (this.built)
      throw new Error('Batch has been built. Cannot push more calls');
    if (!this.context.getCore(domain))
      throw new Error('Domain not registered on NomadContext');
    const calls = this.remote.get(domain);
    const normalized = utils.normalizeCall(call);
    if (!calls) {
      this.remote.set(domain, [normalized]);
    } else {
      calls.push(normalized);
    }
  }

  // Build a governance transaction from this callbatch
  async build(): Promise<ethers.PopulatedTransaction> {
    if (this.built) return this.built;
    const [domains, remoteCalls] = utils.associateRemotes(this.remote);
    this.built =
      await this.governorCore.governanceRouter.populateTransaction.executeGovernanceActions(
        this.local,
        domains,
        remoteCalls,
      );
    return this.built;
  }

  // Return the batch hash for the specified domain
  domainHash(domain: number): string {
    const calls = this.remote.get(domain);
    if (!calls) throw new Error(`Not found calls for remote ${domain}`);
    return utils.batchHash(calls);
  }

  // Sign the governance batch and return a serialized transaction
  // Used by individual governors
  async sign(): Promise<string> {
    await this.build();
    const signer = this.governorCore.governanceRouter.signer;
    return signer.signTransaction(this.built as ethers.PopulatedTransaction);
  }

  // Execute the local governance calls immediately,
  // dispatch the remote governance calls to their respective domains
  async execute(): Promise<ethers.providers.TransactionResponse> {
    await this.build();
    const signer = this.governorCore.governanceRouter.signer;
    return signer.sendTransaction(this.built as ethers.PopulatedTransaction);
  }

  // Execute the remote governance calls for a domain
  // @dev ensure waitDomain returns before attempting to executeDomain
  async executeDomain(
    domain: number,
  ): Promise<ethers.providers.TransactionResponse> {
    const calls = this.remote.get(domain);
    if (!calls) throw new Error(`Not found calls for remote ${domain}`);
    const governanceRouter = this.context.mustGetCore(domain).governanceRouter;
    return governanceRouter.executeCallBatch(calls);
  }

  // Check if the Batch
  private async queryReceipt(
    domain: number,
  ): Promise<BatchReceivedEvent | undefined> {
    const router = this.context.mustGetCore(domain).governanceRouter;
    const hash = this.domainHash(domain);
    const filter = router.filters.BatchReceived(hash);
    const events = await router.queryFilter(filter);
    if (events.length >= 1) return events[0];
    return undefined;
  }

  // Waits for a specified domain to receive its batch
  // Note that this does not call execute
  async waitDomain(
    domain: number,
  ): Promise<ethers.providers.TransactionReceipt> {
    const router = this.context.mustGetCore(domain).governanceRouter;
    const hash = this.domainHash(domain);

    const poll = this.queryReceipt(domain);
    const once: Promise<ethers.Event> = new Promise((resolve) => {
      router.once(router.filters.BatchReceived(hash), resolve);
    });

    let event: ethers.Event | undefined = await poll;
    if (!event) {
      event = await once;
    }

    return event.getTransactionReceipt();
  }

  // Waits for all participating domains to receive their batches
  // Note that this does not call execute
  async waitAll(): Promise<ethers.providers.TransactionReceipt[]> {
    return Promise.all(this.domains.map((domain) => this.waitDomain(domain)));
  }
}
