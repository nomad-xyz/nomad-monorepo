import fs from "fs";

import { AssertionError, expect } from "chai";
// Local imports
import { Network, networkFromObject } from "./network";
import { Key } from "./key";
import { Agent, AgentType, agentTypeToString, LocalAgent } from "./agent";

import {
  Chain,
  CoreDeployAddresses,
  RustConfig,
  DEFAULT_GAS,
  DeployEnvironment,
} from "@nomad-xyz/deploy/src/chain";
import {
  Governor,
  CoreConfig,
  CoreDeploy,
  ExistingCoreDeploy,
} from "@nomad-xyz/deploy/src/core/CoreDeploy";
import {
  BridgeConfig,
  BridgeDeploy,
  ExistingBridgeDeploy,
} from "@nomad-xyz/deploy/src/bridge/BridgeDeploy";
import { getPathToLatestDeploy } from "@nomad-xyz/deploy/src/verification/readDeployOutput";
import {
  deployBridges,
  deployNewChainBridge,
  getEnrollBridgeCall,
} from "@nomad-xyz/deploy/src/bridge";
import { CallData } from "@nomad-xyz/deploy/src/utils";
import {
  deployNChains,
  deployNewChain,
  getEnrollReplicaCall,
  getEnrollWatchersCall,
} from "@nomad-xyz/deploy/src/core";
import { ContractVerificationInput } from "@nomad-xyz/deploy/src/deploy";
import TestBridgeDeploy from "@nomad-xyz/deploy/src/bridge/TestBridgeDeploy";
import {
  BridgeContractAddresses,
  BridgeContracts,
} from "@nomad-xyz/deploy/src/bridge/BridgeContracts";

import { NomadContext } from "@nomad-xyz/sdk";
import { CoreContracts as NomadCoreContracts } from "@nomad-xyz/sdk/nomad/contracts/CoreContracts";
import { BridgeContracts as NomadBridgeContracts } from "@nomad-xyz/sdk/nomad/contracts/BridgeContracts";
import type { NomadDomain } from "@nomad-xyz/sdk/nomad/domains/domain";
import { CoreContracts } from "@nomad-xyz/deploy/src/core/CoreContracts";

import {
  XAppConnectionManager__factory,
  XAppConnectionManager,
} from "@nomad-xyz/contract-interfaces/dist/core";

import { Updater } from "@nomad-xyz/test/lib/core";
import { NonceManager } from "@ethersproject/experimental";
import { toBytes32 } from "@nomad-xyz/deploy/src/utils";
import { Waiter, zip } from "./utils";
import { checkCoreDeploy } from "@nomad-xyz/deploy/src/core/checks";
import { checkBridgeDeploy } from "@nomad-xyz/deploy/src/bridge/checks";
import {ethers} from "ethers";

export class Nomad {
  id: number;
  private deployed: Set<number>;
  host: Network;
  private deployers: Map<number, Key>;
  private signers: Map<number | string, Key>;
  private updaters: Map<number, Key>;
  private watchers: Map<number, Key>;
  private networks: Map<number, Network>;
  private deployArtifacts?: DeployArtifacts;
  private agents: Map<string, Agent>;

  multiprovider?: NomadContext;

  constructor(host: Network) {
    this.id = Date.now();
    this.deployed = new Set();
    this.deployers = new Map();
    this.signers = new Map();
    this.updaters = new Map();
    this.watchers = new Map();
    this.networks = new Map();
    this.agents = new Map();

    this.host = host;
    this.addNetwork(host);
  }

  toObject(): Object {
    return {
      id: this.id,
      deployed: Array.from(this.deployed),
      host: this.host.domain,
      deployers: Object.fromEntries(
        Array.from(this.deployers.entries()).map(([n, k]) => [n, k.toString()])
      ),
      signers: Object.fromEntries(
        Array.from(this.signers.entries()).map(([n, k]) => [n, k.toString()])
      ),
      updaters: Object.fromEntries(
        Array.from(this.updaters.entries()).map(([n, k]) => [n, k.toString()])
      ),
      watchers: Object.fromEntries(
        Array.from(this.watchers.entries()).map(([n, k]) => [n, k.toString()])
      ),
      networks: Object.fromEntries(
        Array.from(this.networks.entries()).map(([n, net]) => [
          n,
          net.toObject(),
        ])
      ),
      deployArtifacts: deployArtifactsToObject(this.deployArtifacts),
    };
  }

