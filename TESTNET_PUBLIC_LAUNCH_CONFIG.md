# Testnet Public Launch Configuration

**Date:** $(date)  
**Launch Type:** Public Testnet Launch (Not Mainnet)

---

## ✅ GOOD NEWS: Your Testnet Setup is Correct!

Since you're launching **publicly on testnet** (not mainnet), your current factory addresses and RPC URLs are **PERFECT**! 

All your testnet deployments are verified and ready:
- ✅ Ethereum Sepolia: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- ✅ BSC Testnet: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- ✅ Base Sepolia: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- ✅ Hedera Testnet: `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D`

---

## 🔴 RAILWAY (Backend) - Changes Needed for Testnet Launch

### ✅ KEEP THESE (Already Correct for Testnet)
- `BASE_RPC_URL=https://base-sepolia-rpc.publicnode.com` ✅ Keep as is
- `BSC_RPC_URL=https://bsc-testnet.publicnode.com` ✅ Keep as is
- `ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com` ✅ Keep as is
- `BASE_FACTORY_ADDRESS=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58` ✅ Keep as is
- `BSC_FACTORY_ADDRESS=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6` ✅ Keep as is
- `ETHEREUM_FACTORY_ADDRESS=0x8eF1A74d477448630282EFC130ac9D17f495Bca4` ✅ Keep as is
- `VITE_HEDERA_FACTORY=0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D` ✅ Keep as is
- `HEDERA_NETWORK=testnet` ✅ Keep as is (testnet is correct)

### 🔴 ADD THESE (Missing Critical Variables)

#### Core Application Settings
```env
NODE_ENV=production
```
**Why:** Even though using testnet, backend should run in `production` mode for performance and logging. This doesn't affect which blockchain network you use.

```env
CORS_ORIGIN=https://crossify.io,https://www.crossify.io
```
**Why:** Required for frontend to communicate with backend. Replace with your actual frontend domain(s).

#### Solana Configuration
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
```
**Why:** Missing entirely! Needed for Solana token operations and DEX graduation to Raydium.

**Note:** For testnet, you can use public RPC or a testnet-specific provider.

#### Hedera Configuration
**Your Hedera config is already correct for testnet:**
- ✅ `HEDERA_NETWORK=testnet` (keep this!)
- ✅ `HEDERA_ACCOUNT_ID=YOUR_HEDERA_ACCOUNT_ID` (testnet account)
- ✅ `HEDERA_PRIVATE_KEY=...` (testnet key)
- ✅ `HEDERA_HCS_TOPIC_ID=YOUR_HEDERA_HCS_TOPIC_ID` (testnet topic)

**✅ DO NOT change these to mainnet** - they're correct for testnet launch!

---

## 🟡 OPTIONAL (For DEX Graduation on Testnet)

These are needed if you want automatic DEX pool creation when tokens graduate on testnet:

```env
SOLANA_PRIVATE_KEY=...         # For Raydium DEVNET pool creation
ETHEREUM_PRIVATE_KEY=0x...     # For Uniswap V3 SEPOLIA pool creation
BSC_PRIVATE_KEY=0x...          # For PancakeSwap TESTNET pool creation
BASE_PRIVATE_KEY=0x...         # For BaseSwap SEPOLIA pool creation
```

**Security Note:** 
- Use testnet wallets with testnet tokens
- These are only for creating testnet DEX pools
- Not required for basic functionality, only for automatic graduation

---

## 📋 Railway Variables Checklist (Testnet Launch)

### ✅ Already Correct (Keep These):
- [x] `BASE_RPC_URL` (testnet)
- [x] `BSC_RPC_URL` (testnet)
- [x] `ETHEREUM_RPC_URL` (testnet)
- [x] `BASE_FACTORY_ADDRESS` (testnet)
- [x] `BSC_FACTORY_ADDRESS` (testnet)
- [x] `ETHEREUM_FACTORY_ADDRESS` (testnet)
- [x] `VITE_HEDERA_FACTORY` (testnet)
- [x] `HEDERA_NETWORK=testnet`
- [x] `HEDERA_ACCOUNT_ID` (testnet)
- [x] `HEDERA_PRIVATE_KEY` (testnet)
- [x] `HEDERA_HCS_TOPIC_ID` (testnet)
- [x] `GLOBAL_SUPPLY_TRACKER_*` (all testnet)
- [x] `CROSS_CHAIN_SYNC_*` (all testnet)
- [x] `CLOUDINARY_*` (good)
- [x] `DATABASE_URL` (good)

### 🔴 Must Add:
- [ ] `NODE_ENV=production` (backend mode, not network)
- [ ] `CORS_ORIGIN=https://crossify.io` (your frontend domain)
- [ ] `SOLANA_RPC_URL=https://api.devnet.solana.com` (for Solana testnet)

### 🟡 Should Add (Optional):
- [ ] `SOLANA_PRIVATE_KEY` (for Raydium graduation)
- [ ] `ETHEREUM_PRIVATE_KEY` (for Uniswap graduation)
- [ ] `BSC_PRIVATE_KEY` (for PancakeSwap graduation)
- [ ] `BASE_PRIVATE_KEY` (for BaseSwap graduation)

