# Environment Variables to Add - Quick Reference

## 🔴 RAILWAY (Backend) - MUST ADD

Add these to **Railway** → Your backend service → **Variables** tab:

### Core (Required)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
CORS_ORIGIN=https://crossify.io,https://www.crossify.io
```

### TokenFactory Addresses (Production Mainnet)
```env
ETHEREUM_FACTORY_ADDRESS=0x...  # Your deployed TokenFactory on Ethereum mainnet
BSC_FACTORY_ADDRESS=0x...       # Your deployed TokenFactory on BSC mainnet
BASE_FACTORY_ADDRESS=0x...      # Your deployed TokenFactory on Base mainnet
```

### RPC URLs (Production Mainnet)
```env
ETHEREUM_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY  # Or Infura, QuickNode, etc.
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Hedera (Required for Audit Logging)
```env
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_HCS_TOPIC_ID=0.0.xxxxx  # Optional - auto-creates if not set
HEDERA_MAINNET=true  # Set to true for mainnet, omit for testnet
```

### DEX Graduation (Optional but Recommended)
```env
SOLANA_PRIVATE_KEY=...         # For Raydium pool creation
ETHEREUM_PRIVATE_KEY=0x...     # For Uniswap V3 pool creation
BSC_PRIVATE_KEY=0x...          # For PancakeSwap pool creation
BASE_PRIVATE_KEY=0x...         # For BaseSwap pool creation
```

**⚠️ Security Note:** DEX private keys should have minimal funds (only for gas/fees). Use a separate wallet.

---

## 🟢 GITHUB SECRETS (For GitHub Actions) - MUST ADD

Add these to **GitHub** → Your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

### Frontend Build Secrets (for deploy.yml)
```env
VITE_API_BASE=https://crossify-platform-production.up.railway.app
VITE_ETH_FACTORY=0x...              # Same as ETHEREUM_FACTORY_ADDRESS in Railway
VITE_BSC_FACTORY=0x...              # Same as BSC_FACTORY_ADDRESS in Railway
VITE_BASE_FACTORY=0x...             # Same as BASE_FACTORY_ADDRESS in Railway
VITE_HEDERA_FACTORY=0x...           # Your TokenFactory on Hedera (if using)
VITE_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
```

### Contract Testing Secrets (for contracts.yml - Optional)
```env
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com  # Only needed if running tests
ETHEREUM_PRIVATE_KEY=0x...                           # Only needed if deploying from GitHub Actions
```

**Note:** These are only needed if you plan to run contract tests or deploy contracts via GitHub Actions. If you deploy manually, you don't need these.

---

## 📋 Quick Checklist

### Railway Variables to Add:
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `CORS_ORIGIN` (your frontend domain)
- [ ] `ETHEREUM_FACTORY_ADDRESS` (mainnet)
- [ ] `BSC_FACTORY_ADDRESS` (mainnet)
- [ ] `BASE_FACTORY_ADDRESS` (mainnet)
- [ ] `ETHEREUM_MAINNET_RPC_URL` (reliable RPC provider)
- [ ] `BSC_MAINNET_RPC_URL`
- [ ] `BASE_MAINNET_RPC_URL`
- [ ] `SOLANA_RPC_URL`
- [ ] `HEDERA_ACCOUNT_ID`
- [ ] `HEDERA_PRIVATE_KEY`
- [ ] `HEDERA_MAINNET=true` (if using mainnet)
- [ ] `SOLANA_PRIVATE_KEY` (optional - for DEX graduation)
- [ ] `ETHEREUM_PRIVATE_KEY` (optional - for DEX graduation)
- [ ] `BSC_PRIVATE_KEY` (optional - for DEX graduation)
- [ ] `BASE_PRIVATE_KEY` (optional - for DEX graduation)

