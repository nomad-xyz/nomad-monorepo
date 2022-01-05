pub use home_mod::*;
#[allow(clippy::too_many_arguments)]
mod home_mod {
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
    #[doc = "Home was auto-generated with ethers-rs Abigen. More information at: https://github.com/gakonst/ethers-rs"]
    use std::sync::Arc;
    pub static HOME_ABI: ethers::contract::Lazy<ethers::core::abi::Abi> =
        ethers::contract::Lazy::new(|| {
            serde_json :: from_str ("[\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_localDomain\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"constructor\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"messageHash\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint256\",\n        \"name\": \"leafIndex\",\n        \"type\": \"uint256\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint64\",\n        \"name\": \"destinationAndNonce\",\n        \"type\": \"uint64\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32\",\n        \"name\": \"committedRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"message\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"Dispatch\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32\",\n        \"name\": \"oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32[2]\",\n        \"name\": \"newRoot\",\n        \"type\": \"bytes32[2]\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature\",\n        \"type\": \"bytes\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature2\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"DoubleUpdate\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32\",\n        \"name\": \"oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes32\",\n        \"name\": \"newRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"ImproperUpdate\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"oldUpdater\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"newUpdater\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"NewUpdater\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"updaterManager\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"NewUpdaterManager\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"previousOwner\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"newOwner\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"OwnershipTransferred\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint32\",\n        \"name\": \"homeDomain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"bytes32\",\n        \"name\": \"newRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bytes\",\n        \"name\": \"signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"Update\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"updater\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"reporter\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"UpdaterSlashed\",\n    \"type\": \"event\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"MAX_MESSAGE_BODY_BYTES\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"VERSION\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint8\",\n        \"name\": \"\",\n        \"type\": \"uint8\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"committedRoot\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"count\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_destinationDomain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_recipientAddress\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_messageBody\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"dispatch\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32[2]\",\n        \"name\": \"_newRoot\",\n        \"type\": \"bytes32[2]\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature\",\n        \"type\": \"bytes\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature2\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"doubleUpdate\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"homeDomainHash\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_oldRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_newRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"improperUpdate\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"contract IUpdaterManager\",\n        \"name\": \"_updaterManager\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"initialize\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"localDomain\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"name\": \"nonces\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"owner\",\n    \"outputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_item\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"name\": \"queueContains\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"queueEnd\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"queueLength\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"renounceOwnership\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"root\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_updater\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"setUpdater\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_updaterManager\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"setUpdaterManager\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"state\",\n    \"outputs\": [\n      {\n        \"internalType\": \"enum NomadBase.States\",\n        \"name\": \"\",\n        \"type\": \"uint8\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"suggestUpdate\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_committedRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_new\",\n        \"type\": \"bytes32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"newOwner\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"transferOwnership\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"tree\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint256\",\n        \"name\": \"count\",\n        \"type\": \"uint256\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_committedRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_newRoot\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"update\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"updater\",\n    \"outputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"updaterManager\",\n    \"outputs\": [\n      {\n        \"internalType\": \"contract IUpdaterManager\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  }\n]\n") . expect ("invalid abi")
        });
    #[derive(Clone)]
    pub struct Home<M>(ethers::contract::Contract<M>);
    impl<M> std::ops::Deref for Home<M> {
        type Target = ethers::contract::Contract<M>;
        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }
    impl<M: ethers::providers::Middleware> std::fmt::Debug for Home<M> {
        fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.debug_tuple(stringify!(Home))
                .field(&self.address())
                .finish()
        }
    }
    impl<'a, M: ethers::providers::Middleware> Home<M> {
        #[doc = r" Creates a new contract instance with the specified `ethers`"]
        #[doc = r" client at the given `Address`. The contract derefs to a `ethers::Contract`"]
        #[doc = r" object"]
        pub fn new<T: Into<ethers::core::types::Address>>(
            address: T,
            client: ::std::sync::Arc<M>,
        ) -> Self {
            let contract =
                ethers::contract::Contract::new(address.into(), HOME_ABI.clone(), client);
            Self(contract)
        }
        #[doc = "Calls the contract's `MAX_MESSAGE_BODY_BYTES` (0x522ae002) function"]
        pub fn max_message_body_bytes(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([82, 42, 224, 2], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `VERSION` (0xffa1ad74) function"]
        pub fn version(&self) -> ethers::contract::builders::ContractCall<M, u8> {
            self.0
                .method_hash([255, 161, 173, 116], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `committedRoot` (0x67a6771d) function"]
        pub fn committed_root(&self) -> ethers::contract::builders::ContractCall<M, [u8; 32]> {
            self.0
                .method_hash([103, 166, 119, 29], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `count` (0x06661abd) function"]
        pub fn count(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([6, 102, 26, 189], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `dispatch` (0xfa31de01) function"]
        pub fn dispatch(
            &self,
            destination_domain: u32,
            recipient_address: [u8; 32],
            message_body: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash(
                    [250, 49, 222, 1],
                    (destination_domain, recipient_address, message_body),
                )
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
        #[doc = "Calls the contract's `improperUpdate` (0x8e4e30e0) function"]
        pub fn improper_update(
            &self,
            old_root: [u8; 32],
            new_root: [u8; 32],
            signature: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([142, 78, 48, 224], (old_root, new_root, signature))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `initialize` (0xc4d66de8) function"]
        pub fn initialize(
            &self,
            updater_manager: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([196, 214, 109, 232], updater_manager)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `localDomain` (0x8d3638f4) function"]
        pub fn local_domain(&self) -> ethers::contract::builders::ContractCall<M, u32> {
            self.0
                .method_hash([141, 54, 56, 244], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `nonces` (0xb95a2001) function"]
        pub fn nonces(&self, p0: u32) -> ethers::contract::builders::ContractCall<M, u32> {
            self.0
                .method_hash([185, 90, 32, 1], p0)
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
        #[doc = "Calls the contract's `queueContains` (0x2bef2892) function"]
        pub fn queue_contains(
            &self,
            item: [u8; 32],
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([43, 239, 40, 146], item)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `queueEnd` (0xf6d16102) function"]
        pub fn queue_end(&self) -> ethers::contract::builders::ContractCall<M, [u8; 32]> {
            self.0
                .method_hash([246, 209, 97, 2], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `queueLength` (0xab91c7b0) function"]
        pub fn queue_length(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([171, 145, 199, 176], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `renounceOwnership` (0x715018a6) function"]
        pub fn renounce_ownership(&self) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([113, 80, 24, 166], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `root` (0xebf0c717) function"]
        pub fn root(&self) -> ethers::contract::builders::ContractCall<M, [u8; 32]> {
            self.0
                .method_hash([235, 240, 199, 23], ())
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
        #[doc = "Calls the contract's `setUpdaterManager` (0x9776120e) function"]
        pub fn set_updater_manager(
            &self,
            updater_manager: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([151, 118, 18, 14], updater_manager)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `state` (0xc19d93fb) function"]
        pub fn state(&self) -> ethers::contract::builders::ContractCall<M, u8> {
            self.0
                .method_hash([193, 157, 147, 251], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `suggestUpdate` (0x36e104de) function"]
        pub fn suggest_update(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ([u8; 32], [u8; 32])> {
            self.0
                .method_hash([54, 225, 4, 222], ())
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
        #[doc = "Calls the contract's `tree` (0xfd54b228) function"]
        pub fn tree(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::U256> {
            self.0
                .method_hash([253, 84, 178, 40], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `update` (0xb31c01fb) function"]
        pub fn update(
            &self,
            committed_root: [u8; 32],
            new_root: [u8; 32],
            signature: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([179, 28, 1, 251], (committed_root, new_root, signature))
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
        #[doc = "Calls the contract's `updaterManager` (0x9df6c8e1) function"]
        pub fn updater_manager(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::Address> {
            self.0
                .method_hash([157, 246, 200, 225], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Gets the contract's `Dispatch` event"]
        pub fn dispatch_filter(&self) -> ethers::contract::builders::Event<M, DispatchFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `DoubleUpdate` event"]
        pub fn double_update_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, DoubleUpdateFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `ImproperUpdate` event"]
        pub fn improper_update_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, ImproperUpdateFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `NewUpdater` event"]
        pub fn new_updater_filter(&self) -> ethers::contract::builders::Event<M, NewUpdaterFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `NewUpdaterManager` event"]
        pub fn new_updater_manager_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, NewUpdaterManagerFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `OwnershipTransferred` event"]
        pub fn ownership_transferred_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, OwnershipTransferredFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `Update` event"]
        pub fn update_filter(&self) -> ethers::contract::builders::Event<M, UpdateFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `UpdaterSlashed` event"]
        pub fn updater_slashed_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, UpdaterSlashedFilter> {
            self.0.event()
        }
        #[doc = r" Returns an [`Event`](#ethers_contract::builders::Event) builder for all events of this contract"]
        pub fn events(&self) -> ethers::contract::builders::Event<M, HomeEvents> {
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
        name = "Dispatch",
        abi = "Dispatch(bytes32,uint256,uint64,bytes32,bytes)"
    )]
    pub struct DispatchFilter {
        #[ethevent(indexed)]
        pub message_hash: [u8; 32],
        #[ethevent(indexed)]
        pub leaf_index: ethers::core::types::U256,
        #[ethevent(indexed)]
        pub destination_and_nonce: u64,
        pub committed_root: [u8; 32],
        pub message: ethers::core::types::Bytes,
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
    #[ethevent(name = "ImproperUpdate", abi = "ImproperUpdate(bytes32,bytes32,bytes)")]
    pub struct ImproperUpdateFilter {
        pub old_root: [u8; 32],
        pub new_root: [u8; 32],
        pub signature: ethers::core::types::Bytes,
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
    #[ethevent(name = "NewUpdaterManager", abi = "NewUpdaterManager(address)")]
    pub struct NewUpdaterManagerFilter {
        pub updater_manager: ethers::core::types::Address,
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
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthEvent,
        ethers :: contract :: EthDisplay,
    )]
    #[ethevent(name = "UpdaterSlashed", abi = "UpdaterSlashed(address,address)")]
    pub struct UpdaterSlashedFilter {
        #[ethevent(indexed)]
        pub updater: ethers::core::types::Address,
        #[ethevent(indexed)]
        pub reporter: ethers::core::types::Address,
    }
    #[derive(Debug, Clone, PartialEq, Eq, ethers :: contract :: EthAbiType)]
    pub enum HomeEvents {
        DispatchFilter(DispatchFilter),
        DoubleUpdateFilter(DoubleUpdateFilter),
        ImproperUpdateFilter(ImproperUpdateFilter),
        NewUpdaterFilter(NewUpdaterFilter),
        NewUpdaterManagerFilter(NewUpdaterManagerFilter),
        OwnershipTransferredFilter(OwnershipTransferredFilter),
        UpdateFilter(UpdateFilter),
        UpdaterSlashedFilter(UpdaterSlashedFilter),
    }
    impl ethers::contract::EthLogDecode for HomeEvents {
        fn decode_log(log: &ethers::core::abi::RawLog) -> Result<Self, ethers::core::abi::Error>
        where
            Self: Sized,
        {
            if let Ok(decoded) = DispatchFilter::decode_log(log) {
                return Ok(HomeEvents::DispatchFilter(decoded));
            }
            if let Ok(decoded) = DoubleUpdateFilter::decode_log(log) {
                return Ok(HomeEvents::DoubleUpdateFilter(decoded));
            }
            if let Ok(decoded) = ImproperUpdateFilter::decode_log(log) {
                return Ok(HomeEvents::ImproperUpdateFilter(decoded));
            }
            if let Ok(decoded) = NewUpdaterFilter::decode_log(log) {
                return Ok(HomeEvents::NewUpdaterFilter(decoded));
            }
            if let Ok(decoded) = NewUpdaterManagerFilter::decode_log(log) {
                return Ok(HomeEvents::NewUpdaterManagerFilter(decoded));
            }
            if let Ok(decoded) = OwnershipTransferredFilter::decode_log(log) {
                return Ok(HomeEvents::OwnershipTransferredFilter(decoded));
            }
            if let Ok(decoded) = UpdateFilter::decode_log(log) {
                return Ok(HomeEvents::UpdateFilter(decoded));
            }
            if let Ok(decoded) = UpdaterSlashedFilter::decode_log(log) {
                return Ok(HomeEvents::UpdaterSlashedFilter(decoded));
            }
            Err(ethers::core::abi::Error::InvalidData)
        }
    }
    impl ::std::fmt::Display for HomeEvents {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            match self {
                HomeEvents::DispatchFilter(element) => element.fmt(f),
                HomeEvents::DoubleUpdateFilter(element) => element.fmt(f),
                HomeEvents::ImproperUpdateFilter(element) => element.fmt(f),
                HomeEvents::NewUpdaterFilter(element) => element.fmt(f),
                HomeEvents::NewUpdaterManagerFilter(element) => element.fmt(f),
                HomeEvents::OwnershipTransferredFilter(element) => element.fmt(f),
                HomeEvents::UpdateFilter(element) => element.fmt(f),
                HomeEvents::UpdaterSlashedFilter(element) => element.fmt(f),
            }
        }
    }
    #[doc = "Container type for all input parameters for the `MAX_MESSAGE_BODY_BYTES`function with signature `MAX_MESSAGE_BODY_BYTES()` and selector `[82, 42, 224, 2]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "MAX_MESSAGE_BODY_BYTES", abi = "MAX_MESSAGE_BODY_BYTES()")]
    pub struct MaxMessageBodyBytesCall;
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
    #[doc = "Container type for all input parameters for the `count`function with signature `count()` and selector `[6, 102, 26, 189]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "count", abi = "count()")]
    pub struct CountCall;
    #[doc = "Container type for all input parameters for the `dispatch`function with signature `dispatch(uint32,bytes32,bytes)` and selector `[250, 49, 222, 1]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "dispatch", abi = "dispatch(uint32,bytes32,bytes)")]
    pub struct DispatchCall {
        pub destination_domain: u32,
        pub recipient_address: [u8; 32],
        pub message_body: ethers::core::types::Bytes,
    }
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
    #[doc = "Container type for all input parameters for the `improperUpdate`function with signature `improperUpdate(bytes32,bytes32,bytes)` and selector `[142, 78, 48, 224]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "improperUpdate", abi = "improperUpdate(bytes32,bytes32,bytes)")]
    pub struct ImproperUpdateCall {
        pub old_root: [u8; 32],
        pub new_root: [u8; 32],
        pub signature: ethers::core::types::Bytes,
    }
    #[doc = "Container type for all input parameters for the `initialize`function with signature `initialize(address)` and selector `[196, 214, 109, 232]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "initialize", abi = "initialize(address)")]
    pub struct InitializeCall {
        pub updater_manager: ethers::core::types::Address,
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
    #[doc = "Container type for all input parameters for the `nonces`function with signature `nonces(uint32)` and selector `[185, 90, 32, 1]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "nonces", abi = "nonces(uint32)")]
    pub struct NoncesCall(pub u32);
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
    #[doc = "Container type for all input parameters for the `queueContains`function with signature `queueContains(bytes32)` and selector `[43, 239, 40, 146]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "queueContains", abi = "queueContains(bytes32)")]
    pub struct QueueContainsCall {
        pub item: [u8; 32],
    }
    #[doc = "Container type for all input parameters for the `queueEnd`function with signature `queueEnd()` and selector `[246, 209, 97, 2]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "queueEnd", abi = "queueEnd()")]
    pub struct QueueEndCall;
    #[doc = "Container type for all input parameters for the `queueLength`function with signature `queueLength()` and selector `[171, 145, 199, 176]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "queueLength", abi = "queueLength()")]
    pub struct QueueLengthCall;
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
    #[doc = "Container type for all input parameters for the `root`function with signature `root()` and selector `[235, 240, 199, 23]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "root", abi = "root()")]
    pub struct RootCall;
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
    #[doc = "Container type for all input parameters for the `setUpdaterManager`function with signature `setUpdaterManager(address)` and selector `[151, 118, 18, 14]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "setUpdaterManager", abi = "setUpdaterManager(address)")]
    pub struct SetUpdaterManagerCall {
        pub updater_manager: ethers::core::types::Address,
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
    #[doc = "Container type for all input parameters for the `suggestUpdate`function with signature `suggestUpdate()` and selector `[54, 225, 4, 222]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "suggestUpdate", abi = "suggestUpdate()")]
    pub struct SuggestUpdateCall;
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
    #[doc = "Container type for all input parameters for the `tree`function with signature `tree()` and selector `[253, 84, 178, 40]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "tree", abi = "tree()")]
    pub struct TreeCall;
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
        pub committed_root: [u8; 32],
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
    #[doc = "Container type for all input parameters for the `updaterManager`function with signature `updaterManager()` and selector `[157, 246, 200, 225]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "updaterManager", abi = "updaterManager()")]
    pub struct UpdaterManagerCall;
    #[derive(Debug, Clone, PartialEq, Eq, ethers :: contract :: EthAbiType)]
    pub enum HomeCalls {
        MaxMessageBodyBytes(MaxMessageBodyBytesCall),
        Version(VersionCall),
        CommittedRoot(CommittedRootCall),
        Count(CountCall),
        Dispatch(DispatchCall),
        DoubleUpdate(DoubleUpdateCall),
        HomeDomainHash(HomeDomainHashCall),
        ImproperUpdate(ImproperUpdateCall),
        Initialize(InitializeCall),
        LocalDomain(LocalDomainCall),
        Nonces(NoncesCall),
        Owner(OwnerCall),
        QueueContains(QueueContainsCall),
        QueueEnd(QueueEndCall),
        QueueLength(QueueLengthCall),
        RenounceOwnership(RenounceOwnershipCall),
        Root(RootCall),
        SetUpdater(SetUpdaterCall),
        SetUpdaterManager(SetUpdaterManagerCall),
        State(StateCall),
        SuggestUpdate(SuggestUpdateCall),
        TransferOwnership(TransferOwnershipCall),
        Tree(TreeCall),
        Update(UpdateCall),
        Updater(UpdaterCall),
        UpdaterManager(UpdaterManagerCall),
    }
    impl ethers::core::abi::AbiDecode for HomeCalls {
        fn decode(data: impl AsRef<[u8]>) -> Result<Self, ethers::core::abi::AbiError> {
            if let Ok(decoded) =
                <MaxMessageBodyBytesCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::MaxMessageBodyBytes(decoded));
            }
            if let Ok(decoded) =
                <VersionCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Version(decoded));
            }
            if let Ok(decoded) =
                <CommittedRootCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::CommittedRoot(decoded));
            }
            if let Ok(decoded) = <CountCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Count(decoded));
            }
            if let Ok(decoded) =
                <DispatchCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Dispatch(decoded));
            }
            if let Ok(decoded) =
                <DoubleUpdateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::DoubleUpdate(decoded));
            }
            if let Ok(decoded) =
                <HomeDomainHashCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::HomeDomainHash(decoded));
            }
            if let Ok(decoded) =
                <ImproperUpdateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::ImproperUpdate(decoded));
            }
            if let Ok(decoded) =
                <InitializeCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Initialize(decoded));
            }
            if let Ok(decoded) =
                <LocalDomainCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::LocalDomain(decoded));
            }
            if let Ok(decoded) = <NoncesCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Nonces(decoded));
            }
            if let Ok(decoded) = <OwnerCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Owner(decoded));
            }
            if let Ok(decoded) =
                <QueueContainsCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::QueueContains(decoded));
            }
            if let Ok(decoded) =
                <QueueEndCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::QueueEnd(decoded));
            }
            if let Ok(decoded) =
                <QueueLengthCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::QueueLength(decoded));
            }
            if let Ok(decoded) =
                <RenounceOwnershipCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::RenounceOwnership(decoded));
            }
            if let Ok(decoded) = <RootCall as ethers::core::abi::AbiDecode>::decode(data.as_ref()) {
                return Ok(HomeCalls::Root(decoded));
            }
            if let Ok(decoded) =
                <SetUpdaterCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::SetUpdater(decoded));
            }
            if let Ok(decoded) =
                <SetUpdaterManagerCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::SetUpdaterManager(decoded));
            }
            if let Ok(decoded) = <StateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::State(decoded));
            }
            if let Ok(decoded) =
                <SuggestUpdateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::SuggestUpdate(decoded));
            }
            if let Ok(decoded) =
                <TransferOwnershipCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::TransferOwnership(decoded));
            }
            if let Ok(decoded) = <TreeCall as ethers::core::abi::AbiDecode>::decode(data.as_ref()) {
                return Ok(HomeCalls::Tree(decoded));
            }
            if let Ok(decoded) = <UpdateCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Update(decoded));
            }
            if let Ok(decoded) =
                <UpdaterCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::Updater(decoded));
            }
            if let Ok(decoded) =
                <UpdaterManagerCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(HomeCalls::UpdaterManager(decoded));
            }
            Err(ethers::core::abi::Error::InvalidData.into())
        }
    }
    impl ethers::core::abi::AbiEncode for HomeCalls {
        fn encode(self) -> Vec<u8> {
            match self {
                HomeCalls::MaxMessageBodyBytes(element) => element.encode(),
                HomeCalls::Version(element) => element.encode(),
                HomeCalls::CommittedRoot(element) => element.encode(),
                HomeCalls::Count(element) => element.encode(),
                HomeCalls::Dispatch(element) => element.encode(),
                HomeCalls::DoubleUpdate(element) => element.encode(),
                HomeCalls::HomeDomainHash(element) => element.encode(),
                HomeCalls::ImproperUpdate(element) => element.encode(),
                HomeCalls::Initialize(element) => element.encode(),
                HomeCalls::LocalDomain(element) => element.encode(),
                HomeCalls::Nonces(element) => element.encode(),
                HomeCalls::Owner(element) => element.encode(),
                HomeCalls::QueueContains(element) => element.encode(),
                HomeCalls::QueueEnd(element) => element.encode(),
                HomeCalls::QueueLength(element) => element.encode(),
                HomeCalls::RenounceOwnership(element) => element.encode(),
                HomeCalls::Root(element) => element.encode(),
                HomeCalls::SetUpdater(element) => element.encode(),
                HomeCalls::SetUpdaterManager(element) => element.encode(),
                HomeCalls::State(element) => element.encode(),
                HomeCalls::SuggestUpdate(element) => element.encode(),
                HomeCalls::TransferOwnership(element) => element.encode(),
                HomeCalls::Tree(element) => element.encode(),
                HomeCalls::Update(element) => element.encode(),
                HomeCalls::Updater(element) => element.encode(),
                HomeCalls::UpdaterManager(element) => element.encode(),
            }
        }
    }
    impl ::std::fmt::Display for HomeCalls {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            match self {
                HomeCalls::MaxMessageBodyBytes(element) => element.fmt(f),
                HomeCalls::Version(element) => element.fmt(f),
                HomeCalls::CommittedRoot(element) => element.fmt(f),
                HomeCalls::Count(element) => element.fmt(f),
                HomeCalls::Dispatch(element) => element.fmt(f),
                HomeCalls::DoubleUpdate(element) => element.fmt(f),
                HomeCalls::HomeDomainHash(element) => element.fmt(f),
                HomeCalls::ImproperUpdate(element) => element.fmt(f),
                HomeCalls::Initialize(element) => element.fmt(f),
                HomeCalls::LocalDomain(element) => element.fmt(f),
                HomeCalls::Nonces(element) => element.fmt(f),
                HomeCalls::Owner(element) => element.fmt(f),
                HomeCalls::QueueContains(element) => element.fmt(f),
                HomeCalls::QueueEnd(element) => element.fmt(f),
                HomeCalls::QueueLength(element) => element.fmt(f),
                HomeCalls::RenounceOwnership(element) => element.fmt(f),
                HomeCalls::Root(element) => element.fmt(f),
                HomeCalls::SetUpdater(element) => element.fmt(f),
                HomeCalls::SetUpdaterManager(element) => element.fmt(f),
                HomeCalls::State(element) => element.fmt(f),
                HomeCalls::SuggestUpdate(element) => element.fmt(f),
                HomeCalls::TransferOwnership(element) => element.fmt(f),
                HomeCalls::Tree(element) => element.fmt(f),
                HomeCalls::Update(element) => element.fmt(f),
                HomeCalls::Updater(element) => element.fmt(f),
                HomeCalls::UpdaterManager(element) => element.fmt(f),
            }
        }
    }
    impl ::std::convert::From<MaxMessageBodyBytesCall> for HomeCalls {
        fn from(var: MaxMessageBodyBytesCall) -> Self {
            HomeCalls::MaxMessageBodyBytes(var)
        }
    }
    impl ::std::convert::From<VersionCall> for HomeCalls {
        fn from(var: VersionCall) -> Self {
            HomeCalls::Version(var)
        }
    }
    impl ::std::convert::From<CommittedRootCall> for HomeCalls {
        fn from(var: CommittedRootCall) -> Self {
            HomeCalls::CommittedRoot(var)
        }
    }
    impl ::std::convert::From<CountCall> for HomeCalls {
        fn from(var: CountCall) -> Self {
            HomeCalls::Count(var)
        }
    }
    impl ::std::convert::From<DispatchCall> for HomeCalls {
        fn from(var: DispatchCall) -> Self {
            HomeCalls::Dispatch(var)
        }
    }
    impl ::std::convert::From<DoubleUpdateCall> for HomeCalls {
        fn from(var: DoubleUpdateCall) -> Self {
            HomeCalls::DoubleUpdate(var)
        }
    }
    impl ::std::convert::From<HomeDomainHashCall> for HomeCalls {
        fn from(var: HomeDomainHashCall) -> Self {
            HomeCalls::HomeDomainHash(var)
        }
    }
    impl ::std::convert::From<ImproperUpdateCall> for HomeCalls {
        fn from(var: ImproperUpdateCall) -> Self {
            HomeCalls::ImproperUpdate(var)
        }
    }
    impl ::std::convert::From<InitializeCall> for HomeCalls {
        fn from(var: InitializeCall) -> Self {
            HomeCalls::Initialize(var)
        }
    }
    impl ::std::convert::From<LocalDomainCall> for HomeCalls {
        fn from(var: LocalDomainCall) -> Self {
            HomeCalls::LocalDomain(var)
        }
    }
    impl ::std::convert::From<NoncesCall> for HomeCalls {
        fn from(var: NoncesCall) -> Self {
            HomeCalls::Nonces(var)
        }
    }
    impl ::std::convert::From<OwnerCall> for HomeCalls {
        fn from(var: OwnerCall) -> Self {
            HomeCalls::Owner(var)
        }
    }
    impl ::std::convert::From<QueueContainsCall> for HomeCalls {
        fn from(var: QueueContainsCall) -> Self {
            HomeCalls::QueueContains(var)
        }
    }
    impl ::std::convert::From<QueueEndCall> for HomeCalls {
        fn from(var: QueueEndCall) -> Self {
            HomeCalls::QueueEnd(var)
        }
    }
    impl ::std::convert::From<QueueLengthCall> for HomeCalls {
        fn from(var: QueueLengthCall) -> Self {
            HomeCalls::QueueLength(var)
        }
    }
    impl ::std::convert::From<RenounceOwnershipCall> for HomeCalls {
        fn from(var: RenounceOwnershipCall) -> Self {
            HomeCalls::RenounceOwnership(var)
        }
    }
    impl ::std::convert::From<RootCall> for HomeCalls {
        fn from(var: RootCall) -> Self {
            HomeCalls::Root(var)
        }
    }
    impl ::std::convert::From<SetUpdaterCall> for HomeCalls {
        fn from(var: SetUpdaterCall) -> Self {
            HomeCalls::SetUpdater(var)
        }
    }
    impl ::std::convert::From<SetUpdaterManagerCall> for HomeCalls {
        fn from(var: SetUpdaterManagerCall) -> Self {
            HomeCalls::SetUpdaterManager(var)
        }
    }
    impl ::std::convert::From<StateCall> for HomeCalls {
        fn from(var: StateCall) -> Self {
            HomeCalls::State(var)
        }
    }
    impl ::std::convert::From<SuggestUpdateCall> for HomeCalls {
        fn from(var: SuggestUpdateCall) -> Self {
            HomeCalls::SuggestUpdate(var)
        }
    }
    impl ::std::convert::From<TransferOwnershipCall> for HomeCalls {
        fn from(var: TransferOwnershipCall) -> Self {
            HomeCalls::TransferOwnership(var)
        }
    }
    impl ::std::convert::From<TreeCall> for HomeCalls {
        fn from(var: TreeCall) -> Self {
            HomeCalls::Tree(var)
        }
    }
    impl ::std::convert::From<UpdateCall> for HomeCalls {
        fn from(var: UpdateCall) -> Self {
            HomeCalls::Update(var)
        }
    }
    impl ::std::convert::From<UpdaterCall> for HomeCalls {
        fn from(var: UpdaterCall) -> Self {
            HomeCalls::Updater(var)
        }
    }
    impl ::std::convert::From<UpdaterManagerCall> for HomeCalls {
        fn from(var: UpdaterManagerCall) -> Self {
            HomeCalls::UpdaterManager(var)
        }
    }
}
