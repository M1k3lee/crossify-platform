# Railway Environment Variables - Changes Needed

## 🚨 CRITICAL: You're Using Testnet URLs in Production!

I can see you have **testnet RPC URLs** but your environment is marked as "production". For public launch, you need **mainnet** configuration.

---

## ❌ CHANGE THESE (Testnet → Mainnet)

### 1. Change RPC URLs to Mainnet

**Current (Testnet):**
```env
BASE_RPC_URL=https://base-sepolia.publicnode.com  ❌
BSC_RPC_URL=https://bsc-testnet.publicnode.com    ❌
ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com  ❌
```

**Should Be (Mainnet):**
```env
BASE_RPC_URL=https://mainnet.base.org
# OR better:
BASE_MAINNET_RPC_URL=https://mainnet.base.org

BSC_RPC_URL=https://bsc-dataseed.binance.org
# OR better:
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
# OR better (use Infura/Alchemy/QuickNode):
ETHEREUM_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

**⚠️ Important:** For Ethereum mainnet, use a reliable RPC provider (Infura, Alchemy, QuickNode) - public RPCs can be slow/unreliable.

### 2. Change Hedera to Mainnet

**Current:**
```env
HEDERA_NETWORK=testnet  ❌
```

**Should Be:**
```env
HEDERA_NETWORK=mainnet
# OR remove HEDERA_NETWORK and set:
HEDERA_MAINNET=true
NODE_ENV=production  # This triggers mainnet in code
```

**Note:** Your Hedera credentials look good (`HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`, `HEDERA_HCS_TOPIC_ID`). Just verify they're for mainnet, not testnet.

---

## ✅ ADD THESE (Missing Critical Variables)

### Core Application Settings

```env
NODE_ENV=production
```

**Why:** Your backend needs to know it's in production mode. Currently missing!

```env
CORS_ORIGIN=https://crossify.io,https://www.crossify.io
```

**Why:** Required for frontend to communicate with backend. Replace with your actual frontend domain(s).

### Solana Configuration

```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**Why:** Missing entirely! Needed for Solana token operations and DEX graduation to Raydium.

**Optional (better):** Use a reliable Solana RPC provider:
```env
SOLANA_RPC_URL=https://your-endpoint.helius.dev?api-key=YOUR_KEY
# OR
SOLANA_RPC_URL=https://solana-mainnet.quicknode.com/YOUR_KEY
```

---

## ⚠️ OPTIONAL BUT RECOMMENDED (For DEX Graduation)

These are needed if you want automatic DEX pool creation when tokens graduate:

```env
SOLANA_PRIVATE_KEY=...
ETHEREUM_PRIVATE_KEY=0x...
BSC_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...
```

