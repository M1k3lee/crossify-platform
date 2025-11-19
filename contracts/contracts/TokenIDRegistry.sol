// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TokenIDRegistry
 * @dev Maps token addresses to token IDs (bytes32) for cross-chain price synchronization
 * This allows the same logical token across different chains to share the same global supply
 */
contract TokenIDRegistry {
    address public owner;
    
    // tokenAddress => tokenId (bytes32 hash of database UUID)
    mapping(address => bytes32) public tokenIdByAddress;
    
    // tokenId => tokenAddress (for reverse lookup, stores first registered address)
    mapping(bytes32 => address) public primaryAddressByTokenId;
    
    // tokenId => chain => tokenAddress (allows multiple addresses per token ID per chain)
    mapping(bytes32 => mapping(string => address)) public addressByTokenIdAndChain;
    
    // Events
    event TokenIDRegistered(
        bytes32 indexed tokenId,
        address indexed tokenAddress,
        string chain
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Register a token address with a token ID
     * @param tokenAddress The token contract address on this chain
     * @param tokenId The bytes32 token ID (hash of database UUID)
     * @param chain The chain name (e.g., "sepolia", "bsc-testnet", "base-sepolia")
     */
    function registerToken(
        address tokenAddress,
        bytes32 tokenId,
        string memory chain
    ) public onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(tokenId != bytes32(0), "Invalid token ID");
        
        // If this is the first registration for this token ID, set as primary
        if (primaryAddressByTokenId[tokenId] == address(0)) {
            primaryAddressByTokenId[tokenId] = tokenAddress;
        }
        
        // Register the mapping
        tokenIdByAddress[tokenAddress] = tokenId;
        addressByTokenIdAndChain[tokenId][chain] = tokenAddress;
        
        emit TokenIDRegistered(tokenId, tokenAddress, chain);
    }
    
    /**
     * @dev Batch register multiple token addresses
     */
    function batchRegisterTokens(
        address[] memory tokenAddresses,
        bytes32[] memory tokenIds,
        string[] memory chains
    ) external onlyOwner {
        require(
            tokenAddresses.length == tokenIds.length && 
            tokenIds.length == chains.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            registerToken(tokenAddresses[i], tokenIds[i], chains[i]);
        }
    }
    
    /**
     * @dev Get token ID for a token address
     */
    function getTokenId(address tokenAddress) external view returns (bytes32) {
        return tokenIdByAddress[tokenAddress];
    }
    
    /**
     * @dev Get token address for a token ID on a specific chain
     */
    function getTokenAddress(bytes32 tokenId, string memory chain) external view returns (address) {
        return addressByTokenIdAndChain[tokenId][chain];
    }
    
    /**
     * @dev Check if a token address is registered
     */
    function isRegistered(address tokenAddress) external view returns (bool) {
        return tokenIdByAddress[tokenAddress] != bytes32(0);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}

