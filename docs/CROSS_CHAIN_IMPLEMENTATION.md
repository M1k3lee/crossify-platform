# Cross-Chain Liquidity Implementation Guide

## Architecture Overview

We'll implement a hybrid approach using:
1. **LayerZero** for real-time cross-chain messaging
2. **Supra Oracles** for price verification and security
3. **Smart Contracts** for on-chain logic

## Step 1: LayerZero Integration

### Install Dependencies

```bash
npm install @layerzerolabs/lz-evm-protocol-v2 @layerzerolabs/toolbox-hardhat
```

### Update GlobalSupplyTracker Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/lzApp/LzApp.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GlobalSupplyTracker
 * @dev Cross-chain supply tracker with LayerZero messaging
 */
contract GlobalSupplyTracker is LzApp, Ownable {
    // tokenId => global supply sold across all chains
    mapping(address => uint256) public globalSupply;
    
    // tokenId => chainId => supply on that chain
    mapping(address => mapping(uint16 => uint256)) public chainSupply;
    
    // Authorized bonding curves that can update supply
    mapping(address => bool) public authorizedUpdaters;
    
    // LayerZero chain IDs
    mapping(string => uint16) public chainIds;
    
    event SupplyUpdated(
        address indexed tokenId,
        uint16 indexed chainId,
        uint256 newSupply,
        uint256 globalSupply
    );
    
    event CrossChainUpdate(
        address indexed tokenId,
        uint16 indexed fromChain,
        uint16 indexed toChain,
        uint256 supply
    );
    
    constructor(address _lzEndpoint) LzApp(_lzEndpoint) Ownable(msg.sender) {
        // Initialize chain IDs
        chainIds["ethereum"] = 101; // LayerZero chain ID
        chainIds["bsc"] = 102;
        chainIds["base"] = 184;
        // Add more chains as needed
    }
    
    function authorizeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }
    
    /**
     * @dev Update supply locally and broadcast to other chains
     */
    function updateSupply(
        address tokenId,
        string memory chain,
        uint256 newSupply
    ) external {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        
        uint16 chainId = chainIds[chain];
        require(chainId != 0, "Invalid chain");
        
        uint256 oldChainSupply = chainSupply[tokenId][chainId];
        
        // Update local supply
        globalSupply[tokenId] = globalSupply[tokenId] - oldChainSupply + newSupply;
        chainSupply[tokenId][chainId] = newSupply;
        
        emit SupplyUpdated(tokenId, chainId, newSupply, globalSupply[tokenId]);
        
        // Broadcast to other chains via LayerZero
        _broadcastSupplyUpdate(tokenId, chainId, newSupply);
    }
    
    /**
     * @dev Broadcast supply update to all chains
     */
    function _broadcastSupplyUpdate(
        address tokenId,
        uint16 fromChainId,
        uint256 newSupply
    ) internal {
        // Get all chain IDs (excluding current chain)
        uint16[] memory targetChains = _getTargetChains(fromChainId);
        
        bytes memory payload = abi.encode(tokenId, fromChainId, newSupply);
        
        for (uint i = 0; i < targetChains.length; i++) {
            _lzSend(
                targetChains[i],
                payload,
                payable(msg.sender),
                address(0),
                bytes(""),
                msg.value / targetChains.length // Split gas across chains
            );
        }
    }
    
    /**
     * @dev Receive cross-chain message from LayerZero
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        (address tokenId, uint16 fromChainId, uint256 newSupply) = abi.decode(
            _payload,
            (address, uint16, uint256)
        );
        
        // Update supply from remote chain
        uint256 oldChainSupply = chainSupply[tokenId][fromChainId];
        globalSupply[tokenId] = globalSupply[tokenId] - oldChainSupply + newSupply;
        chainSupply[tokenId][fromChainId] = newSupply;
        
        emit CrossChainUpdate(tokenId, fromChainId, _srcChainId, newSupply);
        emit SupplyUpdated(tokenId, fromChainId, newSupply, globalSupply[tokenId]);
    }
    
    function _getTargetChains(uint16 excludeChainId) internal pure returns (uint16[] memory) {
        // Return all chain IDs except the excluded one
        // In production, this would be configurable
        uint16[] memory chains = new uint16[](3);
        if (excludeChainId != 101) chains[0] = 101; // Ethereum
        if (excludeChainId != 102) chains[1] = 102; // BSC
        if (excludeChainId != 184) chains[2] = 184; // Base
        return chains;
    }
    
    function getGlobalSupply(address tokenId) external view returns (uint256) {
        return globalSupply[tokenId];
    }
}
```

## Step 2: Supra Oracle Integration

### Oracle Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @dev Oracle for price verification and reconciliation
 */
