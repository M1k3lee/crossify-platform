# Railway Deployment Verification Checklist

## ✅ Changes Pushed
- ✅ Added `.nvmrc` file (Node 18)
- ✅ Added `engines` field to `package.json`
- ✅ Enhanced homepage with premium features
- ✅ All changes committed and pushed

## 🔍 Railway Configuration Check

### Step 1: Verify Service Settings

Go to Railway Dashboard → Your Service → **Settings** tab:

**Root Directory:**
- ✅ Should be: `backend`
- ❌ If empty or `/`, change it to `backend`

**Build Command:**
- ✅ Should be: `npm ci && npm run build`
- Or: `npm install && npm run build`

**Start Command:**
- ✅ Should be: `npm start`

**Node Version:**
- ✅ Should auto-detect from `.nvmrc` (Node 18)
- Or set manually: `NODE_VERSION=18` in Variables

### Step 2: Check Environment Variables

Go to **Variables** tab and verify these are set:

**Required:**
```
PORT=3001
NODE_ENV=production
```

**Database (choose one):**
```
# Option 1: PostgreSQL (Recommended)
DATABASE_URL=postgresql://... (from Railway PostgreSQL service)

# Option 2: SQLite (ephemeral - resets on deploy)
DATABASE_PATH=/data/crossify.db
```

**CORS:**
```
CORS_ORIGIN=https://crossify.io,https://www.crossify.io,https://crossify-platform.vercel.app
```

**Blockchain RPC URLs:**
```
SOLANA_RPC_URL=https://api.devnet.solana.com
ETHEREUM_RPC_URL=https://rpc.sepolia.org
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BASE_RPC_URL=https://sepolia.base.org
```

**Factory Addresses:**
```
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
# ... (add all factory addresses)
```

**Optional but Recommended:**
```
JWT_SECRET=<random-string>
ADMIN_PASSWORD_HASH=<bcrypt-hash>
SOLANA_PRIVATE_KEY=<your-key>
```

### Step 3: Monitor Deployment

1. **Go to Deployments tab**
2. **Click on the latest deployment**
3. **Check Build Logs:**
   - ✅ Should see: `npm ci` or `npm install`
   - ✅ Should see: `npm run build`
   - ✅ Should see: `tsc` (TypeScript compilation)
   - ✅ Should see: `Build completed successfully`
   - ❌ If errors, check specific error messages

4. **Check Start Logs:**
   - ✅ Should see: `✅ Database initialized`
   - ✅ Should see: `✅ Price sync service started`
   - ✅ Should see: `✅ Graduation monitoring service started`
   - ✅ Should see: `🚀 Server running on port 3001`
   - ❌ If errors, check specific error messages

### Step 4: Verify Service is Running

**Check Health Endpoint:**
```
https://your-railway-url.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

**Check API Endpoint:**
```
https://your-railway-url.up.railway.app/api/tokens
```

Should return token list (may be empty if no tokens yet).

## 🐛 Common Issues & Fixes

### Issue: "Build failed" or "You reached the start of the range"

**Possible Causes:**
1. **Build timeout** - Build taking too long
2. **Memory limit** - Running out of memory
3. **Node version mismatch** - Wrong Node version
4. **Missing dependencies** - Package installation failing

**Fixes:**
1. Check build logs for specific error
2. Verify Node version (should be 18 from `.nvmrc`)
3. Try simpler build command: `npm install && npm run build`
4. Check if all dependencies are in `package.json`

### Issue: "Start failed"

**Possible Causes:**
1. **Port conflict** - Port 3001 already in use
2. **Database connection error** - DATABASE_URL incorrect
3. **Missing environment variables** - Required vars not set
4. **TypeScript errors** - Build didn't catch all errors

**Fixes:**
1. Check start logs for specific error
2. Verify PORT environment variable
3. Check DATABASE_URL is correct
4. Verify all required env vars are set

### Issue: "Service not responding"

**Possible Causes:**
1. **Service crashed** - Check logs for errors
2. **Health check failing** - Service not starting
3. **CORS issues** - Frontend can't connect

**Fixes:**
1. Check Railway logs for crash errors
2. Verify health endpoint responds
3. Check CORS_ORIGIN includes your frontend URL

## 📊 Expected Logs on Successful Start

```
✅ Database initialized
✅ Redis initialized (or warning if not available)
✅ Price sync service started
✅ Unified liquidity pool monitoring started
✅ Cross-chain relayer service started
✅ Startup sync service started
✅ Holder count service started
✅ Liquidity monitoring service started
✅ Graduation monitoring service started
🚀 Server running on port 3001
```

## 🎯 Next Steps After Successful Deployment

1. **Update Frontend API URL:**
   - Go to Vercel/Netlify settings
   - Update `VITE_API_BASE` to: `https://your-railway-url.up.railway.app/api`
   - Redeploy frontend

2. **Test API Endpoints:**
   - Health check: `/api/health`
   - Tokens list: `/api/tokens`
   - Create token: `/api/tokens` (POST)

3. **Monitor Logs:**
   - Check Railway logs regularly
   - Watch for errors or warnings
   - Verify services are running

## 🔗 Useful Links

- Railway Dashboard: https://railway.app
- Railway Docs: https://docs.railway.app
- Railway Status: https://status.railway.app

## 📝 Notes

- Railway uses ephemeral storage by default (files reset on deploy)
- Use PostgreSQL for persistent database
- Free tier has resource limits
- Builds may take 2-5 minutes
- First deployment may take longer

















