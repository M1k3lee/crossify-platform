# Production Environment Variables Verification Checklist

**Date:** $(date)  
**Purpose:** Comprehensive checklist for verifying all production environment variables

---

## 📋 Overview

This document lists **all environment variables** required for production deployment across:
- ✅ **Backend (Railway)** - Core API service
- ✅ **Frontend (Vercel/Netlify)** - User-facing web application
- ✅ **Blockchain Configurations** - Chain-specific settings

---

## 🔴 BACKEND (RAILWAY) - Required Variables

### Core Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | ⚠️ Recommended | `3001` | Backend server port |
| `NODE_ENV` | ✅ **YES** | - | Must be `production` for production |
| `DATABASE_URL` | ✅ **YES** | - | PostgreSQL connection string (if using PostgreSQL) |
| `CORS_ORIGIN` | ✅ **YES** | - | Frontend URL(s), comma-separated (e.g., `https://crossify.io,https://www.crossify.io`) |

### Database Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ **YES** | PostgreSQL connection string (format: `postgresql://user:password@host:port/database`) |
| `DATABASE_PATH` | ❌ Only if using SQLite | SQLite file path (fallback if `DATABASE_URL` not set) |

**Note:** Production should use PostgreSQL, not SQLite.

---

## 🔴 BLOCKCHAIN CONFIGURATION - Required Variables

### TokenFactory Contract Addresses (Per Chain)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ETHEREUM_FACTORY_ADDRESS` | ✅ **YES** | TokenFactory on Ethereum mainnet | `0x...` |
| `BSC_FACTORY_ADDRESS` | ✅ **YES** | TokenFactory on BSC mainnet | `0x...` |
| `BASE_FACTORY_ADDRESS` | ✅ **YES** | TokenFactory on Base mainnet | `0x...` |
| `SEPOLIA_FACTORY_ADDRESS` | ⚠️ If using testnet | TokenFactory on Sepolia testnet | `0x...` |
| `BSC_TESTNET_FACTORY_ADDRESS` | ⚠️ If using testnet | TokenFactory on BSC testnet | `0x...` |
| `BASE_SEPOLIA_FACTORY_ADDRESS` | ⚠️ If using testnet | TokenFactory on Base Sepolia testnet | `0x...` |

**Alternative naming (both work):**
- `TOKEN_FACTORY_ETHEREUM` = `ETHEREUM_FACTORY_ADDRESS`
- `TOKEN_FACTORY_BSC` = `BSC_FACTORY_ADDRESS`
- `TOKEN_FACTORY_BASE` = `BASE_FACTORY_ADDRESS`

### RPC URLs (Per Chain)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ETHEREUM_RPC_URL` | ✅ **YES** | Ethereum mainnet RPC (or Sepolia if testnet) | `https://eth.llamarpc.com` |
| `ETHEREUM_MAINNET_RPC_URL` | ⚠️ If using both | Ethereum mainnet RPC | `https://eth.llamarpc.com` |
| `BSC_RPC_URL` | ✅ **YES** | BSC mainnet RPC (or testnet if testnet) | `https://bsc-dataseed.binance.org` |
| `BSC_MAINNET_RPC_URL` | ⚠️ If using both | BSC mainnet RPC | `https://bsc-dataseed.binance.org` |
| `BASE_RPC_URL` | ✅ **YES** | Base mainnet RPC (or Sepolia if testnet) | `https://mainnet.base.org` |
| `BASE_MAINNET_RPC_URL` | ⚠️ If using both | Base mainnet RPC | `https://mainnet.base.org` |
| `SOLANA_RPC_URL` | ✅ **YES** | Solana mainnet RPC (or devnet if testnet) | `https://api.mainnet-beta.solana.com` |
| `HEDERA_RPC_URL` | ⚠️ If using Hedera | Hedera mainnet RPC | `https://mainnet.hashio.io/api` |

**Note:** For production, use **mainnet RPC URLs** from reliable providers (Infura, Alchemy, QuickNode, etc.)