contract PriceOracle is Ownable {
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool verified;
    }
    
    // tokenId => chainId => price data
    mapping(address => mapping(uint16 => PriceData)) public prices;
    
    // Authorized oracle nodes
    mapping(address => bool) public authorizedOracles;
    
    // Minimum required oracle confirmations
    uint256 public constant MIN_CONFIRMATIONS = 2;
    
    // Price discrepancy threshold (0.5%)
    uint256 public constant DISCREPANCY_THRESHOLD = 5; // 0.5% = 5 basis points
    
    event PriceUpdated(
        address indexed tokenId,
        uint16 indexed chainId,
        uint256 price,
        address indexed oracle
    );
    
    event DiscrepancyDetected(
        address indexed tokenId,
        uint16 indexed chainId1,
        uint16 indexed chainId2,
        uint256 price1,
        uint256 price2
    );
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    function authorizeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = true;
    }
    
    /**
     * @dev Update price from oracle
     */
    function updatePrice(
        address tokenId,
        uint16 chainId,
        uint256 price
    ) external {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        
        prices[tokenId][chainId] = PriceData({
            price: price,
            timestamp: block.timestamp,
            verified: true
        });
        
        emit PriceUpdated(tokenId, chainId, price, msg.sender);
        
        // Check for discrepancies across chains
        _checkDiscrepancies(tokenId, chainId, price);
    }
    
    /**
     * @dev Check for price discrepancies across chains
     */
    function _checkDiscrepancies(
        address tokenId,
        uint16 updatedChainId,
        uint256 updatedPrice
    ) internal {
        // Compare with prices on other chains
        uint16[] memory allChains = _getAllChains();
        
        for (uint i = 0; i < allChains.length; i++) {
            if (allChains[i] == updatedChainId) continue;
            
            PriceData memory otherPrice = prices[tokenId][allChains[i]];
            if (!otherPrice.verified || block.timestamp - otherPrice.timestamp > 10 minutes) {
                continue; // Skip stale or unverified prices
            }
            
            // Calculate discrepancy
            uint256 discrepancy = _calculateDiscrepancy(updatedPrice, otherPrice.price);
            
            if (discrepancy > DISCREPANCY_THRESHOLD) {
                emit DiscrepancyDetected(
                    tokenId,
                    updatedChainId,
                    allChains[i],
                    updatedPrice,
                    otherPrice.price
                );
                
                // Trigger reconciliation (could call GlobalSupplyTracker)
            }
        }
    }
    
    function _calculateDiscrepancy(uint256 price1, uint256 price2) internal pure returns (uint256) {
        if (price1 == 0 || price2 == 0) return 10000; // 100% if either is zero
        
        uint256 diff = price1 > price2 ? price1 - price2 : price2 - price1;
        uint256 avg = (price1 + price2) / 2;
        
        // Return basis points (0.01% increments)
        return (diff * 10000) / avg;
    }
    
    function _getAllChains() internal pure returns (uint16[] memory) {
        uint16[] memory chains = new uint16[](3);
        chains[0] = 101; // Ethereum
        chains[1] = 102; // BSC
        chains[2] = 184; // Base
        return chains;
    }
    
    function getPrice(address tokenId, uint16 chainId) external view returns (uint256) {
        return prices[tokenId][chainId].price;
    }
    
    function isPriceStale(address tokenId, uint16 chainId) external view returns (bool) {
        PriceData memory priceData = prices[tokenId][chainId];
        return block.timestamp - priceData.timestamp > 10 minutes;
    }
}
```

## Step 3: Update BondingCurve to Use Cross-Chain Supply

```solidity
// Update BondingCurve.sol to prioritize cross-chain supply

function getCurrentPrice() public view returns (uint256) {
    uint256 supply = totalSupplySold;
    
    // Priority 1: Use global supply from tracker (cross-chain)
    if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
        try globalSupplyTracker.getGlobalSupply(address(token)) returns (uint256 globalSupply) {
            supply = globalSupply;
        } catch {
            // Fallback to local supply if cross-chain fails
            supply = totalSupplySold;
        }
    }
    
    return basePrice + (slope * supply);
}

