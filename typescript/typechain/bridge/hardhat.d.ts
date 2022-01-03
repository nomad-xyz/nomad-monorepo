/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "Home",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Home__factory>;
    getContractFactory(
      name: "MerkleTreeManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MerkleTreeManager__factory>;
    getContractFactory(
      name: "NomadBase",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.NomadBase__factory>;
    getContractFactory(
      name: "QueueManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.QueueManager__factory>;
    getContractFactory(
      name: "Replica",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Replica__factory>;
    getContractFactory(
      name: "UpgradeBeaconProxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UpgradeBeaconProxy__factory>;
    getContractFactory(
      name: "Version0",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Version0__factory>;
    getContractFactory(
      name: "XAppConnectionManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.XAppConnectionManager__factory>;
    getContractFactory(
      name: "IMessageRecipient",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IMessageRecipient__factory>;
    getContractFactory(
      name: "IUpdaterManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUpdaterManager__factory>;
    getContractFactory(
      name: "OwnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OwnableUpgradeable__factory>;
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "TypedMemView",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TypedMemView__factory>;
    getContractFactory(
      name: "BridgeRouter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BridgeRouter__factory>;
    getContractFactory(
      name: "BridgeToken",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BridgeToken__factory>;
    getContractFactory(
      name: "ETHHelper",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ETHHelper__factory>;
    getContractFactory(
      name: "MockCore",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockCore__factory>;
    getContractFactory(
      name: "MockWeth",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MockWeth__factory>;
    getContractFactory(
      name: "TestBridgeMessage",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestBridgeMessage__factory>;
    getContractFactory(
      name: "TestEncoding",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TestEncoding__factory>;
    getContractFactory(
      name: "TokenRegistry",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TokenRegistry__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "PingPongRouter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.PingPongRouter__factory>;
    getContractFactory(
      name: "Router",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Router__factory>;
    getContractFactory(
      name: "RouterTemplate",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.RouterTemplate__factory>;
    getContractFactory(
      name: "XAppConnectionClient",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.XAppConnectionClient__factory>;
    getContractFactory(
      name: "IBridgeToken",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBridgeToken__factory>;
    getContractFactory(
      name: "IWeth",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IWeth__factory>;

    getContractAt(
      name: "Home",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Home>;
    getContractAt(
      name: "MerkleTreeManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MerkleTreeManager>;
    getContractAt(
      name: "NomadBase",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.NomadBase>;
    getContractAt(
      name: "QueueManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.QueueManager>;
    getContractAt(
      name: "Replica",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Replica>;
    getContractAt(
      name: "UpgradeBeaconProxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UpgradeBeaconProxy>;
    getContractAt(
      name: "Version0",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Version0>;
    getContractAt(
      name: "XAppConnectionManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.XAppConnectionManager>;
    getContractAt(
      name: "IMessageRecipient",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IMessageRecipient>;
    getContractAt(
      name: "IUpdaterManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUpdaterManager>;
    getContractAt(
      name: "OwnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OwnableUpgradeable>;
    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "TypedMemView",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TypedMemView>;
    getContractAt(
      name: "BridgeRouter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BridgeRouter>;
    getContractAt(
      name: "BridgeToken",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BridgeToken>;
    getContractAt(
      name: "ETHHelper",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ETHHelper>;
    getContractAt(
      name: "MockCore",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockCore>;
    getContractAt(
      name: "MockWeth",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MockWeth>;
    getContractAt(
      name: "TestBridgeMessage",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TestBridgeMessage>;
    getContractAt(
      name: "TestEncoding",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TestEncoding>;
    getContractAt(
      name: "TokenRegistry",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TokenRegistry>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "PingPongRouter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.PingPongRouter>;
    getContractAt(
      name: "Router",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Router>;
    getContractAt(
      name: "RouterTemplate",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.RouterTemplate>;
    getContractAt(
      name: "XAppConnectionClient",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.XAppConnectionClient>;
    getContractAt(
      name: "IBridgeToken",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBridgeToken>;
    getContractAt(
      name: "IWeth",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IWeth>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
