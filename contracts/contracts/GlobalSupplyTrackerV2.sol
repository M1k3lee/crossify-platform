// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenIDRegistry.sol";

/**
 * @title ICrossChainSync
 * @dev Interface for CrossChainSync contract
 */
interface ICrossChainSync {
    function syncSupplyUpdate(
        bytes32 tokenId,
        uint256 newSupply,
        uint32 sourceEID
    ) external payable;
    
    function estimateSyncFee(bytes32 tokenId, uint32 targetEID) external view returns (uint256 fee);
}

/**
 * @title GlobalSupplyTrackerV2
 * @dev Tracks global token supply across all chains using token IDs (bytes32)
 * This enables true cross-chain price synchronization for tokens with different addresses on each chain
 * 
 * Key improvements over V1:
 * - Uses bytes32 token IDs instead of token addresses
 * - Integrates with TokenIDRegistry to map addresses to IDs
 * - Supports both token ID and address-based lookups (backward compatible)
 */
contract GlobalSupplyTrackerV2 {
    address public owner;
    TokenIDRegistry public tokenIDRegistry;
    
    // tokenId (bytes32) => global supply sold across all chains
    mapping(bytes32 => uint256) public globalSupply;
    
    // tokenId => chain name => supply on that chain
    mapping(bytes32 => mapping(string => uint256)) public chainSupply;
    
    // Authorized bonding curves that can update supply
    mapping(address => bool) public authorizedUpdaters;
    
    // Cross-chain sync contract for LayerZero messaging
    ICrossChainSync public crossChainSync;
    bool public crossChainEnabled;
    
    // Chain name to LayerZero EID mapping
    mapping(string => uint32) public chainEIDs;
    
    // Current chain's EID (set in constructor)
    uint32 public currentChainEID;
    
    // Minimum fee reserve for cross-chain messages
    uint256 public minFeeReserve = 0.001 ether;
    
    // Backward compatibility: token address => global supply (deprecated, use token ID)
    mapping(address => uint256) public globalSupplyByAddress;
    
    // Events
    event SupplyUpdated(bytes32 indexed tokenId, string chain, uint256 newSupply, uint256 globalSupply);
    event SupplyUpdatedByAddress(address indexed tokenAddress, string chain, uint256 newSupply, uint256 globalSupply);
    event CrossChainSyncEnabled(address indexed crossChainSync);
    event CrossChainSyncDisabled();
    event CrossChainSyncFailed(bytes32 indexed tokenId, string chain, uint256 newSupply, string reason);
    event TokenIDRegistrySet(address indexed registry);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(uint32 _currentChainEID, address _tokenIDRegistry) {
        owner = msg.sender;
        currentChainEID = _currentChainEID;
        tokenIDRegistry = TokenIDRegistry(_tokenIDRegistry);
        
        // Initialize LayerZero EIDs for testnets
        chainEIDs["ethereum"] = 40161;
        chainEIDs["sepolia"] = 40161;
        chainEIDs["bsc"] = 40102;
        chainEIDs["bsc-testnet"] = 40102;
        chainEIDs["base"] = 40245;
        chainEIDs["base-sepolia"] = 40245;
    }
    
    /**
     * @dev Set the TokenIDRegistry contract
     */
    function setTokenIDRegistry(address _tokenIDRegistry) external onlyOwner {
        require(_tokenIDRegistry != address(0), "Invalid registry address");
        tokenIDRegistry = TokenIDRegistry(_tokenIDRegistry);
        emit TokenIDRegistrySet(_tokenIDRegistry);
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
     * @dev Update supply using token ID (recommended method)
     * @param tokenId The bytes32 token ID from TokenIDRegistry
     * @param chain The chain name (e.g., "sepolia", "bsc-testnet")
     * @param newSupply The new supply for this chain
     */
    function updateSupplyByTokenId(
        bytes32 tokenId,
        string memory chain,
        uint256 newSupply
    ) external payable onlyAuthorized {
        require(tokenId != bytes32(0), "Invalid token ID");
        
        uint256 oldChainSupply = chainSupply[tokenId][chain];
        
        // Update chain-specific supply
        chainSupply[tokenId][chain] = newSupply;
        
        // Update global supply (sum across all chains)
        globalSupply[tokenId] = globalSupply[tokenId] - oldChainSupply + newSupply;
        
        emit SupplyUpdated(tokenId, chain, newSupply, globalSupply[tokenId]);
        
        // Send cross-chain sync message if enabled
        if (crossChainEnabled && address(crossChainSync) != address(0)) {
            _syncCrossChain(tokenId, chain, newSupply);
        }
    }
    
    /**
     * @dev Update supply using token address (backward compatible, auto-looks up token ID)
     * @param tokenAddress The token contract address
     * @param chain The chain name
     * @param newSupply The new supply for this chain
     */
    function updateSupply(
        address tokenAddress,
        string memory chain,
        uint256 newSupply
    ) external payable onlyAuthorized {
        // Try to get token ID from registry
        bytes32 tokenId = tokenIDRegistry.getTokenId(tokenAddress);
        
        if (tokenId != bytes32(0)) {
            // Token is registered, use token ID-based tracking
            updateSupplyByTokenId(tokenId, chain, newSupply);
        } else {
            // Fallback to address-based tracking (backward compatibility)
            uint256 oldGlobalSupply = globalSupplyByAddress[tokenAddress];
            globalSupplyByAddress[tokenAddress] = newSupply;
            
            emit SupplyUpdatedByAddress(tokenAddress, chain, newSupply, newSupply);
        }
    }
    
    /**
     * @dev Internal function to sync supply across chains via LayerZero
     */
    function _syncCrossChain(
        bytes32 tokenId,
        string memory chain,
        uint256 newSupply
    ) internal {
        uint32 sourceEID = currentChainEID;
        
        if (sourceEID == 0) {
            sourceEID = getChainEID(chain);
        }
        
        if (sourceEID == 0) {
            emit CrossChainSyncFailed(tokenId, chain, newSupply, "Source EID not configured");
            return;
        }
        
        uint256 availableFee = msg.value;
        
        if (availableFee == 0 && address(this).balance >= minFeeReserve) {
            availableFee = minFeeReserve;
        }
        
        if (availableFee > 0) {
            try crossChainSync.syncSupplyUpdate{value: availableFee}(
                tokenId,
                newSupply,
                sourceEID
            ) {
                // Success - cross-chain message sent
            } catch Error(string memory reason) {
                emit CrossChainSyncFailed(tokenId, chain, newSupply, reason);
            } catch {
                emit CrossChainSyncFailed(tokenId, chain, newSupply, "Unknown error");
            }
        } else {
            emit CrossChainSyncFailed(tokenId, chain, newSupply, "Insufficient fees");
        }
    }
    
    /**
     * @dev Get global supply for a token ID
     */
    function getGlobalSupply(bytes32 tokenId) external view returns (uint256) {
        return globalSupply[tokenId];
    }
    
    /**
     * @dev Get global supply for a token address (looks up token ID first)
     */
    function getGlobalSupplyByAddress(address tokenAddress) external view returns (uint256) {
        bytes32 tokenId = tokenIDRegistry.getTokenId(tokenAddress);
        
        if (tokenId != bytes32(0)) {
            return globalSupply[tokenId];
        } else {
            // Fallback to address-based
            return globalSupplyByAddress[tokenAddress];
        }
    }
    
    /**
     * @dev Get supply for a specific chain and token ID
     */
    function getChainSupply(bytes32 tokenId, string memory chain) external view returns (uint256) {
        return chainSupply[tokenId][chain];
    }
    
    /**
     * @dev Get supply for a specific chain and token address
     */
    function getChainSupplyByAddress(address tokenAddress, string memory chain) external view returns (uint256) {
        bytes32 tokenId = tokenIDRegistry.getTokenId(tokenAddress);
        
        if (tokenId != bytes32(0)) {
            return chainSupply[tokenId][chain];
        } else {
            return 0;
        }
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
}

