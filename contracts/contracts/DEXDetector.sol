// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DEXDetector
 * @dev Utility contract to detect and register DEX pairs
 */
interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract DEXDetector {
    // Known DEX factories
    mapping(string => address) public dexFactories;
    mapping(string => address) public wrappedNativeTokens;
    
    constructor() {
        // Ethereum
        dexFactories["ethereum"] = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f; // Uniswap V2
        wrappedNativeTokens["ethereum"] = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH
        
        // BSC
        dexFactories["bsc"] = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73; // PancakeSwap V2
        wrappedNativeTokens["bsc"] = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c; // WBNB
        
        // Base
        dexFactories["base"] = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6; // BaseSwap
        wrappedNativeTokens["base"] = 0x4200000000000000000000000000000000000006; // WETH
    }
    
    /**
     * @dev Detect Uniswap V2 style DEX pair for a token
     */
    function detectUniswapV2Pair(
        address token,
        string memory chain
    ) external view returns (address pair) {
        address factory = dexFactories[chain];
        address weth = wrappedNativeTokens[chain];
        
        if (factory == address(0) || weth == address(0)) {
            return address(0);
        }
        
        try IUniswapV2Factory(factory).getPair(token, weth) returns (address detectedPair) {
            return detectedPair;
        } catch {
            return address(0);
        }
    }
    
    /**
     * @dev Verify if an address is a valid DEX pair
     */
    function verifyDEXPair(
        address pair,
        address token,
        string memory chain
    ) external view returns (bool) {
        address factory = dexFactories[chain];
        address weth = wrappedNativeTokens[chain];
        
        if (factory == address(0)) {
            return false;
        }
        
        // Check if pair exists in factory
        address expectedPair = IUniswapV2Factory(factory).getPair(token, weth);
        
        if (expectedPair != pair) {
            // Also check reverse order (some DEXes might have different ordering)
            expectedPair = IUniswapV2Factory(factory).getPair(weth, token);
        }
        
        return expectedPair == pair;
    }
    
    /**
     * @dev Get all known DEX factories
     */
    function getDEXFactory(string memory chain) external view returns (address) {
        return dexFactories[chain];
    }
    
    /**
     * @dev Get wrapped native token for chain
     */
    function getWrappedNativeToken(string memory chain) external view returns (address) {
        return wrappedNativeTokens[chain];
    }
}




