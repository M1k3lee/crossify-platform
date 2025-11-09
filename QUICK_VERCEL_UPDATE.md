# Quick Vercel Update - Frontend Environment Variables

## 📋 Variables to Update in Vercel

### Step 1: Go to Vercel
1. https://vercel.com → Your Project → **Settings** → **Environment Variables**

### Step 2: Update These 3 Variables

```
VITE_BASE_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
VITE_BSC_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
VITE_ETH_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
```

### Step 3: For Each Variable

1. Click **Add New** (if new) or click existing variable to **Edit**
2. Enter variable name: `VITE_BASE_FACTORY` (or `VITE_BSC_FACTORY` or `VITE_ETH_FACTORY`)
3. Enter value: The address (see above)
4. Select environments: **Production**, **Preview**, **Development** (or all)
5. Click **Save**

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait for deployment

## ✅ Quick Copy-Paste

**Variable Name**: `VITE_BASE_FACTORY`  
**Value**: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`

**Variable Name**: `VITE_BSC_FACTORY`  
**Value**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`

**Variable Name**: `VITE_ETH_FACTORY`  
**Value**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`

## 🎯 Why Update?

Frontend needs these to:
- Connect to NEW TokenFactory contracts
- Create tokens with FIXED BondingCurve
- Enable trading functionality

---

**Path**: Vercel → Project → Settings → Environment Variables

