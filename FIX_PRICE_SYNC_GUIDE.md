# Fix Price Sync Across Chains

## Problem
Prices are different across chains (Base Sepolia, BSC Testnet, Sepolia). Users need to see prices visually sync and work 100%.

## Root Causes

1. **Bonding curves not using global supply**
   - `useGlobalSupply` flag is disabled
   - `globalSupplyTracker` address not set
   - Bonding curve not authorized in `GlobalSupplyTracker`

2. **GlobalSupplyTracker not updated**
   - Global supply is 0 or incorrect
   - Cross-chain messages not being sent/received

3. **Cross-chain messaging not working**
   - LayerZero messages not configured
   - Contracts not authorized

## Solution

### Step 1: Verify Current Status

Run the verification script to check all chains:

```bash
cd contracts
npx hardhat run scripts/check-price-sync-status.ts --network baseSepolia <tokenId>
```

Or use the existing verification script:

```bash
npx hardhat run scripts/verify-all-chains.ts
```

This will show:
- ✅ Which chains are configured correctly
- ❌ Which chains have issues
- 📊 Current prices and variance

### Step 2: Fix Bonding Curve Configuration

If bonding curves are not configured, run the fix script for each chain:

```bash
# Base Sepolia
npx hardhat run scripts/fix-bonding-curve-config.ts --network baseSepolia

# BSC Testnet  
npx hardhat run scripts/fix-bonding-curve-config.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/fix-bonding-curve-config.ts --network sepolia
```

**What this does:**
- Sets `globalSupplyTracker` address on bonding curve
- Enables `useGlobalSupply` flag
- Authorizes bonding curve in `GlobalSupplyTracker`

### Step 3: Initialize Global Supply

If global supply is 0, trigger a small buy transaction on each chain:

```bash
npx hardhat run scripts/initialize-global-supply.ts --network baseSepolia
```

This will:
- Make a small buy on each chain
- Update `GlobalSupplyTracker` with supply
- Trigger cross-chain sync

### Step 4: Verify Prices Match

After fixing, check prices again:

```bash
npx hardhat run scripts/verify-all-chains.ts
```

All chains should show:
- ✅ Same price (within 0.5% variance)
- ✅ `useGlobalSupply: true`
- ✅ Authorized in tracker

## Frontend Improvements

The UI now shows:

1. **Visual Sync Indicators**
   - 🟢 Green badge = "Synced" (all prices match)
   - 🟡 Yellow badge = "Syncing..." (prices differ, syncing in progress)
   - Individual chain indicators show sync status

2. **Auto-Refresh**
   - Refreshes every 3 seconds when out of sync
   - Refreshes every 10 seconds when synced
   - Shows real-time price updates

3. **Price Variance Display**
   - Shows variance percentage
   - Highlights chains that are out of sync
   - Shows deviation from average price

## How It Works

1. **User buys on Chain A**
   - Transaction recorded in database
   - `GlobalSupplyTracker` updated on Chain A
   - Cross-chain message sent via LayerZero

2. **Cross-Chain Sync**
   - LayerZero delivers message to other chains
   - `GlobalSupplyTracker` updated on Chains B & C
   - Bonding curves query `GlobalSupplyTracker` for price

3. **Price Calculation**
   - All chains use: `price = basePrice + (slope * globalSupply)`
   - Since `globalSupply` is the same, prices match

4. **Frontend Display**
   - Queries `getCurrentPrice()` from each bonding curve
   - Shows prices with sync indicators
   - Auto-refreshes when variance detected

## Testing

1. Make a buy transaction on one chain
2. Watch prices sync across all chains in real-time
3. Verify all chains show the same price within 3-10 seconds

## Troubleshooting

**Prices still different after fix:**
- Check if `GlobalSupplyTracker` has correct global supply
- Verify cross-chain messages are being sent (check transaction logs)
- Ensure bonding curves are querying `GlobalSupplyTracker` (check `useGlobalSupply`)

**Sync indicator stuck on "Syncing...":**
- Check network connectivity
- Verify RPC endpoints are working
- Check if bonding curve contracts are accessible

**High variance (>1%):**
- May indicate cross-chain messages are delayed
- Check LayerZero endpoint configuration
- Verify contracts are authorized

## Next Steps

1. Run verification script to identify issues
2. Fix bonding curve configuration if needed
3. Initialize global supply if it's 0
4. Test with a buy transaction
5. Watch prices sync in real-time on the UI









