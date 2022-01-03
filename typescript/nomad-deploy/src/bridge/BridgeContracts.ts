import * as xAppContracts from '@nomad-xyz/contract-interfaces/dist/bridge';
import { BeaconProxy, ProxyAddresses } from '../proxyUtils';
import { Contracts } from '../contracts';
import * as ethers from 'ethers';
import * as contracts from '@nomad-xyz/contract-interfaces/dist/core';

type SignerOrProvider = ethers.ethers.providers.Provider | ethers.ethers.Signer;

export type BridgeContractAddresses = {
  bridgeRouter: ProxyAddresses;
  bridgeToken: ProxyAddresses;
  ethHelper?: string;
};

export class BridgeContracts extends Contracts {
  bridgeRouter?: BeaconProxy<xAppContracts.BridgeRouter>;
  bridgeToken?: BeaconProxy<xAppContracts.BridgeToken>;
  ethHelper?: xAppContracts.ETHHelper;

  constructor() {
    super();
  }

  toObject(): Object {
    return {
      bridgeRouter: this.bridgeRouter?.toObject(),
      bridgeToken: this.bridgeToken?.toObject(),
      ethHelper: this.ethHelper?.address,
    };
  }

  static fromAddresses(
    addresses: BridgeContractAddresses,
    signerOrProvider: SignerOrProvider,
  ): BridgeContracts {
    const b = new BridgeContracts();

    // TODO: needs type magic for turning governance, home and replicas to BeaconProxy contracts
    const routerImplementation = xAppContracts.BridgeRouter__factory.connect(
      addresses.bridgeRouter.implementation,
      signerOrProvider,
    );
    const routerProxy = xAppContracts.BridgeRouter__factory.connect(
      addresses.bridgeRouter.proxy,
      signerOrProvider,
    );
    const routerUpgradeBeacon = contracts.UpgradeBeacon__factory.connect(
      addresses.bridgeRouter.beacon,
      signerOrProvider,
    );
    b.bridgeRouter = new BeaconProxy<xAppContracts.BridgeRouter>(
      routerImplementation,
      routerProxy,
      routerUpgradeBeacon,
    );

    const tokenImplementation = xAppContracts.BridgeToken__factory.connect(
      addresses.bridgeToken.implementation,
      signerOrProvider,
    );
    const tokenProxy = xAppContracts.BridgeToken__factory.connect(
      addresses.bridgeToken.proxy,
      signerOrProvider,
    );
    const tokenUpgradeBeacon = contracts.UpgradeBeacon__factory.connect(
      addresses.bridgeToken.beacon,
      signerOrProvider,
    );
    b.bridgeToken = new BeaconProxy<xAppContracts.BridgeToken>(
      tokenImplementation,
      tokenProxy,
      tokenUpgradeBeacon,
    );

    if (addresses.ethHelper) {
      b.ethHelper = xAppContracts.ETHHelper__factory.connect(
        addresses.ethHelper,
        signerOrProvider,
      );
    }

    return b;
  }
}
