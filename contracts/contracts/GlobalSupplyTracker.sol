// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GlobalSupplyTracker
 * @dev Tracks global token supply across all chains for unified price calculation
 * This enables virtual liquidity and cross-chain price synchronization
 */
contract GlobalSupplyTracker {
    address public owner;
    
    // tokenId => global supply sold across all chains
    mapping(address => uint256) public globalSupply;
    
    // tokenId => chain name => supply on that chain
    mapping(address => mapping(string => uint256)) public chainSupply;
    
    // Authorized bonding curves that can update supply
    mapping(address => bool) public authorizedUpdaters;
    
    event SupplyUpdated(address indexed tokenId, string chain, uint256 newSupply, uint256 globalSupply);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Authorize a bonding curve contract to update supply
     */
    function authorizeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }
    
    /**
     * @dev Revoke authorization
     */
    function revokeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }
    
    /**
     * @dev Update supply for a specific chain
     * Called by bonding curve contracts when tokens are bought/sold
     */
    function updateSupply(
        address tokenId,
        string memory chain,
        uint256 newSupply
    ) external onlyAuthorized {
        uint256 oldChainSupply = chainSupply[tokenId][chain];
        
        // Update chain-specific supply
        chainSupply[tokenId][chain] = newSupply;
        
        // Update global supply
        globalSupply[tokenId] = globalSupply[tokenId] - oldChainSupply + newSupply;
        
        emit SupplyUpdated(tokenId, chain, newSupply, globalSupply[tokenId]);
    }
    
    /**
     * @dev Get global supply for a token (used by bonding curves for price calculation)
     */
    function getGlobalSupply(address tokenId) external view returns (uint256) {
        return globalSupply[tokenId];
    }
    
    /**
     * @dev Get supply for a specific chain
     */
    function getChainSupply(address tokenId, string memory chain) external view returns (uint256) {
        return chainSupply[tokenId][chain];
    }
    
    /**
     * @dev Get all chain supplies for a token
     */
    function getAllChainSupplies(address tokenId) external view returns (uint256[] memory) {
        // This would need to be called with known chains
        // For simplicity, returning array of known chains
        uint256[] memory supplies = new uint256[](4);
        supplies[0] = chainSupply[tokenId]["ethereum"];
        supplies[1] = chainSupply[tokenId]["bsc"];
        supplies[2] = chainSupply[tokenId]["base"];
        supplies[3] = chainSupply[tokenId]["solana"];
        return supplies;
    }
}





