# 🚀 Start Here: Cross-Chain Deployment

## ✅ What's Ready

All code changes, scripts, and documentation are complete and pushed to the repository!

## 📋 Quick Start Checklist

### Step 1: Prepare Your Environment

1. **Navigate to contracts directory:**
   ```bash
   cd contracts
   ```

2. **Ensure `.env` file exists with:**
   ```env
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
   BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
   ```

3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

### Step 2: Check Existing Contracts (Optional)

Check if existing GlobalSupplyTracker contracts have the new functions:

```bash
# Base Sepolia
npx hardhat run scripts/check-global-supply-tracker.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/check-global-supply-tracker.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/check-global-supply-tracker.ts --network sepolia
```

**If functions are missing**, you'll need to redeploy GlobalSupplyTracker.

### Step 3: Deploy CrossChainSync (All Chains)

Deploy CrossChainSync on each chain:

```bash
# Base Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```

**📝 Save all addresses!**

### Step 4: Deploy/Update GlobalSupplyTracker (If Needed)

If existing contracts don't have cross-chain functions, redeploy:

```bash
# Base Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/deploy-global-supply.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network sepolia
```

**📝 Save all addresses!**

### Step 5: Configure Contracts (All Chains)

Use the setup script to configure everything:

```bash
# Base Sepolia
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network baseSepolia

# BSC Testnet
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network bscTestnet

# Sepolia
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network sepolia
```

### Step 6: Set Trusted Remotes (All Chains)

After deploying on all chains, update `.env` with all CrossChainSync addresses, then:

```bash
# Base Sepolia
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network baseSepolia

# BSC Testnet
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network bscTestnet

# Sepolia
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network sepolia
```

### Step 7: Update TokenFactory (If Needed)

If you deployed new GlobalSupplyTracker contracts:

```bash
# Base Sepolia
TOKEN_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58 \
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/update-tokenfactory.ts --network baseSepolia

# BSC Testnet
TOKEN_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E \
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/update-tokenfactory.ts --network bscTestnet

# Sepolia
TOKEN_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E \
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/update-tokenfactory.ts --network sepolia
```

### Step 8: Verify Setup

Verify everything is configured correctly:

```bash
# Base Sepolia
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/verify-cross-chain-setup.ts --network baseSepolia

# Repeat for BSC Testnet and Sepolia
```

### Step 9: Test Cross-Chain Sync

1. **Create a token** on Base Sepolia
2. **Authorize its BondingCurve:**
   ```bash
   GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
   BONDING_CURVE_ADDRESS=0x... \
   npx hardhat run scripts/authorize-bonding-curve.ts --network baseSepolia
   ```
3. **Buy tokens** on Base Sepolia
4. **Check transaction logs** for cross-chain sync events
5. **Verify supply** on other chains

## 🎯 Alternative: Master Script (Recommended)

For the fastest deployment, use the master script that does everything:

```bash
# Base Sepolia
TRACKER_FUND_AMOUNT=0.05 \
SYNC_FUND_AMOUNT=0.1 \
npx hardhat run scripts/master-deploy-crosschain.ts --network baseSepolia

# BSC Testnet
TRACKER_FUND_AMOUNT=0.05 \
SYNC_FUND_AMOUNT=0.1 \
npx hardhat run scripts/master-deploy-crosschain.ts --network bscTestnet

# Sepolia
TRACKER_FUND_AMOUNT=0.05 \
SYNC_FUND_AMOUNT=0.1 \
npx hardhat run scripts/master-deploy-crosschain.ts --network sepolia
```

Then set trusted remotes (Step 6) and verify (Step 8).

## 📚 Documentation

- **DEPLOYMENT_EXECUTION_PLAN.md** - Step-by-step commands
- **CROSS_CHAIN_SETUP_GUIDE.md** - Detailed setup guide
- **CROSS_CHAIN_DEPLOYMENT_ACTION_PLAN.md** - Complete action plan
- **NEXT_STEPS_CROSS_CHAIN.md** - Next steps summary

## ⚠️ Important Notes

1. **LayerZero Endpoint**: All testnets use: `0x6EDCE65403992e310A62460808c4b910D972f10f`
2. **Chain EIDs**: Base Sepolia (40245), BSC Testnet (40102), Sepolia (40161)
3. **Funding**: Each contract needs 0.05-0.1 ETH/BNB for LayerZero fees
4. **Private Key**: Must be set in `contracts/.env` file

## 🎉 Ready to Deploy!

All scripts are ready. Start with Step 1 and proceed through each step. The master script (alternative method) can do most steps automatically.

If you encounter any issues, refer to the troubleshooting sections in the guides.

