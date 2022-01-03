pub use replica_mod::*;
#[allow(clippy::too_many_arguments)]
mod replica_mod {
    #![allow(clippy::enum_variant_names)]
    #![allow(dead_code)]
    #![allow(clippy::type_complexity)]
    #![allow(unused_imports)]
    use ethers::contract::{
        builders::{ContractCall, Event},
        Contract, Lazy,
    };
    use ethers::core::{
        abi::{Abi, Detokenize, InvalidOutputType, Token, Tokenizable},
        types::*,
    };
    use ethers::providers::Middleware;
    #[doc = "Replica was auto-generated with ethers-rs Abigen. More information at: https://github.com/gakonst/ethers-rs"]
    use std::sync::Arc;
    pub static REPLICA_ABI: ethers::contract::Lazy<ethers::core::abi::Abi> =
        ethers::contract::Lazy::new(|| {
            serde_json :: from_str ("[\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_localDomain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_processGas\",\n        \"type\": \"uint256\"\n      },\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_reserveGas\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"constructor\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32\",\n        \"name\": \"oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32[2]\",\n        \"name\": \"newRoot\",\n        \"type\": \"bytes32[2]\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature\",\n        \"type\": \"bytes\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature2\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"DoubleUpdate\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"oldUpdater\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"newUpdater\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"NewUpdater\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"previousOwner\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"newOwner\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"OwnershipTransferred\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"messageHash\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"bool\",\n        \"name\": \"success\",\n        \"type\": \"bool\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes\",\n        \"name\": \"returnData\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"Process\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"root\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"uint256\",\n        \"name\": \"previousConfirmAt\",\n        \"type\": \"uint256\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"uint256\",\n        \"name\": \"newConfirmAt\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"SetConfirmation\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"uint256\",\n        \"name\": \"timeout\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"SetOptimisticTimeout\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint32\",\n        \"name\": \"homeDomain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"newRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"Update\",\n    \"type\": \"event\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"PROCESS_GAS\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"RESERVE_GAS\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"VERSION\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint8\",\n        \"name\": \"\",\n        \"type\": \"uint8\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_root\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"name\": \"acceptableRoot\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"committedRoot\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"name\": \"confirmAt\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32[2]\",\n        \"name\": \"_newRoot\",\n        \"type\": \"bytes32[2]\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature\",\n        \"type\": \"bytes\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature2\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"doubleUpdate\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"homeDomainHash\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_remoteDomain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_updater\",\n        \"type\": \"address\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_committedRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_optimisticSeconds\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"initialize\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"localDomain\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"name\": \"messages\",\n    \"outputs\": [\n      {\n        \"internalType\": \"enum Replica.MessageStatus\",\n        \"name\": \"\",\n        \"type\": \"uint8\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"optimisticSeconds\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"owner\",\n    \"outputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_message\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"process\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"_success\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_leaf\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32[32]\",\n        \"name\": \"_proof\",\n        \"type\": \"bytes32[32]\"\n      },\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_index\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"prove\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_message\",\n        \"type\": \"bytes\"\n      },\n      {\n        \"internalType\": \"bytes32[32]\",\n        \"name\": \"_proof\",\n        \"type\": \"bytes32[32]\"\n      },\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_index\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"proveAndProcess\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"remoteDomain\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"renounceOwnership\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_root\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_confirmAt\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"setConfirmation\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"_optimisticSeconds\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"name\": \"setOptimisticTimeout\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_updater\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"setUpdater\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"state\",\n    \"outputs\": [\n      {\n        \"internalType\": \"enum NomadBase.States\",\n        \"name\": \"\",\n        \"type\": \"uint8\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"newOwner\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"transferOwnership\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_newRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"update\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"updater\",\n    \"outputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  }\n]\n") . expect ("invalid abi")
        });
    #[derive(Clone)]
    pub struct Replica<M>(ethers::contract::Contract<M>);
    impl<M> std::ops::Deref for Replica<M> {
        type Target = ethers::contract::Contract<M>;
        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }
    impl<M: ethers::providers::Middleware> std::fmt::Debug for Replica<M> {
        fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.debug_tuple(stringify!(Replica))
                .field(&self.address())
                .finish()
        }
    }
    impl<'a, M: ethers::providers::Middleware> Replica<M> {
        #[doc = r" Creates a new contract instance with the specified `ethers`"]
        #[doc = r" client at the given `Address`. The contract derefs to a `ethers::Contract`"]
        #[doc = r" object"]
        pub fn new<T: Into<ethers::core::types::Address>>(
            address: T,
            client: ::std::sync::Arc<M>,
        ) -> Self {
            let contract =
                ethers::contract::Contract::new(address.into(), REPLICA_ABI.clone(), client);
            Self(contract)
        }
        #[doc = "Calls the contract's `PROCESS_GAS` (0xd88beda2) function"]
        pub fn process_gas(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([216, 139, 237, 162], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `RESERVE_GAS` (0x25e3beda) function"]
        pub fn reserve_gas(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([37, 227, 190, 218], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `VERSION` (0xffa1ad74) function"]
        pub fn version(&self) -> ethers::contract::builders::ContractCall<M, u8> {
            self.0
                .method_hash([255, 161, 173, 116], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `acceptableRoot` (0xa3f81d68) function"]
        pub fn acceptable_root(
            &self,
            root: [u8; 32],
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([163, 248, 29, 104], root)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `committedRoot` (0x67a6771d) function"]
        pub fn committed_root(&self) -> ethers::contract::builders::ContractCall<M, [u8; 32]> {
            self.0
                .method_hash([103, 166, 119, 29], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `confirmAt` (0x71bfb7b8) function"]
        pub fn confirm_at(
            &self,
            p0: [u8; 32],
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([113, 191, 183, 184], p0)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `doubleUpdate` (0x19d9d21a) function"]
        pub fn double_update(
            &self,
            old_root: [u8; 32],
            new_root: [[u8; 32]; 2usize],
            signature: ethers::core::types::Bytes,
            signature_2: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash(
                    [25, 217, 210, 26],
                    (old_root, new_root, signature, signature_2),
                )
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `homeDomainHash` (0x45630b1a) function"]
        pub fn home_domain_hash(&self) -> ethers::contract::builders::ContractCall<M, [u8; 32]> {
            self.0
                .method_hash([69, 99, 11, 26], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `initialize` (0xe7e7a7b7) function"]
        pub fn initialize(
            &self,
            remote_domain: u32,
            updater: ethers::core::types::Address,
            committed_root: [u8; 32],
            optimistic_seconds: ethers::core::types::U256,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash(
                    [231, 231, 167, 183],
                    (remote_domain, updater, committed_root, optimistic_seconds),
                )
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `localDomain` (0x8d3638f4) function"]
        pub fn local_domain(&self) -> ethers::contract::builders::ContractCall<M, u32> {
            self.0
                .method_hash([141, 54, 56, 244], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `messages` (0x2bbd59ca) function"]
        pub fn messages(&self, p0: [u8; 32]) -> ethers::contract::builders::ContractCall<M, u8> {
            self.0
                .method_hash([43, 189, 89, 202], p0)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `optimisticSeconds` (0x39992668) function"]
        pub fn optimistic_seconds(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([57, 153, 38, 104], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `owner` (0x8da5cb5b) function"]
        pub fn owner(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::Address> {
            self.0
                .method_hash([141, 165, 203, 91], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `process` (0x928bc4b2) function"]
        pub fn process(
            &self,
            message: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([146, 139, 196, 178], message)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `prove` (0x371d3071) function"]
        pub fn prove(
            &self,
            leaf: [u8; 32],
            proof: [[u8; 32]; 32usize],
            index: ethers::core::types::U256,
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([55, 29, 48, 113], (leaf, proof, index))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `proveAndProcess` (0x6188af0e) function"]
        pub fn prove_and_process(
            &self,
            message: ethers::core::types::Bytes,
            proof: [[u8; 32]; 32usize],
            index: ethers::core::types::U256,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([97, 136, 175, 14], (message, proof, index))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `remoteDomain` (0x961681dc) function"]
        pub fn remote_domain(&self) -> ethers::contract::builders::ContractCall<M, u32> {
            self.0
                .method_hash([150, 22, 129, 220], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `renounceOwnership` (0x715018a6) function"]
        pub fn renounce_ownership(&self) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([113, 80, 24, 166], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `setConfirmation` (0x088b5ed3) function"]
        pub fn set_confirmation(
            &self,
            root: [u8; 32],
            confirm_at: ethers::core::types::U256,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([8, 139, 94, 211], (root, confirm_at))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `setOptimisticTimeout` (0x885b5e2d) function"]
        pub fn set_optimistic_timeout(
            &self,
            optimistic_seconds: ethers::core::types::U256,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([136, 91, 94, 45], optimistic_seconds)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `setUpdater` (0x9d54f419) function"]
        pub fn set_updater(
            &self,
            updater: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([157, 84, 244, 25], updater)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `state` (0xc19d93fb) function"]
        pub fn state(&self) -> ethers::contract::builders::ContractCall<M, u8> {
            self.0
                .method_hash([193, 157, 147, 251], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `transferOwnership` (0xf2fde38b) function"]
        pub fn transfer_ownership(
            &self,
            new_owner: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([242, 253, 227, 139], new_owner)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `update` (0xb31c01fb) function"]
        pub fn update(
            &self,
            old_root: [u8; 32],
            new_root: [u8; 32],
            signature: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([179, 28, 1, 251], (old_root, new_root, signature))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `updater` (0xdf034cd0) function"]
        pub fn updater(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::Address> {
            self.0
                .method_hash([223, 3, 76, 208], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Gets the contract's `DoubleUpdate` event"]
        pub fn double_update_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, DoubleUpdateFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `NewUpdater` event"]
        pub fn new_updater_filter(&self) -> ethers::contract::builders::Event<M, NewUpdaterFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `OwnershipTransferred` event"]
        pub fn ownership_transferred_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, OwnershipTransferredFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `Process` event"]
        pub fn process_filter(&self) -> ethers::contract::builders::Event<M, ProcessFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `SetConfirmation` event"]
        pub fn set_confirmation_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, SetConfirmationFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `SetOptimisticTimeout` event"]
        pub fn set_optimistic_timeout_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, SetOptimisticTimeoutFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `Update` event"]
        pub fn update_filter(&self) -> ethers::contract::builders::Event<M, UpdateFilter> {
            self.0.event()
        }
        #[doc = r" Returns an [`Event`](#ethers_contract::builders::Event) builder for all events of this contract"]
        pub fn events(&self) -> ethers::contract::builders::Event<M, ReplicaEvents> {
            self.0.event_with_filter(Default::default())
        }
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(
        name = "DoubleUpdate",
        abi = "DoubleUpdate(bytes32,bytes32[2],bytes,bytes)"
    )]
    pub struct DoubleUpdateFilter {
        pub old_root: [u8; 32],
        pub new_root: [[u8; 32]; 2],
        pub signature: ethers::core::types::Bytes,
        pub signature_2: ethers::core::types::Bytes,
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(name = "NewUpdater", abi = "NewUpdater(address,address)")]
    pub struct NewUpdaterFilter {
        pub old_updater: ethers::core::types::Address,
        pub new_updater: ethers::core::types::Address,
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(
        name = "OwnershipTransferred",
        abi = "OwnershipTransferred(address,address)"
    )]
    pub struct OwnershipTransferredFilter {
        #[ethevent(indexed)]
        pub previous_owner: ethers::core::types::Address,
        #[ethevent(indexed)]
        pub new_owner: ethers::core::types::Address,
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(name = "Process", abi = "Process(bytes32,bool,bytes)")]
    pub struct ProcessFilter {
        #[ethevent(indexed)]
        pub message_hash: [u8; 32],
        #[ethevent(indexed)]
        pub success: bool,
        #[ethevent(indexed)]
        pub return_data: ethers::core::types::H256,
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(
        name = "SetConfirmation",
        abi = "SetConfirmation(bytes32,uint256,uint256)"
    )]
    pub struct SetConfirmationFilter {
        #[ethevent(indexed)]
        pub root: [u8; 32],
        pub previous_confirm_at: ethers::core::types::U256,
        pub new_confirm_at: ethers::core::types::U256,
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(name = "SetOptimisticTimeout", abi = "SetOptimisticTimeout(uint256)")]
    pub struct SetOptimisticTimeoutFilter {
        pub timeout: ethers::core::types::U256,
    }
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(name = "Update", abi = "Update(uint32,bytes32,bytes32,bytes)")]
    pub struct UpdateFilter {
        #[ethevent(indexed)]
        pub home_domain: u32,
        #[ethevent(indexed)]
        pub old_root: [u8; 32],
        #[ethevent(indexed)]
        pub new_root: [u8; 32],
        pub signature: ethers::core::types::Bytes,
    }
    #[derive(Debug, Clone, PartialEq, Eq, ethers :: contract :: EthAbiType)]
    pub enum ReplicaEvents {
        DoubleUpdateFilter(DoubleUpdateFilter),
        NewUpdaterFilter(NewUpdaterFilter),
        OwnershipTransferredFilter(OwnershipTransferredFilter),
        ProcessFilter(ProcessFilter),
        SetConfirmationFilter(SetConfirmationFilter),
        SetOptimisticTimeoutFilter(SetOptimisticTimeoutFilter),
        UpdateFilter(UpdateFilter),
    }
    impl ethers::contract::EthLogDecode for ReplicaEvents {
        fn decode_log(log: &ethers::core::abi::RawLog) -> Result<Self, ethers::core::abi::Error>
        where
            Self: Sized,
        {
            if let Ok(decoded) = DoubleUpdateFilter::decode_log(log) {
                return Ok(ReplicaEvents::DoubleUpdateFilter(decoded));
            }
            if let Ok(decoded) = NewUpdaterFilter::decode_log(log) {
                return Ok(ReplicaEvents::NewUpdaterFilter(decoded));
            }
            if let Ok(decoded) = OwnershipTransferredFilter::decode_log(log) {
                return Ok(ReplicaEvents::OwnershipTransferredFilter(decoded));
            }
            if let Ok(decoded) = ProcessFilter::decode_log(log) {
                return Ok(ReplicaEvents::ProcessFilter(decoded));
            }
            if let Ok(decoded) = SetConfirmationFilter::decode_log(log) {
                return Ok(ReplicaEvents::SetConfirmationFilter(decoded));
            }
            if let Ok(decoded) = SetOptimisticTimeoutFilter::decode_log(log) {
                return Ok(ReplicaEvents::SetOptimisticTimeoutFilter(decoded));
            }
            if let Ok(decoded) = UpdateFilter::decode_log(log) {
                return Ok(ReplicaEvents::UpdateFilter(decoded));
            }
            Err(ethers::core::abi::Error::InvalidData)
        }
    }
    impl ::std::fmt::Display for ReplicaEvents {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            match self {
                ReplicaEvents::DoubleUpdateFilter(element) => element.fmt(f),
                ReplicaEvents::NewUpdaterFilter(element) => element.fmt(f),
                ReplicaEvents::OwnershipTransferredFilter(element) => element.fmt(f),
                ReplicaEvents::ProcessFilter(element) => element.fmt(f),
                ReplicaEvents::SetConfirmationFilter(element) => element.fmt(f),
                ReplicaEvents::SetOptimisticTimeoutFilter(element) => element.fmt(f),
                ReplicaEvents::UpdateFilter(element) => element.fmt(f),
            }
        }
    }
    #[doc = "Container type for all input parameters for the `PROCESS_GAS`function with signature `PROCESS_GAS()` and selector `[216, 139, 237, 162]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "PROCESS_GAS", abi = "PROCESS_GAS()")]
    pub struct ProcessGasCall;
    #[doc = "Container type for all input parameters for the `RESERVE_GAS`function with signature `RESERVE_GAS()` and selector `[37, 227, 190, 218]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "RESERVE_GAS", abi = "RESERVE_GAS()")]
    pub struct ReserveGasCall;
    #[doc = "Container type for all input parameters for the `VERSION`function with signature `VERSION()` and selector `[255, 161, 173, 116]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "VERSION", abi = "VERSION()")]
    pub struct VersionCall;
    #[doc = "Container type for all input parameters for the `acceptableRoot`function with signature `acceptableRoot(bytes32)` and selector `[163, 248, 29, 104]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "acceptableRoot", abi = "acceptableRoot(bytes32)")]
    pub struct AcceptableRootCall {
        pub root: [u8; 32],
    }
    #[doc = "Container type for all input parameters for the `committedRoot`function with signature `committedRoot()` and selector `[103, 166, 119, 29]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "committedRoot", abi = "committedRoot()")]
    pub struct CommittedRootCall;
    #[doc = "Container type for all input parameters for the `confirmAt`function with signature `confirmAt(bytes32)` and selector `[113, 191, 183, 184]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "confirmAt", abi = "confirmAt(bytes32)")]
    pub struct ConfirmAtCall(pub [u8; 32]);
    #[doc = "Container type for all input parameters for the `doubleUpdate`function with signature `doubleUpdate(bytes32,bytes32[2],bytes,bytes)` and selector `[25, 217, 210, 26]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(
        name = "doubleUpdate",
        abi = "doubleUpdate(bytes32,bytes32[2],bytes,bytes)"
    )]
    pub struct DoubleUpdateCall {
        pub old_root: [u8; 32],
        pub new_root: [[u8; 32]; 2usize],
        pub signature: ethers::core::types::Bytes,
        pub signature_2: ethers::core::types::Bytes,
    }
    #[doc = "Container type for all input parameters for the `homeDomainHash`function with signature `homeDomainHash()` and selector `[69, 99, 11, 26]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "homeDomainHash", abi = "homeDomainHash()")]
    pub struct HomeDomainHashCall;
    #[doc = "Container type for all input parameters for the `initialize`function with signature `initialize(uint32,address,bytes32,uint256)` and selector `[231, 231, 167, 183]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(
        name = "initialize",
        abi = "initialize(uint32,address,bytes32,uint256)"
    )]
    pub struct InitializeCall {
        pub remote_domain: u32,
        pub updater: ethers::core::types::Address,
        pub committed_root: [u8; 32],
        pub optimistic_seconds: ethers::core::types::U256,
    }
    #[doc = "Container type for all input parameters for the `localDomain`function with signature `localDomain()` and selector `[141, 54, 56, 244]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "localDomain", abi = "localDomain()")]
    pub struct LocalDomainCall;
    #[doc = "Container type for all input parameters for the `messages`function with signature `messages(bytes32)` and selector `[43, 189, 89, 202]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "messages", abi = "messages(bytes32)")]
    pub struct MessagesCall(pub [u8; 32]);
    #[doc = "Container type for all input parameters for the `optimisticSeconds`function with signature `optimisticSeconds()` and selector `[57, 153, 38, 104]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "optimisticSeconds", abi = "optimisticSeconds()")]
    pub struct OptimisticSecondsCall;
    #[doc = "Container type for all input parameters for the `owner`function with signature `owner()` and selector `[141, 165, 203, 91]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "owner", abi = "owner()")]
    pub struct OwnerCall;
    #[doc = "Container type for all input parameters for the `process`function with signature `process(bytes)` and selector `[146, 139, 196, 178]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "process", abi = "process(bytes)")]
    pub struct ProcessCall {
        pub message: ethers::core::types::Bytes,
    }
    #[doc = "Container type for all input parameters for the `prove`function with signature `prove(bytes32,bytes32[32],uint256)` and selector `[55, 29, 48, 113]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "prove", abi = "prove(bytes32,bytes32[32],uint256)")]
    pub struct ProveCall {
        pub leaf: [u8; 32],
        pub proof: [[u8; 32]; 32usize],
        pub index: ethers::core::types::U256,
    }
    #[doc = "Container type for all input parameters for the `proveAndProcess`function with signature `proveAndProcess(bytes,bytes32[32],uint256)` and selector `[97, 136, 175, 14]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(
        name = "proveAndProcess",
        abi = "proveAndProcess(bytes,bytes32[32],uint256)"
    )]
    pub struct ProveAndProcessCall {
        pub message: ethers::core::types::Bytes,
        pub proof: [[u8; 32]; 32usize],
        pub index: ethers::core::types::U256,
    }
    #[doc = "Container type for all input parameters for the `remoteDomain`function with signature `remoteDomain()` and selector `[150, 22, 129, 220]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "remoteDomain", abi = "remoteDomain()")]
    pub struct RemoteDomainCall;
    #[doc = "Container type for all input parameters for the `renounceOwnership`function with signature `renounceOwnership()` and selector `[113, 80, 24, 166]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "renounceOwnership", abi = "renounceOwnership()")]
    pub struct RenounceOwnershipCall;
    #[doc = "Container type for all input parameters for the `setConfirmation`function with signature `setConfirmation(bytes32,uint256)` and selector `[8, 139, 94, 211]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "setConfirmation", abi = "setConfirmation(bytes32,uint256)")]
    pub struct SetConfirmationCall {
        pub root: [u8; 32],
        pub confirm_at: ethers::core::types::U256,
    }
    #[doc = "Container type for all input parameters for the `setOptimisticTimeout`function with signature `setOptimisticTimeout(uint256)` and selector `[136, 91, 94, 45]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "setOptimisticTimeout", abi = "setOptimisticTimeout(uint256)")]
    pub struct SetOptimisticTimeoutCall {
        pub optimistic_seconds: ethers::core::types::U256,
    }
    #[doc = "Container type for all input parameters for the `setUpdater`function with signature `setUpdater(address)` and selector `[157, 84, 244, 25]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "setUpdater", abi = "setUpdater(address)")]
    pub struct SetUpdaterCall {
        pub updater: ethers::core::types::Address,
    }
    #[doc = "Container type for all input parameters for the `state`function with signature `state()` and selector `[193, 157, 147, 251]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "state", abi = "state()")]
    pub struct StateCall;
    #[doc = "Container type for all input parameters for the `transferOwnership`function with signature `transferOwnership(address)` and selector `[242, 253, 227, 139]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "transferOwnership", abi = "transferOwnership(address)")]
    pub struct TransferOwnershipCall {
        pub new_owner: ethers::core::types::Address,
    }
    #[doc = "Container type for all input parameters for the `update`function with signature `update(bytes32,bytes32,bytes)` and selector `[179, 28, 1, 251]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "update", abi = "update(bytes32,bytes32,bytes)")]
    pub struct UpdateCall {
        pub old_root: [u8; 32],
        pub new_root: [u8; 32],
        pub signature: ethers::core::types::Bytes,
    }
    #[doc = "Container type for all input parameters for the `updater`function with signature `updater()` and selector `[223, 3, 76, 208]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "updater", abi = "updater()")]
    pub struct UpdaterCall;
    #[derive(Debug, Clone, PartialEq, Eq, ethers :: contract :: EthAbiType)]
    pub enum ReplicaCalls {
        ProcessGas(ProcessGasCall),
        ReserveGas(ReserveGasCall),
        Version(VersionCall),
        AcceptableRoot(AcceptableRootCall),
        CommittedRoot(CommittedRootCall),
        ConfirmAt(ConfirmAtCall),
        DoubleUpdate(DoubleUpdateCall),
        HomeDomainHash(HomeDomainHashCall),
        Initialize(InitializeCall),
        LocalDomain(LocalDomainCall),
        Messages(MessagesCall),
        OptimisticSeconds(OptimisticSecondsCall),
        Owner(OwnerCall),
        Process(ProcessCall),
        Prove(ProveCall),
        ProveAndProcess(ProveAndProcessCall),
        RemoteDomain(RemoteDomainCall),
        RenounceOwnership(RenounceOwnershipCall),
        SetConfirmation(SetConfirmationCall),
        SetOptimisticTimeout(SetOptimisticTimeoutCall),
        SetUpdater(SetUpdaterCall),
        State(StateCall),
        TransferOwnership(TransferOwnershipCall),
        Update(UpdateCall),
        Updater(UpdaterCall),
    }
    impl ethers::core::abi::AbiDecode for ReplicaCalls {
        fn decode(data: impl AsRef<[u8]>) -> Result<Self, ethers::core::abi::AbiError> {
            if let Ok(decoded) =
                <ProcessGasCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::ProcessGas(decoded));
            }
            if let Ok(decoded) =
                <ReserveGasCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::ReserveGas(decoded));
            }
            if let Ok(decoded) =
                <VersionCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Version(decoded));
            }
            if let Ok(decoded) =
                <AcceptableRootCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::AcceptableRoot(decoded));
            }
            if let Ok(decoded) =
                <CommittedRootCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::CommittedRoot(decoded));
            }
            if let Ok(decoded) =
                <ConfirmAtCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::ConfirmAt(decoded));
            }
            if let Ok(decoded) =
                <DoubleUpdateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::DoubleUpdate(decoded));
            }
            if let Ok(decoded) =
                <HomeDomainHashCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::HomeDomainHash(decoded));
            }
            if let Ok(decoded) =
                <InitializeCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Initialize(decoded));
            }
            if let Ok(decoded) =
                <LocalDomainCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::LocalDomain(decoded));
            }
            if let Ok(decoded) =
                <MessagesCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Messages(decoded));
            }
            if let Ok(decoded) =
                <OptimisticSecondsCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::OptimisticSeconds(decoded));
            }
            if let Ok(decoded) = <OwnerCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Owner(decoded));
            }
            if let Ok(decoded) =
                <ProcessCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Process(decoded));
            }
            if let Ok(decoded) = <ProveCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Prove(decoded));
            }
            if let Ok(decoded) =
                <ProveAndProcessCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::ProveAndProcess(decoded));
            }
            if let Ok(decoded) =
                <RemoteDomainCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::RemoteDomain(decoded));
            }
            if let Ok(decoded) =
                <RenounceOwnershipCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::RenounceOwnership(decoded));
            }
            if let Ok(decoded) =
                <SetConfirmationCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::SetConfirmation(decoded));
            }
            if let Ok(decoded) =
                <SetOptimisticTimeoutCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::SetOptimisticTimeout(decoded));
            }
            if let Ok(decoded) =
                <SetUpdaterCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::SetUpdater(decoded));
            }
            if let Ok(decoded) = <StateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::State(decoded));
            }
            if let Ok(decoded) =
                <TransferOwnershipCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::TransferOwnership(decoded));
            }
            if let Ok(decoded) = <UpdateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Update(decoded));
            }
            if let Ok(decoded) =
                <UpdaterCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(ReplicaCalls::Updater(decoded));
            }
            Err(ethers::core::abi::Error::InvalidData.into())
        }
    }
    impl ethers::core::abi::AbiEncode for ReplicaCalls {
        fn encode(self) -> Vec<u8> {
            match self {
                ReplicaCalls::ProcessGas(element) => element.encode(),
                ReplicaCalls::ReserveGas(element) => element.encode(),
                ReplicaCalls::Version(element) => element.encode(),
                ReplicaCalls::AcceptableRoot(element) => element.encode(),
                ReplicaCalls::CommittedRoot(element) => element.encode(),
                ReplicaCalls::ConfirmAt(element) => element.encode(),
                ReplicaCalls::DoubleUpdate(element) => element.encode(),
                ReplicaCalls::HomeDomainHash(element) => element.encode(),
                ReplicaCalls::Initialize(element) => element.encode(),
                ReplicaCalls::LocalDomain(element) => element.encode(),
                ReplicaCalls::Messages(element) => element.encode(),
                ReplicaCalls::OptimisticSeconds(element) => element.encode(),
                ReplicaCalls::Owner(element) => element.encode(),
                ReplicaCalls::Process(element) => element.encode(),
                ReplicaCalls::Prove(element) => element.encode(),
                ReplicaCalls::ProveAndProcess(element) => element.encode(),
                ReplicaCalls::RemoteDomain(element) => element.encode(),
                ReplicaCalls::RenounceOwnership(element) => element.encode(),
                ReplicaCalls::SetConfirmation(element) => element.encode(),
                ReplicaCalls::SetOptimisticTimeout(element) => element.encode(),
                ReplicaCalls::SetUpdater(element) => element.encode(),
                ReplicaCalls::State(element) => element.encode(),
                ReplicaCalls::TransferOwnership(element) => element.encode(),
                ReplicaCalls::Update(element) => element.encode(),
                ReplicaCalls::Updater(element) => element.encode(),
            }
        }
    }
    impl ::std::fmt::Display for ReplicaCalls {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            match self {
                ReplicaCalls::ProcessGas(element) => element.fmt(f),
                ReplicaCalls::ReserveGas(element) => element.fmt(f),
                ReplicaCalls::Version(element) => element.fmt(f),
                ReplicaCalls::AcceptableRoot(element) => element.fmt(f),
                ReplicaCalls::CommittedRoot(element) => element.fmt(f),
                ReplicaCalls::ConfirmAt(element) => element.fmt(f),
                ReplicaCalls::DoubleUpdate(element) => element.fmt(f),
                ReplicaCalls::HomeDomainHash(element) => element.fmt(f),
                ReplicaCalls::Initialize(element) => element.fmt(f),
                ReplicaCalls::LocalDomain(element) => element.fmt(f),
                ReplicaCalls::Messages(element) => element.fmt(f),
                ReplicaCalls::OptimisticSeconds(element) => element.fmt(f),
                ReplicaCalls::Owner(element) => element.fmt(f),
                ReplicaCalls::Process(element) => element.fmt(f),
                ReplicaCalls::Prove(element) => element.fmt(f),
                ReplicaCalls::ProveAndProcess(element) => element.fmt(f),
                ReplicaCalls::RemoteDomain(element) => element.fmt(f),
                ReplicaCalls::RenounceOwnership(element) => element.fmt(f),
                ReplicaCalls::SetConfirmation(element) => element.fmt(f),
                ReplicaCalls::SetOptimisticTimeout(element) => element.fmt(f),
                ReplicaCalls::SetUpdater(element) => element.fmt(f),
                ReplicaCalls::State(element) => element.fmt(f),
                ReplicaCalls::TransferOwnership(element) => element.fmt(f),
                ReplicaCalls::Update(element) => element.fmt(f),
                ReplicaCalls::Updater(element) => element.fmt(f),
            }
        }
    }
    impl ::std::convert::From<ProcessGasCall> for ReplicaCalls {
        fn from(var: ProcessGasCall) -> Self {
            ReplicaCalls::ProcessGas(var)
        }
    }
    impl ::std::convert::From<ReserveGasCall> for ReplicaCalls {
        fn from(var: ReserveGasCall) -> Self {
            ReplicaCalls::ReserveGas(var)
        }
    }
    impl ::std::convert::From<VersionCall> for ReplicaCalls {
        fn from(var: VersionCall) -> Self {
            ReplicaCalls::Version(var)
        }
    }
    impl ::std::convert::From<AcceptableRootCall> for ReplicaCalls {
        fn from(var: AcceptableRootCall) -> Self {
            ReplicaCalls::AcceptableRoot(var)
        }
    }
    impl ::std::convert::From<CommittedRootCall> for ReplicaCalls {
        fn from(var: CommittedRootCall) -> Self {
            ReplicaCalls::CommittedRoot(var)
        }
    }
    impl ::std::convert::From<ConfirmAtCall> for ReplicaCalls {
        fn from(var: ConfirmAtCall) -> Self {
            ReplicaCalls::ConfirmAt(var)
        }
    }
    impl ::std::convert::From<DoubleUpdateCall> for ReplicaCalls {
        fn from(var: DoubleUpdateCall) -> Self {
            ReplicaCalls::DoubleUpdate(var)
        }
    }
    impl ::std::convert::From<HomeDomainHashCall> for ReplicaCalls {
        fn from(var: HomeDomainHashCall) -> Self {
            ReplicaCalls::HomeDomainHash(var)
        }
    }
    impl ::std::convert::From<InitializeCall> for ReplicaCalls {
        fn from(var: InitializeCall) -> Self {
            ReplicaCalls::Initialize(var)
        }
    }
    impl ::std::convert::From<LocalDomainCall> for ReplicaCalls {
        fn from(var: LocalDomainCall) -> Self {
            ReplicaCalls::LocalDomain(var)
        }
    }
    impl ::std::convert::From<MessagesCall> for ReplicaCalls {
        fn from(var: MessagesCall) -> Self {
            ReplicaCalls::Messages(var)
        }
    }
    impl ::std::convert::From<OptimisticSecondsCall> for ReplicaCalls {
        fn from(var: OptimisticSecondsCall) -> Self {
            ReplicaCalls::OptimisticSeconds(var)
        }
    }
    impl ::std::convert::From<OwnerCall> for ReplicaCalls {
        fn from(var: OwnerCall) -> Self {
            ReplicaCalls::Owner(var)
        }
    }
    impl ::std::convert::From<ProcessCall> for ReplicaCalls {
        fn from(var: ProcessCall) -> Self {
            ReplicaCalls::Process(var)
        }
    }
    impl ::std::convert::From<ProveCall> for ReplicaCalls {
        fn from(var: ProveCall) -> Self {
            ReplicaCalls::Prove(var)
        }
    }
    impl ::std::convert::From<ProveAndProcessCall> for ReplicaCalls {
        fn from(var: ProveAndProcessCall) -> Self {
            ReplicaCalls::ProveAndProcess(var)
        }
    }
    impl ::std::convert::From<RemoteDomainCall> for ReplicaCalls {
        fn from(var: RemoteDomainCall) -> Self {
            ReplicaCalls::RemoteDomain(var)
        }
    }
    impl ::std::convert::From<RenounceOwnershipCall> for ReplicaCalls {
        fn from(var: RenounceOwnershipCall) -> Self {
            ReplicaCalls::RenounceOwnership(var)
        }
    }
    impl ::std::convert::From<SetConfirmationCall> for ReplicaCalls {
        fn from(var: SetConfirmationCall) -> Self {
            ReplicaCalls::SetConfirmation(var)
        }
    }
    impl ::std::convert::From<SetOptimisticTimeoutCall> for ReplicaCalls {
        fn from(var: SetOptimisticTimeoutCall) -> Self {
            ReplicaCalls::SetOptimisticTimeout(var)
        }
    }
    impl ::std::convert::From<SetUpdaterCall> for ReplicaCalls {
        fn from(var: SetUpdaterCall) -> Self {
            ReplicaCalls::SetUpdater(var)
        }
    }
    impl ::std::convert::From<StateCall> for ReplicaCalls {
        fn from(var: StateCall) -> Self {
            ReplicaCalls::State(var)
        }
    }
    impl ::std::convert::From<TransferOwnershipCall> for ReplicaCalls {
        fn from(var: TransferOwnershipCall) -> Self {
            ReplicaCalls::TransferOwnership(var)
        }
    }
    impl ::std::convert::From<UpdateCall> for ReplicaCalls {
        fn from(var: UpdateCall) -> Self {
            ReplicaCalls::Update(var)
        }
    }
    impl ::std::convert::From<UpdaterCall> for ReplicaCalls {
        fn from(var: UpdaterCall) -> Self {
            ReplicaCalls::Updater(var)
        }
    }
}
