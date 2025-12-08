# Unichain Deployment Guide

## 🚀 Ready to Deploy!

I've created a deployment script for Unichain. Here's what you need to know:

---

## 📋 What I Need From You

### 1. **Wallet Address & Funding**

The deployment script uses `PRIVATE_KEY` from your `contracts/.env` file.

**To find your wallet address:**
```bash
cd contracts
node -e "const ethers = require('ethers'); require('dotenv').config(); const key = process.env.PRIVATE_KEY; if (key) { const wallet = new ethers.Wallet(key.replace(/^0x/, '')); console.log('Wallet Address:', wallet.address); } else { console.log('PRIVATE_KEY not set'); }"
```

**Once you have the address, you need to:**
1. Bridge testnet ETH from Ethereum Sepolia to Unichain Sepolia
2. Recommended: **0.1-0.2 ETH** for deployment and gas fees

**Bridge Options:**
- https://bridge.unichain.org (official Unichain bridge)
- https://brid.gg (supports Unichain)
- https://superbridge.com (supports Unichain)

---

## 📝 Contracts to Deploy

The script will deploy **3 contracts**:

1. **GlobalSupplyTracker** - Tracks global token supply
2. **CrossChainSync** - Handles cross-chain price synchronization
3. **TokenFactory** - Factory for creating tokens

**Estimated Gas Costs:**
- GlobalSupplyTracker: ~0.01 ETH
- CrossChainSync: ~0.01 ETH
- TokenFactory: ~0.05 ETH
- **Total: ~0.07-0.1 ETH** (testnet, very cheap)

---

## 🔧 Configuration Needed

### Environment Variables (contracts/.env)

Make sure you have:
```env
# Required
PRIVATE_KEY=your_private_key_here

# Optional (has defaults)
UNICHAIN_TESTNET_RPC_URL=https://sepolia.unichain.org
LAYERZERO_ENDPOINT_UNICHAIN=0x6EDCE65403992e310A62460808c4b910D972f10f
UNICHAIN_CHAIN_EID=0  # TODO: Get from LayerZero docs
```

**Note:** The LayerZero EID for Unichain may need to be verified. The script will work with EID=0 initially, but you should update it later.

---

## 🚀 Deployment Steps

### Step 1: Fund Your Wallet

1. Get your wallet address (command above)
2. Bridge ETH from Ethereum Sepolia to Unichain Sepolia
3. Verify balance on Unichain:
   - Explorer: https://sepolia.uniscan.xyz
   - Or check in MetaMask after adding Unichain network

### Step 2: Run Deployment

```bash
cd contracts
npx hardhat run scripts/deploy-unichain.ts --network unichainTestnet
```

### Step 3: Save Contract Addresses

The script will output all addresses. Save them:

**Backend (.env):**
```env
UNICHAIN_FACTORY_ADDRESS=0x...
UNICHAIN_GLOBAL_SUPPLY_TRACKER=0x...
UNICHAIN_CROSS_CHAIN_SYNC=0x...
```

**Frontend (Vercel/Netlify):**
```env
VITE_UNICHAIN_FACTORY=0x...
```

---

## ✅ What Happens During Deployment

1. **Checks Connection** - Verifies RPC connection to Unichain
2. **Checks Balance** - Warns if balance is too low
3. **Deploys GlobalSupplyTracker** - First contract
4. **Deploys CrossChainSync** - Second contract
5. **Configures GlobalSupplyTracker** - Links to CrossChainSync
6. **Deploys TokenFactory** - Main factory contract
7. **Outputs Summary** - All addresses and next steps

---

## 🎯 After Deployment

### 1. Update Environment Variables

Add the addresses to:
- Backend (Railway): Environment variables
- Frontend (Vercel/Netlify): Environment variables

### 2. Verify LayerZero EID

Check LayerZero documentation for Unichain Sepolia EID and update if needed.

### 3. Set Trusted Remotes

If using cross-chain sync, set trusted remotes in CrossChainSync contract.

### 4. Test!

- Create a test token on Unichain
- Test bonding curve
- Test price sync (if cross-chain enabled)

---

## 🆘 Troubleshooting

### "Cannot connect to RPC"
- Check `UNICHAIN_TESTNET_RPC_URL` in `.env`
- Default: `https://sepolia.unichain.org`

### "Insufficient funds"
- Bridge more ETH to Unichain Sepolia
- Check balance on explorer

### "PRIVATE_KEY not found"
- Make sure `PRIVATE_KEY` is set in `contracts/.env`
- Check for typos or extra spaces

---

## 📞 Ready When You Are!

**Just let me know:**
1. ✅ Your wallet address (so I can verify it's funded)
2. ✅ When you've bridged ETH to Unichain
3. ✅ When you're ready to deploy

Then I'll run the deployment script and we'll be live! 🚀

---

**Status**: ✅ **Deployment Script Ready**  
**Next**: Fund wallet and deploy!

