# Single-Chain vs Cross-Chain Deployment

This document explains how users can choose between single-chain and cross-chain token deployment.

## Overview

Users can now choose to deploy their token:
1. **Single-Chain**: Standard token on one chain (no cross-chain features)
2. **Cross-Chain**: Token with automatic price synchronization across multiple chains

## User Experience

### Step 1: Select Chains

In the Builder UI (Step 4: Chains), users select which chains they want to deploy on:
- Ethereum
- BSC
- Base
- Solana

### Step 2: Cross-Chain Toggle

After selecting chains, a **Cross-Chain Price Sync** toggle appears:

- **If 1 chain selected**: Toggle is disabled (grayed out) with explanation that cross-chain requires 2+ chains
- **If 2+ chains selected**: Toggle is enabled and user can choose:
  - **OFF**: Each chain operates independently (standard tokens)
  - **ON**: Prices sync automatically across all chains (cross-chain tokens)

### Visual Indicators

**Single Chain (1 selected):**
- ❌ Cross-chain toggle disabled
- ℹ️ Message: "Cross-chain sync requires multiple chains"
- 💡 Standard token deployment

**Multi-Chain without Cross-Chain (2+ selected, toggle OFF):**
- ✅ Cross-chain toggle available but OFF
- 💡 Message: "Token will operate independently on each chain"
- 💡 Standard tokens on each chain

**Multi-Chain with Cross-Chain (2+ selected, toggle ON):**
- ✅ Cross-chain toggle ON
- ✅ Green success indicator: "Cross-chain sync enabled"
- ℹ️ Info: "0.5% fee on DEX trades covers cross-chain messaging costs"
- 💡 Cross-chain tokens deployed

## Technical Implementation

### Frontend (Builder.tsx)

```typescript
// State
const [crossChainEnabled, setCrossChainEnabled] = useState(false);

// Auto-disable if only one chain
const actualCrossChainEnabled = formData.chains.length > 1 ? crossChainEnabled : false;

// Send to backend
{
  ...tokenData,
  crossChainEnabled: actualCrossChainEnabled,
}
```

### Backend (tokens.ts)

```typescript
// Validation
crossChainEnabled: z.boolean().optional().default(false),

// Storage
cross_chain_enabled: crossChainEnabled ? 1 : 0,
```

### Smart Contracts

**TokenFactory** automatically chooses the right token type:

```solidity
if (crossChainEnabled && lzEndpoint != address(0) && crossChainSync != address(0)) {
    // Deploy CrossChainToken with cross-chain sync
    token = new CrossChainToken(...);
} else {
    // Deploy standard CrossifyToken
    token = new CrossifyToken(...);
}
```

## Deployment Behavior

### Single-Chain Deployment

When user selects 1 chain OR disables cross-chain:
- ✅ Deploys `CrossifyToken` (standard ERC20)
- ✅ No LayerZero dependencies
- ✅ No cross-chain fees
- ✅ Standard bonding curve
- ✅ Works independently on each chain

### Cross-Chain Deployment

When user selects 2+ chains AND enables cross-chain:
- ✅ Deploys `CrossChainToken` (ERC20 + cross-chain sync)
- ✅ Requires LayerZero infrastructure
- ✅ 0.5% fee on DEX trades
- ✅ Automatic price synchronization
- ✅ DEX trade detection

## Cost Comparison

### Single-Chain Token
- **Deployment Cost**: Standard gas fees only
- **Operating Cost**: None (standard token)
- **User Fees**: Only bonding curve fees (if any)

### Cross-Chain Token
- **Deployment Cost**: Slightly higher (cross-chain contract)
- **Operating Cost**: 0.5% fee on DEX trades
- **User Fees**: Bonding curve fees + 0.5% cross-chain fee

## When to Use Each

### Use Single-Chain When:
- ✅ Deploying on only one chain
- ✅ Don't need price synchronization
- ✅ Want to minimize fees
- ✅ Simple use case

### Use Cross-Chain When:
- ✅ Deploying on multiple chains
- ✅ Need consistent pricing across chains
- ✅ Want unified liquidity
- ✅ Building cross-chain applications

## Migration Path

Users can start with single-chain and add cross-chain later:
1. Deploy single-chain token initially
2. Later, deploy cross-chain version on additional chains
3. Migrate liquidity if needed

**Note**: This requires manual migration - there's no automatic upgrade path.

## UI Components

### CrossChainToggle Component

Located in `frontend/src/components/CrossChainToggle.tsx`:

- **Visual Toggle**: Animated switch (on/off)
- **Status Messages**: Dynamic feedback based on selection
- **Info Panel**: Expandable section explaining how it works
- **Auto-Disable**: Automatically disabled when only one chain selected

### Builder Integration

In `frontend/src/pages/Builder.tsx`:

- Toggle appears in Step 4 (Chains)
- Positioned after chain selection
- Updates deployment logic automatically

## Database Schema

```sql
-- tokens table
ALTER TABLE tokens ADD COLUMN cross_chain_enabled INTEGER DEFAULT 0;

-- 0 = single-chain (standard token)
-- 1 = cross-chain (CrossChainToken)
```

## API Changes

### Create Token Endpoint

```typescript
POST /api/tokens/create
{
  ...tokenData,
  crossChainEnabled: boolean  // optional, defaults to false
}
```

## Summary

The system now provides a user-friendly way to choose between:
- **Simple single-chain tokens** (no extra complexity)
- **Advanced cross-chain tokens** (automatic price sync)

Users are guided through the choice with clear explanations and visual indicators, making it easy to understand when to use each option.




