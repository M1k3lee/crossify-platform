# Netlify Environment Variables Debug Guide

## Issue
The error messages still show "Vercel" instead of "Netlify", and factory addresses aren't being read correctly.

## Diagnosis Steps

### 1. Check Netlify Build Logs
1. Go to Netlify Dashboard → Your Site → Deploys
2. Click on the latest deploy
3. Check the build logs for:
   - Environment variables being loaded
   - Build completion
   - Any errors

### 2. Verify Environment Variables in Netlify
1. Go to Site Settings → Environment variables
2. Verify these are set:
   - `VITE_ETH_FACTORY` = `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
   - `VITE_BSC_FACTORY` = `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6` (note: ends with `40B6`, not `4086`)
   - `VITE_BASE_FACTORY` = `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
3. Make sure they're set for **All scopes** (Production, Deploy previews, Branch deploys)

### 3. Check Browser Console
After the new deploy completes, open browser console and look for:
```
🏭 Factory Addresses Configuration: {
  ethereum: "...",
  bsc: "...",
  base: "...",
  envVars: { ... }
}
```

### 4. Clear Browser Cache
1. **Chrome/Edge**: `Ctrl+Shift+Delete` → Clear cached images and files
2. **Or**: Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Or**: Open in Incognito/Private mode

### 5. Verify New Code is Deployed
1. Check the deploy timestamp in Netlify
2. The error message should say "Netlify" not "Vercel"
3. If it still says "Vercel", the new code hasn't deployed yet

## Common Issues

### Issue 1: Environment Variables Not Available at Build Time
**Symptom**: Debug log shows "NOT SET" for all addresses
**Solution**: 
- Verify variables are set in Netlify (not just locally)
- Make sure variable names start with `VITE_`
- Trigger a new deploy after adding variables

### Issue 2: Browser Cache
**Symptom**: Old error messages, old behavior
**Solution**:
- Clear browser cache
- Hard refresh
- Try incognito mode

### Issue 3: Build Not Completed
**Symptom**: Still seeing old code after "redeploying"
**Solution**:
- Wait for build to complete (check Netlify dashboard)
- Verify deploy status is "Published"
- Check build logs for errors

### Issue 4: Wrong Variable Scope
**Symptom**: Variables work locally but not in production
**Solution**:
- Set variables for "All scopes" or at least "Production"
- Don't set them only for "Deploy previews"

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

## Next Steps

1. Wait for Netlify to finish building (check deploy status)
2. Clear browser cache
3. Open browser console
4. Look for the debug log
5. Share what the console shows

