# Adding Environment Variables to Railway Backend

## 🎯 Goal
Add the TokenFactory addresses and RPC URLs to Railway so the backend can sync tokens from the blockchain.

## 📋 Step-by-Step Instructions

### Step 1: Open Railway Dashboard
1. Go to [https://railway.app](https://railway.app)
2. Log in to your account
3. Find and click on your **"crossify-platform"** project

### Step 2: Open Service Settings
1. Click on the **"crossify-platform"** service (the main service box)
2. Click on the **"Variables"** tab (or **"Environment Variables"**)

### Step 3: Add TokenFactory Addresses
Click **"+ New Variable"** and add each of these:

**TokenFactory Addresses:**
```
ETHEREUM_FACTORY_ADDRESS=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
BSC_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BASE_FACTORY_ADDRESS=0x8eC132791e6897bDbe8dCd6849d51129A7630241
```

### Step 4: Add RPC URLs (if not already present)
Add or update these RPC URLs:

**RPC URLs:**
```
BASE_RPC_URL=https://base-sepolia.publicnode.com
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
BSC_RPC_URL=https://bsc-testnet.publicnode.com
```

**Note:** If you're using mainnet instead of testnet, update these to:
```
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

### Step 5: Save and Redeploy
1. After adding all variables, Railway will automatically **redeploy** your service
2. Wait for the deployment to complete (check the "Deployments" tab)
3. Verify the deployment succeeded (green checkmark)

### Step 6: Verify Setup
1. Check the logs to ensure the backend started successfully
2. Test the health endpoint:
   ```bash
   curl https://crossify-platform-production.up.railway.app/api/health
   ```
3. The backend should now be able to sync tokens from the blockchain!

## 📝 Complete List of Variables to Add

Copy and paste these into Railway (one variable per line):

```
ETHEREUM_FACTORY_ADDRESS=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
BSC_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BASE_FACTORY_ADDRESS=0x8eC132791e6897bDbe8dCd6849d51129A7630241
BASE_RPC_URL=https://base-sepolia.publicnode.com
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
BSC_RPC_URL=https://bsc-testnet.publicnode.com
```

## 🔍 Visual Guide

### Railway Dashboard Navigation:
```
Railway Dashboard
  └── Your Project (crossify-platform)
      └── Your Service (crossify-platform)
          └── Variables Tab ← Click here!
              └── + New Variable ← Add each variable here
```

### Variable Format in Railway:
- **Key:** `ETHEREUM_FACTORY_ADDRESS`
- **Value:** `0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0`
- Click **"Add"** after each variable

## ✅ Verification

After adding the variables and redeploying:

1. **Check Logs:**
   - Go to Railway → Your Service → "Logs" tab
   - Look for: `✅ Synced X tokens from blockchain` (when users visit dashboard)

2. **Test Token Sync:**
   - Visit your dashboard and connect your wallet
   - Your tokens should now appear (synced from blockchain)

3. **Check for Errors:**
   - If you see errors in logs about missing factory addresses, double-check the variable names
   - Make sure addresses are correct (no extra spaces)

## 🚨 Troubleshooting

### Variables Not Appearing
- Make sure you clicked "Add" after entering each variable
- Check the "Variables" tab to see all added variables
- Railway might need a few seconds to save

### Backend Not Syncing Tokens
- Check Railway logs for errors
- Verify factory addresses are correct
- Verify RPC URLs are accessible
- Make sure tokens were created through the TokenFactory contract

### Deployment Failed
- Check Railway logs for error messages
- Verify all required environment variables are set
- Make sure the backend code is up to date (pushed to GitHub)

## 📖 Next Steps

After adding the variables:
1. ✅ Backend will automatically redeploy
2. ✅ Wait for deployment to complete
3. ✅ Test by visiting your dashboard
4. ✅ Your tokens should now sync from the blockchain!

## 💡 Tips

- **Railway Auto-Deploys:** Railway automatically redeploys when you add environment variables
- **Case Sensitive:** Variable names are case-sensitive (e.g., `ETHEREUM_FACTORY_ADDRESS` not `ethereum_factory_address`)
- **No Spaces:** Make sure there are no spaces around the `=` sign
- **Testnet vs Mainnet:** Make sure your RPC URLs match your network (testnet vs mainnet)

---

**Need Help?** Check the Railway logs or see `BLOCKCHAIN_SYNC_SETUP.md` for more details about the sync functionality.












