// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./UnifiedCrossChainSync.sol";

/**
 * @title SupraSync
 * @dev Supra HyperNova adapter for cross-chain synchronization
 * 
 * NOTE: This is a placeholder implementation until Supra EVM support is available.
 * The actual Supra HyperNova interfaces will be integrated when they launch.
 * 
 * For now, this contract:
 * - Provides the interface for Supra integration
 * - Can be deployed and configured
 * - Will be updated when Supra EVM support launches
 */
contract SupraSync is Ownable {
    address public unifiedSync;
    
    // Chain ID to Supra chain ID mapping
    mapping(uint32 => uint256) public supraChainIds;
    
    // Message tracking
    mapping(bytes32 => bool) public sentMessages;
    
    // Configuration
    bool public enabled;
    
    // Events
    event SupraMessageSent(
        bytes32 indexed messageId,
        address indexed token,
        uint32 sourceEID,
        uint32 targetEID,
        uint256 supply
    );
    
    event SupraMessageReceived(
        bytes32 indexed messageId,
        address indexed token,
        uint32 sourceEID,
        uint256 supply
    );
    
    event SupraEnabled(bool enabled);
    
    error NotUnifiedSync();
    error SupraNotEnabled();
    error InvalidMessageId();
    
    constructor(address _unifiedSync) Ownable(msg.sender) {
        unifiedSync = _unifiedSync;
        enabled = false; // Disabled until Supra EVM support is available
        
        // Initialize chain mappings (placeholder)
        // These will be updated when Supra EVM support launches
        supraChainIds[40161] = 1; // Ethereum Sepolia (placeholder)
        supraChainIds[40102] = 2; // BSC Testnet (placeholder)
        supraChainIds[40245] = 3; // Base Sepolia (placeholder)
    }
    
    /**
     * @dev Set unified sync address
     */
    function setUnifiedSync(address _unifiedSync) external onlyOwner {
        require(_unifiedSync != address(0), "Invalid address");
        unifiedSync = _unifiedSync;
    }
    
    /**
     * @dev Enable/disable Supra sync
     */
    function setEnabled(bool _enabled) external onlyOwner {
        enabled = _enabled;
        emit SupraEnabled(_enabled);
    }
    
    /**
     * @dev Set Supra chain ID mapping
     */
    function setSupraChainId(uint32 eid, uint256 supraChainId) external onlyOwner {
        supraChainIds[eid] = supraChainId;
    }
    
    /**
     * @dev Sync supply via Supra HyperNova
     * TODO: Implement when Supra EVM support is available
     * 
     * This function will:
     * 1. Generate message ID for deduplication
     * 2. Call Supra HyperNova to send cross-chain message
     * 3. Track message for monitoring
     */
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable {
        require(msg.sender == unifiedSync, "Only unified sync");
        require(enabled, "Supra not enabled");
        
        // Generate message ID for deduplication
        bytes32 messageId = keccak256(abi.encodePacked(
            token,
            sourceEID,
            newSupply,
            block.timestamp,
            block.number
        ));
        
        // TODO: When Supra EVM support is available:
        // 1. Get target chains from unified sync
        // 2. Call Supra HyperNova.sendMessage() for each target
        // 3. Handle Supra-specific fee structure
        
        // For now, just emit event (placeholder)
        emit SupraMessageSent(messageId, token, sourceEID, 0, newSupply);
        
        sentMessages[messageId] = true;
        
        // Return funds if Supra is not yet available
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
    }
    
    /**
     * @dev Receive message from Supra HyperNova
     * TODO: Implement when Supra EVM support is available
     * 
     * This function will:
     * 1. Verify message is from Supra HyperNova
     * 2. Decode message payload
     * 3. Forward to unified sync for processing
     */
    function receiveSupraMessage(
        bytes32 messageId,
        address token,
        uint32 sourceEID,
        uint256 supply,
        uint256 globalSupplyValue
    ) external {
        // TODO: Verify message is from Supra HyperNova
        // require(msg.sender == address(supraHyperNova), "Invalid sender");
        
        // Verify message ID
        if (sentMessages[messageId]) {
            revert InvalidMessageId();
        }
        
        // Forward to unified sync
        (bool success, ) = unifiedSync.call(
            abi.encodeWithSignature(
                "receiveSupraMessage(bytes32,address,uint32,uint256,uint256)",
                messageId,
                token,
                sourceEID,
                supply,
                globalSupplyValue
            )
        );
        require(success, "Failed to forward to unified sync");
        
        emit SupraMessageReceived(messageId, token, sourceEID, supply);
    }
    
    /**
     * @dev Get target EIDs for a source EID
     * Helper function to determine which chains to sync to
     */
    function getTargetEIDs(uint32 sourceEID) external pure returns (uint32[] memory) {
        // Return all EIDs except source
        uint32[] memory targets = new uint32[](3);
        uint256 index = 0;
        
        uint32[3] memory allEIDs = [uint32(40161), uint32(40102), uint32(40245)];
        
        for (uint i = 0; i < allEIDs.length; i++) {
            if (allEIDs[i] != sourceEID) {
                targets[index++] = allEIDs[i];
            }
        }
        
        // Resize array
        assembly {
            mstore(targets, index)
        }
        
        return targets;
    }
    
    /**
     * @dev Check if Supra is enabled and configured
     */
    function isReady() external view returns (bool) {
        return enabled && unifiedSync != address(0);
    }
    
    /**
     * @dev Withdraw native tokens
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

