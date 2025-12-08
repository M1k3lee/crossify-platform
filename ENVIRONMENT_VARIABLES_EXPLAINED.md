# Environment Variables: GitHub Actions vs Railway

## Important Distinction

There are **two separate systems** for environment variables:

1. **GitHub Actions Secrets/Variables** - For CI/CD workflows (build, test, deploy)
2. **Railway Environment Variables** - For your deployed application runtime

---

## GitHub Actions Secrets/Variables

### What They're For:
- Used by GitHub Actions workflows (`.github/workflows/*.yml`)
- Only available during CI/CD runs
- **NOT** available to your running application

### When to Use:
- **Secrets**: Sensitive data needed during build/deploy (e.g., deployment keys, API keys for publishing)
- **Variables**: Non-sensitive config for workflows (e.g., build paths, test commands)

### Current Status:
- You have some secrets set (`VITE_API_BASE`, `VITE_HEDERA_FACTORY`, `VITE_WALLETCONNECT_PROJECT_ID`)
- These are likely used by your GitHub Actions workflows (if any)
- **These are NOT used by your running application**

---

## Railway Environment Variables

### What They're For:
- Used by your **running application** (backend/frontend)
- Available at runtime to your Node.js/Express backend
- **This is where your app reads config from**

### When to Use:
- **All runtime configuration** (database URLs, API keys, private keys, contract addresses)
- **Sensitive data** (private keys, database passwords)
- **Non-sensitive config** (RPC URLs, factory addresses)

### Current Status:
- ✅ You have these set in Railway (we saw them in screenshots):
  - `GLOBAL_SUPPLY_TRACKER_*`
  - `CROSS_CHAIN_SYNC_*`
  - `HEDERA_PRIVATE_KEY`
  - Factory addresses, RPC URLs, etc.

---

## What You Need for Cross-Chain Price Sync

### Required in Railway (Runtime):
```
# Private keys for cross-chain messaging (if you want backend to send messages)
ETHEREUM_PRIVATE_KEY=...
BASE_PRIVATE_KEY=...
BSC_PRIVATE_KEY=...

# GlobalSupplyTracker addresses (✅ Already set)
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x130195A8D09dfd99c36D5903B94088EDBD66533e
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0xe84Ae64735261F441e0bcB12bCf60630c5239ef4

# CrossChainSync addresses (✅ Already set)
CROSS_CHAIN_SYNC_SEPOLIA=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
CROSS_CHAIN_SYNC_BSC_TESTNET=0xf5446E2690B2eb161231fB647476A98e1b6b7736
```

### Optional in GitHub Actions (Only if you have workflows):
- Only needed if you have GitHub Actions workflows that:
  - Deploy contracts
  - Run tests that need these values
  - Build frontend with these values

---

## Answer to Your Question

### Should you set them as Repository Variables in GitHub?

**Only if:**
- You have GitHub Actions workflows that need them
- You want to use them during CI/CD (build, test, deploy)

**For your running application:**
- ❌ **NO** - GitHub Actions variables are NOT available to your Railway-deployed app
- ✅ **YES** - You need them in **Railway environment variables**

---

## Current Situation

### What's Working:
- ✅ Railway has the necessary addresses (GlobalSupplyTracker, CrossChainSync)
- ✅ Railway has Hedera private key
- ✅ Your app can read from Railway environment variables

### What's Missing (Optional):
- ⚠️ Private keys for Ethereum/Base/BSC in Railway
  - Only needed if you want backend to automatically send cross-chain messages
  - If not set, cross-chain sync still works via smart contracts
  - Backend just won't send messages automatically (non-critical)

### What's NOT Needed:
- ❌ You don't need to duplicate Railway variables in GitHub Actions
- ❌ GitHub Actions secrets won't help your running application

---

## Recommendation

### For Cross-Chain Price Sync:

1. **Keep Railway variables as-is** ✅
   - You already have the addresses you need
   - These are what your app uses at runtime

2. **Add private keys to Railway (optional)**:
   - Only if you want backend to send cross-chain messages
   - Go to Railway → Variables → Add:
     - `ETHEREUM_PRIVATE_KEY`
     - `BASE_PRIVATE_KEY`
     - `BSC_PRIVATE_KEY`

3. **GitHub Actions (only if needed)**:
   - Only add secrets/variables if you have workflows that need them
   - For example, if you have a workflow that:
     - Deploys contracts (needs private keys)
     - Builds frontend with API URLs (needs `VITE_API_BASE`)

---

## Summary

| Location | Purpose | Needed For App? |
|----------|---------|-----------------|
| **Railway Variables** | Runtime config | ✅ **YES** - This is what your app uses |
| **GitHub Actions Secrets** | CI/CD workflows | ❌ **NO** - Only for GitHub Actions |

**Bottom line:** Your Railway variables are correct. You don't need to duplicate them in GitHub Actions unless you have workflows that need them.

---

## Next Steps

1. ✅ **Railway variables are fine** - You have what you need
2. ⚠️ **Optional**: Add private keys to Railway if you want automatic cross-chain messaging
3. ✅ **Proceed with verification** - Run the verification scripts to check bonding curve configuration

The empty GitHub Actions secrets are fine - they're just for CI/CD, not your running app.

