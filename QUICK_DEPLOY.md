# 🚀 Quick Deploy Guide

## Should You Press Deploy?

**Answer: It depends!**

### Scenario 1: Vercel Already Connected to GitHub ✅
- **Don't press deploy** - it should auto-deploy from your latest push
- **Check Vercel Dashboard** → Deployments tab
- Look for a new deployment (should show your latest commit)
- If deployment is running → **Just wait!**
- If NO deployment → **Then press "Redeploy"**

### Scenario 2: New Vercel Project 🔧
- **Press "Deploy"** after configuring:
  1. Root Directory: `frontend`
  2. Environment Variables (see below)
  3. Build settings verified

## ⚠️ Critical Settings Before Deploy

### 1. Root Directory (MOST IMPORTANT)
- Must be set to: `frontend`
- Go to: Settings → General → Root Directory
- Click "Edit" → Select `frontend`

### 2. Environment Variables
Go to: **Settings → Environment Variables**

Add these (for Production):
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

## 📋 Step-by-Step

### If Project Already Exists:

1. **Check Dashboard**
   - Go to Vercel Dashboard
   - Click your project
   - Check "Deployments" tab
   - See if new deployment is running

2. **If Deployment Running:**
   - ✅ Just wait for it to complete
   - ✅ No action needed

3. **If NO Deployment:**
   - Go to "Deployments" tab
   - Click "Redeploy"
   - Select latest commit
   - Click "Redeploy"

4. **Verify Settings:**
   - Root Directory = `frontend` ✅
   - Environment variables set ✅

### If Creating New Project:

1. **Import Project**
   - Add New Project → Import from GitHub
   - Select `crossify-platform`

2. **Configure Settings**
   - Framework: Vite (or Other)
   - Root Directory: `frontend` ⚠️
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from above
   - Select "Production" environment

4. **Deploy**
   - Click "Deploy"
   - Wait for build (2-3 minutes)

## ⚠️ Important Notes

### Backend Dependency
- Frontend will deploy and work ✅
- But API calls will fail until backend is deployed ⚠️
- This is expected and normal
- Deploy backend to Railway/Render next

### Current API Setup
- `VITE_API_BASE=/api` means API calls go to same domain
- Requires backend on same domain OR proxy
- For now, frontend works but API features show errors (expected)

## ✅ After Deployment

1. Visit your Vercel URL
2. Check if site loads
3. Test navigation
4. Verify wallet connection works
5. **Note**: API errors are expected until backend is deployed

## 🎯 Quick Answer

**Check Vercel Dashboard first:**
- If deployment is running → **Wait**
- If no deployment → **Press "Redeploy"** or configure and deploy

**Before deploying, verify:**
- ✅ Root Directory = `frontend`
- ✅ Environment variables added

**After deploying:**
- ✅ Frontend works
- ⚠️ API calls fail (expected - deploy backend next)