  static async fromObject(obj: Object): Promise<Nomad> {
    const hostDomain: number = Object(obj)["host"];
    const networks = new Map<number, Network>(
      Array.from(Object.entries(Object(obj)["networks"])).map(([n, net]) => {
        return [parseInt(n), networkFromObject(net as Object)];
      })
    );

    if (!hostDomain) throw new Error(`No network host name`);

    const host = networks.get(hostDomain);

    if (!host) throw new Error(`Host was not found in nettworks`);

    const o = new Nomad(host);

    Array.from(networks.values()).forEach((network) => {
      if (network !== host) {
        o.addNetwork(network);
      }
    });

    o.setId(Object(obj)["id"] as number);
    o.setDeployed(...(Object(obj)["deployed"] as number[]));

    Array.from(Object.entries(Object(obj)["deployers"])).forEach(([n, k]) => {
      o.setDeployer(parseInt(n), new Key(k as string));
    });

    Array.from(Object.entries(Object(obj)["signers"])).forEach(([n, k]) => {
      console.log(`Setting signer`, n, k);
      o.setSigner(parseInt(n), new Key(k as string));
    });

    Array.from(Object.entries(Object(obj)["updaters"])).forEach(([n, k]) => {
      o.setUpdater(parseInt(n), new Key(k as string));
    });

    Array.from(Object.entries(Object(obj)["watchers"])).forEach(([n, k]) => {
      o.setWatcher(parseInt(n), new Key(k as string));
    });

    o.setArtifacts(deployArtifactsFromObject(Object(obj)["deployArtifacts"]));

    await o.updateMultiProvider();

    await o.connectNetworks();
    await o.connectAllAgents();

    return o;
  }

  setId(id: number): void {
    this.id = id;
  }

  setDeployed(...domains: number[]): void {
    domains.forEach((d) => this.deployed.add(d));
  }

  getArtifacts(
    networkish: string | number | Network
  ): CoreAndBridgeArtifact | undefined {
    const network = this.getNetwork(networkish);
    if (!network) throw new Error(`Network not found`);

    return this.deployArtifacts?.merged.get(network.name);
  }
  addNetwork(network: Network) {
    // if (this.deployed) throw new Error(`Nomad is already deployed`);

    this.networks.set(network.domain, network);
  }

  setDeployer(networkish: string | number | Network, key: Key) {
    const domain = this.networkToDomain(networkish);

    if (domain) this.deployers.set(domain, key);
  }

  setSigner(
    networkish: string | number | Network,
    key: Key,
    agentType?: string | AgentType
  ) {
    const domain = this.networkToDomain(networkish);

    if (domain) {
      if (agentType) {
        const mapKey = `${agentTypeToString(
          agentType
        ).toLowerCase()}_${domain}`;
        this.signers.set(mapKey, key);
      } else {
        this.signers.set(domain, key);
      }
    }
  }

  setUpdater(networkish: string | number | Network, key: Key) {
    const domain = this.networkToDomain(networkish);

    if (domain) this.updaters.set(domain, key);
  }

  setWatcher(networkish: string | number | Network, key: Key) {
    const domain = this.networkToDomain(networkish);

    if (domain) this.watchers.set(domain, key);
  }

  getDeployerKey(networkish: string | number | Network): Key | undefined {
    const domain = this.networkToDomain(networkish);
    if (domain) return this.deployers.get(domain);
    return undefined;
  }

  getSignerKey(
    networkish: string | number | Network,
    agentType?: string | AgentType
  ): Key | undefined {
    const domain = this.networkToDomain(networkish);
    if (domain) {
      if (agentType) {
        const mapKey = `${agentTypeToString(
          agentType
        ).toLowerCase()}_${domain}`;
        return this.signers.get(mapKey);
      } else {
        return this.signers.get(domain);
      }
    }
    return undefined;
  }

  getUpdaterKey(networkish: string | number | Network): Key | undefined {
    const domain = this.networkToDomain(networkish);
    if (domain) return this.updaters.get(domain);
    return undefined;
  }

  getWatcherKey(networkish: string | number | Network): Key | undefined {
    const domain = this.networkToDomain(networkish);
    if (domain) return this.watchers.get(domain);
    return undefined;
  }

  getRemotes(): Network[] {
    return Array.from(this.networks.values()).filter(
      (network) => network != this.host
    );
  }

  async getNomadUpdater(
    networkish: string | number | Network,
    addressOrIndex?: string | number
  ): Promise<Updater> {
    const network = this.getNetwork(networkish);
    if (!network) throw new Error(`Network not found`);

    const addressOrNumInNode =
      addressOrIndex || this.getUpdaterKey(network)?.toAddress();
    if (!addressOrNumInNode)
      throw new Error(
        `No way to identify updater's address: provide to function, or define in nomad`
      );

    const signerWithAddress = await network.getSignerWithAddress(
      addressOrNumInNode
    );
    return Updater.fromSigner(signerWithAddress, network.domain);
  }

  setAllKey(networkish: string | number | Network, key: Key) {
    this.setDeployer(networkish, key);
    this.setSigner(networkish, key);
    this.setUpdater(networkish, key);
    this.setWatcher(networkish, key);
  }

  setArtifacts(artifacts: DeployArtifacts) {
    this.deployArtifacts = artifacts;
  }

  getAgent(agentType: string | AgentType, network: Network): Agent {
    const agentName = `${agentTypeToString(agentType)}_${network.name}`;
    let agent = this.agents.get(agentName);
    if (agent) {
      return agent;
    } else {
      agent = new LocalAgent(agentType, network, this);
      this.agents.set(agentName, agent);
      return agent;
    }
  }

