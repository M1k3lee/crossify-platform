# Environment Variables Setup Guide

## Overview

There are **3 different places** where environment variables are needed:

1. **Local Machine** (`contracts/.env`) - For deploying contracts with Hardhat
2. **Railway** (Backend API) - For backend to read blockchain data
3. **Vercel** (Frontend) - For frontend to know contract addresses

---

## 1. Local Machine (`contracts/.env`) - For Contract Deployment

**Location**: Create a `.env` file in the `contracts/` directory on your local machine.

**Purpose**: This is ONLY used when you run Hardhat deployment scripts locally.

**Required Variables**:
```env
# Your wallet private key (NEVER commit this to git!)
PRIVATE_KEY=your_private_key_here

# RPC URLs (public nodes work fine)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com

# Optional: For contract verification on block explorers
ETHERSCAN_API_KEY=your_key_here
BSCSCAN_API_KEY=your_key_here
BASESCAN_API_KEY=your_key_here
```

**⚠️ Important**: 
- This file should **NOT** be committed to git (it's in `.gitignore`)
- This is **ONLY** for local deployment
- You'll use this when running: `npx hardhat run scripts/master-deploy-crosschain.ts --network baseSepolia`

---

## 2. Railway (Backend API) - For Reading Blockchain Data

**Location**: Railway dashboard → Your backend service → Variables tab

**Purpose**: Backend needs these to:
- Sync tokens from blockchain
- Read contract data
- Query TokenFactory contracts

**Required Variables** (add/update these in Railway):

```env
# TokenFactory Contract Addresses (from deployment)
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
ETHEREUM_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
# Or use these names (they work interchangeably):
BASE_SEPOLIA_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_TESTNET_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
SEPOLIA_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E

# RPC URLs (for backend to connect to blockchains)
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# Or use these names:
BASE_RPC_URL=https://base-sepolia-rpc.publicnode.com
BSC_RPC_URL=https://bsc-testnet.publicnode.com
ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# After cross-chain deployment, add these:
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x... (from deployment)
CROSS_CHAIN_SYNC_BSC_TESTNET=0x... (from deployment)
CROSS_CHAIN_SYNC_SEPOLIA=0x... (from deployment)
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x... (from deployment)
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x... (from deployment)
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x... (from deployment)
```

**✅ Current Status**: You already have some of these set. Check Railway dashboard to see what's missing.

**⚠️ Note**: Railway does **NOT** need your private key! The backend only reads from the blockchain, it doesn't deploy contracts.

---

## 3. Vercel (Frontend) - For Frontend to Know Contract Addresses

**Location**: Vercel dashboard → Your frontend project → Settings → Environment Variables

**Purpose**: Frontend needs these to:
- Connect to TokenFactory contracts
- Display correct contract addresses
- Enable token creation

**Required Variables** (add/update these in Vercel):

```env
# TokenFactory Contract Addresses
VITE_BASE_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BSC_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
VITE_ETH_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E

# Backend API URL (Railway URL)
VITE_API_URL=https://crossify-platform-production.up.railway.app

# WalletConnect (if using)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

**✅ Current Status**: You mentioned updating these earlier. Verify they're correct in Vercel.

---

## Summary: What Goes Where

| Variable | Local (`contracts/.env`) | Railway (Backend) | Vercel (Frontend) |
|----------|-------------------------|-------------------|-------------------|
| `PRIVATE_KEY` | ✅ **YES** (for deployment) | ❌ NO | ❌ NO |
| `*_RPC_URL` | ✅ YES | ✅ YES | ❌ NO |
| `*_FACTORY_ADDRESS` | ❌ NO | ✅ YES | ✅ YES (as `VITE_*_FACTORY`) |
| `CROSS_CHAIN_SYNC_*` | ❌ NO | ✅ YES (after deployment) | ❌ NO |
| `GLOBAL_SUPPLY_TRACKER_*` | ❌ NO | ✅ YES (after deployment) | ❌ NO |

---

## Step-by-Step Setup

### Step 1: Local Setup (One-Time)

1. Navigate to `contracts/` directory
2. Create `.env` file:
   ```bash
   cd contracts
   touch .env  # or create manually
   ```
3. Add your private key and RPC URLs (see section 1 above)
4. **Never commit this file** (it's in `.gitignore`)

### Step 2: Deploy Contracts (One-Time Per Network)

1. Run deployment script:
   ```bash
   cd contracts
   TRACKER_FUND_AMOUNT=0.05 SYNC_FUND_AMOUNT=0.1 \
   npx hardhat run scripts/master-deploy-crosschain.ts --network baseSepolia
   ```
2. **Copy the deployed addresses** from the output
3. Repeat for other networks (BSC Testnet, Sepolia)

### Step 3: Update Railway (Backend)

1. Go to Railway dashboard
2. Select your backend service
3. Go to Variables tab
4. Add/update the factory addresses and RPC URLs (see section 2 above)
5. After cross-chain deployment, add the cross-chain contract addresses
6. Railway will automatically redeploy

### Step 4: Update Vercel (Frontend)

1. Go to Vercel dashboard
2. Select your frontend project
3. Go to Settings → Environment Variables
4. Add/update the factory addresses (see section 3 above)
5. Vercel will automatically redeploy

---

## Quick Checklist

- [ ] Created `contracts/.env` locally with `PRIVATE_KEY` and RPC URLs
- [ ] Deployed contracts to testnets (Base Sepolia, BSC Testnet, Sepolia)
- [ ] Updated Railway with factory addresses and RPC URLs
- [ ] Updated Vercel with factory addresses (`VITE_*_FACTORY`)
- [ ] After cross-chain deployment, updated Railway with cross-chain addresses
- [ ] Verified both Railway and Vercel have redeployed

---

## FAQ

**Q: Do you know my private key?**  
A: No, and I shouldn't! Your private key should only be in your local `contracts/.env` file, never in Railway or Vercel.

**Q: Should I update Railway or Vercel?**  
A: Both! Railway needs the factory addresses for the backend to work. Vercel needs them for the frontend to work.

**Q: What if I deploy new contracts?**  
A: After deploying new contracts, update the addresses in both Railway and Vercel.

**Q: Do I need to update anything after cross-chain deployment?**  
A: Yes, add the cross-chain contract addresses to Railway (backend needs them). Frontend doesn't need them directly.

---

## Need Help?

If you're unsure about any step:
1. Check the deployment output for contract addresses
2. Verify Railway variables match the deployed addresses
3. Verify Vercel variables match the deployed addresses
4. Check the debug endpoint: `https://crossify-platform-production.up.railway.app/api/debug/factory-info`

