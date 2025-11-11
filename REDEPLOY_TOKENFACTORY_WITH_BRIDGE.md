# Redeploy TokenFactory with Bridge Support

## ✅ Best Approach: Redeploy TokenFactory

Since you're willing to delete and remake your token, the **best approach** is to:

1. **Redeploy TokenFactory** with bridge support configured
2. **Delete your existing token** (if needed)
3. **Remake the token** - it will automatically have bridge support!

## Why This Is Better

- ✅ New tokens automatically get bridge support
- ✅ No need to manually update curves
- ✅ Cleaner, more maintainable
- ✅ Future tokens will also have bridge support

## Step-by-Step Guide

### Step 1: Redeploy TokenFactory on Each Chain

The TokenFactory contract already has bridge support in the code. We just need to:
1. Redeploy it
2. Configure it to use the bridge

```bash
cd contracts

# Deploy on Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy on Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Note**: The deploy script will use the existing infrastructure (GlobalSupplyTracker, CrossChainSync, etc.)

### Step 2: Configure New Factories to Use Bridge

After deployment, update each factory:

```bash
# Set the new factory addresses
SEPOLIA_FACTORY_ADDRESS=0x... # New address from Step 1
BSCTESTNET_FACTORY_ADDRESS=0x... # New address from Step 1
BASESEPOLIA_FACTORY_ADDRESS=0x... # New address from Step 1

# Configure to use bridge
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia
```

### Step 3: Update Environment Variables

Update factory addresses in:

1. **`contracts/.env`**:
   ```bash
   SEPOLIA_FACTORY_ADDRESS=0x... # New address
   BSCTESTNET_FACTORY_ADDRESS=0x... # New address
   BASESEPOLIA_FACTORY_ADDRESS=0x... # New address
   ```

2. **`backend/.env`** (for token syncing):
   ```bash
   SEPOLIA_FACTORY_ADDRESS=0x... # New address
   BSC_TESTNET_FACTORY_ADDRESS=0x... # New address
   BASE_SEPOLIA_FACTORY_ADDRESS=0x... # New address
   ```

3. **Frontend environment variables** (for UI):
   ```bash
   VITE_ETH_FACTORY=0x... # New address
   VITE_BSC_FACTORY=0x... # New address
   VITE_BASE_FACTORY=0x... # New address
   ```

### Step 4: Delete and Remake Your Token

1. **Delete existing token** (if you want to start fresh)
2. **Create new token** through the updated factory
3. **New token will automatically have bridge support!**

## What Happens When You Create a New Token

With the updated factory, when you create a token:

1. ✅ Token is deployed
2. ✅ BondingCurve is deployed with:
   - Bridge address set
   - Chain EID set
   - Bridge enabled
3. ✅ Token is ready to use bridge automatically!

## Bridge Addresses Reference

| Chain | Bridge Address | Chain EID |
|-------|---------------|-----------|
| Sepolia | `0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29` | 40161 |
| BSC Testnet | `0x08BA4231c0843375714Ef89999C9F908735E0Ec2` | 40102 |
| Base Sepolia | `0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA` | 40245 |

## Quick Command Reference

```bash
# 1. Redeploy factories
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network bscTestnet
npx hardhat run scripts/deploy.ts --network baseSepolia

# 2. Configure bridges (set factory addresses in .env first)
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia

# 3. Update environment variables (see Step 3 above)
# 4. Delete and remake your token through the UI
```

## Benefits of This Approach

- ✅ **Automatic**: New tokens get bridge support automatically
- ✅ **No Manual Updates**: No need to update curves one by one
- ✅ **Future-Proof**: All future tokens will have bridge support
- ✅ **Clean**: Fresh start with proper configuration

## Summary

**Yes, it's better to run the optional steps!** Specifically:

1. ✅ **Redeploy TokenFactory** (Step 3) - This ensures new tokens get bridge support
2. ❌ **Skip updating existing curves** (Step 4) - Not needed if you're remaking the token

After redeploying the factory and remaking your token, it will have full bridge support automatically! 🎉