  getNetwork(networkish: string | number | Network): Network | undefined {
    const domain = this.networkToDomain(networkish);
    if (domain) return this.networks.get(domain);
    return undefined;
  }

  getNetworks(): Network[] {
    return Array.from(this.networks.values());
  }

  getCore(networkish: string | number | Network): NomadCoreContracts {
    const network = this.getNetwork(networkish);
    if (!network) throw new Error(`Network not found`);

    const multiprovider = this.multiprovider;
    if (!multiprovider) throw new Error(`No multiprovider`);

    const contracts = multiprovider.getCore(network.domain);
    if (!contracts) throw new Error(`No contracts`);
    return contracts;
  }

  getBridge(networkish: string | number | Network): NomadBridgeContracts {
    const network = this.getNetwork(networkish);
    if (!network) throw new Error(`Network not found`);

    const multiprovider = this.multiprovider;
    if (!multiprovider) throw new Error(`No multiprovider`);

    const contracts = multiprovider.getBridge(network.domain);
    if (!contracts) throw new Error(`No contracts`);
    return contracts;
  }

  private getDomainByName(networkName: string): number | undefined {
    const found = Array.from(this.networks.entries()).find(
      ([_, net]) => net.name == networkName
    );

    if (found) return found[0];
    else return undefined;
  }

  private networkToDomain(
    networkish: string | number | Network
  ): number | undefined {
    if (typeof networkish === "string") {
      return this.getDomainByName(networkish);
    } else if (typeof networkish === "number") {
      if (!this.networks.has(networkish))
        console.warn(
          `Even though domain-key pair was added to deployers, domain haven't been added to nomad yet!`
        );
      return networkish;
    } else {
      if (!this.networks.has(networkish.domain))
        console.warn(
          `Even though network exists it was found not added to nomad yet!`
        );
      return networkish.domain;
    }
  }

  getDeployArtifacts(): DeployArtifacts | undefined {
    return this.deployArtifacts;
  }

  async getNomadDomainForNetwork(
    networkish: string | number | Network
  ): Promise<NomadDomain | undefined> {
    const network = this.getNetwork(networkish);

    if (!network)
      throw new Error(`Network ${networkish.toString()} was not found`);

    const artifact = this.getArtifacts(network);

    if (!artifact) return undefined;

    const ethHelper = this.getBridgeConfig(network).weth; // TODO: maybe better to use some post deploy function, though later. Example: artifact.bridge.contracts.ethHelper.weth()
    const home = artifact.core.coreDeployAddresses.home.proxy;

    const replicas = Object.entries(
      artifact.core.coreDeployAddresses.replicas || {}
    ).map(([domainStr, replica]) => ({
      domain: parseInt(domainStr),
      address: replica.proxy,
    }));

    return {
      id: network.domain,
      name: network.name,
      bridgeRouter: artifact.bridge.contracts!.bridgeRouter!.proxy.address,
      ethHelper,
      home,
      replicas,
    };
  }

  async updateMultiProvider(): Promise<NomadContext> {
    if (!this.deployArtifacts)
      throw new Error(`Nomad haven't been deployed yet`);
    console.log(`updateMultiProvider...`);

    // Domain duplicates must be taken care at MultiProvider,
    // but it is possible to do it here as well
    const domains = await Promise.all(
      this.getNetworks().map(async (network) =>
        this.getNomadDomainForNetwork(network)
      )
    );

    const isNomadDomain = (
      item: NomadDomain | undefined
    ): item is NomadDomain => {
      return !!item;
    };
    const filteredDomains = domains.filter(isNomadDomain);

    const ctx = NomadContext.fromDomains(filteredDomains);

    this.getNetworks().forEach((network) => {
      const signerKey = this.getSignerKey(network);
      if (signerKey) {
        ctx.registerRpcProvider(network.domain, network.location.toString());

        ctx.registerWalletSigner(network.domain, signerKey.toString());
      } else {
        console.warn(
          `Signer key was not found for network ${network.name} - Multiprovider might not work`
        );
      }
    });

    this.multiprovider = ctx;

    return ctx;
  }

  getMultiprovider(): NomadContext {
    if (!this.multiprovider) throw new Error(`No multiprovider`);
    return this.multiprovider;
  }

  getChain(network: Network): Chain {
    const {name, domain, location} = network;

    const deployerKey = this.deployers.get(domain)?.toString();
    if (!deployerKey)
      throw new Error(
        `Deployer key for ${name}(${domain}) was not found`
      );

      const rpc = location.toString();
      const confirmations = 5;
      const chunk = 100;
      const timelag = 5;
      const gas = DEFAULT_GAS;
      // Also works:
      // {
      //   limit: ethers.BigNumber.from(30000000), // 3 million gas
      //   price: ethers.BigNumber.from(1_000_000), 
      // };

      const provider = new ethers.providers.JsonRpcProvider(rpc);
      const signer = new ethers.Wallet(deployerKey, provider);
      const deployer = new NonceManager(signer);
      return {
        domain,
        name,
        provider,
        deployer,
        confirmations,
        gas,
        config: {
          name,
          rpc,
          domain,
          deployerKey,
          chunk,
          timelag,
          confirmations,
        },
      };
  }

