# TokenFactory Setup and Deployment Guide

## 🚀 Quick Start

### Step 1: Create Environment File

Create a file named `.env` in the `contracts/` directory with the following content:

```env
# Your wallet private key (NEVER commit this file!)
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# RPC URLs (use public endpoints or your own)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
```

**⚠️ IMPORTANT:**
- Replace `your_private_key_here_without_0x_prefix` with your actual private key
- Private key should be 64 characters (32 bytes in hex), without the `0x` prefix
- Example: `PRIVATE_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`
- **NEVER commit this file to git!** It's already in `.gitignore`

### Step 2: Verify You Have Testnet Tokens

You need testnet tokens for gas fees. Get them from:

- **Sepolia ETH**: https://sepoliafaucet.com/ or https://www.alchemy.com/faucets/ethereum-sepolia
- **BSC Testnet BNB**: https://testnet.bnbchain.org/faucet-smart
- **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

**Recommended:** Have at least 0.1 ETH/BNB on each network for gas fees.

### Step 3: Compile Contracts

```bash
cd contracts
npx hardhat compile
```

Expected output:
```
Compiled successfully
```

### Step 4: Deploy TokenFactory

Deploy to each network one by one:

#### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**Copy the factory address from the output:**
```
✅ TokenFactory deployed successfully!
📍 Address: 0x...
```

#### Deploy to BSC Testnet
```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

**Copy the factory address from the output**

#### Deploy to Base Sepolia
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Copy the factory address from the output**

### Step 5: Update Frontend Environment Variables

After deployment, update your frontend environment variables:

**For Vercel:**
1. Go to your Vercel project
2. Navigate to Settings → Environment Variables
3. Add/Update these variables:
   - `VITE_ETH_FACTORY` = (Sepolia factory address from Step 4)
   - `VITE_BSC_FACTORY` = (BSC Testnet factory address from Step 4)
   - `VITE_BASE_FACTORY` = (Base Sepolia factory address from Step 4)
4. Redeploy your frontend (or wait for auto-deploy)

**For Local Development:**
Update `frontend/.env` file:
```env
VITE_ETH_FACTORY=0x... (Sepolia factory address)
VITE_BSC_FACTORY=0x... (BSC Testnet factory address)
VITE_BASE_FACTORY=0x... (Base Sepolia factory address)
```

Then restart your frontend dev server.

### Step 6: Test Token Creation

1. Go to your Builder page
2. Create a test token:
   - Name: TestToken
   - Symbol: TEST
   - Description: Test token for deployment verification
   - Select all chains: Sepolia, BSC, Base
3. Click "Deploy Token"
4. Verify deployment succeeds without errors

## 🔍 Verification Checklist

After deployment, verify:

- [ ] TokenFactory deployed on Sepolia
- [ ] TokenFactory deployed on BSC Testnet
- [ ] TokenFactory deployed on Base Sepolia
- [ ] Factory addresses copied correctly
- [ ] Frontend environment variables updated
- [ ] Token creation works without errors
- [ ] No "Failed to authorize token" errors

## 📝 Expected Deployment Output

When you run the deployment, you should see:

```
🚀 Deploying TokenFactory contract...
📋 Network: sepolia
👤 Deployer: 0x097b70CfE0007915249D31dF96a5B582bAb96D75
💰 Balance: 0.5 ETH
✅ Connected to network. Current block: 12345678

📦 Deploying TokenFactory...
   Global Supply Tracker: 0x130195A8D09dfd99c36D5903B94088EDBD66533e
   Chain Name: ethereum
   Use Global Supply: true
   🔗 Cross-Chain Enabled: YES
   LayerZero Endpoint: 0x6EDCE65403992e310A62460808c4b910D972f10f
   Cross-Chain Sync: 0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
   Chain EID: 40161

⏳ Transaction hash: 0x...
⏳ Waiting for deployment confirmation...

✅ TokenFactory deployed successfully!
📍 Address: 0x... (NEW ADDRESS HERE)
🔗 Explorer: https://sepolia.etherscan.io/address/0x...

📝 IMPORTANT: Add this address to your frontend/.env file:
   VITE_ETH_FACTORY=0x... (NEW ADDRESS HERE)

✅ Deployment complete!
```

## ⚠️ Troubleshooting

### "Private key not found" or "Private key too short"
- Check that `.env` file exists in `contracts/` directory
- Verify `PRIVATE_KEY=...` is set correctly
- Private key should be 64 characters (without `0x` prefix)
- No quotes around the private key value

### "Insufficient funds"
- Get testnet tokens from faucets (links above)
- Check your wallet balance on block explorers
- Recommended: 0.1+ ETH/BNB per network

### "RPC connection failed"
- Check RPC URLs in `.env` file
- Try public RPC endpoints if custom ones are down
- Verify network is accessible

### "Transaction reverted"
- Verify you're on the correct network
- Check that GlobalSupplyTracker and CrossChainSync addresses are correct
- Ensure contracts are properly funded

## 🎯 What Happens After Deployment

Once deployed:

1. ✅ Token creation will work without authorization errors
2. ✅ New tokens can be created on all networks
3. ✅ Cross-chain sync will work (GlobalSupplyTracker is already authorized)
4. ✅ Existing tokens (created with old factory) will continue to work
5. ✅ New tokens must use the new factory addresses

## 📚 Additional Resources

- `DEPLOYMENT_STEPS.md` - Quick start guide
- `DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `NEXT_STEPS_SUMMARY.md` - Summary of changes
- `DEPLOYMENT_RESULTS.md` - Current contract addresses

## 🆘 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify your `.env` file is set up correctly
3. Check that you have testnet tokens
4. Review the troubleshooting section above
5. Check block explorers for transaction status

---

**Ready to deploy?** Follow the steps above and you'll be done in 15-30 minutes!

