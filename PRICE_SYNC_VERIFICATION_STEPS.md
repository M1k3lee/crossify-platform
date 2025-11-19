# Price Sync Verification & Fix Steps

## Current Status
Prices are different across chains. We need to verify and fix the bonding curve configuration.

## Step 1: Verify Current Configuration

### Option A: Use Standalone Script (Recommended)

```bash
cd contracts
npx ts-node scripts/verify-price-sync-standalone.ts <tokenId>
```

This will show:
- ✅/❌ Configuration status for each chain
- Current prices on each chain
- Issues found (if any)

### Option B: Use Hardhat Script

```bash
cd contracts
npx hardhat run scripts/verify-all-chains.ts
```

**Note:** Requires proper Hardhat config with private keys set.

## Step 2: Identify Issues

The verification will show one or more of these issues:

1. **GlobalSupplyTracker not set**
   - Bonding curve doesn't have tracker address configured

2. **useGlobalSupply disabled**
   - Bonding curve is using local supply instead of global

3. **Not authorized in tracker**
   - Bonding curve can't update the GlobalSupplyTracker

4. **Price variance**
   - Prices differ across chains (indicates sync not working)

## Step 3: Fix Configuration

### For a Specific Token (All Chains)

```bash
cd contracts
TOKEN_ID=<tokenId> npx hardhat run scripts/fix-all-chains-for-token.ts
```

**Requirements:**
- `PRIVATE_KEY_BASE_SEPOLIA` in .env
- `PRIVATE_KEY_BSC_TESTNET` in .env
- `PRIVATE_KEY_SEPOLIA` in .env
- Wallet must be owner of bonding curves AND GlobalSupplyTracker contracts

### For Individual Chains

```bash
# Base Sepolia
CURVE_ADDRESS=<curve> GLOBAL_SUPPLY_TRACKER=<tracker> npx hardhat run scripts/fix-bonding-curve-config.ts --network baseSepolia

# BSC Testnet
CURVE_ADDRESS=<curve> GLOBAL_SUPPLY_TRACKER=<tracker> npx hardhat run scripts/fix-bonding-curve-config.ts --network bscTestnet

# Sepolia
CURVE_ADDRESS=<curve> GLOBAL_SUPPLY_TRACKER=<tracker> npx hardhat run scripts/fix-bonding-curve-config.ts --network sepolia
```

## Step 4: Initialize Global Supply

If global supply is 0, trigger a small buy on each chain:

```bash
npx hardhat run scripts/initialize-global-supply.ts --network baseSepolia
```

This will:
- Make a small buy transaction
- Update GlobalSupplyTracker
- Trigger cross-chain sync

## Step 5: Verify Fix

Run verification again to confirm:

```bash
npx ts-node scripts/verify-price-sync-standalone.ts <tokenId>
```

Expected results:
- ✅ All chains configured
- ✅ Prices match (variance < 0.5%)
- ✅ Global supply > 0

## Environment Variables Needed

Create/update `.env` in `contracts/` directory:

```env
# API
API_BASE_URL=https://crossify-platform-production.up.railway.app/api

# Base Sepolia
RPC_URL_BASE_SEPOLIA=https://base-sepolia-rpc.publicnode.com
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
PRIVATE_KEY_BASE_SEPOLIA=<your_private_key>

# BSC Testnet
RPC_URL_BSC_TESTNET=https://bsc-testnet.publicnode.com
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0xe84Ae64735261F441e0bcB12bCf60630c5239ef4
PRIVATE_KEY_BSC_TESTNET=<your_private_key>

# Sepolia
RPC_URL_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x130195A8D09dfd99c36D5903B94088EDBD66533e
PRIVATE_KEY_SEPOLIA=<your_private_key>
```

## Quick Test

After fixing, make a buy transaction on one chain and watch:
1. Prices update on that chain
2. Within 3-10 seconds, prices sync on other chains
3. UI shows "Synced" status with green indicators

## Troubleshooting

**"Private key too short" error:**
- Make sure private keys in .env don't have `0x` prefix
- Private keys should be 64 hex characters (32 bytes)

**"Not the owner" error:**
- The wallet address must be the owner of both bonding curve AND GlobalSupplyTracker
- Check ownership: `npx hardhat run scripts/check-tracker-owners.ts`

**Prices still different:**
- Check if cross-chain messages are being sent (check transaction logs)
- Verify LayerZero endpoint is configured
- Ensure GlobalSupplyTracker has correct global supply value

**Script fails to connect:**
- Check RPC URLs are correct and accessible
- Verify network names match (baseSepolia, bscTestnet, sepolia)

## Next Steps After Fix

1. ✅ All bonding curves configured
2. ✅ Global supply initialized
3. ✅ Prices syncing correctly
4. ✅ UI showing sync status

The frontend will automatically:
- Show sync indicators (green = synced, yellow = syncing)
- Refresh prices every 3s when out of sync
- Display variance percentage
- Highlight chains that need to sync






