# Next Steps for Cross-Chain Deployment

## ✅ What's Been Done

1. ✅ **Code Implementation**: Cross-chain sync integration complete
2. ✅ **Deployment Scripts**: Created and ready to use
3. ✅ **Documentation**: Comprehensive guides created
4. ✅ **Changes Pushed**: All code pushed to repository

## 🎯 What Needs to Be Done Next

### Step 1: Check Existing GlobalSupplyTracker Contracts

First, verify if the existing GlobalSupplyTracker contracts have the new cross-chain functions:

```bash
cd contracts

# Check Base Sepolia
npx hardhat run scripts/check-global-supply-tracker.ts --network baseSepolia

# Check BSC Testnet  
npx hardhat run scripts/check-global-supply-tracker.ts --network bscTestnet

# Check Sepolia
npx hardhat run scripts/check-global-supply-tracker.ts --network sepolia
```

**Decision Point:**
- If functions exist → Use existing contracts (skip to Step 3)
- If functions missing → Redeploy GlobalSupplyTracker (Step 2)

### Step 2: Deploy CrossChainSync on All Chains

Deploy CrossChainSync on each testnet:

```bash
# Base Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```

**Save the addresses** for each deployment.

### Step 3: Deploy/Update GlobalSupplyTracker (If Needed)

If existing contracts don't have the new functions, redeploy:

```bash
# Base Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/deploy-global-supply.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network sepolia
```

### Step 4: Configure Contracts

Use the setup script to configure everything:

```bash
# For each chain, set environment variables and run:
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network baseSepolia
```

This will:
- Set CrossChainSync in GlobalSupplyTracker
- Authorize GlobalSupplyTracker in CrossChainSync
- Fund contracts with native tokens

### Step 5: Set Trusted Remotes

After deploying CrossChainSync on all chains, set trusted remotes:

```bash
# Update .env with all addresses first, then:
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network baseSepolia
```

Repeat for BSC Testnet and Sepolia.

### Step 6: Verify Setup

Verify everything is configured correctly:

```bash
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/verify-cross-chain-setup.ts --network baseSepolia
```

### Step 7: Test Cross-Chain Sync

1. Create a token on one chain
2. Authorize its BondingCurve in GlobalSupplyTracker
3. Buy tokens
4. Verify supply updates on other chains

## 📋 Quick Command Reference

### Deploy CrossChainSync
```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network [baseSepolia|bscTestnet|sepolia]
```

### Deploy GlobalSupplyTracker
```bash
npx hardhat run scripts/deploy-global-supply.ts --network [baseSepolia|bscTestnet|sepolia]
```

### Setup Cross-Chain (All-in-One)
```bash
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network [baseSepolia|bscTestnet|sepolia]
```

### Set Trusted Remotes
```bash
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network [baseSepolia|bscTestnet|sepolia]
```

### Verify Setup
```bash
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/verify-cross-chain-setup.ts --network [baseSepolia|bscTestnet|sepolia]
```

## 📚 Documentation

- **CROSS_CHAIN_SETUP_GUIDE.md** - Detailed setup instructions
- **CROSS_CHAIN_DEPLOYMENT_ACTION_PLAN.md** - Step-by-step action plan
- **DEPLOY_CROSS_CHAIN_STEP_BY_STEP.md** - Detailed deployment steps
- **QUICK_DEPLOY_CROSS_CHAIN.md** - Quick reference guide

## ⚠️ Important Notes

1. **LayerZero Endpoint**: All testnets use the same endpoint address: `0x6EDCE65403992e310A62460808c4b910D972f10f`

2. **Chain EIDs**:
   - Base Sepolia: 40245
   - BSC Testnet: 40102
   - Sepolia: 40161

3. **Funding Requirements**:
   - GlobalSupplyTracker: 0.05 ETH/BNB minimum
   - CrossChainSync: 0.1 ETH/BNB minimum

4. **TokenFactory Update**: If you redeploy GlobalSupplyTracker, you may need to update TokenFactory to use the new address.

## 🚀 Ready to Deploy

All scripts and documentation are ready. Start with Step 1 (checking existing contracts) and proceed through the steps.

If you encounter any issues, refer to the troubleshooting section in `CROSS_CHAIN_SETUP_GUIDE.md`.

