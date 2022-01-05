import { ethers } from 'ethers';
import { core } from '@nomad-xyz/contract-interfaces';
import { Contracts } from '../../contracts';
import { ReplicaInfo } from '../domains/domain';

type Address = string;

type InternalReplica = {
  domain: number;
  address: Address;
};

interface Core {
  id: number;
  home: Address;
  replicas: ReplicaInfo[];
}

export class CoreContracts extends Contracts {
  readonly domain;
  readonly _home: Address;
  readonly _replicas: Map<number, InternalReplica>;
  private providerOrSigner?: ethers.providers.Provider | ethers.Signer;

  constructor(
    domain: number,
    home: Address,
    replicas: ReplicaInfo[],
    providerOrSigner?: ethers.providers.Provider | ethers.Signer,
  ) {
    super(domain, home, replicas, providerOrSigner);
    this.providerOrSigner = providerOrSigner;
    this.domain = domain;
    this._home = home;

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
      home: this.home.address,
      replicas: replicas,
    };
  }

  static fromObject(data: Core, signer?: ethers.Signer): CoreContracts {
    const { id, home, replicas } = data;
    if (!id || !home || !replicas) {
      throw new Error('Missing key');
    }
    return new CoreContracts(id, home, replicas, signer);
  }
}
