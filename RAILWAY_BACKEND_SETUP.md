# Railway Backend Setup - Step by Step

## 🎯 Current Situation
- Railway has imported your entire `crossify-platform` repository
- It's trying to deploy the root directory (which doesn't work)
- We need to configure it to use the `backend` folder

## 📋 Step-by-Step Instructions

### Step 1: Open Service Settings
1. **Click on the "crossify-platform" component** (the box in the center)
   - OR click the **"Details"** button next to "Apply 2 changes"
   - This will open the service configuration

### Step 2: Configure Root Directory
1. Once the service details open, look for **"Settings"** tab
2. Scroll down to find **"Root Directory"** or **"Source"** section
3. Change the root directory from:
   - **Current:** `/` (or empty)
   - **Change to:** `backend`
4. Click **"Save"** or **"Apply"**

### Step 3: Configure Build Settings
Still in Settings, look for:

**Build Command:**
- Set to: `npm install && npm run build`

**Start Command:**
- Set to: `npm start`

### Step 4: Alternative - Create New Service
If you can't find the root directory setting, you can create a new service:

1. Click the **"+ Create"** button (top right)
2. Select **"GitHub Repo"**
3. Choose `crossify-platform` repository
4. In the setup wizard:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Click **"Deploy"**

### Step 5: Add Environment Variables
1. Go to **"Variables"** tab in your service
2. Add all the environment variables from `QUICK_BACKEND_DEPLOY.md`
3. **Important ones to add:**
   ```
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://crossify-platform.vercel.app,https://crossify.io
   DATABASE_PATH=/data/crossify.db
   JWT_SECRET=your-jwt-secret
   ADMIN_PASSWORD_HASH=your-admin-password-hash
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_PRIVATE_KEY=your-solana-private-key
   ETHEREUM_RPC_URL=https://rpc.sepolia.org
   BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
   BASE_RPC_URL=https://sepolia.base.org
   TOKEN_FACTORY_ETHEREUM=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
   TOKEN_FACTORY_BSC=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   TOKEN_FACTORY_BASE=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
   GLOBAL_SUPPLY_TRACKER_SEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
   GLOBAL_SUPPLY_TRACKER_BSCTESTNET=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
   GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
   ```

### Step 6: Add Database Volume
1. Go to **"Settings"** → **"Volumes"** (or "Storage")
2. Click **"Add Volume"**
3. Set mount path: `/data`
4. This keeps your database between deployments

### Step 7: Get Your Backend URL
1. After deployment succeeds, Railway will provide a URL
2. It will look like: `https://crossify-platform-production-xxxx.up.railway.app`
3. Copy this URL

### Step 8: Update Vercel
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update `VITE_API_BASE`:
   - Change from: `/api`
   - Change to: `https://your-railway-url.up.railway.app/api`
3. **Redeploy** frontend

## 🔍 Troubleshooting

### If "Root Directory" Setting is Not Visible:
1. Click on the service name (crossify-platform)
2. Go to **"Settings"** tab
3. Look for **"Source"** or **"Repository"** section
4. There should be a **"Root Directory"** field
5. If not, try the "New Service" approach (Step 4 above)

### If Deployment Fails:
1. Check the **"Logs"** tab to see error messages
2. Common issues:
   - Missing `package.json` in backend folder (should be there)
   - Missing environment variables
   - Wrong build/start commands

### Quick Test:
After deployment, visit:
- `https://your-railway-url.up.railway.app/api/health`
- Should return: `{"status":"ok","service":"crossify-backend",...}`

## 📝 Quick Reference

**What to configure:**
- ✅ Root Directory: `backend`
- ✅ Build Command: `npm install && npm run build`
- ✅ Start Command: `npm start`
- ✅ Environment Variables: Add all from guide
- ✅ Volume: `/data` for database

---

**Next:** Once backend is deployed, update Vercel with the backend URL!

