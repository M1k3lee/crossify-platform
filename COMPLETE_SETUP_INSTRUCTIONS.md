# 🎯 Complete Setup Instructions - Final 4 Steps

## ✅ Step 1: Update Backend Environment

### Action Required

Create or update `backend/.env` file with bridge configuration:

```bash
# Cross-Chain Liquidity Bridge Addresses
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x08BA4231c0843375714Ef89999C9F908735E0Ec2
BASE_LIQUIDITY_BRIDGE_ADDRESS=0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA

# Private Keys for Bridge Operations
ETHEREUM_PRIVATE_KEY=0x... # Your private key (same as contracts)
BSC_PRIVATE_KEY=0x... # Your private key
BASE_PRIVATE_KEY=0x... # Your private key
```

**File Location**: `backend/.env`

**Status**: ⚠️ **REQUIRED** - Without this, monitoring service won't work

---

## ✅ Step 2: Restart Backend

### Action Required

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Liquidity monitoring service started
🔄 Starting liquidity monitoring service...
```

**Status**: ⚠️ **REQUIRED** - Activates automatic monitoring and rebalancing

---

## ⚠️ Step 3: Update TokenFactory (Optional)

### Current Situation

Existing TokenFactory contracts don't have bridge functions. Two options:

### Option A: Redeploy TokenFactory (Recommended for New Tokens)

```bash
cd contracts

# Redeploy with updated code
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network bscTestnet
npx hardhat run scripts/deploy.ts --network baseSepolia

# Then update new factories
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia
```

### Option B: Skip (Acceptable)

- Bridge works for existing tokens via direct curve updates
- New tokens can use updated factory later
- Monitoring works regardless

**Status**: ⚠️ **OPTIONAL** - Only affects new tokens created through factory

**See**: `UPDATE_TOKENFACTORY_GUIDE.md` for details

---

## ⚠️ Step 4: Update Existing Bonding Curves (Optional)

### Action Required

Find bonding curve addresses and update them:

```bash
cd contracts

# Set curve addresses in .env
BONDING_CURVE_ADDRESSES=0x...,0x...,0x...

# Update on each chain
npx hardhat run scripts/update-bonding-curves-bridge.ts --network sepolia
npx hardhat run scripts/update-bonding-curves-bridge.ts --network bscTestnet
npx hardhat run scripts/update-bonding-curves-bridge.ts --network baseSepolia
```

**Status**: ⚠️ **OPTIONAL** - Enables automatic bridge requests from curves

**See**: `UPDATE_BONDING_CURVES_GUIDE.md` for details

---

## 🎯 Minimum Required Setup

**To get the system working, you only need:**

1. ✅ Update `backend/.env` with bridge addresses and private keys
2. ✅ Restart backend

**This enables:**
- ✅ Automatic reserve monitoring (every 30 seconds)
- ✅ Automatic rebalancing (when reserves are low)
- ✅ API endpoints for manual operations
- ✅ Bridge execution via backend

**What won't work without Steps 3-4:**
- ⚠️ Automatic bridge requests from bonding curves (but backend can still bridge)
- ⚠️ New tokens won't auto-enable bridge (but can be updated later)

## 🚀 Quick Start (Minimum Setup)

1. **Create `backend/.env`**:
   ```bash
   ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29
   BSC_LIQUIDITY_BRIDGE_ADDRESS=0x08BA4231c0843375714Ef89999C9F908735E0Ec2
   BASE_LIQUIDITY_BRIDGE_ADDRESS=0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA
   ETHEREUM_PRIVATE_KEY=0x... # Your key
   BSC_PRIVATE_KEY=0x... # Your key
   BASE_PRIVATE_KEY=0x... # Your key
   ```

2. **Restart backend**:
   ```bash
   cd backend && npm run dev
   ```

3. **Verify**:
   - Check logs for: `✅ Liquidity monitoring service started`
   - Test API: `curl http://localhost:3000/api/crosschain/liquidity/reserves/TOKEN_ID`

**That's it!** The system is now operational.

## 📊 System Status After Each Step

| Step | Status | What It Enables |
|------|--------|----------------|
| 1. Backend .env | ⚠️ Required | Monitoring, rebalancing, API |
| 2. Restart backend | ⚠️ Required | Activates monitoring service |
| 3. Update TokenFactory | ⚠️ Optional | Auto-enable bridge for new tokens |
| 4. Update curves | ⚠️ Optional | Auto-request bridge from curves |

## 🎉 Success Criteria

After completing Steps 1-2, you should see:

```
✅ Liquidity monitoring service started
🔄 Starting liquidity monitoring service...
```

And the system will automatically:
- Monitor reserves every 30 seconds
- Rebalance when needed
- Process bridge requests

**The bridge system is operational!** 🚀

