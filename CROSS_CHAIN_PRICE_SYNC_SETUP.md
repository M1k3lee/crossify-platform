# Cross-Chain Price Sync Setup Guide

## Problem
Prices are different across chains because each chain is using its **local supply** instead of **global supply** for pricing. This means:
- BSC Testnet: $0.000500 (using local supply)
- Sepolia: $0.000100 (using local supply)  
- Base Sepolia: $0.000100 (using local supply)

**Expected**: All chains should show the **same price** because they should all use the **global supply** (sum of all chains' local supplies).

---

## Root Cause

The bonding curve contracts need:
1. ✅ `globalSupplyTracker` address set
2. ✅ `useGlobalSupply` set to `true`
3. ✅ GlobalSupplyTracker contract deployed and configured
4. ✅ Cross-chain messaging configured (LayerZero)

---

## Step 1: Verify Current Contract Configuration

### Check Environment Variables

Please provide screenshots or values for these environment variables in **Railway**:

#### Required for Cross-Chain Messaging:
```
ETHEREUM_PRIVATE_KEY=...
BASE_PRIVATE_KEY=...
BSC_PRIVATE_KEY=...
```

#### Required for GlobalSupplyTracker:
```
GLOBAL_SUPPLY_TRACKER_SEPOLIA=...
GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=...
GLOBAL_SUPPLY_TRACKER_BSCTESTNET=...
```

#### Required for CrossChainSync:
```
CROSS_CHAIN_SYNC_SEPOLIA=...
CROSS_CHAIN_SYNC_BASESEPOLIA=...
CROSS_CHAIN_SYNC_BSCTESTNET=...
```

#### Required for TokenFactory (should already be set):
```
TOKEN_FACTORY_SEPOLIA=...
TOKEN_FACTORY_BASE_SEPOLIA=...
TOKEN_FACTORY_BSC_TESTNET=...
```

---

## Step 2: Verify Bonding Curve Configuration

We need to check if existing bonding curves have:
- `globalSupplyTracker` set
- `useGlobalSupply` = `true`

### Verification Script

I'll create a script to check all deployed bonding curves. But first, I need to know:

1. **Which token are you testing?** (Token ID or address)
2. **Which chains is it deployed on?** (Base Sepolia, BSC Testnet, Sepolia)

---

## Step 3: Fix Existing Bonding Curves

If bonding curves are missing global supply configuration, we need to:

1. **Set GlobalSupplyTracker address** on each bonding curve
2. **Enable useGlobalSupply** on each bonding curve
3. **Authorize bonding curves** in GlobalSupplyTracker

### Script to Fix Bonding Curves

I'll create a script that:
- Takes a bonding curve address
- Sets the GlobalSupplyTracker address
- Enables `useGlobalSupply`
- Authorizes the curve in GlobalSupplyTracker

---

## Step 4: Deploy Missing Contracts (If Needed)

If GlobalSupplyTracker or CrossChainSync are not deployed, we need to deploy them.

### Check Current Deployment Status

Please check if these contracts exist on each chain:

#### Base Sepolia:
- GlobalSupplyTracker: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573` (from docs)
- CrossChainSync: Need to verify

#### BSC Testnet:
- GlobalSupplyTracker: `0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e` (from docs)
- CrossChainSync: Need to verify

#### Sepolia:
- GlobalSupplyTracker: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573` (from docs)
- CrossChainSync: Need to verify

---

## Step 5: Configure Cross-Chain Trusted Remotes

Once CrossChainSync contracts are deployed, we need to configure trusted remotes so they can communicate with each other.

---

## Next Steps

1. **Please provide**:
   - Screenshot of Railway environment variables (or list the values)
   - Token ID you're testing
   - Which chains it's deployed on

2. **I'll create**:
   - Verification script to check bonding curve configuration
   - Fix script to update existing bonding curves
   - Deployment scripts if contracts are missing

3. **Then we'll**:
   - Run verification
   - Fix any issues
   - Test cross-chain price sync

---

## Quick Test After Setup

After configuration, test by:
1. Making a buy on Base Sepolia
2. Check if price updates on BSC Testnet and Sepolia
3. All chains should show the same price

---

## Expected Result

After setup, all chains should show:
- **Same price** (using global supply)
- **Price updates** when buys/sells happen on any chain
- **Cross-chain messages** sent via LayerZero
- **Audit logs** in Hedera HCS

