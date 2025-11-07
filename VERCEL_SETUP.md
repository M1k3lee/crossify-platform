# Vercel Deployment Setup for Crossify.io

## ✅ Pre-Deployment Checklist

- [x] Contracts deployed and tested
- [x] Token ownership verified
- [x] Environment variables ready
- [ ] Vercel project configured
- [ ] Domain configured

## Step 1: Vercel Project Configuration

### 1.1 Create/Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import `crossify-platform` repository from GitHub
4. Configure project settings:

**Project Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 1.2 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

**Production Environment:**
```env
VITE_ETH_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_BSC_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BASE_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_GLOBAL_SUPPLY_TRACKER_SEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
VITE_GLOBAL_SUPPLY_TRACKER_BSCTESTNET=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
VITE_GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
VITE_API_BASE=/api
NODE_ENV=production
```

**Preview Environment:**
```env
VITE_ETH_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_BSC_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BASE_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
VITE_API_BASE=/api
NODE_ENV=development
```

### 1.3 Deploy Frontend

1. Click "Deploy" button
2. Wait for build to complete
3. You'll get a preview URL (e.g., `https://crossify-platform.vercel.app`)

## Step 2: Backend Deployment (Railway/Render)

⚠️ **Important**: Backend needs to be deployed separately.

### Option A: Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Create new project
3. Add service → Select `backend` folder
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Set environment variables:
   ```env
   PORT=3001
   CORS_ORIGIN=https://crossify.io,https://www.crossify.io
   DATABASE_PATH=/data/crossify.db
   JWT_SECRET=your-jwt-secret
   ADMIN_PASSWORD_HASH=your-admin-password-hash
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_PRIVATE_KEY=your-solana-private-key
   ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-key
   BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
   BASE_RPC_URL=https://sepolia.base.org
   TOKEN_FACTORY_ETHEREUM=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
   TOKEN_FACTORY_BSC=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   TOKEN_FACTORY_BASE=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
   ```
6. Get Railway URL (e.g., `https://crossify-backend.railway.app`)
7. Update `VITE_API_BASE` in Vercel to: `https://crossify-backend.railway.app/api`

### Option B: Render

1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Set environment variables (same as Railway)
6. Get Render URL
7. Update `VITE_API_BASE` in Vercel

## Step 3: Configure Domain (crossify.io)

### 3.1 Add Domain in Vercel

1. In Vercel project, go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `crossify.io`
4. Click **"Add"**
5. Vercel will show DNS configuration

### 3.2 Configure DNS

**Option A: Vercel Nameservers (Easiest)**

1. Copy nameservers from Vercel (e.g., `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
2. Go to your domain registrar (where you bought crossify.io)
3. Find DNS/Nameserver settings
4. Update nameservers to Vercel's nameservers
5. Save changes
6. Wait 24-48 hours for DNS propagation

**Option B: DNS Records (If keeping current nameservers)**

Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 3.3 Verify DNS Propagation

1. Check DNS propagation: https://www.whatsmydns.net/#A/crossify.io
2. Wait for propagation (usually 1-24 hours)
3. SSL certificate will auto-generate once DNS is configured

### 3.4 Verify SSL

- Vercel automatically provisions SSL certificates
- Once DNS is configured, SSL will be active
- Your site will be accessible at `https://crossify.io`

## Step 4: Post-Deployment Verification

### 4.1 Frontend Checks

- [ ] Site loads at https://crossify.io
- [ ] All pages accessible
- [ ] Wallet connections work
- [ ] API calls work (check browser console)
- [ ] Images and assets load
- [ ] No console errors

### 4.2 Backend Checks

- [ ] Backend URL is accessible
- [ ] API endpoints respond
- [ ] CORS allows crossify.io domain
- [ ] Database initialized
- [ ] Admin dashboard accessible

### 4.3 Domain Checks

- [ ] Domain resolves correctly
- [ ] SSL certificate active (green lock)
- [ ] www.crossify.io works (optional)
- [ ] No mixed content warnings

## Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all dependencies in package.json
- Check Node.js version compatibility

### Domain Not Working
- Verify DNS records are correct
- Wait for DNS propagation (24-48 hours)
- Check domain is added in Vercel dashboard

### API Calls Failing
- Check `VITE_API_BASE` environment variable
- Verify backend CORS allows crossify.io
- Check backend is deployed and accessible

### 404 on Refresh
- Verify `vercel.json` has proper rewrites
- Check routing configuration

## Next Steps After Deployment

1. Set up monitoring (Vercel Analytics)
2. Configure error tracking (Sentry)
3. Set up CI/CD for automated deployments
4. Configure CDN for static assets
5. Set up database backups

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check Railway/Render logs for backend
3. Verify environment variables
4. Check DNS propagation status

---

**Status**: Ready for deployment
**Last Updated**: 2025-01-XX