  getCoreConfig(network: Network): CoreConfig {
    const updater = this.updaters.get(network.domain);
    if (!updater)
      console.warn(
        `Updater key for ${network.name}(${network.domain}) was not found`
      ); // throw new Error();

    const watcher = this.watchers.get(network.domain);
    if (!watcher)
      console.warn(
        `Watchers key for ${network.name}(${network.domain}) was not found`
      ); // throw new Error();

    const governor: Governor | undefined = network.governor;

    return {
      environment: "dev" as DeployEnvironment, // TODO
      updater: updater!.toAddress(),
      optimisticSeconds: 10, // TODO
      watchers: [watcher!.toAddress()],
      recoveryTimelock: 180, // TODO
      recoveryManager: "0x24F6c874F56533d9a1422e85e5C7A806ED11c036", // TODO
      processGas: 850_000, // TODO
      reserveGas: 15_000, // TODO
      governor,
    };
  }

  getCoreDeploy(network: Network): CoreDeploy {
    const coreConfig = this.getCoreConfig(network);
    const chain = this.getChain(network);

    return new CoreDeploy(chain, coreConfig);
  }

  getExistingCoreDeploy(network: Network): ExistingCoreDeploy | undefined {
    const coreConfig = this.getCoreConfig(network);
    const chain = this.getChain(network);

    const artifacts = this.getArtifacts(network);

    if (artifacts) {
      const addresses = artifacts.core.coreDeployAddresses;

      return new ExistingCoreDeploy(chain, coreConfig, addresses);
    }
  }

  getBridgeConfig(network: Network): BridgeConfig {
    return {
      // weth: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
    };
  }

  getBridgeDeploy(network: Network, coreDeploy?: CoreDeploy): BridgeDeploy {
    const chain = this.getChain(network);
    const bridgeConfig = this.getBridgeConfig(network);

    if (coreDeploy) {
      return new BridgeDeploy(
        chain,
        bridgeConfig,
        "/tmp/deleteme",
        false,
        coreDeploy.contractOutput
      );
    } else {
      const path = getPathToLatestDeploy();
      return new BridgeDeploy(chain, bridgeConfig, path);
    }
  }

  getExistingBridgeDeploy(network: Network): ExistingBridgeDeploy | undefined {
    const path = getPathToLatestDeploy();
    const chain = this.getChain(network);
    const bridgeConfig = this.getBridgeConfig(network);

    const artifacts = this.getArtifacts(network);

    if (artifacts) {
      const coreAddresses = artifacts.core.coreDeployAddresses;
      const bridgeAddresses = artifacts.bridge.bridgeDeployAddresses;

      return new ExistingBridgeDeploy(
        chain,
        bridgeConfig,
        path,
        false,
        bridgeAddresses,
        coreAddresses
      );
    }
  }

  async getXAppConnectionManager(
    networkish: string | number | Network
  ): Promise<XAppConnectionManager> {
    const network = this.getNetwork(networkish);
    if (!network) throw new Error(`No network!`);

    const signerAddress = this.getWatcherKey(network)?.toAddress();
    if (!signerAddress)
      throw new Error(`No signer for network ${network.toString()}!`);

    const signer = network.getJsonRpcSigner(signerAddress);

    const XAppConnectionManagerAddress =
      this.getArtifacts(networkish)?.core.coreDeployAddresses
        .xAppConnectionManager;
    if (!XAppConnectionManagerAddress)
      throw new Error(`No XAppConnectionManager address in artifacts`);

    return new XAppConnectionManager__factory(signer).attach(
      XAppConnectionManagerAddress
    );
  }

  async deployChains(networks: Network[]) {
    const deploys = networks.map((network) => this.getCoreDeploy(network));
    await deployNChains(deploys);
    return deploys;
  }

  async deployBridges(networks: Network[]) {
    const deploys = networks.map((network) => this.getBridgeDeploy(network));
    await deployBridges(deploys);
    return deploys;
  }

  isDeployed(networkish: string | number | Network): boolean {
    const network = this.getNetwork(networkish);
    if (!network) throw new Error(`No network!`);

    return this.deployed.has(network.domain);
  }

  getDeployedRemotes(): Network[] {
    return this.getRemotes().filter((r) => this.isDeployed(r));
  }

  getNotDeployedRemotes(): Network[] {
    return this.getRemotes().filter((r) => !this.isDeployed(r));
  }

