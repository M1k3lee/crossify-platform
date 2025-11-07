# Quick Deployment Checklist for Crossify.io

## ✅ Pre-Deployment Steps

### 1. Code Preparation
- [ ] All code committed to GitHub
- [ ] No sensitive data in code (use environment variables)
- [ ] `.gitignore` is properly configured
- [ ] Build commands work locally

### 2. Environment Variables Ready
Prepare these values:
- [ ] WalletConnect Project ID (get from https://cloud.walletconnect.com)
- [ ] Backend deployment URL (Railway/Render)
- [ ] Admin password hash
- [ ] JWT secret
- [ ] RPC URLs for all chains
- [ ] Private keys (for backend only, never in frontend)

## 🚀 Deployment Steps

### Step 1: Deploy Backend First (Railway or Render)

**Railway (Recommended):**
1. [ ] Go to https://railway.app
2. [ ] Create new project
3. [ ] Add service from GitHub repo
4. [ ] Set root directory to `backend`
5. [ ] Set build command: `npm install && npm run build`
6. [ ] Set start command: `npm start`
7. [ ] Add environment variables (see VERCEL_DEPLOYMENT.md)
8. [ ] Deploy and get URL (e.g., `https://crossify-backend.railway.app`)
9. [ ] Test backend URL is accessible
10. [ ] Update CORS_ORIGIN to allow crossify.io

**Render:**
1. [ ] Go to https://render.com
2. [ ] Create new Web Service
3. [ ] Connect GitHub repo
4. [ ] Set root directory to `backend`
5. [ ] Configure build/start commands
6. [ ] Add environment variables
7. [ ] Deploy and get URL

### Step 2: Deploy Frontend to Vercel

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click "Add New Project"
3. [ ] Import `crossify-platform` repository
4. [ ] Configure project:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
5. [ ] Add environment variables:
   - `VITE_API_BASE` = your backend URL (e.g., `https://crossify-backend.railway.app/api`)
   - `VITE_WALLETCONNECT_PROJECT_ID` = your project ID
6. [ ] Click "Deploy"
7. [ ] Wait for deployment to complete
8. [ ] Test preview URL

### Step 3: Configure Domain (crossify.io)

1. [ ] In Vercel project, go to Settings → Domains
2. [ ] Click "Add Domain"
3. [ ] Enter: `crossify.io`
4. [ ] Choose configuration method:

   **Option A: Vercel Nameservers (Easiest)**
   - [ ] Copy nameservers from Vercel
   - [ ] Go to domain registrar
   - [ ] Update nameservers
   - [ ] Wait 24-48 hours for propagation

   **Option B: DNS Records (If keeping current nameservers)**
   - [ ] Add A record: `@` → `76.76.21.21`
   - [ ] Add CNAME: `www` → `cname.vercel-dns.com`
   - [ ] Wait for DNS propagation

5. [ ] Verify DNS propagation at https://www.whatsmydns.net
6. [ ] Wait for SSL certificate (automatic)
7. [ ] Test https://crossify.io

### Step 4: Post-Deployment Verification

#### Frontend Checks
- [ ] Site loads at https://crossify.io
- [ ] All pages accessible (Home, Builder, Marketplace, etc.)
- [ ] Wallet connections work (MetaMask, Phantom)
- [ ] API calls work (check browser console)
- [ ] Images and assets load
- [ ] No console errors

#### Backend Checks
- [ ] Backend URL is accessible
- [ ] API endpoints respond (test with Postman/curl)
- [ ] CORS allows crossify.io domain
- [ ] Database is initialized
- [ ] Admin dashboard accessible at `/admin`

#### Domain Checks
- [ ] Domain resolves correctly
- [ ] SSL certificate active (green lock in browser)
- [ ] www.crossify.io works (optional redirect)
- [ ] No mixed content warnings

## 🔧 Common Issues & Solutions

### Issue: 404 on page refresh
**Fix**: Verify `vercel.json` has proper rewrites

### Issue: API calls failing (CORS error)
**Fix**: 
- Check `CORS_ORIGIN` in backend includes `https://crossify.io`
- Verify `VITE_API_BASE` is correct in Vercel

### Issue: Build fails
**Fix**:
- Check build logs in Vercel
- Ensure all dependencies in package.json
- Try clearing Vercel build cache

### Issue: Domain not working
**Fix**:
- Verify DNS records are correct
- Wait for propagation (can take 24-48 hours)
- Check domain is added in Vercel dashboard

## 📝 Post-Deployment Tasks

- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Set up monitoring alerts
- [ ] Configure database backups
- [ ] Test all features end-to-end
- [ ] Update social media with live URL
- [ ] Submit to blockchain directories

## 🎉 You're Live!

Once all checks pass, your site is live at https://crossify.io!

**Next Steps:**
1. Share the launch on social media
2. Start building community
3. Gather user feedback
4. Plan presale/launch campaign


