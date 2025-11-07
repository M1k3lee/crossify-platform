# Vercel Deployment Guide for Crossify.io

This guide will walk you through deploying Crossify.io to Vercel and connecting your domain.

## Prerequisites

- ✅ Vercel account created
- ✅ GitHub repository linked (crossify-platform)
- ✅ Domain: crossify.io (ready to configure)

## Step 1: Prepare Repository

### 1.1 Ensure all files are committed
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Configure Vercel Project

### 2.1 Initial Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your `crossify-platform` repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (or leave as root if using vercel.json)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`

### 2.2 Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

**Production:**
```
VITE_API_BASE=https://your-backend-url.railway.app/api
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NODE_ENV=production
```

**Preview:**
```
VITE_API_BASE=/api
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NODE_ENV=development
```

## Step 3: Deploy Backend Separately

⚠️ **Important**: The backend needs to be deployed separately as Vercel serverless functions have limitations.

### Option A: Deploy to Railway (Recommended)
1. Go to [Railway](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add service → Select `backend` folder
5. Set environment variables:
   ```
   PORT=3001
   CORS_ORIGIN=https://crossify.io
   DATABASE_PATH=/data/crossify.db
   JWT_SECRET=your-jwt-secret
   ADMIN_PASSWORD_HASH=your-admin-password-hash
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_PRIVATE_KEY=your-solana-private-key
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-key
   BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
   BASE_RPC_URL=https://sepolia.base.org
   ```
6. Get Railway URL (e.g., `https://crossify-backend.railway.app`)
7. Update `VITE_API_BASE` in Vercel to point to Railway URL

### Option B: Deploy to Render
1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Set environment variables (same as Railway)
6. Update `VITE_API_BASE` in Vercel

## Step 4: Deploy Frontend to Vercel

### 4.1 First Deployment
1. In Vercel Dashboard, click "Deploy"
2. Wait for build to complete
3. You'll get a preview URL (e.g., `https://crossify-platform.vercel.app`)

### 4.2 Verify Deployment
- Visit the preview URL
- Check that frontend loads correctly
- Test wallet connections
- Verify API calls work (may need backend deployed first)

## Step 5: Configure Domain (crossify.io)

### 5.1 Add Domain in Vercel
1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter: `crossify.io`
4. Click "Add"
5. Vercel will show DNS configuration needed

### 5.2 Configure DNS Records

**Option A: Vercel Nameservers (Recommended)**
1. Copy the nameservers from Vercel
2. Go to your domain registrar (where you bought crossify.io)
3. Update nameservers to Vercel's nameservers
4. Wait for DNS propagation (can take 24-48 hours)

**Option B: DNS Records (If keeping current nameservers)**
Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5.3 Wait for DNS Propagation
- Use [whatsmydns.net](https://www.whatsmydns.net) to check propagation
- Usually takes 1-24 hours
- SSL certificate will auto-generate once DNS is configured

### 5.4 Verify SSL
- Vercel automatically provisions SSL certificates
- Once DNS is configured, SSL will be active
- Your site will be accessible at `https://crossify.io`

## Step 6: Post-Deployment Checklist

### 6.1 Frontend Verification
- [ ] Site loads at https://crossify.io
- [ ] All pages are accessible
- [ ] Wallet connections work
- [ ] API calls are successful
- [ ] Images and assets load correctly

### 6.2 Backend Verification
- [ ] Backend is accessible at Railway/Render URL
- [ ] API endpoints respond correctly
- [ ] Database is initialized
- [ ] CORS is configured for crossify.io domain
- [ ] Admin dashboard is accessible

### 6.3 Domain Verification
- [ ] Domain redirects correctly
- [ ] SSL certificate is active (green lock)
- [ ] www.crossify.io redirects to crossify.io (optional)

## Step 7: Environment-Specific Configuration

### 7.1 Update CORS in Backend
In your backend `.env` or Railway/Render environment variables:
```
CORS_ORIGIN=https://crossify.io,https://www.crossify.io
```

### 7.2 Update Frontend API Base
In Vercel environment variables:
```
VITE_API_BASE=https://your-backend-url.railway.app/api
```

## Step 8: Continuous Deployment

Vercel automatically deploys on every push to main branch:
- Push to `main` → Automatic production deployment
- Push to other branches → Preview deployments
- Pull requests → Preview deployments with comments

## Troubleshooting

### Issue: 404 on refresh
**Solution**: Ensure `vercel.json` has proper rewrites configured

### Issue: API calls failing
**Solution**: 
- Check `VITE_API_BASE` environment variable
- Verify backend CORS allows crossify.io
- Check backend is deployed and accessible

### Issue: Domain not working
**Solution**:
- Verify DNS records are correct
- Wait for DNS propagation (can take 24-48 hours)
- Check domain is added in Vercel dashboard

### Issue: Build failing
**Solution**:
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Domain Configuration](https://vercel.com/docs/concepts/projects/domains)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check Railway/Render logs for backend
3. Verify environment variables are set correctly
4. Check DNS propagation status

---

**Next Steps After Deployment:**
1. Set up monitoring (Vercel Analytics)
2. Configure error tracking (Sentry)
3. Set up CI/CD for automated testing
4. Configure CDN for static assets
5. Set up database backups


