# Hedera Setup Guide - Getting Started

## Overview

This guide walks you through everything you need to get Hedera working on Crossify.io. You'll need to set up a Hedera account, get testnet HBAR, deploy contracts, and configure your environment.

---

## Step 1: Create Hedera Account (5 minutes)

### Option A: Using HashPack Wallet (Recommended for Testing)

1. **Install HashPack Wallet**
   - Browser Extension: https://hashpack.app/
   - Mobile App: Available on iOS/Android
   - This is the MetaMask equivalent for Hedera

2. **Create New Wallet**
   - Open HashPack
   - Click "Create Wallet"
   - Save your **12-word recovery phrase** (CRITICAL - write it down!)
   - Set a password

3. **Get Your Account ID**
   - After creating wallet, you'll see your Account ID (format: `0.0.xxxxx`)
   - **Save this Account ID** - you'll need it for configuration
   - Example: `0.0.1234567`

### Option B: Using Hedera Portal (For Backend/Server Use)

1. **Visit Hedera Portal**
   - Go to: https://portal.hedera.com/

2. **Create Testnet Account**
   - Click "Create Account" (Testnet)
   - You'll get:
     - **Account ID**: `0.0.xxxxx`
     - **Private Key**: Hex format
   - **Save both securely!**

3. **Export Private Key**
   - The portal will show your private key
   - Copy it and save it securely (you'll need it for environment variables)

---

## Step 2: Get Testnet HBAR (Free) (2 minutes)

### Method 1: Hedera Portal Faucet

1. **Visit Faucet**
   - Go to: https://portal.hedera.com/
   - Click "Get Testnet HBAR"

2. **Enter Your Account ID**
   - Paste your Account ID (e.g., `0.0.1234567`)
   - Click "Submit"

3. **Receive HBAR**
   - You'll receive ~10,000 testnet HBAR (free!)
   - Check your HashPack wallet or portal account

### Method 2: HashPack Wallet

1. **Open HashPack**
   - Click on your account
   - Look for "Get Testnet HBAR" button
   - Click it and follow the prompts

### How Much Do You Need?

- **Contract Deployment**: ~1-5 HBAR per contract
- **Token Creation**: ~0.001 HBAR per token
- **Transactions**: ~0.0001 HBAR per transaction
- **Recommended**: Get 100-1000 testnet HBAR to start (it's free!)

---

## Step 3: Deploy Contracts to Hedera Testnet (10 minutes)

### Prerequisites

1. **Set Up Environment Variables**

   Create or update `contracts/.env`:

   ```env
   # Hedera Configuration
   HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
   PRIVATE_KEY=your_hedera_private_key_here
   
   # Note: Hedera private keys are in hex format (no 0x prefix needed)
   # If your key starts with 0x, remove it
   ```

2. **Get Your Private Key**

   **From HashPack:**
   - Open HashPack wallet
   - Go to Settings → Export Private Key
   - Copy the private key (hex format, no 0x prefix)

   **From Hedera Portal:**
   - The portal shows your private key directly
   - Copy it (it's already in hex format)

### Deploy Contracts

1. **Navigate to Contracts Directory**
   ```bash
   cd contracts
   ```

2. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Deploy to Hedera Testnet**
   ```bash
   npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet
   ```

4. **Save the Output**
   The script will output:
   ```
   ✅ GlobalSupplyTracker deployed to: 0x...
   ✅ CrossChainSync deployed to: 0x...
   ✅ TokenFactory deployed to: 0x...
   ```

   **IMPORTANT**: Save these addresses! You'll need them for configuration.

---

## Step 4: Configure Environment Variables

### Backend Configuration (`backend/.env`)

Add these variables:

```env
# Hedera RPC
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api

# Hedera Account (for backend operations)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your_private_key_hex_here

# Hedera Factory Address (from deployment)
HEDERA_FACTORY_ADDRESS=0x... # From deploy-hedera.ts output

# Optional: For HCS Audit Logging (Phase 2)
HEDERA_HCS_TOPIC_ID=0.0.xxxxx  # Will be created automatically on first use
```

### Frontend Configuration (Netlify/Vercel Environment Variables)

Add these in your deployment platform:

```env
VITE_HEDERA_FACTORY=0x... # TokenFactory address from deployment
```

**Note**: After adding environment variables, you'll need to **redeploy** your frontend for changes to take effect.

---

## Step 5: Test the Integration

### Test Token Creation

1. **Start Your Backend** (if running locally)
   ```bash
   cd backend
   npm run dev
   ```

2. **Open Frontend**
   - Go to your frontend URL
   - Navigate to "Launch Token"

3. **Select Hedera**
   - In the chain selector, click "Hedera"
   - You should see the "⚡ Fast & Cheap" badge

4. **Create Test Token**
   - Fill in token details
   - Select Hedera as one of the chains
   - Click "Deploy"

5. **Connect Wallet**
   - MetaMask should prompt to add Hedera network
   - Or use HashPack wallet for Hedera

### Verify Deployment

1. **Check HashScan**
   - Go to: https://hashscan.io/testnet
   - Search for your TokenFactory address
   - You should see your deployed contracts

2. **Check Backend Logs**
   - Look for successful Hedera service initialization
   - Check for any errors

---

## Security Best Practices

### ⚠️ Private Key Security

**NEVER:**
- ❌ Commit private keys to Git
- ❌ Share private keys publicly
- ❌ Store private keys in client-side code
- ❌ Use mainnet private keys for testing

**ALWAYS:**
- ✅ Use environment variables
- ✅ Use `.env` files (and add to `.gitignore`)
- ✅ Use testnet keys for development
- ✅ Rotate keys if exposed
- ✅ Use separate accounts for testnet/mainnet

### Environment Variable Storage

**For Local Development:**
- Store in `contracts/.env` (already in `.gitignore`)
- Store in `backend/.env` (already in `.gitignore`)

**For Production:**
- Use secure environment variable storage:
  - **Netlify**: Dashboard → Site Settings → Environment Variables
  - **Vercel**: Dashboard → Project Settings → Environment Variables
  - **Railway**: Dashboard → Variables tab
  - **Never** commit these to Git!

---

## Troubleshooting

### Issue: "Cannot connect to Hedera RPC"

**Solution:**
- Check your RPC URL: `https://testnet.hashio.io/api`
- Try alternative RPC: `https://testnet.hashio.io/api`
- Check your internet connection

### Issue: "Insufficient HBAR"

**Solution:**
- Get more testnet HBAR from: https://portal.hedera.com/
- Check your account balance on HashScan
- Ensure you have at least 1 HBAR for contract deployment

### Issue: "Invalid private key"

**Solution:**
- Ensure private key is in hex format (no 0x prefix)
- Remove any spaces or newlines
- Verify the key is correct (check in HashPack or portal)

### Issue: "Factory contract not found"

**Solution:**
- Verify you deployed contracts successfully
- Check the contract address is correct
- Ensure you're on Hedera testnet (not mainnet)
- Verify contract address on HashScan

### Issue: "MetaMask doesn't support Hedera"

**Solution:**
- Hedera is EVM-compatible, but MetaMask may need network added manually
- Use HashPack wallet for better Hedera support
- Or add Hedera network manually to MetaMask:
  - Network Name: Hedera Testnet
  - RPC URL: https://testnet.hashio.io/api
  - Chain ID: 296
  - Currency Symbol: HBAR

---

## Next Steps

### After Basic Setup Works:

1. **Test Token Creation**
   - Create a test token on Hedera
   - Verify it appears in marketplace

2. **Test Trading**
   - Buy tokens on Hedera bonding curve
   - Verify price updates work

3. **Test Cross-Chain Sync** (if LayerZero supports Hedera)
   - Create token on Hedera + another chain
   - Buy on one chain, verify price syncs

4. **Set Up HCS Audit Logging** (Phase 2)
   - Install Hedera SDK: `npm install @hashgraph/sdk`
   - Initialize HCS topic
   - Start logging events

---

## Quick Checklist

- [ ] Created Hedera account (Account ID: `0.0.xxxxx`)
- [ ] Got testnet HBAR (100+ HBAR recommended)
- [ ] Exported private key (hex format)
- [ ] Added private key to `contracts/.env`
- [ ] Deployed contracts to Hedera testnet
- [ ] Saved contract addresses
- [ ] Added `HEDERA_FACTORY_ADDRESS` to backend `.env`
- [ ] Added `VITE_HEDERA_FACTORY` to frontend environment variables
- [ ] Redeployed frontend (if using Netlify/Vercel)
- [ ] Tested token creation on Hedera
- [ ] Verified contracts on HashScan

---

## Resources

- **Hedera Portal**: https://portal.hedera.com/
- **HashPack Wallet**: https://hashpack.app/
- **HashScan Explorer**: https://hashscan.io/testnet
- **Hedera Docs**: https://docs.hedera.com/
- **Hedera Discord**: https://discord.gg/hedera

---

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check HashScan to see if transactions went through
4. Review backend logs for error messages
5. Check Hedera Discord for community support

---

**Ready to get started?** Follow the steps above in order, and you'll have Hedera running on Crossify.io in about 20 minutes!

