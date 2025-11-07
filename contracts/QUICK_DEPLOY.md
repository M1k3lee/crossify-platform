# Quick Deployment Guide

## ✅ Contracts are now compiled! Ready to deploy.

## Step 1: Create `.env` file

Create a `.env` file in the `contracts` directory:

```env
# Your wallet private key (NEVER commit this!)
ETHEREUM_PRIVATE_KEY=your_private_key_here
BSC_PRIVATE_KEY=your_private_key_here
BASE_PRIVATE_KEY=your_private_key_here

# RPC URLs (use free public ones or your own)
ETHEREUM_RPC_URL=https://rpc.sepolia.org
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BASE_RPC_URL=https://sepolia.base.org
```

## Step 2: Get Testnet Tokens

You need testnet tokens for gas fees:

- **Sepolia ETH**: https://sepoliafaucet.com/ or https://www.alchemy.com/faucets/ethereum-sepolia
- **BSC Testnet BNB**: https://testnet.bnbchain.org/faucet-smart
- **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Step 3: Deploy to Testnets

### Deploy to Sepolia (Ethereum)
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### Deploy to BSC Testnet
```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

### Deploy to Base Sepolia
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

## Step 4: Copy Factory Addresses

After each deployment, copy the `tokenFactory` address and add to `frontend/.env`:

```env
VITE_ETH_FACTORY=0x... (from Sepolia)
VITE_BSC_FACTORY=0x... (from BSC)
VITE_BASE_FACTORY=0x... (from Base)
```

## Step 5: Restart Frontend

After adding the factory addresses, restart your frontend dev server.

## Troubleshooting

**"Insufficient funds"**
- Make sure you have testnet tokens in your wallet
- Check your wallet address balance on the testnet explorer

**"Network not found"**
- Make sure your `.env` file has the correct RPC URLs
- Check that the network names match: `sepolia`, `bscTestnet`, `baseSepolia`

**"Nonce too high"**
- This can happen if you have pending transactions
- Wait a few minutes or reset your MetaMask account (Settings → Advanced → Reset Account)

## What Happens After Deployment?

1. ✅ TokenFactory contract is deployed on testnet
2. ✅ Contract address is saved
3. ✅ Frontend can now create tokens using the factory
4. ✅ All token creations will be on-chain and verifiable!

You're all set! 🚀






