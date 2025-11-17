# Add WalletConnect Project ID

## Your Project ID
```
YOUR_WALLETCONNECT_PROJECT_ID
```

## Step 1: Add to Vercel (Production)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **crossify-platform** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   - **Key**: `VITE_WALLETCONNECT_PROJECT_ID`
   - **Value**: `YOUR_WALLETCONNECT_PROJECT_ID`
   - **Environment**: Select **Production**, **Preview**, and **Development** (all three)
6. Click **"Save"**

## Step 2: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic redeploy

## Step 3: Verify

After redeploy, check the browser console (F12). You should see:
- ✅ No more "WalletConnect Project ID not set" warnings
- ✅ HashPack should appear in the wallet selection modal
- ✅ WalletConnect API calls should work (no 400/403 errors)

## For Local Development (Optional)

If you want to test locally, create `frontend/.env.local`:

```env
VITE_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
```

Then restart your dev server:
```bash
cd frontend
npm run dev
```

## Testing HashPack Connection

After redeploy:

1. Go to a Hedera token page (e.g., `https://crossify.io/token/...?chain=hedera-testnet`)
2. Click **"Connect Wallet"** (top right)
3. HashPack should appear in the wallet list
4. Click HashPack → Pairing modal should work
5. Approve connection in HashPack wallet

## Troubleshooting

**Still seeing "WalletConnect Project ID not set"?**
- Make sure you selected all environments (Production, Preview, Development)
- Make sure you redeployed after adding the variable
- Check that the variable name is exactly: `VITE_WALLETCONNECT_PROJECT_ID`

**HashPack not appearing in wallet list?**
- Wait a few minutes for deployment to complete
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors

**Pairing modal not working?**
- Make sure HashPack extension is installed and unlocked
- Try refreshing the page
- Check that WalletConnect API calls are not being blocked

