# Deploy TokenFactory Contracts - Step by Step Guide

## Overview
After fixing the token deployment issue, we need to redeploy the TokenFactory contracts on all networks with the updated code that removes the unnecessary CrossChainSync authorization.

## Prerequisites

1. **Environment Setup**
   - Ensure you have a `.env` file in the `contracts` directory
   - You need the private key of the wallet that will deploy the contracts
   - The wallet should have testnet tokens (ETH for Sepolia/Base, BNB for BSC)

2. **Required Environment Variables**
   ```env
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
   BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
   ```

## Step 1: Verify Contract Compilation

```bash
cd contracts
npx hardhat compile
```

You should see "Compiled successfully" with no errors.

## Step 2: Deploy to Sepolia (Ethereum Testnet)

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output:**
```
🚀 Deploying TokenFactory contract...
📋 Network: sepolia
👤 Deployer: 0x...
💰 Balance: X ETH

✅ TokenFactory deployed to: 0x... (NEW ADDRESS)
```

**⚠️ IMPORTANT:** Copy the new TokenFactory address - you'll need it for the frontend!

## Step 3: Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

**⚠️ IMPORTANT:** Copy the new TokenFactory address!

## Step 4: Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**⚠️ IMPORTANT:** Copy the new TokenFactory address!

## Step 5: Update Frontend Environment Variables

After deploying to all networks, update your frontend `.env` file (or Vercel environment variables) with the new factory addresses:

```env
VITE_ETH_FACTORY=0x... (new Sepolia factory address)
VITE_BSC_FACTORY=0x... (new BSC Testnet factory address)
VITE_BASE_FACTORY=0x... (new Base Sepolia factory address)
```

## Step 6: Verify Deployments

You can verify the contracts on block explorers:

### Sepolia
- Explorer: https://sepolia.etherscan.io
- Verify: `npx hardhat verify --network sepolia <FACTORY_ADDRESS> <CONSTRUCTOR_ARGS>`

### BSC Testnet
- Explorer: https://testnet.bscscan.com
- Verify: `npx hardhat verify --network bscTestnet <FACTORY_ADDRESS> <CONSTRUCTOR_ARGS>`

### Base Sepolia
- Explorer: https://sepolia-explorer.base.org
- Verify: `npx hardhat verify --network baseSepolia <FACTORY_ADDRESS> <CONSTRUCTOR_ARGS>`

## Step 7: Test Token Creation

1. Go to the Builder page in your frontend
2. Fill in token details
3. Select chains (Sepolia, BSC, Base)
4. Click "Deploy Token"
5. Verify that deployment succeeds without the "Failed to authorize token in CrossChainSync" error

## Troubleshooting

### "Insufficient funds"
- Make sure your wallet has enough testnet tokens
- Get tokens from faucets:
  - Sepolia: https://sepoliafaucet.com/
  - BSC Testnet: https://testnet.bnbchain.org/faucet-smart
  - Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### "Private key not found"
- Check that your `.env` file has `PRIVATE_KEY=...`
- Make sure there are no extra spaces or quotes

### "RPC connection failed"
- Check your RPC URLs in the `.env` file
- Try using public RPC endpoints if your custom ones are down

### "Transaction reverted"
- Make sure you're using the correct network
- Check that the GlobalSupplyTracker and CrossChainSync addresses are correct in `deploy.ts`

## What Changed?

The new TokenFactory contract:
- ✅ Removes the unnecessary authorization call to CrossChainSync
- ✅ Tokens don't need to be authorized in CrossChainSync (only GlobalSupplyTracker does)
- ✅ Token creation will succeed without authorization errors
- ✅ Cross-chain sync still works (GlobalSupplyTracker is already authorized)

## Notes

- **Existing tokens** created with the old factory will continue to work
- **New tokens** must be created with the new factory addresses
- The old factory addresses can be retired after confirming all new deployments work

## Next Steps After Deployment

1. Update frontend environment variables (Vercel/Railway)
2. Test token creation on all networks
3. Verify cross-chain price synchronization works
4. Monitor for any issues