**Security Note:** 
- Create separate wallets for these (don't use your main deployer key)
- Fund them with minimal amounts (only for gas/fees)
- These are ONLY used for creating DEX pools, not for token creation

**If you skip these:** Graduation will still be detected, but DEX pool creation will fail gracefully (logged as warnings).

---

## ✅ KEEP THESE (Already Correct)

These are good and don't need changes:
- ✅ `DATABASE_URL` - Looks correct
- ✅ `BASE_FACTORY_ADDRESS` - Keep as is
- ✅ `BSC_FACTORY_ADDRESS` - Keep as is  
- ✅ `ETHEREUM_FACTORY_ADDRESS` - Keep as is
- ✅ `GLOBAL_SUPPLY_TRACKER_*` - Keep as is
- ✅ `CROSS_CHAIN_SYNC_*` - Keep as is
- ✅ `CLOUDINARY_*` - Keep as is
- ✅ `HEDERA_ACCOUNT_ID` - Keep as is (verify it's mainnet account)
- ✅ `HEDERA_PRIVATE_KEY` - Keep as is (verify it's mainnet key)
- ✅ `HEDERA_HCS_TOPIC_ID` - Keep as is (verify it's mainnet topic)
- ✅ `VITE_HEDERA_FACTORY` - Keep as is (though VITE_* vars are usually for frontend)
- ✅ `WALLETCONNECT_PROJECT_ID` - Keep as is

---

## 📋 Complete Checklist

### Must Change (Testnet → Mainnet):

- [ ] `BASE_RPC_URL`: Change to `https://mainnet.base.org` OR set `BASE_MAINNET_RPC_URL`
- [ ] `BSC_RPC_URL`: Change to `https://bsc-dataseed.binance.org` OR set `BSC_MAINNET_RPC_URL`
- [ ] `ETHEREUM_RPC_URL`: Change to mainnet RPC (Infura/Alchemy) OR set `ETHEREUM_MAINNET_RPC_URL`
- [ ] `HEDERA_NETWORK`: Change to `mainnet` OR remove and set `HEDERA_MAINNET=true`

### Must Add:

- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN=https://crossify.io` (replace with your actual domain)
- [ ] `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com` (or better provider)

### Should Add (Optional but Recommended):

- [ ] `SOLANA_PRIVATE_KEY` (for Raydium graduation)
- [ ] `ETHEREUM_PRIVATE_KEY` (for Uniswap V3 graduation)
- [ ] `BSC_PRIVATE_KEY` (for PancakeSwap graduation)
- [ ] `BASE_PRIVATE_KEY` (for BaseSwap graduation)

---

## 🎯 Quick Action Items

1. **Change testnet URLs to mainnet** (highest priority!)
2. **Add `NODE_ENV=production`** (required!)
3. **Add `CORS_ORIGIN`** (required for frontend!)
4. **Add `SOLANA_RPC_URL`** (required for Solana support!)
5. **Change `HEDERA_NETWORK=testnet` to `mainnet`** (if using Hedera in production)
6. **Optional:** Add DEX private keys (for automatic graduation)

---

## ⚠️ Important Notes

### About Factory Addresses
Your factory addresses might be on testnet. **Verify:**
- `ETHEREUM_FACTORY_ADDRESS=0x8eF1A74d477448630282EFC130ac9D17f495Bca4` - Check if this is mainnet or Sepolia
- `BSC_FACTORY_ADDRESS=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6` - Check if this is mainnet or testnet
- `BASE_FACTORY_ADDRESS=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58` - Check if this is mainnet or Sepolia

**How to check:** Look up the address on block explorers:
- Ethereum: https://etherscan.io/address/YOUR_ADDRESS
- BSC: https://bscscan.com/address/YOUR_ADDRESS
- Base: https://basescan.org/address/YOUR_ADDRESS

If they're on testnet, you'll need to **redeploy them to mainnet** and update the addresses.

### About Hedera
Your Hedera configuration shows testnet. If you want to use Hedera in production:
1. Verify your `HEDERA_ACCOUNT_ID` is for mainnet (not testnet)
2. Create a new HCS topic on mainnet (or verify your topic ID is for mainnet)
3. Change `HEDERA_NETWORK=testnet` to `HEDERA_NETWORK=mainnet`

---

## 🔍 Verification After Changes

1. **Redeploy backend** (Railway will auto-redeploy when you save variables)
2. **Check logs** for startup messages:
   - ✅ `NODE_ENV: production`
   - ✅ `Database initialized`
   - ✅ `Hedera Audit Service initialized (mainnet)` or similar
3. **Test health endpoint:**
   ```bash
   curl https://crossify-platform-production.up.railway.app/api/health
   ```
4. **Verify no errors** about missing variables or wrong network

---

**Priority Order:**
1. 🔴 **CRITICAL:** Change testnet → mainnet URLs
2. 🔴 **CRITICAL:** Add `NODE_ENV=production`
3. 🔴 **CRITICAL:** Add `CORS_ORIGIN`
4. 🔴 **CRITICAL:** Add `SOLANA_RPC_URL`
5. 🟡 **IMPORTANT:** Verify factory addresses are on mainnet
6. 🟡 **IMPORTANT:** Update Hedera to mainnet
7. 🟢 **OPTIONAL:** Add DEX private keys

---

**Last Updated:** $(date)



