# Railway Environment Variables Update Guide

## ✅ Yes, You Need to Update TokenFactory Addresses in Railway

The backend uses these addresses to sync tokens from the blockchain. **This is critical** for the `/my-tokens` endpoint to find your tokens.

## 📋 Current vs New Addresses

### Base Sepolia
- **OLD**: `0x8eC132791e6897bDbe8dCd6849d51129A7630241`
- **NEW**: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58` ✅
- **Status**: ⚠️ **MUST UPDATE**

### BSC Testnet
- **OLD**: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`
- **NEW**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E` ✅
- **Status**: ⚠️ **MUST UPDATE**

### Sepolia (Ethereum)
- **OLD**: `0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0`
- **NEW**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E` ✅
- **Status**: ⚠️ **MUST UPDATE**

## 🔧 How to Update in Railway

### Step 1: Go to Railway Dashboard
1. Navigate to https://railway.app
2. Select your `crossify-platform` project
3. Click on the service (likely `crossify-platform` or `backend`)
4. Go to the **Variables** tab

### Step 2: Update Factory Addresses

Update these three environment variables:

```env
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
ETHEREUM_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
```

### Step 3: Save and Redeploy

1. Click **Save** or the variables will auto-save
2. Railway will automatically redeploy your backend
3. Wait for deployment to complete (usually 1-2 minutes)

## ✅ Verification

After updating, verify the backend is working:

1. **Check Railway logs** for any errors
2. **Test the API**:
   - Call `/tokens/my-tokens?address=YOUR_WALLET_ADDRESS`
   - Should sync tokens from the new TokenFactory contracts
   - Should find your tokens on testnet

## 🎯 Why This is Important

The backend's `blockchainTokenSync.ts` service uses these factory addresses to:
- Query TokenFactory contracts for tokens created by users
- Sync tokens from blockchain to database
- Display tokens in the dashboard

**Without updating these addresses:**
- ❌ Backend will query OLD TokenFactory contracts
- ❌ Won't find tokens created with NEW TokenFactory
- ❌ Dashboard will show "No tokens yet" even if you created tokens
- ❌ Token sync won't work for new tokens

**After updating:**
- ✅ Backend will query NEW TokenFactory contracts
- ✅ Will find tokens created with the fixed BondingCurve
- ✅ Dashboard will show your tokens correctly
- ✅ Token sync will work properly

## 📝 Complete Railway Environment Variables

Here are all the factory-related variables you should have in Railway:

```env
# TokenFactory Addresses (REQUIRED - UPDATE THESE)
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
ETHEREUM_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E

# RPC URLs (Already configured, verify these are correct)
BASE_RPC_URL=https://base-sepolia.publicnode.com
BSC_RPC_URL=https://bsc-testnet.publicnode.com
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com

# Optional: Testnet-specific RPC URLs (can use these instead)
BASE_SEPOLIA_RPC_URL=https://base-sepolia.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
SEPOLIA_RPC_URL=https://eth-sepolia.publicnode.com
```

## 🚨 Important Notes

1. **Update Required**: You MUST update these addresses for the backend to work correctly
2. **Automatic Redeploy**: Railway will redeploy automatically when you save variables
3. **No Downtime**: The update should be seamless (Railway handles it)
4. **Test After Update**: Test the `/my-tokens` endpoint after updating

## 🔍 Testing After Update

Once you've updated the variables in Railway:

1. Wait for Railway to redeploy (check the Deployments tab)
2. Test the API endpoint:
   ```bash
   curl "https://your-railway-url.railway.app/tokens/my-tokens?address=YOUR_WALLET_ADDRESS"
   ```
3. Check Railway logs for any errors
4. Verify tokens are being synced correctly

---

**Status**: ⚠️ **ACTION REQUIRED** - Update these addresses in Railway ASAP!

