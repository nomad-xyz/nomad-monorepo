/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  TestBridgeMessage,
  TestBridgeMessageInterface,
} from "../TestBridgeMessage";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_name",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_symbol",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "_decimals",
        type: "uint8",
      },
    ],
    name: "testFormatDetails",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_tokenId",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "_action",
        type: "bytes",
      },
      {
        internalType: "enum BridgeMessage.Types",
        name: "_idType",
        type: "uint8",
      },
      {
        internalType: "enum BridgeMessage.Types",
        name: "_actionType",
        type: "uint8",
      },
    ],
    name: "testFormatMessage",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "testFormatRequestDetails",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "_domain",
        type: "uint32",
      },
      {
        internalType: "bytes32",
        name: "_id",
        type: "bytes32",
      },
    ],
    name: "testFormatTokenId",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_to",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "_amnt",
        type: "uint256",
      },
    ],
    name: "testFormatTransfer",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_action",
        type: "bytes",
      },
    ],
    name: "testIsDetails",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_action",
        type: "bytes",
      },
    ],
    name: "testIsRequestDetails",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_action",
        type: "bytes",
      },
    ],
    name: "testIsTransfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_action",
        type: "bytes",
      },
      {
        internalType: "enum BridgeMessage.Types",
        name: "_t",
        type: "uint8",
      },
    ],
    name: "testIsValidAction",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_message",
        type: "bytes",
      },
    ],
    name: "testIsValidMessageLength",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_message",
        type: "bytes",
      },
    ],
    name: "testMessageType",
    outputs: [
      {
        internalType: "enum BridgeMessage.Types",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_details",
        type: "bytes",
      },
    ],
    name: "testMustBeDetails",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_message",
        type: "bytes",
      },
    ],
    name: "testMustBeMessage",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_request",
        type: "bytes",
      },
    ],
    name: "testMustBeRequestDetails",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_tokenId",
        type: "bytes",
      },
    ],
    name: "testMustBeTokenId",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_transfer",
        type: "bytes",
      },
    ],
    name: "testMustBeTransfer",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_details",
        type: "bytes",
      },
    ],
    name: "testSplitDetails",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_message",
        type: "bytes",
      },
    ],
    name: "testSplitMessage",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_tokenId",
        type: "bytes",
      },
    ],
    name: "testSplitTokenId",
    outputs: [
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_transfer",
        type: "bytes",
      },
    ],
    name: "testSplitTransfer",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50612996806100206000396000f3fe608060405234801561001057600080fd5b506004361061016c5760003560e01c80636c18a185116100cd578063932cbc9811610081578063cd9aeee611610066578063cd9aeee614610d14578063dfd9d1db14610d3d578063f9dd616a14610e7a5761016c565b8063932cbc9814610bc8578063b81726a214610c6e5761016c565b80638213d910116100b25780638213d91014610a5457806382cfb20e14610aff5780638f071d7e14610ba55761016c565b80636c18a1851461089857806375fbce8e1461097d5761016c565b80631a028e201161012457806348528b0c1161010957806348528b0c146106665780635029539f146107ea5780635048e37a146107f25761016c565b80631a028e20146105595780631b083da5146105855761016c565b806308e3410a1161015557806308e3410a1461033257806312bdd731146103ec57806313acadec146104b35761016c565b8063040e728e14610171578063089ee8291461028c575b600080fd5b6102176004803603602081101561018757600080fd5b8101906020810181356401000000008111156101a257600080fd5b8201836020820111156101b457600080fd5b803590602001918460018302840111640100000000831117156101d657600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610f20945050505050565b6040805160208082528351818301528351919283929083019185019080838360005b83811015610251578181015183820152602001610239565b50505050905090810190601f16801561027e5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610217600480360360208110156102a257600080fd5b8101906020810181356401000000008111156102bd57600080fd5b8201836020820111156102cf57600080fd5b803590602001918460018302840111640100000000831117156102f157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610f6f945050505050565b6103d86004803603602081101561034857600080fd5b81019060208101813564010000000081111561036357600080fd5b82018360208201111561037557600080fd5b8035906020019184600183028401116401000000008311171561039757600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610f8b945050505050565b604080519115158252519081900360200190f35b6104926004803603602081101561040257600080fd5b81019060208101813564010000000081111561041d57600080fd5b82018360208201111561042f57600080fd5b8035906020019184600183028401116401000000008311171561045157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610fa3945050505050565b604051808260058111156104a257fe5b815260200191505060405180910390f35b6103d8600480360360208110156104c957600080fd5b8101906020810181356401000000008111156104e457600080fd5b8201836020820111156104f657600080fd5b8035906020019184600183028401116401000000008311171561051857600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610fc3945050505050565b6102176004803603606081101561056f57600080fd5b508035906020810135906040013560ff16610fdb565b61062b6004803603602081101561059b57600080fd5b8101906020810181356401000000008111156105b657600080fd5b8201836020820111156105c857600080fd5b803590602001918460018302840111640100000000831117156105ea57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550610ff5945050505050565b6040805163ffffffff9094168452602084019290925273ffffffffffffffffffffffffffffffffffffffff1682820152519081900360600190f35b61070c6004803603602081101561067c57600080fd5b81019060208101813564010000000081111561069757600080fd5b8201836020820111156106a957600080fd5b803590602001918460018302840111640100000000831117156106cb57600080fd5b91908080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525092955061103b945050505050565b604051808060200180602001838103835285818151815260200191508051906020019080838360005b8381101561074d578181015183820152602001610735565b50505050905090810190601f16801561077a5780820380516001836020036101000a031916815260200191505b50838103825284518152845160209182019186019080838360005b838110156107ad578181015183820152602001610795565b50505050905090810190601f1680156107da5780820380516001836020036101000a031916815260200191505b5094505050505060405180910390f35b6102176110cb565b6102176004803603602081101561080857600080fd5b81019060208101813564010000000081111561082357600080fd5b82018360208201111561083557600080fd5b8035906020019184600183028401116401000000008311171561085757600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506110dd945050505050565b61093e600480360360208110156108ae57600080fd5b8101906020810181356401000000008111156108c957600080fd5b8201836020820111156108db57600080fd5b803590602001918460018302840111640100000000831117156108fd57600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506110f9945050505050565b6040805160ff9095168552602085019390935273ffffffffffffffffffffffffffffffffffffffff909116838301526060830152519081900360800190f35b610a236004803603602081101561099357600080fd5b8101906020810181356401000000008111156109ae57600080fd5b8201836020820111156109c057600080fd5b803590602001918460018302840111640100000000831117156109e257600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550611152945050505050565b604051808560ff1681526020018481526020018381526020018260ff16815260200194505050505060405180910390f35b6103d860048036036040811015610a6a57600080fd5b810190602081018135640100000000811115610a8557600080fd5b820183602082011115610a9757600080fd5b80359060200191846001830284011164010000000083111715610ab957600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295505050903560ff1691506111969050565b61021760048036036020811015610b1557600080fd5b810190602081018135640100000000811115610b3057600080fd5b820183602082011115610b4257600080fd5b80359060200191846001830284011164010000000083111715610b6457600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506111b8945050505050565b61021760048036036040811015610bbb57600080fd5b50803590602001356111d4565b6103d860048036036020811015610bde57600080fd5b810190602081018135640100000000811115610bf957600080fd5b820183602082011115610c0b57600080fd5b80359060200191846001830284011164010000000083111715610c2d57600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295506111e3945050505050565b6103d860048036036020811015610c8457600080fd5b810190602081018135640100000000811115610c9f57600080fd5b820183602082011115610cb157600080fd5b80359060200191846001830284011164010000000083111715610cd357600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550611203945050505050565b61021760048036036040811015610d2a57600080fd5b5063ffffffff813516906020013561121b565b61021760048036036080811015610d5357600080fd5b810190602081018135640100000000811115610d6e57600080fd5b820183602082011115610d8057600080fd5b80359060200191846001830284011164010000000083111715610da257600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295949360208101935035915050640100000000811115610df557600080fd5b820183602082011115610e0757600080fd5b80359060200191846001830284011164010000000083111715610e2957600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295505060ff833581169450602090930135909216915061122a9050565b61021760048036036020811015610e9057600080fd5b810190602081018135640100000000811115610eab57600080fd5b820183602082011115610ebd57600080fd5b80359060200191846001830284011164010000000083111715610edf57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550611269945050505050565b60606000610f3160055b8490611285565b9050610f66610f3f826112a9565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000166112de565b9150505b919050565b60606000610f7d6004610f2a565b9050610f66610f3f82611322565b600080610f986004610f2a565b9050610f6681611330565b600080610faf83611366565b9050610f66610fbe8483611285565b611384565b600080610fd06005610f2a565b9050610f66816113bf565b6060610feb610f3f8585856113de565b90505b9392505050565b6000808080611005856001611285565b9050600061101282611448565b9050600061101f836114ab565b9050600061102c846114e9565b92989197509195509350505050565b606080600061104d60025b8590611285565b9050600061105a82611525565b9050600061106783611565565b90506110947fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000083166112de565b6110bf7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000083166112de565b94509450505050915091565b60606110d8610f3f6115fd565b905090565b606060006110eb6003610f2a565b9050610f66610f3f82611649565b60008080808061110c60035b8790611285565b9050600061111982611657565b9050600061112683611687565b90506000611133846116c5565b9050600061114085611701565b939a9299509097509195509350505050565b6000808080806111626004611105565b9050600061116f82611657565b9050600061117c8361173f565b905060006111898461174d565b905060006111408561178b565b60006111af6111aa83600581111561104657fe5b6117c9565b90505b92915050565b606060006111c66001610f2a565b9050610f66610f3f826117f2565b60606111af610f3f8484611800565b6000806111ef83611366565b9050610f666111fe8483611285565b61185c565b6000806112106003610f2a565b9050610f66816118b8565b60606111af610f3f84846118d7565b6060600061123d84600581111561110557fe5b9050600061125084600581111561110557fe5b905061125c8282611925565b925050505b949350505050565b606060006112776002610f2a565b9050610f66610f3f82611a39565b8151600090602084016112a064ffffffffff85168284611a47565b95945050505050565b60006111b26112b783611a9d565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000016611b1e565b60606000806112ec84611b98565b6bffffffffffffffffffffffff16905060405191508192506113118483602001611bac565b508181016020016040529052919050565b60006111b26112b783611cd8565b6000600461133d83611657565b60ff161480156111b2575060045b61135483611384565b600581111561135f57fe5b1492915050565b60008160248151811061137557fe5b016020015160f81c9050919050565b60006113b17fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008316611d25565b60ff1660058111156111b257fe5b600060056113cc83611657565b60ff161480156111b25750600561134b565b6000610feb611443600060048787876040516020018085600581111561140057fe5b60f81b81526001018481526020018381526020018260ff1660f81b815260010194505050505060405160208183030381529060405261128590919063ffffffff16565b611322565b600081600161147b815b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000841690611d2b565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000851660006004611eab565b60008160016114b981611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000851660046020611ecc565b60008160016114f781611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008516601061203a565b600081600261153381611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008516600060246001612048565b600081600261157381611452565b50600060246115a37fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008716611b98565b6bffffffffffffffffffffffff1603905060006115bf866120ce565b60ff1690506115f37fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000871660248484612048565b9695505050505050565b60006110d8611644600060056040516020018082600581111561161c57fe5b60f81b815260010191505060405160208183030381529060405261128590919063ffffffff16565b6112a9565b60006111b26112b7836120ff565b60006111b27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008316826001611eab565b600081600361169581611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000851660016020611ecc565b60008160036116d381611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008516600d61203a565b600081600361170f81611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000851660216020611eab565b600081600461169581611452565b600081600461175b81611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000851660216020611ecc565b600081600461179981611452565b506112617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000851660416001611eab565b60006117d482611330565b806117e357506117e3826113bf565b806111b257506111b2826118b8565b60006111b26112b78361214c565b60006111af6118576000600386866040516020018084600581111561182157fe5b60f81b8152600101838152602001828152602001935050505060405160208183030381529060405261128590919063ffffffff16565b611649565b60008061188a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008416611b98565b6bffffffffffffffffffffffff16905060658114806118a95750606681145b80610f66575060251492915050565b600060036118c583611657565b60ff161480156111b25750600361134b565b60006111af61192060008585604051602001808363ffffffff1660e01b81526004018281526020019250505060405160208183030381529060405261128590919063ffffffff16565b6117f2565b606082600161193381611452565b5061193d846117c9565b6119a857604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600760248201527f21616374696f6e00000000000000000000000000000000000000000000000000604482015290519081900360640190fd5b60408051600280825260608201835260009260208301908036833701905050905085816000815181106119d757fe5b602002602001019062ffffff1916908162ffffff19168152505084816001815181106119ff57fe5b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000909216602092830291909101909101526115f381612199565b60006111b26112b7836121e9565b600080611a548484612203565b9050604051811115611a64575060005b80611a92577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000915050610fee565b6112a0858585612275565b60006001611acc7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008416611b98565b6bffffffffffffffffffffffff161415611b1657611b0f60055b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000841690612288565b9050610f6a565b6111b26122ae565b6000611b29826122d2565b611b9457604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f56616c696469747920617373657274696f6e206661696c656400000000000000604482015290519081900360640190fd5b5090565b60181c6bffffffffffffffffffffffff1690565b6000611bb78361230f565b611c0c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260288152602001806128d96028913960400191505060405180910390fd5b611c15836122d2565b611c6a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602b815260200180612901602b913960400191505060405180910390fd5b6000611c7584611b98565b6bffffffffffffffffffffffff1690506000611c9085612321565b6bffffffffffffffffffffffff1690506000604051905084811115611cb55760206060fd5b8285848460045afa506115f3611cca87611d25565b64ffffffffff168685612275565b60006042611d077fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008416611b98565b6bffffffffffffffffffffffff161415611b1657611b0f6004611ae6565b60d81c90565b6000611d378383612335565b611ea4576000611d55611d4985611d25565b64ffffffffff16612357565b9150506000611d6a8464ffffffffff16612357565b604080517f5479706520617373657274696f6e206661696c65642e20476f742030780000006020808301919091527fffffffffffffffffffff0000000000000000000000000000000000000000000060b088811b8216603d8501527f2e20457870656374656420307800000000000000000000000000000000000000604785015285901b1660548301528251603e818403018152605e8301938490527f08c379a000000000000000000000000000000000000000000000000000000000909352606282018181528351608284015283519496509294508493839260a2019185019080838360005b83811015611e69578181015183820152602001611e51565b50505050905090810190601f168015611e965780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5090919050565b60008160200360080260ff16611ec2858585611ecc565b901c949350505050565b600060ff8216611ede57506000610fee565b611ee784611b98565b6bffffffffffffffffffffffff16611f028460ff8516612203565b1115611fa457611f43611f1485612321565b6bffffffffffffffffffffffff16611f2b86611b98565b6bffffffffffffffffffffffff16858560ff1661242b565b6040517f08c379a0000000000000000000000000000000000000000000000000000000008152602060048201818152835160248401528351909283926044909101919085019080838360008315611e69578181015183820152602001611e51565b60208260ff161115612001576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603a81526020018061289f603a913960400191505060405180910390fd5b60088202600061201086612321565b6bffffffffffffffffffffffff169050600061202b83612586565b91909501511695945050505050565b60006111af83836014611eab565b60008061205486612321565b6bffffffffffffffffffffffff16905061206d866125cf565b6120818561207b8489612203565b90612203565b11156120b0577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000915050611261565b6120ba8186612203565b90506115f38364ffffffffff168286611a47565b60006111b27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000831660246001611eab565b6000604161212e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008416611b98565b6bffffffffffffffffffffffff161415611b1657611b0f6003611ae6565b6000602461217b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008416611b98565b6bffffffffffffffffffffffff161415611b1657611b0f6001611ae6565b60405160609060006121ae84602084016125f9565b905060006121bb82611b98565b6bffffffffffffffffffffffff16905060006121d683612671565b9184525082016020016040525092915050565b60006121f48261185c565b15611b1657611b0f6002611ae6565b818101828110156111b257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4f766572666c6f7720647572696e67206164646974696f6e2e00000000000000604482015290519081900360640190fd5b606092831b9190911790911b1760181b90565b60d81b7affffffffffffffffffffffffffffffffffffffffffffffffffffff9091161790565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000090565b60006122dd82611d25565b64ffffffffff1664ffffffffff14156122f857506000610f6a565b6000612303836125cf565b60405110199392505050565b600061231a82612685565b1592915050565b60781c6bffffffffffffffffffffffff1690565b60008164ffffffffff1661234884611d25565b64ffffffffff16149392505050565b600080601f5b600f8160ff1611156123bf5760ff600882021684901c61237c816126ad565b61ffff16841793508160ff1660101461239757601084901b93505b507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0161235d565b50600f5b60ff8160ff1610156124255760ff600882021684901c6123e2816126ad565b61ffff16831792508160ff166000146123fd57601083901b92505b507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff016123c3565b50915091565b6060600061243886612357565b915050600061244686612357565b915050600061245486612357565b915050600061246286612357565b91505083838383604051602001808061292c603591397fffffffffffff000000000000000000000000000000000000000000000000000060d087811b821660358401527f2077697468206c656e6774682030780000000000000000000000000000000000603b84015286901b16604a820152605001602161287e82397fffffffffffff000000000000000000000000000000000000000000000000000060d094851b811660218301527f2077697468206c656e677468203078000000000000000000000000000000000060278301529290931b9091166036830152507f2e00000000000000000000000000000000000000000000000000000000000000603c82015260408051601d818403018152603d90920190529b9a5050505050505050505050565b7f80000000000000000000000000000000000000000000000000000000000000007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9091011d90565b60006125da82611b98565b6125e383612321565b016bffffffffffffffffffffffff169050919050565b60006040518281111561260c5760206060fd5b506000805b845181101561266457600085828151811061262857fe5b6020026020010151905061263e81848701611bac565b5061264881611b98565b6bffffffffffffffffffffffff16929092019150600101612611565b5061126160008483612275565b600061267c826126dd565b60200292915050565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000009081161490565b60006126bf60048360ff16901c612711565b60ff161760081b62ffff00166126d482612711565b60ff1617919050565b6000602061270360206126ef85611b98565b6bffffffffffffffffffffffff1690612203565b8161270a57fe5b0492915050565b600060f08083179060ff8216141561272d576030915050610f6a565b8060ff1660f11415612743576031915050610f6a565b8060ff1660f21415612759576032915050610f6a565b8060ff1660f3141561276f576033915050610f6a565b8060ff1660f41415612785576034915050610f6a565b8060ff1660f5141561279b576035915050610f6a565b8060ff1660f614156127b1576036915050610f6a565b8060ff1660f714156127c7576037915050610f6a565b8060ff1660f814156127dd576038915050610f6a565b8060ff1660f914156127f3576039915050610f6a565b8060ff1660fa1415612809576061915050610f6a565b8060ff1660fb141561281f576062915050610f6a565b8060ff1660fc1415612835576063915050610f6a565b8060ff1660fd141561284b576064915050610f6a565b8060ff1660fe1415612861576065915050610f6a565b8060ff1660ff1415612877576066915050610f6a565b5091905056fe2e20417474656d7074656420746f20696e646578206174206f666673657420307854797065644d656d566965772f696e646578202d20417474656d7074656420746f20696e646578206d6f7265207468616e20333220627974657354797065644d656d566965772f636f7079546f202d204e756c6c20706f696e74657220646572656654797065644d656d566965772f636f7079546f202d20496e76616c696420706f696e74657220646572656654797065644d656d566965772f696e646578202d204f76657272616e2074686520766965772e20536c696365206973206174203078a264697066735822122028bc4894fdcc949887070c288b41bb554806ee4958cd125b8b2a11b1b65e356f64736f6c63430007060033";

export class TestBridgeMessage__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<TestBridgeMessage> {
    return super.deploy(overrides || {}) as Promise<TestBridgeMessage>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): TestBridgeMessage {
    return super.attach(address) as TestBridgeMessage;
  }
  connect(signer: Signer): TestBridgeMessage__factory {
    return super.connect(signer) as TestBridgeMessage__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TestBridgeMessageInterface {
    return new utils.Interface(_abi) as TestBridgeMessageInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TestBridgeMessage {
    return new Contract(address, _abi, signerOrProvider) as TestBridgeMessage;
  }
}
