// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity >=0.6.11;
pragma experimental ABIEncoderV2;

// ============ Internal Imports ============
import {MultiChainGovernanceMessage} from "./MultiChainGovernanceMessage.sol";
// ============ External Imports ============
import {IMessageRecipient} from "@nomad-xyz/nomad-core-sol/interfaces/IMessageRecipient.sol";
import {Home} from "@nomad-xyz/nomad-core-sol/contracts/Home.sol";
import {XAppConnectionManager, TypeCasts} from "@nomad-xyz/nomad-core-sol/contracts/XAppConnectionManager.sol";
import {Version0} from "@nomad-xyz/nomad-core-sol/contracts/Version0.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {TypedMemView} from "@summa-tx/memview-sol/contracts/TypedMemView.sol";

contract MultiChainGovernanceRouter is
    Version0,
    Initializable,
    IMessageRecipient
{
    // ============ Libraries ============

    using SafeMath for uint256;
    using TypedMemView for bytes;
    using TypedMemView for bytes29;
    using MultiChainGovernanceMessage for bytes29;

    // ============== Enums ==============

    // The status of a batch of governance calls
    enum BatchStatus {
        Unknown, // 0
        Pending, // 1
        Complete // 2
    }

    // ============ Public Storage ============

    // the local entity empowered to call governance functions, set to 0x0 on non-Governor chains
    address public governor;
    // domain of Governor chain -- for accepting incoming messages from Governor
    uint32 public governorDomain;
    // call hash -> call status
    mapping(bytes32 => BatchStatus) public inboundCallBatches;
    // domain -> remote GovernanceRouter contract address
    mapping(uint32 => bytes32) public remoteRouters;
    // xAppConnectionManager contract which stores Replica addresses
    XAppConnectionManager public xAppConnectionManager;

    // ============ Upgrade Gap ============

    // gap for upgrade safety
    uint256[42] private __GAP;

    // ============ Events ============

    /**
     * @notice Emitted when a batch of governance instructions from the
     * governing remote router is received and ready for execution
     * @param batchHash A hash committing to the batch of calls to be executed
     */
    event BatchReceived(bytes32 indexed batchHash);

    /**
     * @notice Emitted when a batch of governance instructions from the
     * governing remote router is executed
     * @param batchHash A hash committing to the batch of calls to be executed
     */
    event BatchExecuted(bytes32 indexed batchHash);

    /**
     * @notice Emitted a remote GovernanceRouter address is added, removed, or changed
     * @param domain the domain of the remote Router
     * @param previousRouter the previously registered router; 0 if router is being added
     * @param newRouter the new registered router; 0 if router is being removed
     */
    event SetRouter(
        uint32 indexed domain,
        bytes32 previousRouter,
        bytes32 newRouter
    );

    // ============ Modifiers ============

    modifier onlyReplica() {
        require(xAppConnectionManager.isReplica(msg.sender), "!replica");
        _;
    }

    modifier onlyGovernorRouter(uint32 _domain, bytes32 _address) {
        require(_isGovernorRouter(_domain, _address), "!governorRouter");
        _;
    }

    modifier onlyGovernor() {
        require(
            msg.sender == governor || msg.sender == address(this),
            "! called by governor"
        );
        _;
    }

    // ============ Initializer ============

    function initialize(
        uint32 _governorDomain,
        address _governor,
        address _xAppConnectionManager
    ) public initializer {
        // TODO: add back transfer governor?? for setup period setting routers
        // initialize governor
        governorDomain = _governorDomain;
        governor = _governor;
        // initialize XAppConnectionManager
        setXAppConnectionManager(_xAppConnectionManager);
    }

    // ============ External Functions ============

    /**
     * @notice Handle Nomad messages
     * For all non-Governor chains to handle messages
     * sent from the Governor chain via Nomad.
     * Governor chain should never receive messages,
     * because non-Governor chains are not able to send them
     * @param _origin The domain (of the Governor Router)
     * @param _sender The message sender (must be the Governor Router)
     * @param _message The message
     */
    function handle(
        uint32 _origin,
        uint32, // _nonce (unused)
        bytes32 _sender,
        bytes memory _message
    ) external override onlyReplica onlyGovernorRouter(_origin, _sender) {
        bytes29 _batchCall = _message.ref(0).tryAsBatch();
        if (_batchCall.notNull()) {
            _handleBatch(_batchCall);
        } else {
            require(false, "!valid message");
        }
    }

    /**
     * @notice Dispatch a set of calls to be executed on a remote domain.
     * @dev The contents of the _domains array at the same index
     * will determine the destination of messages in that _remoteCalls array.
     * As such, all messages in an array MUST have the same destination.
     * Missing destinations or too many will result in reverts.
     * @param _domains The domains to send the array of remote calls
     * @param _remoteCalls An array of arrays of remote calls
     */
    function executeGovernanceActions(
        uint32[] calldata _domains,
        MultiChainGovernanceMessage.Call[][] calldata _remoteCalls
    ) external onlyGovernor {
        require(
            _domains.length == _remoteCalls.length,
            "!domains length matches calls length"
        );
        // remote calls loop
        for (uint256 i = 0; i < _remoteCalls.length; i++) {
            uint32 destination = _domains[i];
            _callRemote(destination, _remoteCalls[i]);
        }
    }

    /**
     * @notice execute a pending batch of messages on the local chain
     * @param _calls The array of calls to be executed locally
     */
    function executeCallBatch(
        MultiChainGovernanceMessage.Call[] calldata _calls
    ) external {
        bytes32 _batchHash = MultiChainGovernanceMessage.getBatchHash(_calls);
        require(
            inboundCallBatches[_batchHash] == BatchStatus.Pending,
            "!batch pending"
        );
        inboundCallBatches[_batchHash] = BatchStatus.Complete;
        for (uint256 i = 0; i < _calls.length; i++) {
            _callLocal(_calls[i]);
        }
        emit BatchExecuted(_batchHash);
    }

    /**
     * @notice Set the router address *locally only*
     * @dev For use in deploy to setup the router mapping locally
     * @param _domain The domain
     * @param _router The new router
     */
    function addRemoteChain(uint32 _domain, bytes32 _router)
        external
        onlyGovernor
    {
        // ignore local domain in router mapping
        require(!_isLocalDomain(_domain), "can't set local router");
        // store previous router in memory
        bytes32 _previousRouter = remoteRouters[_domain];
        // set router in mapping (add or change)
        remoteRouters[_domain] = _router;
        // emit event
        emit SetRouter(_domain, _previousRouter, _router);
    }

    /**
     * @notice Set the address of the XAppConnectionManager
     * @dev Domain/address validation helper
     * @param _xAppConnectionManager The address of the new xAppConnectionManager
     */
    function setXAppConnectionManager(address _xAppConnectionManager)
        public
        onlyGovernor
    {
        xAppConnectionManager = XAppConnectionManager(_xAppConnectionManager);
    }

    // ============ Internal Functions ============

    /**
     * @notice Handle message dispatching calls locally
     * @dev We considered requiring the batch was not previously known.
     *      However, this would prevent us from ever processing identical
     *      batches, which seems desirable in some cases.
     *      As a result, we simply set it to pending.
     * @param _msg The message
     */
    function _handleBatch(bytes29 _msg) internal {
        bytes32 _batchHash = _msg.batchHash();
        // prevent accidental SSTORE and extra event if already pending
        if (inboundCallBatches[_batchHash] == BatchStatus.Pending) return;
        inboundCallBatches[_batchHash] = BatchStatus.Pending;
        emit BatchReceived(_batchHash);
    }

    /**
     * @notice Dispatch calls on a remote chain via the remote GovernanceRouter
     * @param _destination The domain of the remote chain
     * @param _calls The calls
     */
    function _callRemote(
        uint32 _destination,
        MultiChainGovernanceMessage.Call[] calldata _calls
    ) internal onlyGovernor {
        // ensure that destination chain has enrolled router
        bytes32 _router = _mustHaveRouter(_destination);
        // format batch message
        bytes memory _msg = MultiChainGovernanceMessage.formatBatch(_calls);
        // dispatch call message using Nomad
        Home(xAppConnectionManager.home()).dispatch(
            _destination,
            _router,
            _msg
        );
    }

    /**
     * @notice Dispatch call locally
     * @param _call The call
     * @return _ret
     */
    function _callLocal(MultiChainGovernanceMessage.Call memory _call)
        internal
        returns (bytes memory _ret)
    {
        address _toContract = TypeCasts.bytes32ToAddress(_call.to);
        // attempt to dispatch using low-level call
        bool _success;
        (_success, _ret) = _toContract.call(_call.data);
        // revert if the call failed
        require(_success, "call failed");
    }

    /**
     * @notice Determine if a given domain and address is the Governor Router
     * @param _domain The domain
     * @param _address The address of the domain's router
     * @return _ret True if the given domain/address is the
     * Governor Router.
     */
    function _isGovernorRouter(uint32 _domain, bytes32 _address)
        internal
        view
        returns (bool)
    {
        return _domain == governorDomain && _address == remoteRouters[_domain];
    }

    /**
     * @notice Determine if a given domain is the local domain
     * @param _domain The domain
     * @return _ret - True if the given domain is the local domain
     */
    function _isLocalDomain(uint32 _domain) internal view returns (bool) {
        return _domain == xAppConnectionManager.localDomain();
    }

    /**
     * @notice Require that a domain has a router and returns the router
     * @param _domain The domain
     * @return _router - The domain's router
     */
    function _mustHaveRouter(uint32 _domain)
        internal
        view
        returns (bytes32 _router)
    {
        _router = remoteRouters[_domain];
        require(_router != bytes32(0), "!router");
    }
}
