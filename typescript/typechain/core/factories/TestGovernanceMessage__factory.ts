/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  TestGovernanceMessage,
  TestGovernanceMessageInterface,
} from "../TestGovernanceMessage";

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "to",
            type: "bytes32",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct GovernanceMessage.Call[]",
        name: "_calls",
        type: "tuple[]",
      },
    ],
    name: "formatBatch",
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
        name: "_msg",
        type: "bytes",
      },
    ],
    name: "isValidBatch",
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
        components: [
          {
            internalType: "bytes32",
            name: "to",
            type: "bytes32",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        internalType: "struct GovernanceMessage.Call",
        name: "_call",
        type: "tuple",
      },
    ],
    name: "serializeCall",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5061123f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80631fff7ee014610046578063a835af231461006f578063bf2563e51461008f575b600080fd5b610059610054366004610f30565b6100a2565b6040516100669190611015565b60405180910390f35b61008261007d366004610efd565b6100e7565b604051610066919061100a565b61005961009d366004610e8e565b6100fc565b60606100df6100b86100b3846110ea565b610119565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000016610171565b90505b919050565b60006100df6100f78360016101b5565b6101d9565b606061011061010b838561108a565b610233565b90505b92915050565b805160208083015180516040516000946100df94869461013d949293909101610f68565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0818403018152919052906101b5565b606060008061017f84610267565b6bffffffffffffffffffffffff16905060405191508192506101a4848360200161027b565b508181016020016040529052919050565b8151600090602084016101d064ffffffffff851682846103b1565b95945050505050565b600060016101e683610412565b60ff161480156100df5750602161021e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008416610267565b6bffffffffffffffffffffffff161492915050565b6060600161024083610442565b604051602001610251929190610fba565b6040516020818303038152906040529050919050565b60181c6bffffffffffffffffffffffff1690565b60006102868361056b565b6102db576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260288152602001806111826028913960400191505060405180910390fd5b6102e48361057d565b610339576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602b8152602001806111aa602b913960400191505060405180910390fd5b600061034484610267565b6bffffffffffffffffffffffff169050600061035f856105ba565b6bffffffffffffffffffffffff16905060006040519050848111156103845760206060fd5b8285848460045afa506103a7610399876105ce565b64ffffffffff1686856105d4565b9695505050505050565b6000806103be84846105e7565b90506040518111156103ce575060005b806103fc577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000091505061040b565b6104078585856105d4565b9150505b9392505050565b60006100df7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000008316826001610659565b600080600183510167ffffffffffffffff8111801561046057600080fd5b5060405190808252806020026020018201604052801561048a578160200160208202803683370190505b5090506104a46000845160405160200161013d9190610fda565b816000815181106104b157fe5b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000009092166020928302919091019091015260005b83518110156105525761050a8482815181106104fd57fe5b6020026020010151610119565b82600183018151811061051957fe5b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000909216602092830291909101909101526001016104e5565b5061055c8161067a565b80519060200120915050919050565b6000610576826106ca565b1592915050565b6000610588826105ce565b64ffffffffff1664ffffffffff14156105a3575060006100e2565b60006105ae836106f2565b60405110199392505050565b60781c6bffffffffffffffffffffffff1690565b60d81c90565b606092831b9190911790911b1760181b90565b8181018281101561011357604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f4f766572666c6f7720647572696e67206164646974696f6e2e00000000000000604482015290519081900360640190fd5b60008160200360080260ff1661067085858561071c565b901c949350505050565b604051606090600061068f84602084016108c7565b9050600061069c82610267565b6bffffffffffffffffffffffff16905060006106b783610947565b9184525082016020016040525092915050565b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000009081161490565b60006106fd82610267565b610706836105ba565b016bffffffffffffffffffffffff169050919050565b600060ff821661072e5750600061040b565b61073784610267565b6bffffffffffffffffffffffff166107528460ff85166105e7565b111561083157610793610764856105ba565b6bffffffffffffffffffffffff1661077b86610267565b6bffffffffffffffffffffffff16858560ff1661095b565b6040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b838110156107f65781810151838201526020016107de565b50505050905090810190601f1680156108235780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b60208260ff16111561088e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603a815260200180611148603a913960400191505060405180910390fd5b60088202600061089d866105ba565b6bffffffffffffffffffffffff16905060006108b883610ab6565b91909501511695945050505050565b6000604051828111156108da5760206060fd5b506000805b84518110156109325760008582815181106108f657fe5b6020026020010151905061090c8184870161027b565b5061091681610267565b6bffffffffffffffffffffffff169290920191506001016108df565b5061093f600084836105d4565b949350505050565b600061095282610aff565b60200292915050565b6060600061096886610b33565b915050600061097686610b33565b915050600061098486610b33565b915050600061099286610b33565b9150508383838360405160200180806111d5603591397fffffffffffff000000000000000000000000000000000000000000000000000060d087811b821660358401527f2077697468206c656e6774682030780000000000000000000000000000000000603b84015286901b16604a820152605001602161112782397fffffffffffff000000000000000000000000000000000000000000000000000060d094851b811660218301527f2077697468206c656e677468203078000000000000000000000000000000000060278301529290931b9091166036830152507f2e00000000000000000000000000000000000000000000000000000000000000603c82015260408051601d818403018152603d90920190529b9a5050505050505050505050565b7f80000000000000000000000000000000000000000000000000000000000000007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9091011d90565b60006020610b256020610b1185610267565b6bffffffffffffffffffffffff16906105e7565b81610b2c57fe5b0492915050565b600080601f5b600f8160ff161115610b9b5760ff600882021684901c610b5881610c07565b61ffff16841793508160ff16601014610b7357601084901b93505b507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01610b39565b50600f5b60ff8160ff161015610c015760ff600882021684901c610bbe81610c07565b61ffff16831792508160ff16600014610bd957601083901b92505b507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01610b9f565b50915091565b6000610c1960048360ff16901c610c37565b60ff161760081b62ffff0016610c2e82610c37565b60ff1617919050565b600060f08083179060ff82161415610c535760309150506100e2565b8060ff1660f11415610c695760319150506100e2565b8060ff1660f21415610c7f5760329150506100e2565b8060ff1660f31415610c955760339150506100e2565b8060ff1660f41415610cab5760349150506100e2565b8060ff1660f51415610cc15760359150506100e2565b8060ff1660f61415610cd75760369150506100e2565b8060ff1660f71415610ced5760379150506100e2565b8060ff1660f81415610d035760389150506100e2565b8060ff1660f91415610d195760399150506100e2565b8060ff1660fa1415610d2f5760619150506100e2565b8060ff1660fb1415610d455760629150506100e2565b8060ff1660fc1415610d5b5760639150506100e2565b8060ff1660fd1415610d715760649150506100e2565b8060ff1660fe1415610d875760659150506100e2565b8060ff1660ff1415610d9d5760669150506100e2565b50919050565b600082601f830112610db3578081fd5b813567ffffffffffffffff811115610dc757fe5b610df860207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f84011601611066565b818152846020838601011115610e0c578283fd5b816020850160208301379081016020019190915292915050565b600060408284031215610e37578081fd5b6040516040810167ffffffffffffffff8282108183111715610e5557fe5b81604052829350843583526020850135915080821115610e7457600080fd5b50610e8185828601610da3565b6020830152505092915050565b60008060208385031215610ea0578182fd5b823567ffffffffffffffff80821115610eb7578384fd5b818501915085601f830112610eca578384fd5b813581811115610ed8578485fd5b8660208083028501011115610eeb578485fd5b60209290920196919550909350505050565b600060208284031215610f0e578081fd5b813567ffffffffffffffff811115610f24578182fd5b61093f84828501610da3565b600060208284031215610f41578081fd5b813567ffffffffffffffff811115610f57578182fd5b82016040818503121561040b578182fd5b60008482527fffffffff000000000000000000000000000000000000000000000000000000008460e01b1660208301528251610fab8160248501602087016110f6565b91909101602401949350505050565b600060038410610fc657fe5b5060f89290921b8252600182015260210190565b60f89190911b7fff0000000000000000000000000000000000000000000000000000000000000016815260010190565b901515815260200190565b60006020825282518060208401526110348160408501602087016110f6565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169190910160400192915050565b60405181810167ffffffffffffffff8111828210171561108257fe5b604052919050565b600067ffffffffffffffff83111561109e57fe5b60206110ad8182860201611066565b8481528181019084845b878110156110de576110cc3683358901610e26565b845292840192908401906001016110b7565b50909695505050505050565b60006100df3683610e26565b60005b838110156111115781810151838201526020016110f9565b83811115611120576000848401525b5050505056fe2e20417474656d7074656420746f20696e646578206174206f666673657420307854797065644d656d566965772f696e646578202d20417474656d7074656420746f20696e646578206d6f7265207468616e20333220627974657354797065644d656d566965772f636f7079546f202d204e756c6c20706f696e74657220646572656654797065644d656d566965772f636f7079546f202d20496e76616c696420706f696e74657220646572656654797065644d656d566965772f696e646578202d204f76657272616e2074686520766965772e20536c696365206973206174203078a2646970667358221220a26bab7abf4111dfae69e9f7482b0195aa781a798e5cc393d7da797f7b90805864736f6c63430007060033";

export class TestGovernanceMessage__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<TestGovernanceMessage> {
    return super.deploy(overrides || {}) as Promise<TestGovernanceMessage>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): TestGovernanceMessage {
    return super.attach(address) as TestGovernanceMessage;
  }
  connect(signer: Signer): TestGovernanceMessage__factory {
    return super.connect(signer) as TestGovernanceMessage__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TestGovernanceMessageInterface {
    return new utils.Interface(_abi) as TestGovernanceMessageInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TestGovernanceMessage {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as TestGovernanceMessage;
  }
}
