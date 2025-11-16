# Your Hedera Configuration

## ✅ Your Account Details

**Account ID:** `0.0.7268944`  
**EVM Address:** `0x30314630feb44e1b1df77397906240ff5c40f6d2`  
**Private Key:** `0xYOUR_PRIVATE_KEY`

---

## 📝 Step 1: Configure contracts/.env

Add these lines to your `contracts/.env` file:

```env
# Hedera Configuration
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

**Note:** The script will automatically remove the `0x` prefix if needed.

---

## 📝 Step 2: Deploy Contracts

Run this command:

```bash
cd contracts
npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet
```

**Expected Output:**
```
✅ Connected to Hedera Testnet. Current block: ...
👤 Deployer: 0x30314630feb44e1b1df77397906240ff5c40f6d2
💰 Balance: X HBAR
✅ GlobalSupplyTracker deployed to: 0x...
✅ CrossChainSync deployed to: 0x...
✅ TokenFactory deployed to: 0x...
```

**IMPORTANT:** Save the TokenFactory address from the output!

---

## 📝 Step 3: Configure Backend

Add to `backend/.env`:

```env
# Hedera Configuration
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
HEDERA_ACCOUNT_ID=0.0.7268944
HEDERA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
HEDERA_FACTORY_ADDRESS=0x... # From deployment output above
```

---

## 📝 Step 4: Configure Frontend

Add to your deployment platform (Netlify/Vercel) environment variables:

```env
VITE_HEDERA_FACTORY=0x... # TokenFactory address from deployment
```

**Then redeploy your frontend!**

---

## 🔍 Verify Your Setup

### Check Account Balance

Visit: https://hashscan.io/testnet/account/0.0.7268944

You should see your account with HBAR balance.

### Check EVM Address

Your EVM address is: `0x30314630feb44e1b1df77397906240ff5c40f6d2`

This is what will be used for contract deployments.

---

## ⚠️ Security Reminder

- ✅ This is a **testnet** account (safe to use for development)
- ✅ Private key is stored in `.env` files (already in `.gitignore`)
- ❌ **Never commit** these values to Git
- ❌ **Never share** these values publicly (except testnet is okay)
- ⚠️ For mainnet, create a new account and keep keys secure

---

## 🚀 Next Steps

1. ✅ Add private key to `contracts/.env`
2. ✅ Deploy contracts (run the deploy script)
3. ✅ Save TokenFactory address
4. ✅ Add to backend `.env`
5. ✅ Add to frontend environment variables
6. ✅ Redeploy frontend
7. ✅ Test token creation!

---

## 📞 Quick Reference

- **Account ID:** `0.0.7268944`
- **EVM Address:** `0x30314630feb44e1b1df77397906240ff5c40f6d2`
- **HashScan:** https://hashscan.io/testnet/account/0.0.7268944
- **RPC URL:** https://testnet.hashio.io/api

