# Backend Deployment Guide - Fix 405 Errors

## 🚨 Problem

You're getting **405 (Method Not Allowed)** errors because:
- ✅ Frontend is deployed on Vercel
- ❌ Backend is NOT deployed yet
- ❌ Frontend is trying to call `/api/*` but Vercel doesn't have these routes
- ❌ API requests are failing because there's no backend server

## 🎯 Solution: Deploy Backend to Railway (Recommended)

### Step 1: Create Railway Account

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your GitHub

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **`crossify-platform`** repository
4. Click **"Deploy Now"**

### Step 3: Configure Service

1. After deployment starts, click on the service
2. Go to **Settings** tab
3. Configure:

**Root Directory:**
- Set to: `backend`

**Start Command:**
- Set to: `npm start`

**Build Command:**
- Set to: `npm install && npm run build`

### Step 4: Set Environment Variables

Go to **Variables** tab and add:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://crossify-platform.vercel.app,https://crossify.io,https://www.crossify.io
DATABASE_PATH=/data/crossify.db

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Password Hash (use bcrypt to hash your password)
# To generate: node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10))"
ADMIN_PASSWORD_HASH=$2b$10$your-bcrypt-hash-here

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your-solana-private-key-base58

# Ethereum (Sepolia Testnet)
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# OR use public RPC:
# ETHEREUM_RPC_URL=https://rpc.sepolia.org

# BSC (Testnet)
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Base (Sepolia Testnet)
BASE_RPC_URL=https://sepolia.base.org

# Token Factory Addresses
TOKEN_FACTORY_ETHEREUM=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
TOKEN_FACTORY_BSC=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
TOKEN_FACTORY_BASE=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0

# Global Supply Tracker Addresses
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
GLOBAL_SUPPLY_TRACKER_BSCTESTNET=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
```

### Step 5: Add Database Volume (Persistent Storage)

1. Go to **Settings** → **Volumes**
2. Click **"Add Volume"**
3. Mount path: `/data`
4. This ensures the database persists across deployments

### Step 6: Get Railway URL

1. After deployment, Railway will provide a URL like:
   - `https://crossify-backend-production.up.railway.app`
2. Copy this URL

### Step 7: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_API_BASE`:
   - **Old:** `/api`
   - **New:** `https://your-railway-url.up.railway.app/api`
3. **Redeploy** the frontend (Vercel will auto-redeploy)

### Step 8: Update Backend CORS

Make sure your Railway backend URL is in the `CORS_ORIGIN` environment variable.

## 🔧 Alternative: Render Deployment

### Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect **`crossify-platform`** repository
3. Configure:
   - **Name:** `crossify-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### Step 3: Set Environment Variables

Same as Railway (see Step 4 above)

### Step 4: Get Render URL

Render will provide a URL like:
- `https://crossify-backend.onrender.com`

### Step 5: Update Vercel

Same as Railway (see Step 7 above)

## 🚀 Quick Deploy Script

If you want to deploy quickly, you can use Railway's CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Deploy
railway up
```

## ⚠️ Important Notes

### Database Persistence

- **Railway:** Use Volumes (recommended)
- **Render:** Database files in `/tmp` are NOT persistent
- Consider using a proper database (PostgreSQL, MongoDB) for production

### Environment Variables

- **Never commit** `.env` files to GitHub
- Use Railway/Render's environment variable interface
- Keep secrets secure

### CORS Configuration

Make sure to add your Vercel URL to `CORS_ORIGIN`:
```
CORS_ORIGIN=https://crossify-platform.vercel.app,https://crossify.io,https://www.crossify.io
```

## 📋 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Backend URL obtained
- [ ] `VITE_API_BASE` updated in Vercel
- [ ] Frontend redeployed
- [ ] Test token creation
- [ ] Test logo upload
- [ ] Test API endpoints
- [ ] Verify CORS is working

## 🔍 Troubleshooting

### Still Getting 405 Errors?

1. **Check backend URL:**
   - Verify backend is running: Visit `https://your-backend-url/api/health`
   - Should return a response

2. **Check CORS:**
   - Make sure Vercel URL is in `CORS_ORIGIN`
   - Check browser console for CORS errors

3. **Check Environment Variables:**
   - Verify `VITE_API_BASE` is set correctly in Vercel
   - Redeploy frontend after changing env vars

4. **Check Backend Logs:**
   - View logs in Railway/Render dashboard
   - Look for startup errors

### Database Issues?

- Railway: Make sure volume is mounted at `/data`
- Render: Consider using external database (PostgreSQL)

## 🎯 Next Steps After Backend Deployment

1. **Test API endpoints:**
   - Create a test token
   - Upload a logo
   - Verify all endpoints work

2. **Monitor logs:**
   - Watch for errors
   - Check performance

3. **Set up monitoring:**
   - Use Railway/Render's monitoring tools
   - Set up error tracking (Sentry)

---

**Status:** Ready to deploy backend 🚀

