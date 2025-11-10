# Deployment Checklist

## Changes Made (All Committed & Pushed)

### Frontend Changes (Vercel)
- ✅ TokenDetail page error handling fixes
- ✅ ErrorBoundary component
- ✅ Footer social links (X, Discord, GitHub)
- ✅ Chain name normalization
- ✅ Safe property access
- ✅ All TypeScript errors fixed

### Backend Changes (Railway)
- ✅ Decimals NOT NULL constraint fix
- ✅ RPC URL fixes (Sepolia, Base Sepolia, BSC Testnet)
- ✅ Safe JSON parsing
- ✅ Boolean handling for PostgreSQL
- ✅ Token visibility management

## Deployment Status

### Vercel (Frontend)
**Status**: Should auto-deploy, but check deployment limit

**Action Required**:
1. Check if Vercel deployment limit has reset
2. If limit reset: Vercel will auto-deploy from GitHub
3. If limit not reset: Wait for limit to reset, or manually trigger deployment
4. Verify `VITE_API_BASE` environment variable is set in Vercel

**Environment Variables** (Verify in Vercel):
- `VITE_API_BASE`: Should be set to Railway backend URL
  - Example: `https://crossify-platform-production.up.railway.app`

### Railway (Backend)
**Status**: Should auto-deploy from GitHub

**Action Required**:
1. Check Railway deployment status
2. Verify Railway auto-deployed latest changes
3. If not auto-deployed: Manually trigger deployment
4. Verify `DATABASE_URL` is set (PostgreSQL)

**Environment Variables** (Verify in Railway):
- `DATABASE_URL`: PostgreSQL connection string
- All RPC URLs (optional, will use defaults if not set)
- Factory addresses for each chain

## Deployment Steps

### Option 1: Auto-Deploy (Recommended)
1. **Vercel**: Check if deployment limit reset, then wait for auto-deploy
2. **Railway**: Check if auto-deployed, verify in logs
3. If both auto-deployed: ✅ Done!
4. If not: Use Option 2

### Option 2: Manual Deploy
1. **Vercel**:
   - Go to Vercel dashboard
   - Select your project
   - Click "Redeploy" or trigger new deployment
   - Verify `VITE_API_BASE` environment variable is set

2. **Railway**:
   - Go to Railway dashboard
   - Select your project
   - Click "Redeploy" or trigger new deployment
   - Verify `DATABASE_URL` is set
   - Check deployment logs

## Verification After Deployment

### Frontend (Vercel)
1. ✅ Check token detail page loads
2. ✅ Verify social links in footer
3. ✅ Test token creation with metadata
4. ✅ Verify charts load
5. ✅ Check no console errors

### Backend (Railway)
1. ✅ Check backend logs for startup
2. ✅ Verify PostgreSQL connection
3. ✅ Check token sync working
4. ✅ Test API endpoints
5. ✅ Verify no errors in logs

## Recommended Action

**Deploy Both** (Vercel + Railway):
- Both have changes that need to be deployed
- Frontend: UI fixes, error handling, social links
- Backend: Database fixes, RPC URLs, decimals handling

**Deployment Order**:
1. **Railway first** (Backend): Deploy backend changes
2. **Vercel second** (Frontend): Deploy frontend changes after backend is ready

**Check Before Deploying**:
- ✅ All code committed and pushed to GitHub
- ✅ Vercel deployment limit reset (if it was hit)
- ✅ Railway auto-deploy enabled (should be by default)
- ✅ Environment variables set in both platforms

## Quick Check Commands

### Check Recent Commits
```bash
git log --oneline -5
```

### Check if Changes are Pushed
```bash
git status
```

### Verify Environment Variables
- **Vercel**: Check dashboard → Settings → Environment Variables
- **Railway**: Check dashboard → Variables tab

## Summary

**Answer: Deploy Both (Vercel + Railway)**

1. **Railway**: Deploy backend changes (decimals fix, RPC URLs)
2. **Vercel**: Deploy frontend changes (error handling, social links)

**Deployment Method**:
- If auto-deploy enabled: Wait for auto-deploy, then verify
- If auto-deploy not working: Manually trigger deployment in both platforms

**Priority**: 
- Railway first (backend must be ready)
- Vercel second (frontend depends on backend)