  /**
   * Deploy *not yet deployed* networks.
   * It could be either traditional all nets deploy,
   * or incremental deploy if there are some already
   * deployed networks.
   */
  async deploy(options?: DeployOptions): Promise<void> {
    const newRemotes = this.getNotDeployedRemotes();

    if (newRemotes.length === 0) throw new Error(`No networks to deploy`);

    const oldRemotes = this.getDeployedRemotes();

    if (oldRemotes.length === 0) {
      await this.deployAllNetworks([this.host, ...newRemotes]);
    } else {
      await this.deployAdditionalNetworks(this.host, oldRemotes, newRemotes);
    }

    this.enhanceArtifacts(options?.injectSigners);

    this.exportDeployArtifacts();

    await this.updateMultiProvider();

    return;
  }

  async deployAllNetworks(networks: Network[]): Promise<DeployArtifacts> {
    if (!this.host.isGovernor()) {
      this.host.setLocalGovernor(this.getDeployerKey(this.host)!.toAddress());
    }

    const coreDeploysDeployed = await this.deployChains(networks);
    const bridgeDeploysDeployed = await this.deployBridges(networks);

    const coreDeployArtifacts =
      this.ejectCoreDeploysArtifacts(coreDeploysDeployed);
    const bridgeDeployArtifacts = this.ejectBridgeDeploysArtifacts(
      bridgeDeploysDeployed
    );

    const artifacts = this.mergeCoreAndBridgeArtifacts(
      coreDeployArtifacts,
      bridgeDeployArtifacts
    );

    this.setArtifacts(artifacts);

    this.setDeployed(...networks.map((n) => n.domain));

    return artifacts;
  }

  async deployAdditionalNetworks(
    host: Network,
    oldNetworks: Network[],
    newNetworks: Network[]
  ): Promise<void> {
    for (const newNetwork of newNetworks) {
      await this.deployAdditionalNetwork(newNetwork, host, oldNetworks);
    }
  }

  async deployAdditionalNetwork(
    newNetwork: Network,
    host: Network,
    oldNetworks: Network[]
  ) {
    const oldCoreDeploys = [host, ...oldNetworks].map(
      (n) => this.getExistingCoreDeploy(n)!
    );
    const hostCoreDeploy = oldCoreDeploys[0];

    const oldBridgeDeploys = [host, ...oldNetworks].map(
      (n) => this.getExistingBridgeDeploy(n)!
    );

    const newCoreDeploy = this.getCoreDeploy(newNetwork);
    await deployNewChain(newCoreDeploy, oldCoreDeploys);

    const newBridgeDeploy = this.getBridgeDeploy(newNetwork, newCoreDeploy);
    await deployNewChainBridge(newBridgeDeploy, oldBridgeDeploys);

    const deployer = newCoreDeploy.chain.deployer as NonceManager;
    const nonce = await deployer.getTransactionCount();
    deployer.setTransactionCount(nonce);

    const governingRouter = hostCoreDeploy.contracts.governance!.proxy.connect(
      hostCoreDeploy.deployer
    );

    const zippedDeploys = zip(oldCoreDeploys, oldBridgeDeploys);

    const delegated = true;
    if (delegated) {
      const promises = zippedDeploys.map(([oldCore, oldBridge]) => {
        // We have a set of calls, but only here we know where they go. If we meld them into gnosis safe
        const calls: CallData[] = [
          getEnrollBridgeCall(newBridgeDeploy, oldBridge),
          getEnrollReplicaCall(newCoreDeploy, oldCore),
          ...getEnrollWatchersCall(newCoreDeploy, oldCore),
        ];

        if (oldCore == hostCoreDeploy) {
          return governingRouter.callLocal(calls, hostCoreDeploy.overrides);
        } else {
          return governingRouter.callRemote(
            oldCore.chain.domain,
            calls,
            hostCoreDeploy.overrides
          );
        }
      });

      await Promise.all([
        ...promises,
        // this also eventually should also be a prepared
        // call which will be passed to itslef (GovernanceRouter) probably
        governingRouter.setRouterGlobal(
          newCoreDeploy.chain.domain,
          toBytes32(newCoreDeploy.contracts.governance!.proxy.address)
        ),
      ]);
    } else {
      // await Promise.all([
      //     enrollCoreThroughGovernance(hostCoreDeploy, newCoreDeploy, oldCoreDeploys),
      //     enrollBridgeThroughGovernance(hostCoreDeploy, newBridgeDeploy, oldBridgeDeploys),
      //     enrollRouterThroughGovernance(hostCoreDeploy, newCoreDeploy),
      // ])
    }

    const remoteDomains = Array.from(this.deployed);
    await checkCoreDeploy(newCoreDeploy, remoteDomains, host.domain);
    await checkBridgeDeploy(newBridgeDeploy, remoteDomains);
    await this.checkIncrementalDeploy(
      newCoreDeploy,
      newBridgeDeploy,
      zippedDeploys
    );

    const coreDeployArtifacts = this.ejectCoreDeploysArtifacts([
      newCoreDeploy,
      ...oldCoreDeploys,
    ]);
    const bridgeDeployArtifacts = this.ejectBridgeDeploysArtifacts([
      newBridgeDeploy,
      ...oldBridgeDeploys,
    ]);

    const artifacts = this.mergeCoreAndBridgeArtifacts(
      coreDeployArtifacts,
      bridgeDeployArtifacts
    );

    this.setArtifacts(artifacts);

    this.setDeployed(newNetwork.domain);
  }

