# Virtual Liquidity & Cross-Chain Price Synchronization

## Overview

Crossify.io uses **virtual liquidity** (similar to pump.fun) combined with **cross-chain supply synchronization** to maintain consistent token prices across all blockchains.

## How Pump.fun Works

Pump.fun uses a **bonding curve** with virtual liquidity:

1. **Virtual Liquidity Pool**: No real tokens/ETH in a DEX pool initially
2. **Bonding Curve Pricing**: Price = `basePrice + (slope * supplySold)`
3. **Algorithmic Price**: Price is calculated mathematically, not from DEX reserves
4. **Graduation**: When market cap hits threshold, liquidity migrates to Raydium/Uniswap

## Cross-Chain Virtual Liquidity

For **unified shared liquidity** across chains, we need:

### 1. Global Supply Tracking

Each chain's bonding curve must track the **global supply sold** across ALL chains:

```
Global Supply = Sum of (supplySold on Chain A + supplySold on Chain B + ...)
```

### 2. Synchronized Price Calculation

All chains use the **same formula** with **global supply**:

```solidity
// On Ethereum, BSC, Base, Solana
function getCurrentPrice() public view returns (uint256) {
    uint256 globalSupply = getGlobalSupplySold(); // Query from master contract
    return basePrice + (slope * globalSupply);
}
```

### 3. Master Contract (Recommended)

A central contract that tracks global supply:

```solidity
contract GlobalSupplyTracker {
    mapping(address => uint256) public chainSupplies; // tokenId => totalSupply
    mapping(address => mapping(string => uint256)) public chainContributions; // tokenId => chain => supply
    
    function updateSupply(address tokenId, string memory chain, uint256 newSupply) external {
        // Only callable by authorized bonding curves
        uint256 oldChainSupply = chainContributions[tokenId][chain];
        chainContributions[tokenId][chain] = newSupply;
        chainSupplies[tokenId] = chainSupplies[tokenId] - oldChainSupply + newSupply;
    }
    
    function getGlobalSupply(address tokenId) external view returns (uint256) {
        return chainSupplies[tokenId];
    }
}
```

### 4. Cross-Chain Communication

**Option A: Oracle-Based (Simpler)**
- Each chain queries a price oracle (Chainlink, Pyth)
- Oracle aggregates supply from all chains
- All chains use oracle price

**Option B: Bridge-Based (More Complex)**
- Use Wormhole/Synapse to sync supply updates
- When supply changes on Chain A, send message to all chains
- Each chain updates its local cache

**Option C: Centralized Backend (Current Implementation)**
- Backend tracks all transactions
- Calculates global supply
- Provides API endpoint for each chain's bonding curve
- Each chain queries backend for current global supply

## Implementation Strategy

### Phase 1: Backend Tracking (Current)

```typescript
// backend/src/services/unifiedLiquidity.ts

// Track global supply across all chains
async function updateGlobalSupply(tokenId: string, chain: string, supplySold: bigint) {
  // Update database
  await dbRun(`
    UPDATE shared_liquidity_pools 
    SET balance = CAST(balance AS REAL) + ?,
        global_supply = (SELECT SUM(balance) FROM shared_liquidity_pools WHERE token_id = ?)
    WHERE token_id = ? AND chain = ?
  `, [supplySold.toString(), tokenId, tokenId, chain]);
}

// Get global supply for price calculation
async function getGlobalSupply(tokenId: string): Promise<bigint> {
  const result = await dbGet(`
    SELECT SUM(balance) as total FROM shared_liquidity_pools WHERE token_id = ?
  `, [tokenId]);
  return BigInt(result.total || 0);
}
```

### Phase 2: Smart Contract Integration

Modify BondingCurve to query global supply:

```solidity
interface IGlobalSupplyOracle {
    function getGlobalSupply(address tokenId) external view returns (uint256);
}

contract BondingCurve {
    IGlobalSupplyOracle public oracle;
    
    function getCurrentPrice() public view returns (uint256) {
        uint256 globalSupply = oracle.getGlobalSupply(tokenAddress);
        return basePrice + (slope * globalSupply);
    }
    
    function buy(uint256 tokenAmount) external payable {
        // ... existing logic ...
        
        // Update global supply via oracle
        oracle.updateSupply(tokenAddress, "ethereum", totalSupplySold);
        
        // ... rest of buy logic ...
    }
}
```

### Phase 3: Cross-Chain Bridge

For true decentralization:
- Use Wormhole/Synapse to send supply updates
- Each chain listens for updates
- Maintains local cache of global supply

## Benefits

✅ **Price Consistency**: Same price on all chains (within 0.1% variance)  
✅ **No Arbitrage**: No profit from price differences  
✅ **Virtual Liquidity**: Efficient capital usage  
✅ **Better UX**: Users get fair price regardless of chain  

## Example Flow

1. **User buys 1000 tokens on Ethereum**
   - Ethereum bonding curve: `totalSupplySold += 1000`
   - Backend updates: `globalSupply += 1000`
   - Price on ALL chains increases

2. **User buys 500 tokens on BSC**
   - BSC bonding curve queries global supply (now 1000)
   - Calculates price: `basePrice + slope * 1000`
   - After purchase: `globalSupply += 500` (now 1500)
   - Price on ALL chains increases again

3. **Result**: Prices stay synchronized across all chains!

## Current Implementation

Right now, we:
- ✅ Track supply on each chain
- ✅ Calculate prices independently
- ✅ Monitor price variance
- ⚠️ Need to implement global supply tracking
- ⚠️ Need to modify bonding curves to use global supply

## Next Steps

1. Add global supply tracking to database
2. Create API endpoint for global supply
3. Modify BondingCurve contracts to query global supply
4. Implement cross-chain messaging (Wormhole/Synapse)
5. Add real-time price synchronization