function buy(uint256 tokenAmount) external payable nonReentrant {
    // ... existing buy logic ...
    
    totalSupplySold += tokenAmount;
    
    // Update global supply (will trigger cross-chain broadcast)
    if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
        try globalSupplyTracker.updateSupply(
            address(token),
            chainName,
            totalSupplySold
        ) {
            // Supply updated and broadcasted
        } catch {
            // Log error but continue (graceful degradation)
            emit SupplyUpdateFailed(address(token), chainName, totalSupplySold);
        }
    }
    
    // ... rest of buy logic ...
}
```

## Step 4: Backend Service for Oracle Updates

```typescript
// backend/src/services/oracleService.ts

import axios from 'axios';
import { ethers } from 'ethers';

interface ChainConfig {
  name: string;
  rpcUrl: string;
  contractAddress: string;
  chainId: number;
}

export class OracleService {
  private chains: ChainConfig[];
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    this.chains = [
      { name: 'ethereum', rpcUrl: process.env.ETH_RPC_URL!, contractAddress: process.env.ETH_ORACLE!, chainId: 101 },
      { name: 'bsc', rpcUrl: process.env.BSC_RPC_URL!, contractAddress: process.env.BSC_ORACLE!, chainId: 102 },
      { name: 'base', rpcUrl: process.env.BASE_RPC_URL!, contractAddress: process.env.BASE_ORACLE!, chainId: 184 },
    ];
  }
  
  async startPriceVerification() {
    setInterval(async () => {
      await this.verifyAndUpdatePrices();
    }, this.updateInterval);
  }
  
  async verifyAndUpdatePrices() {
    // Get all tokens from database
    const tokens = await this.getAllTokens();
    
    for (const token of tokens) {
      const prices: Record<string, number> = {};
      
      // Fetch prices from all chains
      for (const chain of this.chains) {
        try {
          const price = await this.getTokenPrice(token.id, chain);
          prices[chain.name] = price;
        } catch (error) {
          console.error(`Failed to get price from ${chain.name}:`, error);
        }
      }
      
      // Check for discrepancies
      const discrepancy = this.checkDiscrepancy(prices);
      
      if (discrepancy > 0.5) { // 0.5% threshold
        console.warn(`Price discrepancy detected for token ${token.id}:`, discrepancy);
        // Trigger reconciliation
        await this.reconcilePrices(token.id, prices);
      }
    }
  }
  
  private async getTokenPrice(tokenId: string, chain: ChainConfig): Promise<number> {
    // Connect to bonding curve contract
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    // ... fetch price from contract
    return 0; // Placeholder
  }
  
  private checkDiscrepancy(prices: Record<string, number>): number {
    const values = Object.values(prices);
    if (values.length < 2) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxDiff = Math.max(...values.map(v => Math.abs(v - avg) / avg * 100));
    
    return maxDiff;
  }
  
  private async reconcilePrices(tokenId: string, prices: Record<string, number>) {
    // Update oracle contracts with verified prices
    // This would trigger reconciliation in GlobalSupplyTracker
  }
  
  private async getAllTokens(): Promise<any[]> {
    // Fetch from database
    return [];
  }
}
```

## Step 5: Cost Optimization

### Batch Updates
- Group multiple supply updates into single cross-chain message
- Reduce LayerZero fees by batching
- Update every 10-30 seconds instead of per transaction

### Caching
- Cache global supply reads
- Update cache on cross-chain messages
- Reduce on-chain reads

### Gas Optimization
- Use EIP-1559 transactions
- Optimize contract storage
- Use events for off-chain indexing

## Security Measures

1. **Message Authentication**: LayerZero provides built-in auth
2. **Oracle Consensus**: Require multiple oracle confirmations
3. **Rate Limiting**: Prevent spam updates
4. **Circuit Breakers**: Pause if discrepancies too large
5. **Audits**: Get security audits for all contracts

## Deployment Steps

1. Deploy LayerZero endpoint contracts
2. Deploy updated GlobalSupplyTracker with LayerZero
3. Deploy PriceOracle contract
4. Authorize bonding curves and oracles
5. Deploy backend oracle service
6. Test cross-chain updates
7. Monitor and optimize

## Monitoring

- Track cross-chain message success rate
- Monitor price discrepancies
- Alert on failures
- Dashboard for real-time status




