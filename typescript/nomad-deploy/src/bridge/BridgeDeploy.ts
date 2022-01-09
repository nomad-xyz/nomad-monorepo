import { Chain, ChainJson, CoreContractAddresses, toChain } from '../chain';
import { BridgeContractAddresses, BridgeContracts } from './BridgeContracts';
import {
  getPathToBridgeConfigFromCore,
  parseFileFromDeploy,
} from '../verification/readDeployOutput';
import { Deploy } from '../deploy';

export type BridgeConfig = {
  weth?: string;
};

export class BridgeDeploy extends Deploy<BridgeContracts> {
  readonly config: BridgeConfig;
  readonly coreDeployPath: string;
  readonly coreContractAddresses: CoreContractAddresses;
  readonly test: boolean;

  constructor(
    chain: Chain,
    config: BridgeConfig,
    coreDeployPath: string,
    test: boolean = false,
    coreContracts?: CoreContractAddresses,
  ) {
    super(chain, new BridgeContracts(), test);
    this.config = config;
    this.coreDeployPath = coreDeployPath;
    this.coreContractAddresses =
      coreContracts ||
      parseFileFromDeploy(coreDeployPath, chain.config.name, 'contracts');
    this.test = test;
  }

  get ubcAddress(): string | undefined {
    return this.coreContractAddresses.upgradeBeaconController;
  }

  get contractOutput(): BridgeContractAddresses {
    return this.contracts.toObject() as BridgeContractAddresses;
  }

  static freshFromConfig(
    config: ChainJson,
    coreDeployPath: string,
  ): BridgeDeploy {
    return new BridgeDeploy(toChain(config), {}, coreDeployPath);
  }
}

export class ExistingBridgeDeploy extends BridgeDeploy {
  constructor(
    chain: Chain,
    config: BridgeConfig,
    coreDeployPath: string,
    test: boolean = false,
    addresses?: BridgeContractAddresses,
    coreContracts?: CoreContractAddresses,
  ) {
    super(chain, config, coreDeployPath, test, coreContracts);

    if (!addresses) {
      const bridgeConfigPath = getPathToBridgeConfigFromCore(coreDeployPath);
      addresses = parseFileFromDeploy(bridgeConfigPath, chain.name, "contracts");
    }

    this.contracts = BridgeContracts.fromAddresses(addresses!, chain.provider);
  }

  static withPath(
    chain: Chain,
    config: BridgeConfig,
    addresses: BridgeContractAddresses,
    test: boolean = false,
    coreDeployPath?: string,
    coreContracts?: CoreContractAddresses,
  ): ExistingBridgeDeploy {
    return new ExistingBridgeDeploy(
      chain,
      config,
      coreDeployPath || '/dev/null',
      test,
      addresses,
      coreContracts,
    );
  }
}