  async checkIncrementalDeploy(
    newCoreDeploy: CoreDeploy,
    newBridgeDeploy: BridgeDeploy,
    zippedDeploys: [CoreDeploy, BridgeDeploy][]
  ): Promise<void> {
    const newDomain = newCoreDeploy.chain.domain;

    const actualGovRouterAddress =
      newCoreDeploy.contracts.governance!.proxy.address.toLowerCase();

    const actualWatchers = newCoreDeploy.config.watchers.map((w) =>
      w.toLowerCase()
    );

    const actualBridgeRouterAddress =
      newBridgeDeploy.contracts.bridgeRouter!.proxy.address.toLowerCase();

    let lastError: typeof AssertionError | undefined = undefined;
    const w = new Waiter(
      async () => {
        try {
          for (const [oldCoreDeploy, oldBridgeDeploy] of zippedDeploys) {
            const govRouterAddress =
              await oldCoreDeploy.contracts.governance!.proxy.routers(
                newDomain
              );
            expect("0x" + govRouterAddress.slice(26).toLowerCase()).to.equal(
              actualGovRouterAddress,
              `Wrong remote GovernanceRouter address at Domain ${oldCoreDeploy.chain.domain}`
            );

            for (const wAddress of actualWatchers) {
              const permissionExists =
                await oldCoreDeploy.contracts.xAppConnectionManager!.watcherPermission(
                  wAddress,
                  newDomain
                );
              expect(
                permissionExists,
                `No permission exists for watcher '${wAddress}' and domain: ${newDomain}`
              );
            }

            const actualReplicaAddress =
              oldCoreDeploy.contracts.replicas[
                newDomain
              ].proxy.address.toLowerCase();
            const replicaAddress =
              await oldCoreDeploy.contracts.xAppConnectionManager!.domainToReplica(
                newDomain
              );
            expect(replicaAddress.toLowerCase()).to.equal(
              actualReplicaAddress,
              `Wrong Replica address at Domain ${oldCoreDeploy.chain.domain}`
            );

            const bridgeRouterAddress =
              await oldBridgeDeploy.contracts.bridgeRouter!.proxy.remotes(
                newDomain
              );
            expect("0x" + bridgeRouterAddress.slice(26).toLowerCase()).to.equal(
              actualBridgeRouterAddress,
              `Wrong remote BridgeRouter address at Domain ${oldCoreDeploy.chain.domain}`
            );
          }

          return true;
        } catch (e: any) {
          lastError = e;
        }
      },
      500_000,
      5_000
    );

    const [_, success] = await w.wait();
    if (!success)
      throw new Error(`Incremental deploy check failed: '${lastError}'`);
  }

  async connectNetworks(): Promise<void> {
    await Promise.all(this.getNetworks().map((n) => n.up()));
  }

  async connectAllAgents(): Promise<void> {
    await this.connectAgents([
      AgentType.Updater,
      AgentType.Relayer,
      AgentType.Processor,
      AgentType.Watcher,
      AgentType.Kathy,
    ]);
  }

  async connectAgents(agentsTypes: (string | AgentType)[]): Promise<void> {
    const startPromises = this.getNetworks().map(async (network) =>
      Promise.all(
        agentsTypes.map(async (agentType) => {
          const agent = this.getAgent(agentType, network);
          await agent.connect();
          return;
        })
      )
    );

    await Promise.all(startPromises);
    return;
  }

  async startAgents(agentsTypes: (string | AgentType)[]): Promise<void> {
    const startPromises = this.getNetworks().map(async (network) =>
      Promise.all(
        agentsTypes.map(async (agentType) => {
          const agent = this.getAgent(agentType, network);
          await agent.connect();
          await agent.start();
          return;
        })
      )
    );

    await Promise.all(startPromises);
    return;
  }

  async stopAgents(
    agentsTypes: (string | AgentType)[],
    disconnect = false
  ): Promise<void> {
    const startPromises = this.getNetworks().map(async (network) =>
      Promise.all(
        agentsTypes.map(async (agentType) => {
          const agent = this.getAgent(agentType, network);
          await agent.stop();
          if (disconnect) await agent.disconnect();
          return;
        })
      )
    );

    await Promise.all(startPromises);
    return;
  }

  async startAllAgents(): Promise<void> {
    return this.startAgents([
      AgentType.Updater,
      AgentType.Relayer,
      AgentType.Processor,
      AgentType.Watcher,
      AgentType.Kathy,
    ]);
  }

  async stopAllAgents(disconnect = false): Promise<void> {
    await Promise.all(
      Array.from(this.agents.values()).map(async (agent) => {
        await agent.stop();
        if (disconnect) await agent.disconnect();
      })
    );

    return;
  }

