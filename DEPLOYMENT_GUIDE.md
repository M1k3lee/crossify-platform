# Deployment Guide - Crossify.io

## ✅ What's Been Fixed

1. **Deploy Button Now Works** - MetaMask will prompt you when deploying tokens
2. **Unified Liquidity Pool** - Created contract and service for cross-chain price consistency
3. **Menu Styling** - Fixed text alignment and responsive layout
4. **Enhanced Logo** - More dynamic and visually appealing

## 🚀 Critical: Deploy Factory Contracts First!

**The deploy button will NOT work until you deploy the TokenFactory contracts to testnets.**

### Step 1: Deploy Factory Contracts

```bash
cd contracts

# Make sure you have a .env file with your private key and RPC URLs
# See contracts/.env.example

# Deploy to Sepolia (Ethereum)
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Step 2: Add Factory Addresses to Frontend

After each deployment, copy the `TokenFactory` address and add to `frontend/.env`:

```env
VITE_ETH_FACTORY=0x...  # From Sepolia deployment
VITE_BSC_FACTORY=0x...  # From BSC Testnet deployment
VITE_BASE_FACTORY=0x... # From Base Sepolia deployment
```

### Step 3: Restart Frontend

```bash
cd frontend
npm run dev
```

## 🎯 How Token Deployment Works

1. **User fills out token form** → Creates database record
2. **User clicks "Deploy Token"** → Frontend calls `deployTokenOnEVM()`
3. **MetaMask popup appears** → User signs transaction
4. **Token + BondingCurve deployed** → On-chain contract addresses returned
5. **Deployment saved to database** → Token appears in marketplace

## 🔄 Unified Liquidity Pool System

### How It Works

The Unified Liquidity Pool maintains price consistency across chains:

1. **Price Monitoring** - Service checks prices on all chains every 5 minutes
2. **Deviation Detection** - If price differs >1% between chains, sync is triggered
3. **Automatic Rebalancing** - Liquidity is rebalanced to keep prices aligned
4. **Real-time Updates** - Database updated with latest prices

### Smart Contract

- **UnifiedLiquidityPool.sol** - Tracks pools across chains
- **Price calculation** - `price = reserve / balance`
- **Sync threshold** - Configurable (default 1%)
- **Arbitrage ready** - Designed for bridge-based arbitrage

### Backend Service

- **unifiedLiquidity.ts** - Monitors and syncs prices
- **Automatic monitoring** - Runs every 5 minutes
- **Cross-chain price sync** - Maintains consistency

## 📝 Testing the Deployment

1. **Connect MetaMask** - Make sure you're on Sepolia testnet
2. **Fill out token form** - Name, symbol, initial supply
3. **Select chains** - Choose Ethereum, BSC, or Base
4. **Click "Deploy Token"** - MetaMask should pop up
5. **Sign transaction** - Pay gas fees
6. **Wait for confirmation** - Deployment completes
7. **View token** - Check marketplace or token detail page

## ⚠️ Troubleshooting

### "Factory contract not deployed"
- **Solution**: Deploy factory contracts first (Step 1 above)
- **Error**: `VITE_ETH_FACTORY` not set in `.env`

### "Transaction rejected"
- **Solution**: User cancelled MetaMask prompt
- **Check**: Make sure you have testnet tokens for gas

### "Insufficient funds"
- **Solution**: Get testnet tokens from faucets:
  - Sepolia: https://sepoliafaucet.com/
  - BSC: https://testnet.bnbchain.org/faucet-smart
  - Base: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### "Network not found"
- **Solution**: MetaMask will prompt to add network automatically
- **Manual**: Add network in MetaMask if needed

## 🎨 What's New

- ✅ **Enhanced Logo** - Animated particles, glowing effects
- ✅ **Better Menu** - Fixed alignment, responsive design
- ✅ **Real Deployments** - Actual blockchain transactions
- ✅ **Unified Liquidity** - Cross-chain price synchronization
- ✅ **Error Handling** - Better error messages and validation

## 📚 Next Steps

1. Deploy factory contracts to testnets
2. Test token creation flow
3. Verify unified liquidity pool syncs prices
4. Deploy to mainnets when ready

## 🔗 Important Files

- `contracts/contracts/TokenFactory.sol` - Factory contract
- `contracts/contracts/UnifiedLiquidityPool.sol` - Liquidity pool contract
- `frontend/src/services/blockchain.ts` - Deployment service
- `frontend/src/pages/Builder.tsx` - Token creation UI
- `backend/src/services/unifiedLiquidity.ts` - Price sync service





