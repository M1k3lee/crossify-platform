# Quick Vercel Deployment Steps

## ✅ Step 1: Import Project in Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select **`crossify-platform`** from your GitHub repositories
5. Click **"Import"**

## ✅ Step 2: Configure Project Settings

**IMPORTANT**: Configure these settings BEFORE clicking Deploy:

### Framework Preset
- Select: **"Vite"** (or "Other" if Vite not listed)

### Root Directory
- Click **"Edit"** next to Root Directory
- Select: **`frontend`**
- Click **"Continue"**

### Build Settings (should auto-detect, but verify):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## ✅ Step 3: Add Environment Variables

Click **"Environment Variables"** and add these:

### Required Variables:

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

**Note**: If you have a WalletConnect Project ID, add:
```
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
```

**Important**: 
- Select **"Production"** environment for all variables
- You can also add them to **"Preview"** and **"Development"** if needed

## ✅ Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-3 minutes)
3. You'll get a preview URL like: `https://crossify-platform-xxxxx.vercel.app`

## ✅ Step 5: Add Domain (crossify.io)

1. After deployment succeeds, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `crossify.io`
4. Click **"Add"**
5. Vercel will show DNS instructions

### DNS Configuration Options:

**Option A: Use Vercel Nameservers (Easiest)**
- Copy the nameservers shown (e.g., `ns1.vercel-dns.com`)
- Go to your domain registrar
- Update nameservers to Vercel's
- Wait 24-48 hours for propagation

**Option B: Add DNS Records (Keep Current Nameservers)**
- Add an A record:
  - Type: `A`
  - Name: `@`
  - Value: `76.76.21.21`
- Add a CNAME record:
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`

## ✅ Step 6: Verify Deployment

1. Visit your Vercel URL (or crossify.io after DNS propagates)
2. Check browser console for errors
3. Test wallet connections
4. Verify API calls work

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify Root Directory is set to `frontend`
- Check that all environment variables are set

### 404 on Page Refresh
- The `vercel.json` should handle this automatically
- If not, verify rewrites are configured

### API Calls Fail
- Check `VITE_API_BASE` is set to `/api` (for production)
- Backend needs to be deployed separately (Railway/Render)
- Update `VITE_API_BASE` to backend URL once backend is deployed

## 📝 Next Steps

After frontend is deployed:
1. Deploy backend to Railway or Render
2. Update `VITE_API_BASE` in Vercel to point to backend URL
3. Configure CORS on backend to allow crossify.io domain

---

**Ready to deploy!** 🚀

