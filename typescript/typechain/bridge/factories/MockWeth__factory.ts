/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MockWeth, MockWethInterface } from "../MockWeth";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: true,
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "decimals",
        type: "uint8",
      },
    ],
    name: "UpdateDetails",
    type: "event",
  },
  {
    inputs: [],
    name: "VERSION",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_PERMIT_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        internalType: "address",
        name: "_spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        internalType: "address",
        name: "_from",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amnt",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "detailsHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "domainSeparator",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amnt",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonces",
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
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "_spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "_r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_newName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_newSymbol",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_newDecimals",
        type: "uint8",
      },
    ],
    name: "setDetails",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_detailsHash",
        type: "bytes32",
      },
    ],
    name: "setDetailsHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9608052610120604052600160e052603160f81b610100527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc660a05261190160f01b60c05234801561007057600080fd5b5060805160a05160c05160f01c6126736100a56000398061126652508061159b525080610ee4528061120252506126736000f3fe6080604052600436106101a15760003560e01c80638da5cb5b116100e1578063cc2ab7c71161008a578063dd62ed3e11610064578063dd62ed3e14610722578063f2fde38b1461076a578063f698da25146107aa578063ffa1ad74146107bf576101a1565b8063cc2ab7c714610685578063d0e30db0146106af578063d505accf146106b7576101a1565b80639dc29fac116100bb5780639dc29fac146105b3578063a457c2d7146105f9578063a9059cbb1461063f576101a1565b80638da5cb5b1461054b57806395d89b4114610589578063982aaf6b1461059e576101a1565b806340c10f191161014e57806370a082311161012857806370a08231146104a1578063715018a6146104e15780637ecebe00146104f65780638129fc1c14610536576101a1565b806340c10f19146103725780634815fcb1146103ba578063654935f4146103cf576101a1565b806323b872dd1161017f57806323b872dd146102b1578063313ce56714610301578063395093511461032c576101a1565b806306fdde03146101a6578063095ea7b31461023057806318160ddd1461028a575b600080fd5b3480156101b257600080fd5b506101bb6107d4565b6040805160208082528351818301528351919283929083019185019080838360005b838110156101f55781810151838201526020016101dd565b50505050905090810190601f1680156102225780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561023c57600080fd5b506102766004803603604081101561025357600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610888565b604080519115158252519081900360200190f35b34801561029657600080fd5b5061029f61089e565b60408051918252519081900360200190f35b3480156102bd57600080fd5b50610276600480360360608110156102d457600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135811691602081013590911690604001356108a4565b34801561030d57600080fd5b5061031661091a565b6040805160ff9092168252519081900360200190f35b34801561033857600080fd5b506102766004803603604081101561034f57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610923565b34801561037e57600080fd5b506103b86004803603604081101561039557600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610966565b005b3480156103c657600080fd5b5061029f610a1c565b3480156103db57600080fd5b506103b8600480360360608110156103f257600080fd5b81019060208101813564010000000081111561040d57600080fd5b82018360208201111561041f57600080fd5b8035906020019184600183028401116401000000008311171561044157600080fd5b91939092909160208101903564010000000081111561045f57600080fd5b82018360208201111561047157600080fd5b8035906020019184600183028401116401000000008311171561049357600080fd5b91935091503560ff16610a22565b3480156104ad57600080fd5b5061029f600480360360208110156104c457600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610bf1565b3480156104ed57600080fd5b506103b8610c02565b34801561050257600080fd5b5061029f6004803603602081101561051957600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610d19565b34801561054257600080fd5b506103b8610d2b565b34801561055757600080fd5b50610560610e47565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b34801561059557600080fd5b506101bb610e63565b3480156105aa57600080fd5b5061029f610ee2565b3480156105bf57600080fd5b506103b8600480360360408110156105d657600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610f06565b34801561060557600080fd5b506102766004803603604081101561061c57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610fb8565b34801561064b57600080fd5b506102766004803603604081101561066257600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135611014565b34801561069157600080fd5b506103b8600480360360208110156106a857600080fd5b5035611021565b6103b86110d7565b3480156106c357600080fd5b506103b8600480360360e08110156106da57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff813581169160208101359091169060408101359060608101359060ff6080820135169060a08101359060c001356110e3565b34801561072e57600080fd5b5061029f6004803603604081101561074557600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81358116916020013516611410565b34801561077657600080fd5b506103b86004803603602081101561078d57600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16611448565b3480156107b657600080fd5b5061029f6114f9565b3480156107cb57600080fd5b506103166115ef565b60688054604080516020601f60027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff61010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561087e5780601f106108535761010080835404028352916020019161087e565b820191906000526020600020905b81548152906001019060200180831161086157829003601f168201915b5050505050905090565b60006108953384846115f4565b50600192915050565b60675490565b60006108b184848461173b565b610910843361090b856040518060600160405280602881526020016125876028913973ffffffffffffffffffffffffffffffffffffffff8a166000908152606660209081526040808320338452909152902054919061190d565b6115f4565b5060019392505050565b606a5460ff1690565b33600081815260666020908152604080832073ffffffffffffffffffffffffffffffffffffffff87168452909152812054909161089591859061090b90866119be565b61096e611a39565b73ffffffffffffffffffffffffffffffffffffffff1661098c610e47565b73ffffffffffffffffffffffffffffffffffffffff1614610a0e57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b610a188282611a3d565b5050565b606c5481565b60685460027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff61010060018416150201909116041580610ad75750606c54610ad586868080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525050604080516020601f8a018190048102820181019092528881529250889150879081908401838280828437600092019190915250879250611b70915050565b145b610b4257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601260248201527f21636f6d6d69747465642064657461696c730000000000000000000000000000604482015290519081900360640190fd5b610b4e606886866123e6565b50610b5b606984846123e6565b50606a80547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660ff831690811790915560405184908490808383808284376040519201829003822094508a93508992508190508383808284376040519201829003822094507f96848da8c41ae282b5ec5c04f45fc469a8186bb78de70419275c2c402fcc27b193506000925050a45050505050565b6000610bfc82611cab565b92915050565b610c0a611a39565b73ffffffffffffffffffffffffffffffffffffffff16610c28610e47565b73ffffffffffffffffffffffffffffffffffffffff1614610caa57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b60335460405160009173ffffffffffffffffffffffffffffffffffffffff16907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3603380547fffffffffffffffffffffffff0000000000000000000000000000000000000000169055565b606b6020526000908152604090205481565b600054610100900460ff1680610d445750610d44611cd3565b80610d52575060005460ff16155b610da7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e815260200180612559602e913960400191505060405180910390fd5b600054610100900460ff16158015610e0d57600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff909116610100171660011790555b610e15611ce4565b8015610e4457600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff1690555b50565b60335473ffffffffffffffffffffffffffffffffffffffff1690565b60698054604080516020601f60027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff61010060018816150201909516949094049384018190048102820181019092528281526060939092909183018282801561087e5780601f106108535761010080835404028352916020019161087e565b7f000000000000000000000000000000000000000000000000000000000000000081565b610f0e611a39565b73ffffffffffffffffffffffffffffffffffffffff16610f2c610e47565b73ffffffffffffffffffffffffffffffffffffffff1614610fae57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b610a188282611dd6565b6000610895338461090b856040518060600160405280602581526020016126196025913933600090815260666020908152604080832073ffffffffffffffffffffffffffffffffffffffff8d168452909152902054919061190d565b600061089533848461173b565b611029611a39565b73ffffffffffffffffffffffffffffffffffffffff16611047610e47565b73ffffffffffffffffffffffffffffffffffffffff16146110c957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b80606c5414610e4457606c55565b6110e13334611a3d565b565b8342111561115257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601d60248201527f45524332305065726d69743a206578706972656420646561646c696e65000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff87166111d457604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601f60248201527f45524332305065726d69743a206f776e6572207a65726f206164647265737300604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8088166000818152606b602090815260408083205481517f00000000000000000000000000000000000000000000000000000000000000008185015280830195909552948b166060850152608084018a905260a0840185905260c08085018a90528151808603909101815260e090940190528251920191909120907f000000000000000000000000000000000000000000000000000000000000000061128d6114f9565b83604051602001808461ffff1660f01b81526002018381526020018281526020019350505050604051602081830303815290604052805190602001209050600060018288888860405160008152602001604052604051808581526020018460ff1681526020018381526020018281526020019450505050506020604051602081039080840390855afa158015611327573d6000803e3d6000fd5b5050506020604051035190508a73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146113cd57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601e60248201527f45524332305065726d69743a20696e76616c6964207369676e61747572650000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8b166000908152606b602052604090206001850190556114038b8b8b6115f4565b5050505050505050505050565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260666020908152604080832093909416825291909152205490565b611450611a39565b73ffffffffffffffffffffffffffffffffffffffff1661146e610e47565b73ffffffffffffffffffffffffffffffffffffffff16146114f057604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b610e4481611f20565b6000804690507f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f606860000160405180828054600181600116156101000203166002900480156115805780601f1061155e576101008083540402835291820191611580565b820191906000526020600020905b81548152906001019060200180831161156c575b505060408051918290038220602080840196909652828201527f0000000000000000000000000000000000000000000000000000000000000000606083015260808201959095523060a0808301919091528551808303909101815260c090910190945250508151910120905090565b600081565b73ffffffffffffffffffffffffffffffffffffffff8316611660576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260248152602001806125f56024913960400191505060405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff82166116cc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806125116022913960400191505060405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff808416600081815260666020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b73ffffffffffffffffffffffffffffffffffffffff83166117a7576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260258152602001806125d06025913960400191505060405180910390fd5b73ffffffffffffffffffffffffffffffffffffffff8216611813576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260238152602001806124a66023913960400191505060405180910390fd5b61181e8383836120c2565b611868816040518060600160405280602681526020016125336026913973ffffffffffffffffffffffffffffffffffffffff8616600090815260656020526040902054919061190d565b73ffffffffffffffffffffffffffffffffffffffff80851660009081526065602052604080822093909355908416815220546118a490826119be565b73ffffffffffffffffffffffffffffffffffffffff80841660008181526065602090815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b600081848411156119b6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561197b578181015183820152602001611963565b50505050905090810190601f1680156119a85780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b600082820183811015611a3257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b3390565b73ffffffffffffffffffffffffffffffffffffffff8216611abf57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015290519081900360640190fd5b611acb600083836120c2565b606754611ad890826119be565b60675573ffffffffffffffffffffffffffffffffffffffff8216600090815260656020526040902054611b0b90826119be565b73ffffffffffffffffffffffffffffffffffffffff831660008181526065602090815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b6000835184845185856040516020018086815260200185805190602001908083835b60208310611bcf57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101611b92565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790529201868152855190830192860191508083835b60208310611c5757805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101611c1a565b6001836020036101000a0380198251168184511680821785525050505050509050018260ff1660f81b8152600101955050505050506040516020818303038152906040528051906020012090509392505050565b73ffffffffffffffffffffffffffffffffffffffff1660009081526065602052604090205490565b6000611cde306120c7565b15905090565b600054610100900460ff1680611cfd5750611cfd611cd3565b80611d0b575060005460ff16155b611d60576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e815260200180612559602e913960400191505060405180910390fd5b600054610100900460ff16158015611dc657600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff909116610100171660011790555b611dce6120cd565b610e156121df565b73ffffffffffffffffffffffffffffffffffffffff8216611e42576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806125af6021913960400191505060405180910390fd5b611e4e826000836120c2565b611e98816040518060600160405280602281526020016124c96022913973ffffffffffffffffffffffffffffffffffffffff8516600090815260656020526040902054919061190d565b73ffffffffffffffffffffffffffffffffffffffff8316600090815260656020526040902055606754611ecb908261236f565b60675560408051828152905160009173ffffffffffffffffffffffffffffffffffffffff8516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9181900360200190a35050565b611f28611a39565b73ffffffffffffffffffffffffffffffffffffffff16611f46610e47565b73ffffffffffffffffffffffffffffffffffffffff1614611fc857604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8116612034576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806124eb6026913960400191505060405180910390fd5b60335460405173ffffffffffffffffffffffffffffffffffffffff8084169216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3603380547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b505050565b3b151590565b600054610100900460ff16806120e657506120e6611cd3565b806120f4575060005460ff16155b612149576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e815260200180612559602e913960400191505060405180910390fd5b600054610100900460ff16158015610e1557600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff909116610100171660011790558015610e4457600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff16905550565b600054610100900460ff16806121f857506121f8611cd3565b80612206575060005460ff16155b61225b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602e815260200180612559602e913960400191505060405180910390fd5b600054610100900460ff161580156122c157600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff909116610100171660011790555b60006122cb611a39565b603380547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8316908117909155604051919250906000907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a3508015610e4457600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff16905550565b6000828211156123e057604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601e60248201527f536166654d6174683a207375627472616374696f6e206f766572666c6f770000604482015290519081900360640190fd5b50900390565b828054600181600116156101000203166002900490600052602060002090601f01602090048101928261241c5760008555612480565b82601f10612453578280017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00823516178555612480565b82800160010185558215612480579182015b82811115612480578235825591602001919060010190612465565b5061248c929150612490565b5090565b5b8082111561248c576000815560010161249156fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737345524332303a206275726e20616d6f756e7420657863656564732062616c616e63654f776e61626c653a206e6577206f776e657220697320746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e6365496e697469616c697a61626c653a20636f6e747261637420697320616c726561647920696e697469616c697a656445524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a206275726e2066726f6d20746865207a65726f206164647265737345524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa2646970667358221220ca88e1988b9c1e87d9672cf26fb4f5fddf3bd18768bf4275c2ca5511e55aa28b64736f6c63430007060033";

export class MockWeth__factory extends ContractFactory {
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
  ): Promise<MockWeth> {
    return super.deploy(overrides || {}) as Promise<MockWeth>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MockWeth {
    return super.attach(address) as MockWeth;
  }
  connect(signer: Signer): MockWeth__factory {
    return super.connect(signer) as MockWeth__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockWethInterface {
    return new utils.Interface(_abi) as MockWethInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockWeth {
    return new Contract(address, _abi, signerOrProvider) as MockWeth;
  }
}