### Cross-Chain Sync Configuration (Optional but Recommended)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GLOBAL_SUPPLY_TRACKER_SEPOLIA` | ⚠️ If using Sepolia | GlobalSupplyTracker on Sepolia | `0x...` |
| `GLOBAL_SUPPLY_TRACKER_BASESEPOLIA` | ⚠️ If using Base Sepolia | GlobalSupplyTracker on Base Sepolia | `0x...` |
| `GLOBAL_SUPPLY_TRACKER_BSCTESTNET` | ⚠️ If using BSC Testnet | GlobalSupplyTracker on BSC Testnet | `0x...` |
| `CROSS_CHAIN_SYNC_SEPOLIA` | ⚠️ If using Sepolia | CrossChainSync on Sepolia | `0x...` |
| `CROSS_CHAIN_SYNC_BASESEPOLIA` | ⚠️ If using Base Sepolia | CrossChainSync on Base Sepolia | `0x...` |
| `CROSS_CHAIN_SYNC_BSCTESTNET` | ⚠️ If using BSC Testnet | CrossChainSync on BSC Testnet | `0x...` |

---

## 🔴 HEDERA INTEGRATION - Required Variables

### Hedera Audit Service (HCS)

| Variable | Required | Description | Notes |
|----------|----------|-------------|-------|
| `HEDERA_ACCOUNT_ID` | ✅ **YES** | Hedera account ID (format: `0.0.xxxxx`) | For HCS audit logging |
| `HEDERA_PRIVATE_KEY` | ✅ **YES** | Hedera account private key (64 hex chars) | ECDSA or ED25519 format |
| `HEDERA_HCS_TOPIC_ID` | ⚠️ Recommended | Existing HCS topic ID (format: `0.0.xxxxx`) | Auto-creates if not set |
| `HEDERA_MAINNET` | ⚠️ If using mainnet | Set to `true` for Hedera mainnet | Default: testnet |

**Format:**
- `HEDERA_ACCOUNT_ID`: `0.0.1234567`
- `HEDERA_PRIVATE_KEY`: `302e020100300506032b657004220420...` (64 hex chars, with or without `0x`)
- `HEDERA_HCS_TOPIC_ID`: `0.0.9876543`

---

## 🟡 DEX GRADUATION - Private Keys (Optional but Recommended)

**Note:** These are only needed if you want **automatic DEX pool creation** when tokens graduate. If not set, graduation will still be detected but pool creation will fail gracefully.

| Variable | Required | Description | Notes |
|----------|----------|-------------|-------|
| `SOLANA_PRIVATE_KEY` | ⚠️ For Raydium | Solana wallet private key (BS58 or hex) | For Raydium pool creation |
| `ETHEREUM_PRIVATE_KEY` | ⚠️ For Uniswap | Ethereum wallet private key (64 hex chars) | For Uniswap V3 pool creation |
| `BSC_PRIVATE_KEY` | ⚠️ For PancakeSwap | BSC wallet private key (64 hex chars) | For PancakeSwap pool creation |
| `BASE_PRIVATE_KEY` | ⚠️ For BaseSwap | Base wallet private key (64 hex chars) | For BaseSwap pool creation |

**Format:**
- Ethereum/BSC/Base: `0x1234567890abcdef...` (64 hex chars, with or without `0x`)
- Solana: BS58 encoded string or JSON array format

