# ✅ Final 4 Steps - Completion Guide

## Step 1: Update Backend Environment ✅ READY

### Create/Update `backend/.env`

Add these lines to your `backend/.env` file:

```bash
# Cross-Chain Liquidity Bridge Addresses
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x08BA4231c0843375714Ef89999C9F908735E0Ec2
BASE_LIQUIDITY_BRIDGE_ADDRESS=0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA

# Private Keys for Bridge Operations
# Use the same private key as your contracts deployment
ETHEREUM_PRIVATE_KEY=0x... # Your private key
BSC_PRIVATE_KEY=0x... # Your private key
BASE_PRIVATE_KEY=0x... # Your private key
# OR use a shared key:
# BRIDGE_PRIVATE_KEY=0x... # Single key for all chains
```

**Note**: The backend `.env` file doesn't exist yet. Create it in the `backend/` directory with the above content.

## Step 2: Restart Backend ✅ READY

After updating `.env`, restart the backend:

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Liquidity monitoring service started
```

The monitoring service will:
- Check reserves every 30 seconds
- Automatically rebalance when needed
- Process bridge requests from bonding curves

## Step 3: Update TokenFactory Contracts ⚠️ REQUIRES REDEPLOYMENT

### Current Status

The existing TokenFactory contracts were deployed **before** the bridge functionality was added. They need to be **redeployed** with the new code that includes:
- `setLiquidityBridge()` function
- `setUseLiquidityBridge()` function
- Bridge parameters in BondingCurve constructor

### Option A: Redeploy TokenFactory (Recommended)

Redeploy TokenFactory on each chain with the updated code:

```bash
cd contracts

# Deploy on Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy on BSC Testnet  
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy on Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Then update the factories:**
```bash
# Set the new factory addresses in .env
SEPOLIA_FACTORY_ADDRESS=0x... # New address
BSCTESTNET_FACTORY_ADDRESS=0x... # New address
BASESEPOLIA_FACTORY_ADDRESS=0x... # New address

# Update factories to use bridge
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia
```

### Option B: Use Existing Factories (Bridge for New Tokens Only)

If you don't want to redeploy, new tokens created through the **updated** TokenFactory will automatically use the bridge. Existing tokens will need to be updated manually (Step 4).

### Option C: Skip TokenFactory Update (Bridge Works for Existing Curves)

The bridge system works independently of TokenFactory. You can:
- Update existing bonding curves directly (Step 4)
- New tokens can be created with bridge support via updated factory later

## Step 4: Update Existing Bonding Curves (Optional)

### Find Bonding Curve Addresses

Bonding curve addresses are stored in the database in the `token_deployments` table under `curve_address`.

### Update Curves

**Option A: Update via Script**

1. Get curve addresses from database or blockchain
2. Set in `.env`:
   ```bash
   BONDING_CURVE_ADDRESSES=0x...,0x...,0x...
   ```
3. Run update script:
   ```bash
   cd contracts
   npx hardhat run scripts/update-bonding-curves-bridge.ts --network sepolia
   npx hardhat run scripts/update-bonding-curves-bridge.ts --network bscTestnet
   npx hardhat run scripts/update-bonding-curves-bridge.ts --network baseSepolia
   ```

**Option B: Update Manually**

For each bonding curve, call:
```solidity
// Sepolia
bondingCurve.setLiquidityBridge(0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29);
bondingCurve.setChainEID(40161);
bondingCurve.setUseLiquidityBridge(true);

// BSC Testnet
bondingCurve.setLiquidityBridge(0x08BA4231c0843375714Ef89999C9F908735E0Ec2);
bondingCurve.setChainEID(40102);
bondingCurve.setUseLiquidityBridge(true);

// Base Sepolia
bondingCurve.setLiquidityBridge(0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA);
bondingCurve.setChainEID(40245);
bondingCurve.setUseLiquidityBridge(true);
```

## ✅ What's Already Working

Even without updating TokenFactory or existing curves, the system is **partially operational**:

1. ✅ **Backend Monitoring** - Will monitor reserves once backend restarts
2. ✅ **API Endpoints** - All endpoints are ready
3. ✅ **Automatic Rebalancing** - Will work for tokens with `cross_chain_enabled = 1`
4. ✅ **Bridge Contracts** - Fully deployed and configured

## 🎯 Priority Order

1. **HIGH**: Update backend `.env` and restart (enables monitoring)
2. **MEDIUM**: Update existing bonding curves (enables automatic bridge requests)
3. **LOW**: Update TokenFactory (only affects new tokens)

## 📝 Quick Reference

### Bridge Addresses
- Sepolia: `0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29`
- BSC Testnet: `0x08BA4231c0843375714Ef89999C9F908735E0Ec2`
- Base Sepolia: `0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA`

### Chain EIDs
- Sepolia: `40161`
- BSC Testnet: `40102`
- Base Sepolia: `40245`

### TokenFactory Addresses (Current)
- Sepolia: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- BSC Testnet: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- Base Sepolia: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`

## 🎉 Summary

**Minimum Required**: Update backend `.env` and restart
- This enables automatic monitoring and rebalancing
- Bridge will work for reserve management

**Recommended**: Update existing bonding curves
- Enables automatic bridge requests when reserves are low
- Better user experience

**Optional**: Update TokenFactory
- Only needed if you want new tokens to automatically use bridge
- Can be done later

The system is **functional now** with just the backend update!

