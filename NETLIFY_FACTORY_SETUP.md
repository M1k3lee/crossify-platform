# Netlify Factory Address Configuration

## ✅ Factory Contracts Are Deployed!

The TokenFactory contracts are already deployed to all testnets. You just need to add the addresses to Netlify environment variables.

## 📋 Deployed Factory Addresses

### Sepolia (Ethereum Testnet)
- **Factory Address**: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- **Explorer**: https://sepolia.etherscan.io/address/0x8eF1A74d477448630282EFC130ac9D17f495Bca4
- **Status**: ✅ Deployed and Verified

### BSC Testnet
- **Factory Address**: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- **Explorer**: https://testnet.bscscan.com/address/0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
- **Status**: ✅ Deployed and Verified

### Base Sepolia
- **Factory Address**: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- **Explorer**: https://sepolia-explorer.base.org/address/0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58
- **Status**: ✅ Deployed and Verified

## 🔧 How to Add Environment Variables in Netlify

### Step 1: Go to Netlify Dashboard
1. Go to https://app.netlify.com
2. Select your site (crossify-platform or similar)
3. Click on **Site settings** (or go to Settings → Environment variables)

### Step 2: Add Environment Variables
Click **Add environment variable** and add these three variables:

#### Variable 1: Ethereum Factory
- **Key**: `VITE_ETH_FACTORY`
- **Value**: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- **Scopes**: All scopes (Production, Deploy previews, Branch deploys)

#### Variable 2: BSC Factory
- **Key**: `VITE_BSC_FACTORY`
- **Value**: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- **Scopes**: All scopes

#### Variable 3: Base Factory
- **Key**: `VITE_BASE_FACTORY`
- **Value**: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- **Scopes**: All scopes

### Step 3: Redeploy
After adding the variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Or wait for the next automatic deploy (if you have auto-deploy enabled)

### Step 4: Verify
After redeploy, check the browser console:
- ❌ Before: Errors showing "Factory not deployed on..."
- ✅ After: No factory errors, tokens can be deployed

## 🔍 Verification Checklist

After setting up the environment variables:

- [ ] All three variables are added in Netlify
- [ ] Site has been redeployed
- [ ] Browser console shows no factory errors
- [ ] Can create tokens on all chains (Sepolia, BSC, Base)

## 🆘 Troubleshooting

### Still Seeing Errors?
1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Variable Names**: Must be exactly `VITE_ETH_FACTORY`, `VITE_BSC_FACTORY`, `VITE_BASE_FACTORY`
3. **Verify Deployment**: Make sure Netlify has redeployed after adding variables
4. **Check Build Logs**: Look for environment variables in Netlify build logs

### Variables Not Showing?
- Make sure you're adding them in the correct site
- Check that variable names start with `VITE_` (required for Vite to expose them)
- Ensure scopes are set correctly (should include Production)

## 📝 Quick Copy-Paste Values

```
VITE_ETH_FACTORY=0x8eF1A74d477448630282EFC130ac9D17f495Bca4
VITE_BSC_FACTORY=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
VITE_BASE_FACTORY=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58
```

## ✅ Success!

Once these are set, the error messages will disappear and you'll be able to deploy tokens on all chains!

