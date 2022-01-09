import { ethers } from 'ethers';
import { CoreContracts } from '../contracts';

import * as utils from './utils';

export type Address = string;

export interface Call {
  to: Address;
  data: ethers.utils.BytesLike;
}

export class CallBatch {
  private local: Call[];
  private remote: Map<number, Call[]>;
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

  pushLocal(call: Call): void {
    if (this.built)
      throw new Error('Batch has been built. Cannot push more calls');
    this.local.push(call);
  }

  pushRemote(domain: number, call: Call): void {
    if (this.built)
      throw new Error('Batch has been built. Cannot push more calls');
    const calls = this.remote.get(domain);
    if (!calls) {
      this.remote.set(domain, [call]);
    } else {
      calls.push(call);
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
        overrides,
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
}
