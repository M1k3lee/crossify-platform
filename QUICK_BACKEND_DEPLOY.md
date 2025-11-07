# 🚀 Quick Backend Deployment (Fix 405 Errors)

## Problem
- Frontend is on Vercel ✅
- Backend is NOT deployed ❌
- API calls failing with 405 errors ❌

## Solution: Deploy Backend to Railway (5 minutes)

### Step 1: Go to Railway
1. Visit [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `crossify-platform`

### Step 2: Configure Service
1. Click on the deployed service
2. Go to **Settings** tab
3. Set **Root Directory:** `backend`
4. Set **Start Command:** `npm start`
5. Set **Build Command:** `npm install && npm run build`

### Step 3: Add Environment Variables
Go to **Variables** tab and add:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://crossify-platform.vercel.app,https://crossify.io,https://www.crossify.io
DATABASE_PATH=/data/crossify.db

# Generate these (see below)
JWT_SECRET=change-this-to-a-random-string
ADMIN_PASSWORD_HASH=change-this-to-bcrypt-hash

# RPC URLs (use public ones for now)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your-solana-private-key

ETHEREUM_RPC_URL=https://rpc.sepolia.org
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BASE_RPC_URL=https://sepolia.base.org

# Factory addresses
TOKEN_FACTORY_ETHEREUM=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
TOKEN_FACTORY_BSC=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
TOKEN_FACTORY_BASE=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0

GLOBAL_SUPPLY_TRACKER_SEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
GLOBAL_SUPPLY_TRACKER_BSCTESTNET=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
```

### Step 4: Generate Secrets

**JWT_SECRET:**
```bash
# Generate random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**ADMIN_PASSWORD_HASH:**
```bash
# Hash your admin password (use 'admin123' or your choice)
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10))"
```

### Step 5: Add Database Volume
1. Go to **Settings** → **Volumes**
2. Click **"Add Volume"**
3. Mount path: `/data`
4. This keeps your database between deployments

### Step 6: Get Backend URL
1. Railway will give you a URL like:
   - `https://crossify-backend-production-xxxx.up.railway.app`
2. Copy this URL

### Step 7: Update Vercel
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update `VITE_API_BASE`:
   - Change from: `/api`
   - Change to: `https://your-railway-url.up.railway.app/api`
3. **Redeploy** frontend (Vercel will auto-redeploy on env change, or click Redeploy)

### Step 8: Test
1. Visit your Vercel site
2. Try creating a token
3. Should work now! ✅

## Alternative: Render (if Railway doesn't work)

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `npm start`
5. Add same environment variables
6. Update Vercel `VITE_API_BASE` to Render URL

## Troubleshooting

### Still 405 errors?
- Check backend is running: Visit `https://your-backend-url/api/health`
- Should return: `{"status":"ok","service":"crossify-backend",...}`

### CORS errors?
- Make sure Vercel URL is in `CORS_ORIGIN` env var
- Format: `https://crossify-platform.vercel.app,https://crossify.io`

### Database errors?
- Make sure volume is mounted at `/data`
- Check Railway logs for errors

---

**Time to deploy: ~5-10 minutes** ⚡

