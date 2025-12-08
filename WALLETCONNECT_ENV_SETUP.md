***REMOVED*** Project ID - Where to Add It

## Your Project ID
```
YOUR_WALLETCONNECT_PROJECT_ID
```

## ✅ Already Done
- ✅ **GitHub Secrets**: Added `VITE_WALLETCONNECT_PROJECT_ID` to GitHub repository secrets

## Where You Need to Add It

### 1. **Vercel** (If using Vercel for frontend) ⚠️ REQUIRED

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **crossify-platform** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   - **Key**: `VITE_WALLETCONNECT_PROJECT_ID`
   - **Value**: `YOUR_WALLETCONNECT_PROJECT_ID`
   - **Environment**: Select **Production**, **Preview**, and **Development** (all three)
6. Click **"Save"**
7. **Redeploy** your frontend

### 2. **Netlify** (If using Netlify for frontend) ⚠️ REQUIRED

**Steps:**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"**
5. Enter:
   - **Key**: `VITE_WALLETCONNECT_PROJECT_ID`
   - **Value**: `YOUR_WALLETCONNECT_PROJECT_ID`
   - **Scopes**: Select **All scopes** (Production, Deploy previews, Branch deploys)
6. Click **"Save"**
7. **Trigger a new deploy**

### 3. **GitHub Actions** (If using GitHub Pages) ✅ DONE

- ✅ Already added to GitHub Secrets
- ✅ Workflow updated to use the secret

### 4. **Railway** ❌ NOT NEEDED

**Railway is for backend only** - `VITE_WALLETCONNECT_PROJECT_ID` is a frontend variable, so you don't need to add it to Railway.

## How to Check Where Your Frontend is Deployed

1. **Check your domain**: Where does `crossify.io` point to?
   - If it's Vercel → Add to Vercel
   - If it's Netlify → Add to Netlify
   - If it's GitHub Pages → Already done ✅

2. **Check your deployment platform**:
   - Look at your DNS settings or domain configuration
   - Check which platform is actually serving your frontend

## Summary

| Platform | Needed? | Status |
|----------|---------|--------|
| **GitHub Secrets** | ✅ Yes (for GitHub Actions) | ✅ Done |
| **Vercel** | ✅ Yes (if using Vercel) | ⚠️ **Need to add** |
| **Netlify** | ✅ Yes (if using Netlify) | ⚠️ **Need to add** |
| **Railway** | ❌ No (backend only) | ✅ Not needed |

## After Adding

1. **Redeploy** your frontend
2. **Test** HashPack connection on a Hedera token page
3. **Verify** in browser console - no "WalletConnect Project ID not set" warnings










