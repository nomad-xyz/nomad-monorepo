pub use xappconnectionmanager_mod::*;
#[allow(clippy::too_many_arguments)]
mod xappconnectionmanager_mod {
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
    #[doc = "XAppConnectionManager was auto-generated with ethers-rs Abigen. More information at: https://github.com/gakonst/ethers-rs"]
    use std::sync::Arc;
    pub static XAPPCONNECTIONMANAGER_ABI: ethers::contract::Lazy<ethers::core::abi::Abi> =
        ethers::contract::Lazy::new(|| {
            serde_json :: from_str ("[\n  {\n    \"inputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"constructor\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"previousOwner\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": true,\n        \"internalType\": \"address\",\n        \"name\": \"newOwner\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"OwnershipTransferred\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint32\",\n        \"name\": \"domain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"replica\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"ReplicaEnrolled\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint32\",\n        \"name\": \"domain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"replica\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"ReplicaUnenrolled\",\n    \"type\": \"event\"\n  },\n  {\n    \"anonymous\": false,\n    \"inputs\": [\n      {\n        \"indexed\": true,\n        \"internalType\": \"uint32\",\n        \"name\": \"domain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"address\",\n        \"name\": \"watcher\",\n        \"type\": \"address\"\n      },\n      {\n        \"indexed\": false,\n        \"internalType\": \"bool\",\n        \"name\": \"access\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"name\": \"WatcherPermissionSet\",\n    \"type\": \"event\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"name\": \"domainToReplica\",\n    \"outputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"home\",\n    \"outputs\": [\n      {\n        \"internalType\": \"contract Home\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_replica\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"isReplica\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"localDomain\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"owner\",\n    \"outputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_replica\",\n        \"type\": \"address\"\n      },\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_domain\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"name\": \"ownerEnrollReplica\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_replica\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"ownerUnenrollReplica\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [],\n    \"name\": \"renounceOwnership\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"replicaToDomain\",\n    \"outputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_home\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"setHome\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_watcher\",\n        \"type\": \"address\"\n      },\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_domain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"_access\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"name\": \"setWatcherPermission\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"newOwner\",\n        \"type\": \"address\"\n      }\n    ],\n    \"name\": \"transferOwnership\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_domain\",\n        \"type\": \"uint32\"\n      },\n      {\n        \"internalType\": \"bytes32\",\n        \"name\": \"_updater\",\n        \"type\": \"bytes32\"\n      },\n      {\n        \"internalType\": \"bytes\",\n        \"name\": \"_signature\",\n        \"type\": \"bytes\"\n      }\n    ],\n    \"name\": \"unenrollReplica\",\n    \"outputs\": [],\n    \"stateMutability\": \"nonpayable\",\n    \"type\": \"function\"\n  },\n  {\n    \"inputs\": [\n      {\n        \"internalType\": \"address\",\n        \"name\": \"_watcher\",\n        \"type\": \"address\"\n      },\n      {\n        \"internalType\": \"uint32\",\n        \"name\": \"_domain\",\n        \"type\": \"uint32\"\n      }\n    ],\n    \"name\": \"watcherPermission\",\n    \"outputs\": [\n      {\n        \"internalType\": \"bool\",\n        \"name\": \"\",\n        \"type\": \"bool\"\n      }\n    ],\n    \"stateMutability\": \"view\",\n    \"type\": \"function\"\n  }\n]\n") . expect ("invalid abi")
        });
    #[derive(Clone)]
    pub struct XAppConnectionManager<M>(ethers::contract::Contract<M>);
    impl<M> std::ops::Deref for XAppConnectionManager<M> {
        type Target = ethers::contract::Contract<M>;
        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }
    impl<M: ethers::providers::Middleware> std::fmt::Debug for XAppConnectionManager<M> {
        fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.debug_tuple(stringify!(XAppConnectionManager))
                .field(&self.address())
                .finish()
        }
    }
    impl<'a, M: ethers::providers::Middleware> XAppConnectionManager<M> {
        #[doc = r" Creates a new contract instance with the specified `ethers`"]
        #[doc = r" client at the given `Address`. The contract derefs to a `ethers::Contract`"]
        #[doc = r" object"]
        pub fn new<T: Into<ethers::core::types::Address>>(
            address: T,
            client: ::std::sync::Arc<M>,
        ) -> Self {
            let contract = ethers::contract::Contract::new(
                address.into(),
                XAPPCONNECTIONMANAGER_ABI.clone(),
                client,
            );
            Self(contract)
        }
        #[doc = "Calls the contract's `domainToReplica` (0xb9cff162) function"]
        pub fn domain_to_replica(
            &self,
            p0: u32,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::Address> {
            self.0
                .method_hash([185, 207, 241, 98], p0)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `home` (0x9fa92f9d) function"]
        pub fn home(
            &self,
        ) -> ethers::contract::builders::ContractCall<M, ethers::core::types::Address> {
            self.0
                .method_hash([159, 169, 47, 157], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `isReplica` (0x5190bc53) function"]
        pub fn is_replica(
            &self,
            replica: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([81, 144, 188, 83], replica)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `localDomain` (0x8d3638f4) function"]
        pub fn local_domain(&self) -> ethers::contract::builders::ContractCall<M, u32> {
            self.0
                .method_hash([141, 54, 56, 244], ())
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
        #[doc = "Calls the contract's `ownerEnrollReplica` (0xf31faefb) function"]
        pub fn owner_enroll_replica(
            &self,
            replica: ethers::core::types::Address,
            domain: u32,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([243, 31, 174, 251], (replica, domain))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `ownerUnenrollReplica` (0x8f5d90e0) function"]
        pub fn owner_unenroll_replica(
            &self,
            replica: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([143, 93, 144, 224], replica)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `renounceOwnership` (0x715018a6) function"]
        pub fn renounce_ownership(&self) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([113, 80, 24, 166], ())
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `replicaToDomain` (0x5f8b1dba) function"]
        pub fn replica_to_domain(
            &self,
            p0: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, u32> {
            self.0
                .method_hash([95, 139, 29, 186], p0)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `setHome` (0x6ef0f37f) function"]
        pub fn set_home(
            &self,
            home: ethers::core::types::Address,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([110, 240, 243, 127], home)
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `setWatcherPermission` (0x916c3470) function"]
        pub fn set_watcher_permission(
            &self,
            watcher: ethers::core::types::Address,
            domain: u32,
            access: bool,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([145, 108, 52, 112], (watcher, domain, access))
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
        #[doc = "Calls the contract's `unenrollReplica` (0xe0e7a913) function"]
        pub fn unenroll_replica(
            &self,
            domain: u32,
            updater: [u8; 32],
            signature: ethers::core::types::Bytes,
        ) -> ethers::contract::builders::ContractCall<M, ()> {
            self.0
                .method_hash([224, 231, 169, 19], (domain, updater, signature))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Calls the contract's `watcherPermission` (0x427ebef5) function"]
        pub fn watcher_permission(
            &self,
            watcher: ethers::core::types::Address,
            domain: u32,
        ) -> ethers::contract::builders::ContractCall<M, bool> {
            self.0
                .method_hash([66, 126, 190, 245], (watcher, domain))
                .expect("method not found (this should never happen)")
        }
        #[doc = "Gets the contract's `OwnershipTransferred` event"]
        pub fn ownership_transferred_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, OwnershipTransferredFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `ReplicaEnrolled` event"]
        pub fn replica_enrolled_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, ReplicaEnrolledFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `ReplicaUnenrolled` event"]
        pub fn replica_unenrolled_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, ReplicaUnenrolledFilter> {
            self.0.event()
        }
        #[doc = "Gets the contract's `WatcherPermissionSet` event"]
        pub fn watcher_permission_set_filter(
            &self,
        ) -> ethers::contract::builders::Event<M, WatcherPermissionSetFilter> {
            self.0.event()
        }
        #[doc = r" Returns an [`Event`](#ethers_contract::builders::Event) builder for all events of this contract"]
        pub fn events(&self) -> ethers::contract::builders::Event<M, XAppConnectionManagerEvents> {
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
    #[ethevent(name = "ReplicaEnrolled", abi = "ReplicaEnrolled(uint32,address)")]
    pub struct ReplicaEnrolledFilter {
        #[ethevent(indexed)]
        pub domain: u32,
        pub replica: ethers::core::types::Address,
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
    #[ethevent(name = "ReplicaUnenrolled", abi = "ReplicaUnenrolled(uint32,address)")]
    pub struct ReplicaUnenrolledFilter {
        #[ethevent(indexed)]
        pub domain: u32,
        pub replica: ethers::core::types::Address,
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
        name = "WatcherPermissionSet",
        abi = "WatcherPermissionSet(uint32,address,bool)"
    )]
    pub struct WatcherPermissionSetFilter {
        #[ethevent(indexed)]
        pub domain: u32,
        pub watcher: ethers::core::types::Address,
        pub access: bool,
    }
    #[derive(Debug, Clone, PartialEq, Eq, ethers :: contract :: EthAbiType)]
    pub enum XAppConnectionManagerEvents {
        OwnershipTransferredFilter(OwnershipTransferredFilter),
        ReplicaEnrolledFilter(ReplicaEnrolledFilter),
        ReplicaUnenrolledFilter(ReplicaUnenrolledFilter),
        WatcherPermissionSetFilter(WatcherPermissionSetFilter),
    }
    impl ethers::contract::EthLogDecode for XAppConnectionManagerEvents {
        fn decode_log(log: &ethers::core::abi::RawLog) -> Result<Self, ethers::core::abi::Error>
        where
            Self: Sized,
        {
            if let Ok(decoded) = OwnershipTransferredFilter::decode_log(log) {
                return Ok(XAppConnectionManagerEvents::OwnershipTransferredFilter(
                    decoded,
                ));
            }
            if let Ok(decoded) = ReplicaEnrolledFilter::decode_log(log) {
                return Ok(XAppConnectionManagerEvents::ReplicaEnrolledFilter(decoded));
            }
            if let Ok(decoded) = ReplicaUnenrolledFilter::decode_log(log) {
                return Ok(XAppConnectionManagerEvents::ReplicaUnenrolledFilter(
                    decoded,
                ));
            }
            if let Ok(decoded) = WatcherPermissionSetFilter::decode_log(log) {
                return Ok(XAppConnectionManagerEvents::WatcherPermissionSetFilter(
                    decoded,
                ));
            }
            Err(ethers::core::abi::Error::InvalidData)
        }
    }
    impl ::std::fmt::Display for XAppConnectionManagerEvents {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            match self {
                XAppConnectionManagerEvents::OwnershipTransferredFilter(element) => element.fmt(f),
                XAppConnectionManagerEvents::ReplicaEnrolledFilter(element) => element.fmt(f),
                XAppConnectionManagerEvents::ReplicaUnenrolledFilter(element) => element.fmt(f),
                XAppConnectionManagerEvents::WatcherPermissionSetFilter(element) => element.fmt(f),
            }
        }
    }
    #[doc = "Container type for all input parameters for the `domainToReplica`function with signature `domainToReplica(uint32)` and selector `[185, 207, 241, 98]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "domainToReplica", abi = "domainToReplica(uint32)")]
    pub struct DomainToReplicaCall(pub u32);
    #[doc = "Container type for all input parameters for the `home`function with signature `home()` and selector `[159, 169, 47, 157]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "home", abi = "home()")]
    pub struct HomeCall;
    #[doc = "Container type for all input parameters for the `isReplica`function with signature `isReplica(address)` and selector `[81, 144, 188, 83]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "isReplica", abi = "isReplica(address)")]
    pub struct IsReplicaCall {
        pub replica: ethers::core::types::Address,
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
    #[doc = "Container type for all input parameters for the `ownerEnrollReplica`function with signature `ownerEnrollReplica(address,uint32)` and selector `[243, 31, 174, 251]`"]
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
        name = "ownerEnrollReplica",
        abi = "ownerEnrollReplica(address,uint32)"
    )]
    pub struct OwnerEnrollReplicaCall {
        pub replica: ethers::core::types::Address,
        pub domain: u32,
    }
    #[doc = "Container type for all input parameters for the `ownerUnenrollReplica`function with signature `ownerUnenrollReplica(address)` and selector `[143, 93, 144, 224]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "ownerUnenrollReplica", abi = "ownerUnenrollReplica(address)")]
    pub struct OwnerUnenrollReplicaCall {
        pub replica: ethers::core::types::Address,
    }
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
    #[doc = "Container type for all input parameters for the `replicaToDomain`function with signature `replicaToDomain(address)` and selector `[95, 139, 29, 186]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "replicaToDomain", abi = "replicaToDomain(address)")]
    pub struct ReplicaToDomainCall(pub ethers::core::types::Address);
    #[doc = "Container type for all input parameters for the `setHome`function with signature `setHome(address)` and selector `[110, 240, 243, 127]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "setHome", abi = "setHome(address)")]
    pub struct SetHomeCall {
        pub home: ethers::core::types::Address,
    }
    #[doc = "Container type for all input parameters for the `setWatcherPermission`function with signature `setWatcherPermission(address,uint32,bool)` and selector `[145, 108, 52, 112]`"]
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
        name = "setWatcherPermission",
        abi = "setWatcherPermission(address,uint32,bool)"
    )]
    pub struct SetWatcherPermissionCall {
        pub watcher: ethers::core::types::Address,
        pub domain: u32,
        pub access: bool,
    }
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
    #[doc = "Container type for all input parameters for the `unenrollReplica`function with signature `unenrollReplica(uint32,bytes32,bytes)` and selector `[224, 231, 169, 19]`"]
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
        name = "unenrollReplica",
        abi = "unenrollReplica(uint32,bytes32,bytes)"
    )]
    pub struct UnenrollReplicaCall {
        pub domain: u32,
        pub updater: [u8; 32],
        pub signature: ethers::core::types::Bytes,
    }
    #[doc = "Container type for all input parameters for the `watcherPermission`function with signature `watcherPermission(address,uint32)` and selector `[66, 126, 190, 245]`"]
    #[derive(
        Clone,
        Debug,
        Default,
        Eq,
        PartialEq,
        ethers :: contract :: EthCall,
        ethers :: contract :: EthDisplay,
    )]
    #[ethcall(name = "watcherPermission", abi = "watcherPermission(address,uint32)")]
    pub struct WatcherPermissionCall {
        pub watcher: ethers::core::types::Address,
        pub domain: u32,
    }
    #[derive(Debug, Clone, PartialEq, Eq, ethers :: contract :: EthAbiType)]
    pub enum XAppConnectionManagerCalls {
        DomainToReplica(DomainToReplicaCall),
        Home(HomeCall),
        IsReplica(IsReplicaCall),
        LocalDomain(LocalDomainCall),
        Owner(OwnerCall),
        OwnerEnrollReplica(OwnerEnrollReplicaCall),
        OwnerUnenrollReplica(OwnerUnenrollReplicaCall),
        RenounceOwnership(RenounceOwnershipCall),
        ReplicaToDomain(ReplicaToDomainCall),
        SetHome(SetHomeCall),
        SetWatcherPermission(SetWatcherPermissionCall),
        TransferOwnership(TransferOwnershipCall),
        UnenrollReplica(UnenrollReplicaCall),
        WatcherPermission(WatcherPermissionCall),
    }
    impl ethers::core::abi::AbiDecode for XAppConnectionManagerCalls {
        fn decode(data: impl AsRef<[u8]>) -> Result<Self, ethers::core::abi::AbiError> {
            if let Ok(decoded) =
                <DomainToReplicaCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::DomainToReplica(decoded));
            }
            if let Ok(decoded) = <HomeCall as ethers::core::abi::AbiDecode>::decode(data.as_ref()) {
                return Ok(XAppConnectionManagerCalls::Home(decoded));
            }
            if let Ok(decoded) =
                <IsReplicaCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::IsReplica(decoded));
            }
            if let Ok(decoded) =
                <LocalDomainCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::LocalDomain(decoded));
            }
            if let Ok(decoded) = <OwnerCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::Owner(decoded));
            }
            if let Ok(decoded) =
                <OwnerEnrollReplicaCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::OwnerEnrollReplica(decoded));
            }
            if let Ok(decoded) =
                <OwnerUnenrollReplicaCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::OwnerUnenrollReplica(decoded));
            }
            if let Ok(decoded) =
                <RenounceOwnershipCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::RenounceOwnership(decoded));
            }
            if let Ok(decoded) =
                <ReplicaToDomainCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::ReplicaToDomain(decoded));
            }
            if let Ok(decoded) =
                <SetHomeCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::SetHome(decoded));
            }
            if let Ok(decoded) =
                <SetWatcherPermissionCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::SetWatcherPermission(decoded));
            }
            if let Ok(decoded) =
                <TransferOwnershipCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::TransferOwnership(decoded));
            }
            if let Ok(decoded) =
                <UnenrollReplicaCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::UnenrollReplica(decoded));
            }
            if let Ok(decoded) =
                <WatcherPermissionCall as ethers::core::abi::AbiDecode>::decode(data.as_ref())
            {
                return Ok(XAppConnectionManagerCalls::WatcherPermission(decoded));
            }
            Err(ethers::core::abi::Error::InvalidData.into())
        }
    }
    impl ethers::core::abi::AbiEncode for XAppConnectionManagerCalls {
        fn encode(self) -> Vec<u8> {
            match self {
                XAppConnectionManagerCalls::DomainToReplica(element) => element.encode(),
                XAppConnectionManagerCalls::Home(element) => element.encode(),
                XAppConnectionManagerCalls::IsReplica(element) => element.encode(),
                XAppConnectionManagerCalls::LocalDomain(element) => element.encode(),
                XAppConnectionManagerCalls::Owner(element) => element.encode(),
                XAppConnectionManagerCalls::OwnerEnrollReplica(element) => element.encode(),
                XAppConnectionManagerCalls::OwnerUnenrollReplica(element) => element.encode(),
                XAppConnectionManagerCalls::RenounceOwnership(element) => element.encode(),
                XAppConnectionManagerCalls::ReplicaToDomain(element) => element.encode(),
                XAppConnectionManagerCalls::SetHome(element) => element.encode(),
                XAppConnectionManagerCalls::SetWatcherPermission(element) => element.encode(),
                XAppConnectionManagerCalls::TransferOwnership(element) => element.encode(),
                XAppConnectionManagerCalls::UnenrollReplica(element) => element.encode(),
                XAppConnectionManagerCalls::WatcherPermission(element) => element.encode(),
            }
        }
    }
    impl ::std::fmt::Display for XAppConnectionManagerCalls {
        fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
            match self {
                XAppConnectionManagerCalls::DomainToReplica(element) => element.fmt(f),
                XAppConnectionManagerCalls::Home(element) => element.fmt(f),
                XAppConnectionManagerCalls::IsReplica(element) => element.fmt(f),
                XAppConnectionManagerCalls::LocalDomain(element) => element.fmt(f),
                XAppConnectionManagerCalls::Owner(element) => element.fmt(f),
                XAppConnectionManagerCalls::OwnerEnrollReplica(element) => element.fmt(f),
                XAppConnectionManagerCalls::OwnerUnenrollReplica(element) => element.fmt(f),
                XAppConnectionManagerCalls::RenounceOwnership(element) => element.fmt(f),
                XAppConnectionManagerCalls::ReplicaToDomain(element) => element.fmt(f),
                XAppConnectionManagerCalls::SetHome(element) => element.fmt(f),
                XAppConnectionManagerCalls::SetWatcherPermission(element) => element.fmt(f),
                XAppConnectionManagerCalls::TransferOwnership(element) => element.fmt(f),
                XAppConnectionManagerCalls::UnenrollReplica(element) => element.fmt(f),
                XAppConnectionManagerCalls::WatcherPermission(element) => element.fmt(f),
            }
        }
    }
    impl ::std::convert::From<DomainToReplicaCall> for XAppConnectionManagerCalls {
        fn from(var: DomainToReplicaCall) -> Self {
            XAppConnectionManagerCalls::DomainToReplica(var)
        }
    }
    impl ::std::convert::From<HomeCall> for XAppConnectionManagerCalls {
        fn from(var: HomeCall) -> Self {
            XAppConnectionManagerCalls::Home(var)
        }
    }
    impl ::std::convert::From<IsReplicaCall> for XAppConnectionManagerCalls {
        fn from(var: IsReplicaCall) -> Self {
            XAppConnectionManagerCalls::IsReplica(var)
        }
    }
    impl ::std::convert::From<LocalDomainCall> for XAppConnectionManagerCalls {
        fn from(var: LocalDomainCall) -> Self {
            XAppConnectionManagerCalls::LocalDomain(var)
        }
    }
    impl ::std::convert::From<OwnerCall> for XAppConnectionManagerCalls {
        fn from(var: OwnerCall) -> Self {
            XAppConnectionManagerCalls::Owner(var)
        }
    }
    impl ::std::convert::From<OwnerEnrollReplicaCall> for XAppConnectionManagerCalls {
        fn from(var: OwnerEnrollReplicaCall) -> Self {
            XAppConnectionManagerCalls::OwnerEnrollReplica(var)
        }
    }
    impl ::std::convert::From<OwnerUnenrollReplicaCall> for XAppConnectionManagerCalls {
        fn from(var: OwnerUnenrollReplicaCall) -> Self {
            XAppConnectionManagerCalls::OwnerUnenrollReplica(var)
        }
    }
    impl ::std::convert::From<RenounceOwnershipCall> for XAppConnectionManagerCalls {
        fn from(var: RenounceOwnershipCall) -> Self {
            XAppConnectionManagerCalls::RenounceOwnership(var)
        }
    }
    impl ::std::convert::From<ReplicaToDomainCall> for XAppConnectionManagerCalls {
        fn from(var: ReplicaToDomainCall) -> Self {
            XAppConnectionManagerCalls::ReplicaToDomain(var)
        }
    }
    impl ::std::convert::From<SetHomeCall> for XAppConnectionManagerCalls {
        fn from(var: SetHomeCall) -> Self {
            XAppConnectionManagerCalls::SetHome(var)
        }
    }
    impl ::std::convert::From<SetWatcherPermissionCall> for XAppConnectionManagerCalls {
        fn from(var: SetWatcherPermissionCall) -> Self {
            XAppConnectionManagerCalls::SetWatcherPermission(var)
        }
    }
    impl ::std::convert::From<TransferOwnershipCall> for XAppConnectionManagerCalls {
        fn from(var: TransferOwnershipCall) -> Self {
            XAppConnectionManagerCalls::TransferOwnership(var)
        }
    }
    impl ::std::convert::From<UnenrollReplicaCall> for XAppConnectionManagerCalls {
        fn from(var: UnenrollReplicaCall) -> Self {
            XAppConnectionManagerCalls::UnenrollReplica(var)
        }
    }
    impl ::std::convert::From<WatcherPermissionCall> for XAppConnectionManagerCalls {
        fn from(var: WatcherPermissionCall) -> Self {
            XAppConnectionManagerCalls::WatcherPermission(var)
        }
    }
}
