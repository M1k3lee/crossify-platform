# Vercel Deployment Checklist

## ✅ Before Deploying

### 1. Verify GitHub Repository
- [x] All code committed and pushed to GitHub
- [x] Repository: `crossify-platform`
- [x] Branch: `main`

### 2. Check Vercel Project Configuration

**If project already exists:**
- [x] Vercel project connected to GitHub repo
- [ ] Root Directory set to `frontend`
- [ ] Framework: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

**If creating new project:**
- Follow steps in `VERCEL_DEPLOYMENT_STEPS.md`

### 3. Environment Variables (CRITICAL)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these for **Production** environment:

```
VITE_ETH_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_BSC_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BASE_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_GLOBAL_SUPPLY_TRACKER_SEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
VITE_GLOBAL_SUPPLY_TRACKER_BSCTESTNET=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
VITE_GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
VITE_API_BASE=/api
NODE_ENV=production
```

**Optional (but recommended):**
```
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

**⚠️ IMPORTANT**: 
- Set `VITE_API_BASE=/api` for now (frontend will use same domain)
- After backend is deployed, update to backend URL (e.g., `https://crossify-backend.railway.app/api`)

### 4. Backend Deployment Status

**Current Status**: Frontend uses `/api` which expects backend on same domain or needs proxy.

**Options:**
1. **Option A**: Deploy backend separately (Railway/Render) → Update `VITE_API_BASE` to backend URL
2. **Option B**: Use Vercel serverless functions for API (future enhancement)

**For now**: Set `VITE_API_BASE=/api` - frontend will work but API calls will fail until backend is deployed separately.

## 🚀 Deployment Steps

### Step 1: Trigger Deployment

**If Vercel is connected to GitHub (auto-deploy enabled):**
- ✅ Just push to `main` branch (already done!)
- ✅ Vercel will automatically deploy
- ✅ Check Vercel dashboard for deployment status

**If auto-deploy is NOT enabled:**
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click **"Redeploy"** or **"Deploy"**
5. Select latest commit
6. Click **"Redeploy"**

### Step 2: Monitor Build

1. Watch build logs in Vercel dashboard
2. Check for any build errors
3. Verify build completes successfully

### Step 3: Verify Deployment

After successful deployment:
1. Visit your Vercel URL (e.g., `https://crossify-platform.vercel.app`)
2. Check browser console for errors
3. Test navigation between pages
4. Verify wallet connection works
5. **Note**: API calls will fail until backend is deployed (expected)

### Step 4: Add Domain (crossify.io)

1. Go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `crossify.io`
4. Click **"Add"**
5. Follow DNS configuration instructions

## ⚠️ Important Notes

### Backend Dependency

The frontend **requires a backend** for:
- Token creation
- Token deployment
- Price data
- Market depth
- Transactions
- Admin dashboard

**Current Setup:**
- Frontend: `VITE_API_BASE=/api` (expects backend on same domain)
- **This won't work** until backend is deployed separately

**Solution Options:**

**Option 1: Deploy Backend to Railway (Recommended)**
1. Deploy backend to Railway
2. Get backend URL (e.g., `https://crossify-backend.railway.app`)
3. Update `VITE_API_BASE` in Vercel to: `https://crossify-backend.railway.app/api`
4. Update backend CORS to allow `https://crossify.io`

**Option 2: Use Vercel API Routes (Future)**
- Convert backend to Vercel serverless functions
- Deploy API routes alongside frontend
- More complex, requires refactoring

### Current Workaround

For now, you can:
1. Deploy frontend to Vercel ✅
2. Run backend locally for testing
3. Use Vercel preview URL for frontend
4. Deploy backend to Railway/Render later

## 📋 Post-Deployment Checklist

### Frontend
- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] No console errors (except API errors - expected)
- [ ] Wallet connections work
- [ ] Navigation works
- [ ] Images/assets load

### Backend (After Deployment)
- [ ] Backend URL accessible
- [ ] API endpoints respond
- [ ] CORS configured for crossify.io
- [ ] Database initialized
- [ ] Admin dashboard works
- [ ] Token creation works
- [ ] Price data loads

### Domain
- [ ] DNS configured
- [ ] Domain resolves
- [ ] SSL certificate active
- [ ] www.crossify.io works (if configured)

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify Root Directory is `frontend`
- Check environment variables are set
- Verify `package.json` has correct build script

### API Calls Fail (Expected Until Backend Deployed)
- This is normal if backend isn't deployed
- Frontend will work but features requiring API won't
- Deploy backend to Railway/Render to fix

### 404 on Page Refresh
- Verify `vercel.json` has rewrites configured
- Should be automatically handled by our config

### Environment Variables Not Working
- Make sure variables start with `VITE_`
- Redeploy after adding variables
- Check variable names are correct

## 🎯 Quick Answer

**Should you press deploy again?**

**If Vercel is connected to GitHub:**
- ✅ **No need to press deploy** - it auto-deploys on push
- ✅ Check Vercel dashboard to see if deployment is running
- ✅ If not auto-deploying, then press "Redeploy"

**If creating new project:**
- ✅ Press "Deploy" after configuring settings
- ✅ Make sure environment variables are set first

## 📝 Next Steps After Frontend Deploys

1. **Deploy Backend** to Railway or Render
2. **Update `VITE_API_BASE`** in Vercel to backend URL
3. **Configure CORS** on backend for crossify.io
4. **Test end-to-end** functionality
5. **Add domain** crossify.io
6. **Verify SSL** certificate

---

**Status**: Ready to deploy! 🚀

