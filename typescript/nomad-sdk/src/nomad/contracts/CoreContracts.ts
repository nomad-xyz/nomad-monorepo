import { ethers } from 'ethers';
import { core } from '@nomad-xyz/contract-interfaces';
import { Contracts } from '../../contracts';
import { ReplicaInfo } from '../domains/domain';
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk';

type Address = string;

type InternalReplica = {
  domain: number;
  address: Address;
};

interface Core {
  id: number;
  home: Address;
  replicas: ReplicaInfo[];
  governanceRouter: Address;
}

export type LocalGovernor = {
  location: 'local';
  identifier: string;
};

export type RemoteGovernor = {
  location: 'remote';
  domain: number;
};

export type Governor = LocalGovernor | RemoteGovernor;

export class CoreContracts extends Contracts {
  readonly domain: number;
  readonly _home: Address;
  readonly _replicas: Map<number, InternalReplica>;
  readonly governanceRouterAddress: Address;
  private providerOrSigner?: ethers.providers.Provider | ethers.Signer;
  private _governor?: Governor;

  constructor(
    domain: number,
    home: Address,
    replicas: ReplicaInfo[],
    governaceRouter: Address,
    providerOrSigner?: ethers.providers.Provider | ethers.Signer,
  ) {
    super(domain, home, replicas, providerOrSigner);
    this.providerOrSigner = providerOrSigner;
    this.domain = domain;
    this._home = home;
    this.governanceRouterAddress = governaceRouter;

    this._replicas = new Map();
    replicas.forEach((replica) => {
      this._replicas.set(replica.domain, {
        address: replica.address,
        domain: replica.domain,
      });
    });
  }

  getReplica(domain: number): core.Replica | undefined {
    if (!this.providerOrSigner) {
      throw new Error('No provider or signer. Call `connect` first.');
    }
    const replica = this._replicas.get(domain);
    if (!replica) return;
    return core.Replica__factory.connect(
      replica.address,
      this.providerOrSigner,
    );
  }

  get home(): core.Home {
    if (!this.providerOrSigner) {
      throw new Error('No provider or signer. Call `connect` first.');
    }
    return core.Home__factory.connect(this._home, this.providerOrSigner);
  }

  get governanceRouter(): core.GovernanceRouter {
    if (!this.providerOrSigner) {
      throw new Error('No provider or signer. Call `connect` first.');
    }
    return core.GovernanceRouter__factory.connect(
      this.governanceRouterAddress,
      this.providerOrSigner,
    );
  }

  async governor(): Promise<Governor> {
    if (this._governor) {
      return this._governor;
    }
    const [domain, identifier] = await Promise.all([
      this.governanceRouter.governorDomain(),
      this.governanceRouter.governor(),
    ]);
    if (identifier === ethers.constants.AddressZero) {
      this._governor = { location: 'remote', domain };
    } else {
      this._governor = { location: 'local', identifier };
    }
    return this._governor;
  }

  async governorSafe(): Promise<Safe> {
    if (!this.providerOrSigner) {
      throw new Error('No provider or signer. Call `connect` first.');
    }

    // hate all this but Safe requires a signer with a provider
    let signer: ethers.Signer = new ethers.VoidSigner(
      ethers.constants.AddressZero,
    );
    if (ethers.providers.Provider.isProvider(this.providerOrSigner)) {
      signer = signer.connect(this.providerOrSigner);
    } else {
      signer = this.providerOrSigner as ethers.Signer;
    }

    const ethAdapter = new EthersAdapter({
      ethers,
      signer,
    });
    const governor = await this.governor();
    if (governor.location === 'remote') {
      throw new Error(
        'Cannot produce safe for remote governor. Call this method only from the core on the governor domain.',
      );
    }
    try {
      return Safe.create({ ethAdapter, safeAddress: governor.identifier });
    } catch (e) {
      throw new Error(
        `Unable to connect to safe on domain ${this.domain}. Safe library threw error: ${e}`,
      );
    }
  }

  connect(providerOrSigner: ethers.providers.Provider | ethers.Signer): void {
    this.providerOrSigner = providerOrSigner;
  }

  toObject(): Core {
    const replicas: ReplicaInfo[] = Array.from(this._replicas.values()).map(
      (replica) => {
        return {
          domain: replica.domain,
          address: replica.address,
        };
      },
    );

    return {
      id: this.domain,
      home: this._home,
      replicas: replicas,
      governanceRouter: this.governanceRouterAddress,
    };
  }

  static fromObject(data: Core, signer?: ethers.Signer): CoreContracts {
    const { id, home, replicas, governanceRouter } = data;
    if (!id || !home || !replicas) {
      throw new Error('Missing key');
    }
    return new CoreContracts(id, home, replicas, governanceRouter, signer);
  }
}