  async end(): Promise<void> {
    await this.stopAllAgents(true);

    return;
  }

  getXAppConnectionManagersConfig(): Map<string, ConnectionManager> {
    return new Map(
      this.getNetworks().map((network) => {
        const xappCMAddress =
          this.getArtifacts(network)?.core.coreDeployAddresses
            .xAppConnectionManager;
        if (!xappCMAddress)
          throw new Error(
            `No net address for xAppConnectionManager found in artifacts`
          );
        return [
          network.name,
          {
            address: xappCMAddress,
            domain: network.domain.toString(),
            name: network.name,
            rpcStyle: "ethereum",
            connection: {
              url: network.location.toString(),
              type: network.location.scheme,
            },
          },
        ];
      })
    );
  }

  getPartials(): Map<string, Partial> {
    const partials = new Map<string, Partial>();

    partials.set("updater", {
      db: "updaterdb",
      interval: "5",
      pause: "15",
      updater: {
        key: "",
        type: "hexKey",
      },
    });

    partials.set("relayer", {
      db: "relayerdb",
      interval: "10",
    });

    partials.set("processor", {
      db: "processordb",
      interval: "10",
    });

    partials.set("watcher", {
      tracing: {
        level: "debug",
        style: "pretty",
      },
      db: "watcherdb",
      interval: "100",
      watcher: {
        key: "",
        type: "hexKey",
      },
      managers: Object.fromEntries(
        Array.from(this.getXAppConnectionManagersConfig())
      ),
    });

    partials.set("kathy", {
      chat: {
        message: "static message",
        recipient:
          "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
        type: "static",
      },
      interval: "20",
    });

    return partials;
  }

  enhanceArtifacts(injectSigners = false, prettyLogs = true) {
    const artifacts = this.deployArtifacts;

    if (artifacts) {
      for (const [name, artifact] of artifacts.merged) {
        const network = this.getNetwork(name);
        if (network) {
          artifact.core.rustConfig.home.connection.type =
            network.location.scheme;
          artifact.core.rustConfig.home.connection.url =
            network.location.toString();

          if (prettyLogs) {
            artifact.core.rustConfig.tracing.level = "info";
            artifact.core.rustConfig.tracing.fmt = "pretty";
          }

          if (injectSigners) {
            for (const signerName in artifact.core.rustConfig.signers) {
              const signerKey = this.getSignerKey(signerName);
              if (signerKey)
                artifact.core.rustConfig.signers[signerName].key =
                  signerKey.toString();
            }
          }

          for (const replicaName in artifact.core.rustConfig.replicas) {
            const replicaNetwork = this.getNetwork(replicaName);
            if (replicaNetwork) {
              artifact.core.rustConfig.replicas[replicaName].connection.type =
                replicaNetwork.location.scheme;
              artifact.core.rustConfig.replicas[replicaName].connection.url =
                replicaNetwork.location.toString();
            }
          }
        }
      }
    }

    return artifacts;
  }

  defultDeployLocation(): string {
    return `/tmp/${this.id}`;
  }

  exportDeployArtifacts(dir: string | undefined = undefined): boolean {
    if (!dir) dir = this.defultDeployLocation();

    if (!this.deployArtifacts) throw new Error(`No deploy artifacts!`);
    const artifacts = this.deployArtifacts;
    if (artifacts) {
      exportDeployArtifacts(dir, artifacts, this.getPartials());
      return true;
    } else {
      return false;
    }
  }

  ejectCoreDeploysArtifacts(
    deploys: CoreDeploy[]
  ): Map<string, CoreDeploysArtifact> {
    return new Map(
      deploys.map((deploy) => {
        const remotes = deploys
          .slice()
          .filter((remote) => remote.chain.domain !== deploy.chain.domain);

        const config = CoreDeploy.buildConfig(deploy, remotes);
        const name = deploy.chain.name;
        const contracts = deploy.contracts;

        return [
          name,
          {
            rustConfig: config,
            coreDeployAddresses: deploy.contractOutput,
            verificationInput: deploy.verificationInput,
            contracts,
          },
        ];
      })
    );
  }

  ejectBridgeDeploysArtifacts(
    deploys: Deploy[]
  ): Map<string, BridgeDeploysArtifact> {
    return new Map(
      deploys.map((deploy) => {
        const name = deploy.chain.name;

        const contracts = deploy.contracts;
        const verificationInput = deploy.verificationInput;
        const artifact: BridgeDeploysArtifact = {
          contracts,
          verificationInput,
        };

        if (
          deploy instanceof BridgeDeploy ||
          deploy instanceof ExistingBridgeDeploy
        ) {
          artifact.bridgeDeployAddresses = deploy.contractOutput;
        }

        return [name, artifact];
      })
    );
  }

