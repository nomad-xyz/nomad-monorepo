/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { MysteryMath, MysteryMathInterface } from "../MysteryMath";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "a",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "b",
        type: "uint256",
      },
    ],
    name: "doMath",
    outputs: [
      {
        internalType: "uint256",
        name: "_result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "getState",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_var",
        type: "uint256",
      },
    ],
    name: "setState",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "stateVar",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class MysteryMath__factory {
  static readonly abi = _abi;
  static createInterface(): MysteryMathInterface {
    return new utils.Interface(_abi) as MysteryMathInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MysteryMath {
    return new Contract(address, _abi, signerOrProvider) as MysteryMath;
  }
}
