import { TypedEvent } from '@nomad-xyz/contract-interfaces/dist/core/commons';
import { ethers } from 'ethers';
import { NomadContext } from '..';
import { CoreContracts } from '../contracts';

import * as utils from './utils';

export type Address = string;

export interface Call {
  to: Address;
  data: ethers.utils.BytesLike;
}

export class CallBatch {
  readonly local: Readonly<Call>[];
  readonly remote: Map<number, Readonly<Call>[]>;
  private core: CoreContracts;
  private built?: ethers.PopulatedTransaction;

  constructor(core: CoreContracts, callerKnowsWhatTheyAreDoing: boolean) {
    if (!callerKnowsWhatTheyAreDoing) {
      throw new Error(
        'Please instantiate this class using the fromContext method',
      );
    }
    this.core = core;
    this.remote = new Map();
    this.local = [];
  }

  static async fromCore(core: CoreContracts): Promise<CallBatch> {
    const governor = await core.governor();
    if (governor.location === 'remote')
      throw new Error(
        'Caonnot create call batch on a chain without governance rights. Use the governing chain.',
      );
    return new CallBatch(core, true);
  }

  pushLocal(call: Partial<Call>): void {
    if (this.built)
      throw new Error('Batch has been built. Cannot push more calls');
    this.local.push(utils.normalizeCall(call));
  }

  pushRemote(domain: number, call: Partial<Call>): void {
    if (this.built)
      throw new Error('Batch has been built. Cannot push more calls');
    const calls = this.remote.get(domain);
    const normalized = utils.normalizeCall(call);
    if (!calls) {
      this.remote.set(domain, [normalized]);
    } else {
      calls.push(normalized);
    }
  }

  // Build a governance transaction from this callbatch
  async build(
    overrides?: ethers.Overrides,
  ): Promise<ethers.PopulatedTransaction> {
    if (this.built) return this.built;

    const [domains, remoteCalls] = utils.associateRemotes(this.remote);

    this.built =
      await this.core.governanceRouter.populateTransaction.executeGovernanceActions(
        this.local,
        domains,
        remoteCalls,
      );

    return this.built;
  }

  // Sign the governance batch and return a serialized transaction
  // Used by individual governors
  async sign(overrides?: ethers.Overrides): Promise<string> {
    await this.build(overrides);
    const signer = this.core.governanceRouter.signer;
    return await signer.signTransaction(
      this.built as ethers.PopulatedTransaction,
    );
  }

  // Sign the governance batch and dispatch the signed batch to the chain
  async execute(
    overrides?: ethers.Overrides,
  ): Promise<ethers.providers.TransactionResponse> {
    await this.build(overrides);
    const signer = this.core.governanceRouter.signer;
    return await signer.sendTransaction(
      this.built as ethers.PopulatedTransaction,
    );
  }

  // Return the batch hash for the specified domain
  domainHash(domain: number): string {
    const calls = this.remote.get(domain);
    if (!calls) throw new Error(`Not found calls for remote ${domain}`);

    return utils.batchHash(calls);
  }

  // Waits for a specified domain to receive its batch
  // Note that this does not call execute
  async waitDomain(
    domain: number,
    context: NomadContext,
  ): Promise<ethers.providers.TransactionReceipt> {
    const router = context.mustGetCore(domain).governanceRouter;
    const hash = this.domainHash(domain);

    const event: TypedEvent<[] & { batchHash: string }> = await new Promise(
      (resolve) => {
        router.once(router.filters.BatchReceived(hash), resolve);
      },
    );
    return await event.getTransactionReceipt();
  }

  // Waits for all participating domains to receive their batches
  // Note that this does not call execute
  async wait(
    context: NomadContext,
  ): Promise<ethers.providers.TransactionReceipt[]> {
    const domains = Array.from(this.remote.keys());
    return await Promise.all(
      domains.map((domain) => this.waitDomain(domain, context)),
    );
  }
}
