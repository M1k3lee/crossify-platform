# Netlify Factory Address Troubleshooting Guide

## Problem
You're seeing errors like "Factory contract not deployed on [chain]" even after setting environment variables in Netlify.

## Root Cause
**Vite environment variables are embedded at BUILD TIME, not runtime.** This means:
- If you add environment variables AFTER a build, they won't be available
- You MUST trigger a new deploy after adding/changing environment variables
- The browser may cache the old JavaScript bundle

## Solution Steps

### Step 1: Verify Environment Variables in Netlify

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Verify these variables are set (case-sensitive):
   - `VITE_ETH_FACTORY` = `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
   - `VITE_BSC_FACTORY` = `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6` (note: ends with `40B6`, not `4086`)
   - `VITE_BASE_FACTORY` = `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
3. **Important**: Make sure they're set for **"All scopes"** or at least **"Production"**
4. Check for typos - especially `VITE_BSC_FACTORY` should end in `40B6` not `4086`

### Step 2: Trigger a New Deploy

**After adding/changing environment variables, you MUST trigger a new deploy:**

1. Go to Netlify Dashboard → Your Site → **Deploys**
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for the build to complete
4. Check the build logs to verify the variables are being read

### Step 3: Check Build Logs

1. Go to Netlify Dashboard → Your Site → **Deploys** → Click on the latest deploy
2. Look for the build logs
3. The build should complete successfully
4. If you see errors, check if they're related to environment variables

### Step 4: Clear Browser Cache

**After the new deploy completes:**

1. **Hard refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Or**: Open in Incognito/Private mode
3. **Or**: Clear browser cache:
   - Chrome: `Ctrl+Shift+Delete` → Clear cached images and files
   - Firefox: `Ctrl+Shift+Delete` → Clear cache

### Step 5: Verify in Browser Console

After clearing cache and loading the new deploy:

1. Open browser console (F12)
2. Look for this log message:
   ```
   🏭 Factory Addresses Configuration: {
     ethereum: "0x8eF1A74d477448630282EFC130ac9D17f495Bca4",
     bsc: "0xFF8c690B5b65905da20D8de87Cd6298c223a40B6",
     base: "0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58",
     ...
   }
   ```
3. If you see `"NOT SET"` for any address, the environment variable isn't being read at build time

### Step 6: Test Token Deployment

1. Try creating a new token
2. The console should show:
   ```
   🔍 Factory Address Check for ethereum: {
     factoryAddress: "0x8eF1A74d477448630282EFC130ac9D17f495Bca4",
     ...
   }
   ✅ Factory address found for ethereum: 0x8eF1A74d477448630282EFC130ac9D17f495Bca4
   ```
3. If you still see errors, check the console logs for more details

## Common Issues

### Issue 1: Environment Variables Not Available at Build Time

**Symptoms**: Console shows `"NOT SET"` for factory addresses

**Solution**: 
- Verify variables are set in Netlify (not just locally)
- Make sure variable names start with `VITE_`
- Trigger a new deploy after adding variables
- Check that variables are set for the correct scope (Production)

### Issue 2: Browser Cache

**Symptoms**: Still seeing old error messages mentioning "Vercel" instead of "Netlify"

**Solution**:
- Clear browser cache
- Hard refresh (`Ctrl+Shift+R`)
- Try incognito mode
- Check the deploy timestamp in Netlify to confirm new code is deployed

### Issue 3: Wrong Variable Scope

**Symptoms**: Variables work locally but not in production

**Solution**:
- Set variables for **"All scopes"** or at least **"Production"**
- Don't set them only for "Deploy previews" or "Branch deploys"

### Issue 4: Typo in Variable Name or Value

**Symptoms**: One chain works but others don't

**Solution**:
- Double-check variable names: `VITE_ETH_FACTORY`, `VITE_BSC_FACTORY`, `VITE_BASE_FACTORY`
- Verify the values are correct (especially `VITE_BSC_FACTORY` ending in `40B6`)
- Check for extra spaces or characters

### Issue 5: Build Not Completed

**Symptoms**: Still seeing old code after "redeploying"

**Solution**:
- Wait for build to complete (check Netlify dashboard)
- Verify deploy status is "Published"
- Check build logs for errors
- Make sure the deploy actually completed successfully

## Expected Console Output (After Fix)

When working correctly, you should see:
```
🏭 Factory Addresses Configuration: {
  ethereum: "0x8eF1A74d477448630282EFC130ac9D17f495Bca4",
  bsc: "0xFF8c690B5b65905da20D8de87Cd6298c223a40B6",
  base: "0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58",
  envVars: {
    VITE_ETH_FACTORY: "0x8eF1A74d477448630282EFC130ac9D17f495Bca4",
    VITE_BSC_FACTORY: "0xFF8c690B5b65905da20D8de87Cd6298c223a40B6",
    VITE_BASE_FACTORY: "0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58"
  }
}
```

When deploying a token:
```
🔍 Factory Address Check for ethereum: {
  factoryAddress: "0x8eF1A74d477448630282EFC130ac9D17f495Bca4",
  envVar: "0x8eF1A74d477448630282EFC130ac9D17f495Bca4",
  ...
}
✅ Factory address found for ethereum: 0x8eF1A74d477448630282EFC130ac9D17f495Bca4
🚀 Starting deployment to ethereum...
```

## Quick Checklist

- [ ] Environment variables set in Netlify
- [ ] Variables are set for "Production" or "All scopes"
- [ ] Variable names are correct (`VITE_ETH_FACTORY`, `VITE_BSC_FACTORY`, `VITE_BASE_FACTORY`)
- [ ] Variable values are correct (especially `VITE_BSC_FACTORY` ending in `40B6`)
- [ ] New deploy triggered after adding variables
- [ ] Build completed successfully
- [ ] Browser cache cleared
- [ ] Console shows factory addresses (not "NOT SET")
- [ ] Error messages say "Netlify" not "Vercel"

## Still Having Issues?

If you've followed all steps and still see errors:

1. Check Netlify build logs for any errors
2. Verify the deploy actually completed
3. Check the deploy timestamp (should be recent)
4. Share the console logs showing the factory address check
5. Verify you're accessing the correct Netlify URL (not a cached version)

