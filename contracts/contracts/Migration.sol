// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BondingCurve.sol";

/**
 * @title Migration
 * @dev Handles migration from bonding curve to DEX (e.g., Uniswap V3)
 */
interface IUniswapV3Factory {
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool);
}

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;
}

interface IERC20Decimals {
    function decimals() external view returns (uint8);
}

contract Migration is Ownable {
    IUniswapV3Factory public uniswapV3Factory;
    address public weth;
    uint24 public constant POOL_FEE = 3000; // 0.3%
    
    event MigrationCompleted(
        address indexed token,
        address indexed bondingCurve,
        address indexed pool,
        uint256 liquidity
    );
    
    constructor(address _uniswapV3Factory, address _weth, address _owner) Ownable(_owner) {
        uniswapV3Factory = IUniswapV3Factory(_uniswapV3Factory);
        weth = _weth;
    }
    
    /**
     * @dev Migrate token from bonding curve to Uniswap V3
     */
    function migrateToUniswapV3(
        address token,
        BondingCurve bondingCurve
    ) external onlyOwner returns (address pool, uint256 liquidity) {
        require(address(bondingCurve) != address(0), "Invalid bonding curve");
        require(!bondingCurve.isGraduated(), "Already graduated");
        
        // Get final price from bonding curve
        uint256 finalPrice = bondingCurve.getCurrentPrice();
        
        // Create Uniswap V3 pool
        pool = uniswapV3Factory.createPool(token, weth, POOL_FEE);
        
        // Calculate liquidity amount
        uint256 reserveAmount = address(bondingCurve).balance;
        uint256 tokenAmount = bondingCurve.totalSupplySold();
        
        // Initialize pool with price
        // In production, calculate sqrtPriceX96 from finalPrice
        uint160 sqrtPriceX96 = _calculateSqrtPriceX96(finalPrice);
        
        // Approve tokens
        IERC20(token).approve(pool, tokenAmount);
        IERC20(weth).approve(pool, reserveAmount);
        
        // Graduate bonding curve
        bondingCurve.graduate(pool);
        
        emit MigrationCompleted(token, address(bondingCurve), pool, liquidity);
        
        return (pool, liquidity);
    }
    
    /**
     * @dev Calculate sqrtPriceX96 from price
     * Simplified - in production, use proper math library
     */
    function _calculateSqrtPriceX96(uint256 price) internal pure returns (uint160) {
        // This is a simplified calculation
        // In production, use proper fixed-point math
        uint256 sqrtPrice = _sqrt(price * (2**192));
        return uint160(sqrtPrice);
    }
    
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}








