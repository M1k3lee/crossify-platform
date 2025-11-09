# Vercel Frontend Environment Variables Update Guide

## 🔧 How to Update Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Navigate to https://vercel.com
2. Log in to your account
3. Select your project (likely `crossify-platform` or similar)
4. Go to **Settings** → **Environment Variables**

### Step 2: Update Factory Addresses

You need to update/add these three environment variables:

```env
VITE_BASE_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BSC_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
VITE_ETH_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
```

### Step 3: Update Each Variable

For each variable:

1. **If the variable exists:**
   - Click on the variable name
   - Click **Edit**
   - Update the value to the new address
   - Select which environments to apply to (Production, Preview, Development)
   - Click **Save**

2. **If the variable doesn't exist:**
   - Click **Add New**
   - Enter the variable name (e.g., `VITE_BASE_FACTORY`)
   - Enter the value (e.g., `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`)
   - Select which environments to apply to (Production, Preview, Development)
   - Click **Save**

### Step 4: Redeploy

After updating all variables:

1. Go to the **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy** (or Vercel may auto-redeploy)
4. Wait for deployment to complete

## 📋 Complete List of Variables to Update

### TokenFactory Addresses (REQUIRED - UPDATE THESE)

```
VITE_BASE_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BSC_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
VITE_ETH_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
```

### Other Variables (Verify These Exist)

You may also want to verify these are set correctly:

```
VITE_API_BASE_URL=https://your-railway-backend.railway.app
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🔍 Visual Guide

1. **Settings Tab**: Click on your project → Settings
2. **Environment Variables**: Left sidebar → Environment Variables
3. **Add/Edit**: Click "Add New" or click on existing variable to edit
4. **Environment Selection**: Choose Production, Preview, Development (or all)
5. **Save**: Click Save button

## ✅ Verification

After updating:

1. **Check Deployment**: Go to Deployments tab and verify new deployment
2. **Test Frontend**: 
   - Go to your live site
   - Connect wallet
   - Try creating a new token
   - Verify it uses the new TokenFactory address
3. **Check Console**: Open browser console, check for any errors

## 🎯 Why Update?

The frontend uses these addresses to:
- Connect to the correct TokenFactory contracts
- Create new tokens using the fixed BondingCurve
- Display token information correctly
- Enable trading functionality

**Without updating**: Frontend will use OLD TokenFactory contracts
**After updating**: Frontend will use NEW TokenFactory contracts with fixed BondingCurve

## ⚠️ Important Notes

1. **Environment Selection**: Make sure to select the correct environments (Production, Preview, Development)
2. **Redeploy Required**: After updating, you need to redeploy for changes to take effect
3. **Case Sensitive**: Variable names are case-sensitive (must be exactly `VITE_BASE_FACTORY`)
4. **No Spaces**: Don't include spaces around the `=` sign

## 🚀 Quick Steps Summary

1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Update `VITE_BASE_FACTORY` to `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`
4. Update `VITE_BSC_FACTORY` to `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
5. Update `VITE_ETH_FACTORY` to `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
6. Save all changes
7. Redeploy (or wait for auto-redeploy)
8. Test your frontend

---

**Status**: ⚠️ **ACTION REQUIRED** - Update these addresses in Vercel!