---

## 🟢 FRONTEND (Vercel/Netlify) - Testnet Launch

### ✅ Keep These (Already Correct):
- `VITE_API_BASE=https://crossify-platform-production.up.railway.app` ✅
- `VITE_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID` ✅
- `VITE_ETH_FACTORY=0x8eF1A74d477448630282EFC130ac9D17f495Bca4` ✅ (testnet - correct!)
- `VITE_BSC_FACTORY=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6` ✅ (testnet - correct!)
- `VITE_BASE_FACTORY=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58` ✅ (testnet - correct!)
- `VITE_HEDERA_FACTORY=0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D` ✅ (testnet - correct!)

**✅ All frontend variables are correct for testnet launch!**

---

## 🔍 Key Differences: Testnet vs Mainnet Launch

| Item | Testnet Launch (Your Choice) | Mainnet Launch (Future) |
|------|------------------------------|-------------------------|
| Factory Addresses | ✅ Current (testnet) | Deploy new to mainnet |
| RPC URLs | ✅ Current (testnet) | Change to mainnet RPCs |
| Hedera Network | ✅ `testnet` | Change to `mainnet` |
| Hedera Account | ✅ Testnet account | Use mainnet account |
| Solana RPC | ✅ Devnet | Use mainnet RPC |
| NODE_ENV | ✅ `production` (mode) | `production` (mode) |
| CORS_ORIGIN | ✅ Frontend domain | Frontend domain |

**Note:** `NODE_ENV=production` means backend runs in production **mode** (performance, logging), not that you're using mainnet blockchain. These are separate things!

---

## ✅ What's Ready for Testnet Launch

### ✅ Contracts (All Verified on Testnet):
- ✅ Ethereum Sepolia TokenFactory: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- ✅ BSC Testnet TokenFactory: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- ✅ Base Sepolia TokenFactory: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- ✅ Hedera Testnet TokenFactory: `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D`

### ✅ Cross-Chain Infrastructure (All Testnet):
- ✅ All GlobalSupplyTracker contracts deployed and configured
- ✅ All CrossChainSync contracts deployed and configured
- ✅ Cross-chain sync working on testnets

### ✅ Backend Configuration:
- ✅ Database configured
- ✅ Testnet RPC URLs configured
- ✅ Testnet factory addresses configured
- ✅ Hedera testnet configured
- ⚠️ Missing: `NODE_ENV=production`
- ⚠️ Missing: `CORS_ORIGIN`
- ⚠️ Missing: `SOLANA_RPC_URL`

---

## 🎯 Quick Action Items for Testnet Launch

1. ✅ **Keep testnet RPC URLs** (don't change to mainnet)
2. ✅ **Keep testnet factory addresses** (don't change)
3. ✅ **Keep Hedera testnet config** (don't change to mainnet)
4. 🔴 **Add `NODE_ENV=production`** (backend mode)
5. 🔴 **Add `CORS_ORIGIN`** (frontend domain)
6. 🔴 **Add `SOLANA_RPC_URL`** (testnet RPC)
7. 🟡 **Optional:** Add DEX private keys (for graduation)

---

## 🚨 Important Notes

1. **NODE_ENV vs Network:**
   - `NODE_ENV=production` = Backend runs in production **mode** (performance, logging, error handling)
   - This is **NOT** related to which blockchain network you use
   - You can use `NODE_ENV=production` with testnet blockchains

2. **Testnet vs Mainnet:**
   - Testnet = Free tokens, no real value, for testing
   - Mainnet = Real tokens, real value, real money
   - Your current setup is **testnet** (correct for public testing)

3. **Public Testnet Launch:**
   - Users will use testnet tokens (no real value)
   - Perfect for public testing before mainnet
   - Allows users to test without financial risk
   - Common practice before mainnet launch

---

## ✅ Final Checklist for Testnet Public Launch

### Railway (Backend):
- [x] All testnet factory addresses ✅
- [x] All testnet RPC URLs ✅
- [x] Hedera testnet configured ✅
- [x] Cross-chain infrastructure configured ✅
- [ ] `NODE_ENV=production` ⚠️ **ADD THIS**
- [ ] `CORS_ORIGIN=...` ⚠️ **ADD THIS**
- [ ] `SOLANA_RPC_URL=...` ⚠️ **ADD THIS**

### Frontend:
- [x] All testnet factory addresses ✅
- [x] WalletConnect configured ✅
- [x] API base URL configured ✅

---

## 🎉 Conclusion

**Your testnet configuration is excellent!** You just need to add:
1. `NODE_ENV=production` (backend mode)
2. `CORS_ORIGIN` (frontend domain)
3. `SOLANA_RPC_URL` (Solana testnet)

**Everything else is perfect for public testnet launch!**

---

**Last Updated:** $(date)  
**Launch Type:** Public Testnet Launch