### GitHub Secrets to Add:
- [ ] `VITE_API_BASE` (Railway backend URL)
- [ ] `VITE_ETH_FACTORY` (same as Railway ETHEREUM_FACTORY_ADDRESS)
- [ ] `VITE_BSC_FACTORY` (same as Railway BSC_FACTORY_ADDRESS)
- [ ] `VITE_BASE_FACTORY` (same as Railway BASE_FACTORY_ADDRESS)
- [ ] `VITE_HEDERA_FACTORY` (if using Hedera)
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` (already have: `YOUR_WALLETCONNECT_PROJECT_ID`)

---

## 🎯 Priority Order

### Must Have (Block Production Launch):
1. ✅ **Railway:** `NODE_ENV`, `DATABASE_URL`, `CORS_ORIGIN`
2. ✅ **Railway:** TokenFactory addresses (at least one chain)
3. ✅ **Railway:** RPC URLs (matching chains)
4. ✅ **Railway:** Hedera credentials (`HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`)
5. ✅ **GitHub:** `VITE_WALLETCONNECT_PROJECT_ID` (if using GitHub Pages)

### Should Have (For Full Functionality):
6. ⚠️ **Railway:** All TokenFactory addresses (Ethereum, BSC, Base)
7. ⚠️ **Railway:** All RPC URLs
8. ⚠️ **Railway:** DEX private keys (for automatic graduation)

### Nice to Have (Optional):
9. 📝 **GitHub:** Contract testing secrets (only if deploying contracts via GitHub Actions)

---

## 🔍 Where to Find Values

### TokenFactory Addresses
- Check your deployment logs from when you deployed contracts
- Or query deployed contracts on each chain using block explorers
- Example: `https://basescan.org/address/YOUR_FACTORY_ADDRESS`

### RPC URLs (Mainnet - Use Reliable Providers)
- **Infura:** https://infura.io (free tier available)
- **Alchemy:** https://alchemy.com (free tier available)
- **QuickNode:** https://quicknode.com (free tier available)
- **Public RPCs:** Less reliable, may have rate limits

**Recommended for Production:**
```env
ETHEREUM_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org  # Public is fine for BSC
BASE_MAINNET_RPC_URL=https://mainnet.base.org  # Public is fine for Base
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # Or use Helius, QuickNode, etc.
```

### Hedera Credentials
- `HEDERA_ACCOUNT_ID`: From your HashPack wallet (format: `0.0.xxxxx`)
- `HEDERA_PRIVATE_KEY`: Export from HashPack wallet (64 hex chars)
- `HEDERA_HCS_TOPIC_ID`: Will be auto-created on first startup, or create manually and set

---

## ✅ Verification After Adding

### 1. Railway Health Check
```bash
curl https://crossify-platform-production.up.railway.app/api/health
```
Should return: `{"status":"ok","database":"connected",...}`

### 2. Check Railway Logs
Look for:
- ✅ `Database initialized`
- ✅ `Hedera Audit Service initialized`
- ✅ `Graduation monitoring service started`
- ✅ No errors about missing environment variables

### 3. Test Frontend (if using GitHub Pages)
- Frontend should load without console errors
- Wallet connection should work
- Token creation should work

---

## 🚨 Common Mistakes

1. ❌ **Wrong RPC URLs:** Using testnet RPCs in production
2. ❌ **Missing `/api`:** `VITE_API_BASE` should NOT include `/api` (frontend adds it)
3. ❌ **Wrong Hedera Network:** Forgetting to set `HEDERA_MAINNET=true` for mainnet
4. ❌ **CORS Mismatch:** `CORS_ORIGIN` doesn't match frontend domain exactly
5. ❌ **Factory Mismatch:** GitHub secrets don't match Railway factory addresses

---

## 📞 Need Help?

If any variable is unclear or you're not sure what value to use, check:
1. `PRODUCTION_ENV_VERIFICATION.md` - Full detailed explanation
2. `RAILWAY_ENV_SETUP.md` - Railway-specific setup guide
3. `WALLETCONNECT_ENV_SETUP.md` - WalletConnect setup

---

**Quick Action Items:**
1. ✅ Add Railway variables (priority: core + Hedera + RPC URLs)
2. ✅ Add GitHub secrets (priority: WalletConnect + Factory addresses)
3. ✅ Test backend health endpoint
4. ✅ Verify frontend loads correctly

---

**Last Updated:** $(date)


