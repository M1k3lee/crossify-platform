// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroReceiver.sol";

/**
 * @title CrossChainSync
 * @dev Central contract for cross-chain supply synchronization using LayerZero v2
 * Handles LayerZero messaging and global supply tracking across multiple chains
 */
contract CrossChainSync is Ownable, ILayerZeroReceiver {
    ILayerZeroEndpointV2 public immutable lzEndpoint;
    
    // token => global supply across all chains
    mapping(address => uint256) public globalSupply;
    
    // token => EID => supply on that chain
    mapping(address => mapping(uint32 => uint256)) public chainSupply;
    
    // Authorized tokens that can sync
    mapping(address => bool) public authorizedTokens;
    
    // Trusted remote addresses (EID => remote address)
    mapping(uint32 => bytes) public trustedRemotes;
    
    // LayerZero EID (Endpoint ID) for each chain
    mapping(string => uint32) public chainEIDs;
    mapping(uint32 => string) public eidToChain;
    
    // LayerZero configuration
    uint256 public constant LZ_GAS_LIMIT = 200000; // Gas limit for cross-chain messages
    
    event SupplySynced(
        address indexed token,
        uint32 indexed sourceEID,
        uint32 indexed targetEID,
        uint256 supply
    );
    
    event GlobalSupplyUpdated(
        address indexed token,
        uint256 globalSupply,
        uint256 timestamp
    );
    
    event TrustedRemoteSet(uint32 eid, bytes remote);
    
    error InvalidSource();
    error NotAuthorized();
    
    constructor(address _lzEndpoint) Ownable(msg.sender) {
        require(_lzEndpoint != address(0), "Invalid endpoint");
        lzEndpoint = ILayerZeroEndpointV2(_lzEndpoint);
        
        // Initialize LayerZero EIDs (Endpoint IDs) for testnets
        // Sepolia: 40161, BSC Testnet: 40102, Base Sepolia: 40245
        chainEIDs["ethereum"] = 40161;
        chainEIDs["bsc"] = 40102;
        chainEIDs["base"] = 40245;
        
        eidToChain[40161] = "ethereum";
        eidToChain[40102] = "bsc";
        eidToChain[40245] = "base";
    }
    
    /**
     * @dev Set trusted remote address for a chain
     */
    function setTrustedRemote(uint32 _eid, bytes calldata _remote) external onlyOwner {
        trustedRemotes[_eid] = _remote;
        emit TrustedRemoteSet(_eid, _remote);
    }
    
    /**
     * @dev Authorize a token contract to sync
     */
    function authorizeToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token");
        authorizedTokens[token] = true;
    }
    
    /**
     * @dev Revoke token authorization
     */
    function revokeToken(address token) external onlyOwner {
        authorizedTokens[token] = false;
    }
    
    /**
     * @dev Sync supply update across all chains
     * Called by token contracts when supply changes
     */
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable {
        if (!authorizedTokens[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized();
        }
        
        // Update local supply
        uint256 oldChainSupply = chainSupply[token][sourceEID];
        chainSupply[token][sourceEID] = newSupply;
        
        // Update global supply
        globalSupply[token] = globalSupply[token] - oldChainSupply + newSupply;
        
        emit GlobalSupplyUpdated(token, globalSupply[token], block.timestamp);
        
        // Broadcast to all other chains via LayerZero
        _broadcastToAllChains(token, sourceEID, newSupply, globalSupply[token]);
    }
    
    /**
     * @dev Broadcast supply update to all chains using LayerZero v2
     */
    function _broadcastToAllChains(
        address token,
        uint32 sourceEID,
        uint256 newChainSupply,
        uint256 globalSupplyValue
    ) internal {
        // Get target EIDs (all chains except source)
        uint32[] memory targetEIDs = _getTargetEIDs(sourceEID);
        
        if (targetEIDs.length == 0) return;
        
        // Encode payload
        bytes memory payload = abi.encode(
            token,
            sourceEID,
            newChainSupply,
            globalSupplyValue
        );
        
        // Calculate fee per chain (split msg.value across all targets)
        uint256 valuePerChain = msg.value / targetEIDs.length;
        
        // Send to each target chain
        for (uint i = 0; i < targetEIDs.length; i++) {
            if (trustedRemotes[targetEIDs[i]].length == 0) {
                // Skip if trusted remote not set
                continue;
            }
            
            _sendMessage(
                targetEIDs[i],
                payload,
                valuePerChain
            );
            
            emit SupplySynced(token, sourceEID, targetEIDs[i], globalSupplyValue);
        }
    }
    
    /**
     * @dev Send cross-chain message using LayerZero v2
     */
    function _sendMessage(
        uint32 _dstEid,
        bytes memory _payload,
        uint256 _nativeValue
    ) internal {
        // Get trusted remote address
        bytes memory trustedRemote = trustedRemotes[_dstEid];
        require(trustedRemote.length > 0, "Trusted remote not set");
        
        // Create message options
        MessagingParams memory params = MessagingParams({
            dstEid: _dstEid,
            receiver: _addressToBytes32(address(this)), // Self as receiver
            message: _payload,
            options: _buildOptions(),
            payInLzToken: false
        });
        
        // Send message via LayerZero EndpointV2
        lzEndpoint.send{value: _nativeValue}(
            params,
            payable(msg.sender) // Refund address
        );
    }
    
    /**
     * @dev Build LayerZero options for messaging
     */
    function _buildOptions() internal pure returns (bytes memory) {
        // Default options - can be extended with executor options
        return bytes("");
    }
    
    /**
     * @dev Convert address to bytes32 for LayerZero
     */
    function _addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
    
    /**
     * @dev Check if a path can be initialized
     */
    function allowInitializePath(Origin calldata _origin) external view returns (bool) {
        bytes memory trustedRemote = trustedRemotes[_origin.srcEid];
        return trustedRemote.length > 0 && 
               keccak256(trustedRemote) == keccak256(abi.encodePacked(_origin.sender));
    }
    
    /**
     * @dev Get next nonce for a sender
     */
    function nextNonce(uint32 _eid, bytes32 _sender) external view returns (uint64) {
        // For simplicity, return 0 (LayerZero will handle nonce management)
        // In production, you might want to track nonces per sender
        return 0;
    }
    
    /**
     * @dev LayerZero v2 receive function
     */
    function lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata _payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) external payable {
        // Verify message is from LayerZero endpoint
        require(msg.sender == address(lzEndpoint), "Invalid endpoint");
        
        // Verify trusted remote
        bytes memory trustedRemote = trustedRemotes[_origin.srcEid];
        require(trustedRemote.length > 0, "Untrusted source");
        require(
            keccak256(trustedRemote) == keccak256(abi.encodePacked(_origin.sender)),
            "Invalid source"
        );
        
        // Decode payload
        (
            address token,
            uint32 sourceEID,
            uint256 chainSupplyValue,
            uint256 globalSupplyValue
        ) = abi.decode(_payload, (address, uint32, uint256, uint256));
        
        // Update local tracking
        uint256 oldChainSupply = chainSupply[token][sourceEID];
        chainSupply[token][sourceEID] = chainSupplyValue;
        
        // Update global supply
        globalSupply[token] = globalSupply[token] - oldChainSupply + chainSupplyValue;
        
        emit SupplySynced(token, sourceEID, _getCurrentEID(), chainSupplyValue);
        emit GlobalSupplyUpdated(token, globalSupply[token], block.timestamp);
    }
    
    /**
     * @dev Get current chain's EID
     */
    function _getCurrentEID() internal view returns (uint32) {
        // This would need to be set per deployment
        // For now, return a default based on chainId
        // In production, this should be configured per network
        if (block.chainid == 11155111) return 40161; // Sepolia
        if (block.chainid == 97) return 40102; // BSC Testnet
        if (block.chainid == 84532) return 40245; // Base Sepolia
        return 0;
    }
    
    /**
     * @dev Get target EIDs (all chains except source)
     */
    function _getTargetEIDs(uint32 excludeEID) internal view returns (uint32[] memory) {
        uint32[] memory eids = new uint32[](3);
        uint256 index = 0;
        
        uint32[3] memory allEIDs = [uint32(40161), uint32(40102), uint32(40245)];
        
        for (uint i = 0; i < allEIDs.length; i++) {
            if (allEIDs[i] != excludeEID && trustedRemotes[allEIDs[i]].length > 0) {
                eids[index++] = allEIDs[i];
            }
        }
        
        // Resize array
        assembly {
            mstore(eids, index)
        }
        
        return eids;
    }
    
    /**
     * @dev Get global supply for a token
     */
    function getGlobalSupply(address token) external view returns (uint256) {
        return globalSupply[token];
    }
    
    /**
     * @dev Get supply for a specific chain
     */
    function getChainSupply(address token, uint32 eid) external view returns (uint256) {
        return chainSupply[token][eid];
    }
    
    /**
     * @dev Get all chain supplies for a token
     */
    function getAllChainSupplies(address token) external view returns (
        uint32[] memory eids,
        uint256[] memory supplies
    ) {
        uint32[] memory allEIDs = new uint32[](3);
        uint256[] memory suppliesArray = new uint256[](3);
        
        allEIDs[0] = 40161; // Ethereum Sepolia
        allEIDs[1] = 40102; // BSC Testnet
        allEIDs[2] = 40245; // Base Sepolia
        
        for (uint i = 0; i < allEIDs.length; i++) {
            suppliesArray[i] = chainSupply[token][allEIDs[i]];
        }
        
        return (allEIDs, suppliesArray);
    }
    
    /**
     * @dev Estimate fee for cross-chain message
     */
    function estimateSyncFee(address token, uint32 targetEID) external view returns (uint256 fee) {
        bytes memory payload = abi.encode(
            token,
            uint32(40161), // Source EID
            uint256(0),  // Chain supply
            uint256(0)   // Global supply
        );
        
        if (address(lzEndpoint) == address(0)) {
            return 0.001 ether; // Default estimate
        }
        
        // Build messaging params
        MessagingParams memory params = MessagingParams({
            dstEid: targetEID,
            receiver: _addressToBytes32(address(this)),
            message: payload,
            options: _buildOptions(),
            payInLzToken: false
        });
        
        // Estimate fee using LayerZero v2 quote function
        try lzEndpoint.quote(params, address(this)) returns (MessagingFee memory fee) {
            return fee.nativeFee;
        } catch {
            return 0.001 ether; // Fallback
        }
    }
    
    /**
     * @dev Withdraw native tokens (for fees)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}
