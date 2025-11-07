// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UnifiedLiquidityPool
 * @dev Maintains unified liquidity across multiple chains for price consistency
 * This contract acts as a bridge/arbitrage mechanism to keep token prices synchronized
 */
contract UnifiedLiquidityPool is Ownable, ReentrancyGuard {
    IERC20 public token;
    address public tokenFactory; // Factory that created the token
    
    // Chain ID to pool info mapping
    struct ChainPool {
        address poolAddress; // DEX pool address on this chain
        uint256 balance; // Token balance in this pool
        uint256 reserve; // Native token (ETH/BNB) reserve
        uint256 lastSync; // Last sync timestamp
        bool isActive;
    }
    
    mapping(uint256 => ChainPool) public chainPools; // chainId => ChainPool
    uint256[] public supportedChains;
    
    // Price synchronization parameters
    uint256 public priceDeviationThreshold = 100; // 1% (in basis points)
    uint256 public syncCooldown = 300; // 5 minutes
    
    event ChainPoolAdded(uint256 indexed chainId, address indexed poolAddress);
    event ChainPoolUpdated(uint256 indexed chainId, uint256 balance, uint256 reserve);
    event PriceSync(uint256 indexed fromChain, uint256 indexed toChain, uint256 amount);
    event ArbitrageExecuted(uint256 indexed chainId, uint256 profit);
    
    constructor(address _token, address _tokenFactory, address _owner) Ownable(_owner) {
        token = IERC20(_token);
        tokenFactory = _tokenFactory;
    }
    
    /**
     * @dev Add or update a chain pool
     * @param chainId Chain ID (e.g., 1 for Ethereum, 56 for BSC, 8453 for Base)
     * @param poolAddress DEX pool address on that chain
     */
    function addChainPool(uint256 chainId, address poolAddress) external onlyOwner {
        require(poolAddress != address(0), "Invalid pool address");
        
        if (!chainPools[chainId].isActive) {
            supportedChains.push(chainId);
        }
        
        chainPools[chainId] = ChainPool({
            poolAddress: poolAddress,
            balance: 0,
            reserve: 0,
            lastSync: 0,
            isActive: true
        });
        
        emit ChainPoolAdded(chainId, poolAddress);
    }
    
    /**
     * @dev Update pool balance/reserve from off-chain price sync service
     * Only callable by owner (price sync service)
     */
    function updateChainPool(
        uint256 chainId,
        uint256 balance,
        uint256 reserve
    ) external onlyOwner {
        require(chainPools[chainId].isActive, "Chain pool not active");
        
        chainPools[chainId].balance = balance;
        chainPools[chainId].reserve = reserve;
        chainPools[chainId].lastSync = block.timestamp;
        
        emit ChainPoolUpdated(chainId, balance, reserve);
    }
    
    /**
     * @dev Calculate current price for a chain (in wei per token)
     * Price = reserve / balance
     */
    function getChainPrice(uint256 chainId) public view returns (uint256) {
        ChainPool memory pool = chainPools[chainId];
        if (!pool.isActive || pool.balance == 0) return 0;
        return (pool.reserve * 1e18) / pool.balance;
    }
    
    /**
     * @dev Get price deviation between chains (in basis points)
     * Returns the maximum deviation from the average price
     */
    function getPriceDeviation() public view returns (uint256 maxDeviation, uint256 avgPrice) {
        if (supportedChains.length < 2) return (0, 0);
        
        uint256 totalPrice = 0;
        uint256 activeChains = 0;
        
        // Calculate average price
        for (uint256 i = 0; i < supportedChains.length; i++) {
            uint256 chainId = supportedChains[i];
            if (chainPools[chainId].isActive && chainPools[chainId].balance > 0) {
                totalPrice += getChainPrice(chainId);
                activeChains++;
            }
        }
        
        if (activeChains == 0) return (0, 0);
        avgPrice = totalPrice / activeChains;
        
        // Find maximum deviation
        for (uint256 i = 0; i < supportedChains.length; i++) {
            uint256 chainId = supportedChains[i];
            if (chainPools[chainId].isActive && chainPools[chainId].balance > 0) {
                uint256 price = getChainPrice(chainId);
                uint256 deviation;
                
                if (price > avgPrice) {
                    deviation = ((price - avgPrice) * 10000) / avgPrice;
                } else {
                    deviation = ((avgPrice - price) * 10000) / avgPrice;
                }
                
                if (deviation > maxDeviation) {
                    maxDeviation = deviation;
                }
            }
        }
    }
    
    /**
     * @dev Check if price sync is needed
     * Returns true if price deviation exceeds threshold
     */
    function needsPriceSync() external view returns (bool) {
        (uint256 maxDeviation, ) = getPriceDeviation();
        return maxDeviation > priceDeviationThreshold;
    }
    
    /**
     * @dev Set price deviation threshold (in basis points)
     */
    function setPriceDeviationThreshold(uint256 threshold) external onlyOwner {
        require(threshold > 0 && threshold <= 1000, "Invalid threshold (0-10%)");
        priceDeviationThreshold = threshold;
    }
    
    /**
     * @dev Set sync cooldown (in seconds)
     */
    function setSyncCooldown(uint256 cooldown) external onlyOwner {
        syncCooldown = cooldown;
    }
    
    /**
     * @dev Get all supported chain IDs
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }
    
    /**
     * @dev Get chain pool info
     */
    function getChainPoolInfo(uint256 chainId) external view returns (
        address poolAddress,
        uint256 balance,
        uint256 reserve,
        uint256 lastSync,
        bool isActive,
        uint256 price
    ) {
        ChainPool memory pool = chainPools[chainId];
        return (
            pool.poolAddress,
            pool.balance,
            pool.reserve,
            pool.lastSync,
            pool.isActive,
            getChainPrice(chainId)
        );
    }
}





