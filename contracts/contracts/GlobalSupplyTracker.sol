// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICrossChainSync
 * @dev Interface for CrossChainSync contract
 */
interface ICrossChainSync {
    function syncSupplyUpdate(
        address token,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable;
    
    function estimateSyncFee(address token, uint32 targetEID) external view returns (uint256 fee);
}

/**
 * @title GlobalSupplyTracker
 * @dev Tracks global token supply across all chains for unified price calculation
 * This enables virtual liquidity and cross-chain price synchronization
 * NOW WITH CROSS-CHAIN SYNC INTEGRATION via LayerZero
 */
contract GlobalSupplyTracker {
    address public owner;
    
    // tokenId => global supply sold across all chains
    mapping(address => uint256) public globalSupply;
    
    // tokenId => chain name => supply on that chain
    mapping(address => mapping(string => uint256)) public chainSupply;
    
    // Authorized bonding curves that can update supply
    mapping(address => bool) public authorizedUpdaters;
    
    // Cross-chain sync contract for LayerZero messaging
    ICrossChainSync public crossChainSync;
    bool public crossChainEnabled;
    
    // Chain name to LayerZero EID mapping
    mapping(string => uint32) public chainEIDs;
    
    // Current chain's EID (set in constructor)
    uint32 public currentChainEID;
    
    // Minimum fee reserve for cross-chain messages (to avoid failed transactions)
    uint256 public minFeeReserve = 0.001 ether;
    
    event SupplyUpdated(address indexed tokenId, string chain, uint256 newSupply, uint256 globalSupply);
    event CrossChainSyncEnabled(address indexed crossChainSync);
    event CrossChainSyncDisabled();
    event CrossChainSyncFailed(address indexed tokenId, string chain, uint256 newSupply, string reason);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(uint32 _currentChainEID) {
        owner = msg.sender;
        currentChainEID = _currentChainEID;
        
        // Initialize LayerZero EIDs for testnets
        // Sepolia: 40161, BSC Testnet: 40102, Base Sepolia: 40245
        chainEIDs["ethereum"] = 40161;
        chainEIDs["sepolia"] = 40161;
        chainEIDs["bsc"] = 40102;
        chainEIDs["bsc-testnet"] = 40102;
        chainEIDs["base"] = 40245;
        chainEIDs["base-sepolia"] = 40245;
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
     * @dev Set cross-chain sync contract and enable cross-chain messaging
     */
    function setCrossChainSync(address _crossChainSync) external onlyOwner {
        if (_crossChainSync == address(0)) {
            crossChainEnabled = false;
            crossChainSync = ICrossChainSync(address(0));
            emit CrossChainSyncDisabled();
        } else {
            crossChainSync = ICrossChainSync(_crossChainSync);
            crossChainEnabled = true;
            emit CrossChainSyncEnabled(_crossChainSync);
        }
    }
    
    /**
     * @dev Set chain EID mapping
     */
    function setChainEID(string memory chainName, uint32 eid) external onlyOwner {
        chainEIDs[chainName] = eid;
    }
    
    /**
     * @dev Set current chain EID
     */
    function setCurrentChainEID(uint32 eid) external onlyOwner {
        currentChainEID = eid;
    }
    
    /**
     * @dev Set minimum fee reserve for cross-chain messages
     */
    function setMinFeeReserve(uint256 reserve) external onlyOwner {
        minFeeReserve = reserve;
    }
    
    /**
     * @dev Get EID for a chain name
     */
    function getChainEID(string memory chainName) public view returns (uint32) {
        return chainEIDs[chainName];
    }
    
    /**
     * @dev Withdraw native tokens (for fee management)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner).transfer(balance);
        }
    }
    
    /**
     * @dev Receive ETH for cross-chain fees
     */
    receive() external payable {}
    
    /**
     * @dev Update supply for a specific chain
     * Called by bonding curve contracts when tokens are bought/sold
     * NOW INCLUDES CROSS-CHAIN SYNC via LayerZero
     */
    function updateSupply(
        address tokenId,
        string memory chain,
        uint256 newSupply
    ) external payable onlyAuthorized {
        uint256 oldChainSupply = chainSupply[tokenId][chain];
        
        // Update chain-specific supply
        chainSupply[tokenId][chain] = newSupply;
        
        // Update global supply
        globalSupply[tokenId] = globalSupply[tokenId] - oldChainSupply + newSupply;
        
        emit SupplyUpdated(tokenId, chain, newSupply, globalSupply[tokenId]);
        
        // NEW: Send cross-chain sync message if enabled
        if (crossChainEnabled && address(crossChainSync) != address(0)) {
            _syncCrossChain(tokenId, chain, newSupply);
        }
    }
    
    /**
     * @dev Internal function to sync supply across chains via LayerZero
     */
    function _syncCrossChain(
        address tokenId,
        string memory chain,
        uint256 newSupply
    ) internal {
        // Get source EID (current chain)
        uint32 sourceEID = currentChainEID;
        
        // If currentChainEID is not set, try to get from chain name
        if (sourceEID == 0) {
            sourceEID = getChainEID(chain);
        }
        
        // Skip if source EID is still 0 (chain not configured)
        if (sourceEID == 0) {
            emit CrossChainSyncFailed(tokenId, chain, newSupply, "Source EID not configured");
            return;
        }
        
        // Calculate available funds for cross-chain fees
        // Use msg.value if provided, otherwise use contract balance (if sufficient)
        uint256 availableFee = msg.value;
        
        // If no fee provided but we have reserve, use reserve (up to minFeeReserve)
        if (availableFee == 0 && address(this).balance >= minFeeReserve) {
            availableFee = minFeeReserve;
        }
        
        // If we have funds, try to send cross-chain message
        if (availableFee > 0) {
            try crossChainSync.syncSupplyUpdate{value: availableFee}(
                tokenId,
                newSupply,
                sourceEID
            ) {
                // Success - cross-chain message sent
                // The CrossChainSync contract will handle LayerZero messaging
            } catch Error(string memory reason) {
                // Failed - log but don't revert (best effort)
                emit CrossChainSyncFailed(tokenId, chain, newSupply, reason);
            } catch {
                // Failed with unknown error - log but don't revert
                emit CrossChainSyncFailed(tokenId, chain, newSupply, "Unknown error");
            }
        } else {
            // No funds available for cross-chain messaging
            emit CrossChainSyncFailed(tokenId, chain, newSupply, "Insufficient fees");
        }
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





