/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { BadRecipient5, BadRecipient5Interface } from "../BadRecipient5";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "handle",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610192806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063ab2dc3f514610030575b600080fd5b6100f36004803603608081101561004657600080fd5b63ffffffff82358116926020810135909116916040820135919081019060808101606082013564010000000081111561007e57600080fd5b82018360208201111561009057600080fd5b803590602001918460018302840111640100000000831117156100b257600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506100f5945050505050565b005b604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600960248201527f6e6f2063616e20646f0000000000000000000000000000000000000000000000604482015290519081900360640190fdfea264697066735822122048d59f98888f4a4947bbf6420c4b378c73a8e1bfb17580ec3cb18866a5afbe7464736f6c63430007060033";

export class BadRecipient5__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<BadRecipient5> {
    return super.deploy(overrides || {}) as Promise<BadRecipient5>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): BadRecipient5 {
    return super.attach(address) as BadRecipient5;
  }
  connect(signer: Signer): BadRecipient5__factory {
    return super.connect(signer) as BadRecipient5__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BadRecipient5Interface {
    return new utils.Interface(_abi) as BadRecipient5Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BadRecipient5 {
    return new Contract(address, _abi, signerOrProvider) as BadRecipient5;
  }
}