**Security Warning:** ⚠️ These private keys should have **minimal funds** (only what's needed for gas/pool creation fees). Use a separate wallet, not your main deployer wallet.

---

## 🟡 ADDITIONAL SERVICES (Optional)

### Redis (Optional - for caching)

| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_HOST` | ❌ Optional | Redis host (if using Redis) |
| `REDIS_PORT` | ❌ Optional | Redis port (default: 6379) |
| `REDIS_PASSWORD` | ❌ Optional | Redis password (if required) |

**Note:** System works without Redis - caching is disabled if Redis unavailable.

### CFY Token Distribution (Optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `CFY_TOKEN_MINT_ADDRESS` | ❌ Optional | CFY token mint address on Solana |
| `SOLANA_DISTRIBUTOR_PRIVATE_KEY` | ❌ Optional | Solana wallet for CFY distribution |
| `SOLANA_OPERATOR_PRIVATE_KEY` | ❌ Optional | Alternative to distributor key |

---

## 🟢 FRONTEND (VERCEL/NETLIFY) - Required Variables

### API Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE` | ✅ **YES** | Backend API base URL | `https://crossify-platform-production.up.railway.app` |

**Note:** Should **NOT** include `/api` suffix - frontend adds it automatically.

##***REMOVED***

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_WALLETCONNECT_PROJECT_ID` | ✅ **YES** | WalletConnect Cloud Project ID | `YOUR_WALLETCONNECT_PROJECT_ID` |

**Get from:** https://cloud.walletconnect.com

### TokenFactory Addresses (Per Chain)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_ETH_FACTORY` | ✅ **YES** | TokenFactory on Ethereum (mainnet) | `0x...` |
| `VITE_ETHEREUM_FACTORY` | ✅ **YES** | Alternative to `VITE_ETH_FACTORY` | `0x...` |
| `VITE_BSC_FACTORY` | ✅ **YES** | TokenFactory on BSC (mainnet) | `0x...` |
| `VITE_BASE_FACTORY` | ✅ **YES** | TokenFactory on Base (mainnet) | `0x...` |
| `VITE_HEDERA_FACTORY` | ⚠️ If using Hedera | TokenFactory on Hedera | `0x...` |

**Note:** Frontend uses these to display token creation options and connect to correct contracts.

### Platform Fee (Optional)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_PLATFORM_FEE_ADDRESS` | ❌ Optional | Platform fee recipient address | `0x...` |

**Default:** `0x0000000000000000000000000000000000000000` (no fee)

---

## 📊 Production Configuration Checklist

### ✅ Backend (Railway) Checklist

**Core Settings:**
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` set (PostgreSQL connection string)
- [ ] `CORS_ORIGIN` set (frontend domain(s))

**TokenFactory Addresses (at least one chain):**
- [ ] `ETHEREUM_FACTORY_ADDRESS` OR `SEPOLIA_FACTORY_ADDRESS`
- [ ] `BSC_FACTORY_ADDRESS` OR `BSC_TESTNET_FACTORY_ADDRESS`
- [ ] `BASE_FACTORY_ADDRESS` OR `BASE_SEPOLIA_FACTORY_ADDRESS`

**RPC URLs (matching chains above):**
- [ ] `ETHEREUM_RPC_URL` OR `ETHEREUM_MAINNET_RPC_URL`
- [ ] `BSC_RPC_URL` OR `BSC_MAINNET_RPC_URL`
- [ ] `BASE_RPC_URL` OR `BASE_MAINNET_RPC_URL`
- [ ] `SOLANA_RPC_URL` (if using Solana)

**Hedera (if using Hedera features):**
- [ ] `HEDERA_ACCOUNT_ID`
- [ ] `HEDERA_PRIVATE_KEY`
- [ ] `HEDERA_HCS_TOPIC_ID` (recommended)
- [ ] `HEDERA_MAINNET=true` (if using mainnet)

**DEX Graduation (optional but recommended):**
- [ ] `SOLANA_PRIVATE_KEY` (for Raydium)
- [ ] `ETHEREUM_PRIVATE_KEY` (for Uniswap V3)
- [ ] `BSC_PRIVATE_KEY` (for PancakeSwap)
- [ ] `BASE_PRIVATE_KEY` (for BaseSwap)

### ✅ Frontend (Vercel/Netlify) Checklist

**Core Settings:**
- [ ] `VITE_API_BASE` set (Railway backend URL)
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` set

**TokenFactory Addresses (matching backend chains):**
- [ ] `VITE_ETH_FACTORY` OR `VITE_ETHEREUM_FACTORY`
- [ ] `VITE_BSC_FACTORY`
- [ ] `VITE_BASE_FACTORY`
- [ ] `VITE_HEDERA_FACTORY` (if using Hedera)

---

## 🔍 Verification Steps

### 1. Backend Health Check

```bash
curl https://crossify-platform-production.up.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "services": {
    "priceSync": "running",
    "graduationMonitor": "running",
    "hederaAudit": "initialized"
  }
}
```

### 2. Check Backend Logs (Railway)

Look for these success messages on startup:
- ✅ `Database initialized`
- ✅ `Price sync service started`
- ✅ `Graduation monitoring service started`
- ✅ `Hedera Audit Service initialized (Powered by Hedera)`

### 3. Frontend Environment Check

Open browser console on production site and check for:
- ✅ No "VITE_API_BASE not set" warnings
- ✅ No "WalletConnect Project ID not set" warnings
- ✅ No "Factory address not set" errors

### 4. Test Token Creation

1. Go to production frontend
2. Connect wallet
3. Try to create a token
4. Verify factory addresses are displayed correctly
5. Check if token creation works

### 5. Test Graduation (if DEX keys set)

1. Create test token with low graduation threshold
2. Buy tokens until threshold reached
3. Verify backend logs show graduation attempt
4. Check if DEX pool is created (or graceful failure logged)

---

## 🚨 Common Issues

### Issue 1: Backend Can't Connect to Database
**Solution:**
- Verify `DATABASE_URL` is correct PostgreSQL connection string
- Check PostgreSQL service is running (if using Railway PostgreSQL)
- Verify credentials are correct

### Issue 2: Frontend Can't Connect to Backend
**Solution:**
- Verify `VITE_API_BASE` is set correctly (should NOT include `/api`)
- Check CORS is configured: `CORS_ORIGIN` includes frontend domain
- Verify Railway backend is accessible

### Issue 3: Token Creation Fails
**Solution:**
- Verify `VITE_ETH_FACTORY`, `VITE_BSC_FACTORY`, `VITE_BASE_FACTORY` are set
- Check factory addresses match deployed contracts
- Verify RPC URLs are accessible and correct network

### Issue 4: Hedera Audit Not Working
**Solution:**
- Verify `HEDERA_ACCOUNT_ID` is correct format (`0.0.xxxxx`)
- Check `HEDERA_PRIVATE_KEY` matches account (test in HashPack)
- Verify account has sufficient HBAR balance (>0.1 HBAR for topic creation)

### Issue 5: Graduation Fails Silently
**Solution:**
- Check if DEX private keys are set (graduation detection works, but pool creation fails)
- Verify private keys have sufficient funds for gas
- Check backend logs for graduation errors

---

## 📝 Production Mainnet Configuration Example

### Backend (Railway)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
CORS_ORIGIN=https://crossify.io,https://www.crossify.io

# TokenFactory Addresses (Mainnet)
ETHEREUM_FACTORY_ADDRESS=0x...
BSC_FACTORY_ADDRESS=0x...
BASE_FACTORY_ADDRESS=0x...

# RPC URLs (Mainnet)
ETHEREUM_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Hedera (Mainnet)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_HCS_TOPIC_ID=0.0.xxxxx
HEDERA_MAINNET=true

# DEX Graduation (Optional)
SOLANA_PRIVATE_KEY=...
ETHEREUM_PRIVATE_KEY=0x...
BSC_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...
```

### Frontend (Vercel)

```env
VITE_API_BASE=https://crossify-platform-production.up.railway.app
VITE_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID

# TokenFactory Addresses (Mainnet)
VITE_ETH_FACTORY=0x...
VITE_BSC_FACTORY=0x...
VITE_BASE_FACTORY=0x...
VITE_HEDERA_FACTORY=0x...

# Optional
VITE_PLATFORM_FEE_ADDRESS=0x...
```

---

## ✅ Final Verification

Before going live:

1. ✅ All backend variables set in Railway
2. ✅ All frontend variables set in Vercel/Netlify
3. ✅ Backend health check passes
4. ✅ Frontend loads without errors
5. ✅ Token creation works on at least one chain
6. ✅ Wallet connection works
7. ✅ Hedera audit logging works (if using Hedera)
8. ✅ Database connection stable

---

**Report Generated:** $(date)  
**Verified By:** Auto (Cursor AI Assistant)  
**Next Steps:** Use this checklist to verify all production environment variables are correctly configured.
