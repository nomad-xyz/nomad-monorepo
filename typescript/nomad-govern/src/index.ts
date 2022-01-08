import { ethers } from 'ethers';

import { NomadContext } from '@nomad-xyz/nomad-sdk/dist';
import { CoreContracts } from '@nomad-xyz/nomad-sdk/dist/nomad';

import {
  SafeTransaction,
  SafeTransactionDataPartial,
} from '@gnosis.pm/safe-core-sdk-types';
import { GovernanceRouter__factory } from '@nomad-xyz/contract-interfaces/dist/core';
import { TransactionResult } from '@gnosis.pm/safe-core-sdk';

export type Address = string;

export interface Call {
  to: Address;
  data: ethers.utils.BytesLike;
}

export class CallBatch {
  private _local: Call[];
  private _remote: Map<number, Call[]>;
  private core: CoreContracts;
  private _built?: SafeTransaction;

  constructor(core: CoreContracts, callerKnowsWhatTheyAreDoing: boolean) {
    if (!callerKnowsWhatTheyAreDoing) {
      throw new Error(
        'Please instantiate this class using the fromContext method',
      );
    }
    this.core = core;
    this._remote = new Map();
    this._local = [];
  }

  static async fromContext(context: NomadContext): Promise<CallBatch> {
    const governorDomain = await context.governorDomain();
    const core = context.mustGetCore(governorDomain);
    return new CallBatch(core, true);
  }

  private associateRemotes(): [number[], Call[][]] {
    const domains = [];
    const calls = [];
    for (const [key, value] of this._remote) {
      domains.push(key);
      calls.push(value);
    }
    return [domains, calls];
  }

  // build a safe transaction from this callbatch
  async build(
    overrides?: SafeTransactionDataPartial,
  ): Promise<SafeTransaction> {
    if (this._built) return this._built;

    const [domains, remoteCalls] = this.associateRemotes();
    const data = GovernanceRouter__factory.createInterface().encodeFunctionData(
      'executeGovernanceActions',
      [this._local, domains, remoteCalls],
    );

    const safe = await this.core.governorSafe();
    this._built = await safe.createTransaction([
      Object.assign(
        {
          to: this.core.governanceRouterAddress,
          data,
          operation: 0, // call, not delegate call
          value: 0,
        },
        overrides,
      ),
    ]);
    return this._built;
  }

  async sign(overrides?: SafeTransactionDataPartial): Promise<void> {
    const safe = await this.core.governorSafe();
    await this.build(overrides);
    await safe.signTransaction(this._built as SafeTransaction);
  }

  async execute(
    overrides?: SafeTransactionDataPartial,
  ): Promise<TransactionResult> {
    const safe = await this.core.governorSafe();
    await this.build(overrides);
    return safe.executeTransaction(this._built as SafeTransaction);
  }

  pushLocal(call: Call): void {
    if (this._built)
      throw new Error('Batch has been built. Cannot push more calls');
    this._local.push(call);
  }

  pushRemote(domain: number, call: Call): void {
    if (this._built)
      throw new Error('Batch has been built. Cannot push more calls');
    const calls = this._remote.get(domain);
    if (!calls) {
      this._remote.set(domain, [call]);
    } else {
      calls.push(call);
    }
  }
}
