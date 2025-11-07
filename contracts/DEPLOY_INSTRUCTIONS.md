# 🚀 Quick Deployment Instructions

## Prerequisites

1. **Private Key**: You need your wallet's private key with testnet tokens
   - Get it from MetaMask: Settings → Security & Privacy → Show Private Key
   - **⚠️ NEVER share or commit this key!**

2. **Testnet Tokens**: Make sure your wallet has:
   - Sepolia ETH: https://sepoliafaucet.com/
   - BSC Testnet BNB: https://testnet.bnbchain.org/faucet-smart
   - Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Step 1: Set Up contracts/.env

Create or edit `contracts/.env` file:

```env
PRIVATE_KEY=your_private_key_here_without_0x_prefix_if_present
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
```

**Important**: 
- Remove the `0x` prefix from your private key if it has one
- The private key should be 64 hex characters

## Step 2: Deploy to All Testnets

Run the deployment script:

```powershell
cd contracts
.\deploy-all.ps1
```

Or deploy manually one by one:

```bash
# Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# BSC Testnet  
npx hardhat run scripts/deploy.ts --network bscTestnet

# Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

## Step 3: Update Frontend .env

After each deployment, copy the factory address and add to `frontend/.env`:

```env
VITE_ETH_FACTORY=0x... (from Sepolia deployment)
VITE_BSC_FACTORY=0x... (from BSC deployment)
VITE_BASE_FACTORY=0x... (from Base deployment)
```

The `deploy-all.ps1` script will try to update this automatically.

## Step 4: Restart Frontend

```bash
cd frontend
npm run dev
```

## Troubleshooting

**"PRIVATE_KEY not found"**
- Make sure your `.env` file is in the `contracts/` directory
- Check that the line starts with `PRIVATE_KEY=` (no spaces)
- Make sure there are no quotes around the key

**"Insufficient funds"**
- Get testnet tokens from the faucets above
- Check your wallet balance on the testnet explorer

**"Stack too deep" compilation error**
- This is fixed by the `viaIR: true` setting in hardhat.config.ts
- If you still see it, try: `npx hardhat clean` then retry





