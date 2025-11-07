# DEX Integration & Cross-Chain Sync Guide

## Overview

When tokens are deployed through Crossify.io, they have **built-in cross-chain synchronization** that works automatically, even when users trade on DEXes directly (Uniswap, PancakeSwap, etc.).

## How It Works

### 1. Token Deployment

When you create a token:
1. **CrossChainToken** contract is deployed (instead of standard ERC20)
2. Token has built-in LayerZero integration
3. Token is authorized in **CrossChainSync** contract
4. DEX pairs can be automatically detected or manually added

### 2. DEX Trade Detection

When someone trades on Uniswap/PancakeSwap:

```
User swaps ETH → TOKEN on Uniswap:
1. Uniswap pair transfers TOKEN to user
2. Token contract detects transfer to/from DEX pair
3. Automatically triggers cross-chain sync
4. Supply update sent to all chains via LayerZero
5. Price increases on ALL chains (ETH, BSC, Base, Solana)
```

### 3. Fee Collection

**Built into the token contract:**
- Small fee (0.5-1%) on DEX trades
- Fee stored in token contract
- Used to pay for LayerZero messages
- Transparent and fair

## Fee Structure

### For Users

**Buying on DEX:**
- DEX Fee: 0.3% (Uniswap/PancakeSwap standard)
- Cross-Chain Sync Fee: 0.5% (pays for synchronization)
- **Total**: ~0.8% (very competitive)

**Buying on Bonding Curve:**
- Bonding Curve Fee: 2% (buy) / 3% (sell)
- Cross-Chain Sync: Included (no extra fee)
- **Total**: 2-3% (standard for bonding curves)

### Fee Breakdown

```
Cross-Chain Sync Fee (0.5%):
├── LayerZero Message: $0.01-0.05
├── Oracle Verification: Free (batched)
└── Gas Costs: Minimal

User pays: 0.5% of trade value
Platform cost: $0.01-0.05
Profit margin: >99% on fees
```

## Implementation Flow

### Step 1: Token Creation

```solidity
// In TokenFactory
CrossChainToken token = new CrossChainToken(
    name,
    symbol,
    supply,
    owner,
    uri,
    lzEndpoint,      // LayerZero endpoint
    chainId,          // Chain ID (101 = Ethereum, 102 = BSC, etc.)
    crossChainSync,   // CrossChainSync contract
    priceOracle       // Price oracle
);

// Authorize token
CrossChainSync(crossChainSync).authorizeToken(address(token));
```

### Step 2: DEX Pair Detection

**Automatic (Recommended):**
```solidity
// Token automatically detects Uniswap pair when created
token.autoDetectDEXPair("ethereum"); // Detects Uniswap V2 pair
```

**Manual (If needed):**
```solidity
// Manually add DEX pair
token.addDEXPair(uniswapPairAddress);
```

### Step 3: Trade Detection

```solidity
// In CrossChainToken._update()
function _update(address from, address to, uint256 value) internal override {
    super._update(from, to, value);
    
    // Detect DEX trade
    if (isDEXPair[from] || isDEXPair[to]) {
        // Trigger cross-chain sync
        _syncCrossChainSupply();
    }
}
```

### Step 4: Cross-Chain Sync

```solidity
// Sync supply to all chains
crossChainSync.syncSupplyUpdate{value: fee}(
    address(this),
    circulatingSupply,
    chainId
);

// LayerZero broadcasts to all chains
// All chains update their supply tracking
// Prices stay synchronized
```

## Example Scenarios

### Scenario 1: User buys on Uniswap (Ethereum)

```
1. User swaps 1 ETH for TOKEN on Uniswap
2. Uniswap pair address: 0x1234...
3. Token transfer: pair → user
4. Token detects: isDEXPair[pair] = true
5. Calculates fee: 0.5% of trade = 0.005 ETH
6. Syncs supply to all chains: ETH, BSC, Base, Solana
7. Price increases everywhere
8. User on BSC sees price increase immediately
```

### Scenario 2: User buys on PancakeSwap (BSC)

```
1. User swaps 1 BNB for TOKEN on PancakeSwap
2. PancakeSwap pair detected automatically
3. Token syncs supply to all chains
4. Price increases on Ethereum, Base, Solana
5. All users see consistent pricing
```

### Scenario 3: User buys on our Bonding Curve

```
1. User buys from bonding curve
2. Bonding curve calls token.syncCrossChainSupply()
3. No extra fee (included in bonding curve fee)
4. Supply syncs to all chains
5. Works seamlessly with DEX trades
```

## Security Features

### 1. DEX Pair Verification

```solidity
// Verify pair is legitimate
function verifyAndAddDEXPair(address pair, string memory chain) {
    require(DEXDetector.verifyDEXPair(pair, token, chain), "Invalid pair");
    addDEXPair(pair);
}
```

### 2. Fee Protection

- Fees are transparent
- Collected in token contract
- Used only for cross-chain operations
- Owner can withdraw excess (with limits)

### 3. Rate Limiting

- Prevent spam syncs
- Minimum time between syncs
- Gas limit protection

### 4. Fallback Mechanisms

- If LayerZero fails: Continue with local pricing
- Oracle verifies later
- Manual reconciliation if needed

## Cost Analysis

### Per Trade Costs

| Trade Size | User Fee (0.5%) | LayerZero Cost | Platform Profit |
|------------|----------------|----------------|-----------------|
| $100 | $0.50 | $0.05 | $0.45 |
| $1,000 | $5.00 | $0.05 | $4.95 |
| $10,000 | $50.00 | $0.05 | $49.95 |

### Monthly Projections

**1,000 trades/day at $100 average:**
- Revenue: 1,000 × $0.50 = $500/day = $15,000/month
- Cost: 1,000 × $0.05 = $50/day = $1,500/month
- **Profit: $13,500/month**

**10,000 trades/day at $500 average:**
- Revenue: 10,000 × $2.50 = $25,000/day = $750,000/month
- Cost: 10,000 × $0.05 = $500/day = $15,000/month
- **Profit: $735,000/month**

## Benefits

### For Token Creators
✅ **True cross-chain token**: Works independently
✅ **Automatic sync**: No manual intervention needed
✅ **DEX compatible**: Works with any DEX
✅ **Increased liquidity**: Combined from all chains

### For Users
✅ **Fair pricing**: Same price everywhere
✅ **Low fees**: Competitive 0.5% sync fee
✅ **Transparent**: Clear fee structure
✅ **Fast sync**: ~30 seconds to all chains

### For Platform
✅ **Sustainable**: Users pay for sync
✅ **Scalable**: No ongoing platform costs
✅ **Profitable**: High margin revenue
✅ **Competitive**: Unique feature

## Next Steps

1. ✅ Deploy CrossChainSync contracts on all chains
2. ✅ Update TokenFactory to deploy CrossChainToken
3. ✅ Integrate DEX detection
4. ✅ Test with Uniswap/PancakeSwap
5. ✅ Deploy to testnets
6. ✅ Security audit
7. ✅ Mainnet deployment

## Technical Implementation

See:
- `contracts/contracts/CrossChainToken.sol` - Token contract
- `contracts/contracts/CrossChainSync.sol` - Sync contract
- `contracts/contracts/DEXDetector.sol` - DEX detection
- `docs/TOKEN_LEVEL_CROSS_CHAIN.md` - Full documentation




