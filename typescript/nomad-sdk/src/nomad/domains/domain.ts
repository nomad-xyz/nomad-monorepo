import { Domain } from '../../domains';
import { Address } from '../../utils';

export interface NomadDomain extends Domain {
  bridgeRouter: Address;
  tokenRegistry: Address;
  ethHelper?: Address;
  home: Address;
  replicas: ReplicaInfo[];
  governanceRouter: Address;
}

export interface ReplicaInfo {
  domain: number;
  address: Address;
}
