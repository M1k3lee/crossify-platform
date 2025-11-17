# HashPack WalletConnect Setup Guide

## Problem
HashPack wallet uses **WalletConnect** for dApp pairing. The "Pair with dApp" modal you see in HashPack requires a valid WalletConnect Project ID to work. Currently, we're blocking WalletConnect because we don't have a valid project ID.

## Solution: Get a Free WalletConnect Project ID

### Step 1: Create WalletConnect Account
1. Go to [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up for a free account (or log in if you already have one)
3. Click **"Create New Project"**

### Step 2: Configure Project
1. **Project Name**: `Crossify.io` (or any name you prefer)
2. **Homepage URL**: `https://crossify.io`
3. **Description**: `Multi-chain token launch platform`
4. Click **"Create"**

### Step 3: Get Your Project ID
1. After creating the project, you'll see your **Project ID** (a long string like `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
2. Copy this Project ID

### Step 4: Add to Environment Variables

**For Local Development:**
Create or update `frontend/.env.local`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

**For Production (Railway/Vercel):**
Add the environment variable in your deployment platform:
- **Variable Name**: `VITE_WALLETCONNECT_PROJECT_ID`
- **Value**: Your WalletConnect Project ID

### Step 5: Redeploy
After adding the environment variable, redeploy your frontend. WalletConnect will now be enabled, and HashPack will be able to connect via the pairing mechanism.

## How HashPack Connection Works

HashPack supports **two connection methods**:

### 1. WalletConnect (Recommended)
- **Desktop**: Users click "Connect Wallet" → HashPack appears in the wallet list → Click to pair
- **Mobile**: Users scan QR code or enter pairing string
- **Requires**: Valid WalletConnect Project ID ✅

### 2. Direct Extension Injection (Fallback)
- **Desktop**: HashPack Chrome extension injects EIP-1193 provider
- **Works**: When extension is installed and unlocked
- **Current Status**: We're trying to detect this, but it may not work if MetaMask is also installed

## Current Status

✅ **What We've Done:**
- Added Chrome extension API detection for HashPack
- Improved provider detection logic
- Added fallback connection methods

⚠️ **What's Missing:**
- Valid WalletConnect Project ID (required for HashPack pairing modal)

## Next Steps

1. **Get WalletConnect Project ID** (see steps above)
2. **Add to environment variables** in your deployment platform
3. **Redeploy frontend**
4. **Test HashPack connection** - it should now appear in the wallet selection modal

## Testing

After adding the WalletConnect Project ID:

1. Go to a Hedera token page on your site
2. Click "Connect Wallet" (main button in top nav)
3. HashPack should appear in the wallet list
4. Click HashPack → Pairing modal should work
5. Approve connection in HashPack wallet

## Alternative: Direct Extension Connection

If you want to test without WalletConnect, HashPack should also work via direct extension injection. However, this may not work reliably when MetaMask is also installed, as both wallets compete for `window.ethereum`.

**To test direct connection:**
1. Temporarily disable MetaMask extension
2. Refresh the page
3. HashPack should inject as `window.ethereum`
4. Click "Connect HashPack" button on Hedera token pages

## Troubleshooting

**HashPack not appearing in wallet list:**
- Check that WalletConnect Project ID is set correctly
- Check browser console for errors
- Verify HashPack extension is installed and unlocked

**Pairing modal not working:**
- Ensure WalletConnect Project ID is valid (not `0000000000000000000000000000000000000000`)
- Check that WalletConnect API calls are not being blocked
- Verify network connectivity

**Connection timeout:**
- Make sure HashPack wallet is unlocked
- Try refreshing the page
- Check if MetaMask is interfering (try disabling it temporarily)