  mergeCoreAndBridgeArtifacts(
    coreArtifacts: Map<string, CoreDeploysArtifact>,
    bridgeArtifacts: Map<string, BridgeDeploysArtifact>
  ): DeployArtifacts {
    const artifacts = Array.from(coreArtifacts.entries()).reduce(
      (artifactsAccumulator, [name, coreArtifact]) => {
        const bridgeArtifact = bridgeArtifacts.get(name);
        if (bridgeArtifact) {
          artifactsAccumulator.set(name, {
            core: coreArtifact,
            bridge: bridgeArtifact,
          });
        }
        return artifactsAccumulator;
      },
      new Map<string, CoreAndBridgeArtifact>()
    );

    return {
      merged: artifacts,
    };
  }
}

type Deploy = BridgeDeploy | TestBridgeDeploy;

interface CoreDeploysArtifact {
  rustConfig: RustConfig;
  coreDeployAddresses: CoreDeployAddresses;
  verificationInput: ContractVerificationInput[];
  contracts?: CoreContracts;
}

function cdArtifactToObject(artifact: CoreDeploysArtifact): Object {
  return {
    rustConfig: artifact.rustConfig,
    coreDeployAddresses: artifact.coreDeployAddresses,
    verificationInput: artifact.verificationInput,
    // contracts: ,
  };
}

interface BridgeDeploysArtifact {
  contracts?: BridgeContracts;
  bridgeDeployAddresses?: BridgeContractAddresses;
  verificationInput: ContractVerificationInput[];
}

function bdArtifactToObject(artifact: BridgeDeploysArtifact): Object {
  return {
    contracts: artifact.contracts?.toObject(),
    verificationInput: artifact.verificationInput,
  };
}

interface CoreAndBridgeArtifact {
  core: CoreDeploysArtifact;
  bridge: BridgeDeploysArtifact;
}

function cbArtifactToObject(artifact: CoreAndBridgeArtifact): Object {
  return {
    core: cdArtifactToObject(artifact.core),
    bridge: bdArtifactToObject(artifact.bridge),
  };
}

interface DeployArtifacts {
  merged: Map<string, CoreAndBridgeArtifact>;
}

function deployArtifactsToObject(
  artifacts: DeployArtifacts | undefined
): Object {
  if (!artifacts) return {};
  return Object.fromEntries(
    Array.from(artifacts.merged.entries()).map(([n, cbArtifact]) => {
      return [n, cbArtifactToObject(cbArtifact)];
    })
  );
}

function deployArtifactsFromObject(o: Object): DeployArtifacts {
  const m = new Map();

  Object.entries(o).forEach(([name, o]) => {
    const core = Object(o)["core"] as CoreDeploysArtifact;
    const bridge = Object(o)["bridge"] as BridgeDeploysArtifact;

    m.set(name, {
      core,
      bridge,
    });
  });

  return {
    merged: m,
  };
}

function exportDeployArtifacts(
  dir: string,
  artifacts: DeployArtifacts,
  partials?: Map<string, Partial>
) {
  const coreDir = `${dir}/latest`;

  const bridgeDir = `${coreDir}/bridge/latest`;

  fs.mkdirSync(coreDir, { recursive: true });
  fs.mkdirSync(bridgeDir, { recursive: true });

  for (const [name, artifact] of artifacts.merged.entries()) {
    const { core, bridge } = artifact;

    const {
      rustConfig: config,
      coreDeployAddresses: contractOutput,
      verificationInput,
    } = core;

    fs.writeFileSync(
      `${coreDir}/${name}_config.json`,
      JSON.stringify(config, null, 2)
    );
    fs.writeFileSync(
      `${coreDir}/${name}_contracts.json`,
      JSON.stringify(contractOutput, null, 2)
    );
    fs.writeFileSync(
      `${coreDir}/${name}_verification.json`,
      JSON.stringify(verificationInput, null, 2)
    );

    if (bridge.contracts && bridge.contracts?.toJsonPretty) {
      fs.writeFileSync(
        `${bridgeDir}/${name}_contracts.json`,
        bridge.contracts?.toJsonPretty()
      );
    }

    fs.writeFileSync(
      `${bridgeDir}/${name}_verification.json`,
      JSON.stringify(bridge.verificationInput, null, 2)
    );
  }

  if (partials) {
    for (const [partialName, partial] of partials) {
      fs.writeFileSync(
        `${coreDir}/${partialName}-partial.json`,
        JSON.stringify(partial, null, 2)
      );
    }
  }
}

interface DeployOptions {
  injectSigners?: boolean;
}

interface ExplicitKey {
  key: string;
  type: string;
}

interface ExplicitConnection {
  url: string;
  type: string;
}

interface ConnectionManager {
  address: string;
  domain: string;
  name: string;
  rpcStyle: string;
  connection: ExplicitConnection;
}

interface ChatGenConfig {
  message: string;
  recipient: string;
  type: string;
}
interface Partial {
  db?: string;
  interval?: string;
  pause?: string;
  updater?: ExplicitKey;
  watcher?: ExplicitKey;
  managers?: Object;
  tracing?: Object;
  chat?: ChatGenConfig;
}
