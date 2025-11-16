# ✅ Your Hedera Setup - Ready to Deploy!

## Your Account Information

**Account ID:** `0.0.7268944`  
**EVM Address:** `0x30314630feb44e1b1df77397906240ff5c40f6d2`  
**Private Key:** `0xYOUR_PRIVATE_KEY`

**View on HashScan:** https://hashscan.io/testnet/account/0.0.7268944

---

## ✅ Step 1: Configuration Added

I've added your Hedera configuration to `contracts/.env`:
- ✅ RPC URL configured
- ✅ Private key added (with 0x prefix - script handles it automatically)

---

## 🚀 Step 2: Deploy Contracts (Run This Now!)

### Option A: Use the Helper Script (Easiest)

```powershell
cd contracts
.\deploy-hedera-now.ps1
```

### Option B: Manual Deployment

```powershell
cd contracts
npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet
```

**What to expect:**
- ✅ Connection to Hedera testnet
- ✅ Your deployer address: `0x30314630feb44e1b1df77397906240ff5c40f6d2`
- ✅ HBAR balance check
- ✅ Contract deployments:
  - GlobalSupplyTracker
  - CrossChainSync (if LayerZero endpoint configured)
  - TokenFactory

**IMPORTANT:** Save the TokenFactory address from the output!

---

## 📝 Step 3: Configure Backend

After deployment, add to `backend/.env`:

```env
# Hedera Configuration
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
HEDERA_ACCOUNT_ID=0.0.7268944
HEDERA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
HEDERA_FACTORY_ADDRESS=0x... # ← From deployment output above
```

---

## 📝 Step 4: Configure Frontend

Add to your deployment platform (Netlify/Vercel):

**Environment Variable:**
```
VITE_HEDERA_FACTORY=0x... # ← TokenFactory address from deployment
```

**Then redeploy your frontend!**

---

## 🔍 Verify Your Account

**Check Balance:**
- Visit: https://hashscan.io/testnet/account/0.0.7268944
- You should see your HBAR balance

**If you need more testnet HBAR:**
- Visit: https://portal.hedera.com/
- Click "Get Testnet HBAR"
- Enter Account ID: `0.0.7268944`

---

## ⚠️ Important Notes

1. **Private Key Security:**
   - ✅ This is a **testnet** account (safe for development)
   - ✅ Stored in `.env` (already in `.gitignore`)
   - ❌ Never commit to Git
   - ❌ Never share publicly (except testnet is okay)

2. **0x Prefix:**
   - Your private key has `0x` prefix
   - The deployment script automatically handles this
   - No need to remove it

3. **EVM Address:**
   - Your EVM address is: `0x30314630feb44e1b1df77397906240ff5c40f6d2`
   - This is what will be used for deployments
   - Different from Account ID (`0.0.7268944`)

---

## 🎯 Quick Checklist

- [x] Account created: `0.0.7268944`
- [x] Configuration added to `contracts/.env`
- [ ] Deploy contracts (run the script above)
- [ ] Save TokenFactory address
- [ ] Add to `backend/.env`
- [ ] Add to frontend environment variables
- [ ] Redeploy frontend
- [ ] Test token creation!

---

## 🆘 Troubleshooting

**"Insufficient HBAR"**
- Get more from: https://portal.hedera.com/
- Enter Account ID: `0.0.7268944`

**"Cannot connect to RPC"**
- Check RPC URL: `https://testnet.hashio.io/api`
- Try again in a few minutes

**"Private key invalid"**
- The script handles `0x` prefix automatically
- Make sure there are no extra spaces

**"Factory not found"**
- Verify you deployed successfully
- Check contract address on HashScan
- Ensure you're using the correct address

---

## 📞 Quick Reference

- **Account ID:** `0.0.7268944`
- **EVM Address:** `0x30314630feb44e1b1df77397906240ff5c40f6d2`
- **HashScan:** https://hashscan.io/testnet/account/0.0.7268944
- **Portal:** https://portal.hedera.com/
- **RPC:** `https://testnet.hashio.io/api`

---

**Ready? Run the deployment script and let's get Hedera live on Crossify! 🚀**

