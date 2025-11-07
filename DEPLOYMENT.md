# Deployment Guide

## Overview

Crossify.io uses **Hardhat** for EVM chains (Ethereum, BSC, Base) and **Anchor** for Solana. This is the industry standard, free, and provides the best developer experience.

## Why Hardhat?

- ✅ **Free and open source**
- ✅ **Industry standard** for EVM development
- ✅ **Excellent tooling** (testing, debugging, deployment)
- ✅ **Multi-network support** (easy to deploy to multiple chains)
- ✅ **Production-ready** workflows
- ✅ **Better than Remix** for team collaboration and CI/CD

## Smart Contract Deployment

### Prerequisites

1. Install Node.js 18+
2. Get testnet ETH/BNB/SOL for gas fees
3. Set up RPC endpoints (Infura, Alchemy, or public RPCs)

### EVM Chains (Hardhat)

#### 1. Setup

```bash
cd contracts
npm install
```

#### 2. Configure Environment

Create `contracts/.env`:
```
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHEREUM_PRIVATE_KEY=your_private_key_here
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://sepolia.base.org
BASE_PRIVATE_KEY=your_private_key_here

# Optional: For contract verification
ETHERSCAN_API_KEY=your_key
# Note: BSC now uses Etherscan API V2 - you can use the same ETHERSCAN_API_KEY for BSC
# BSC_ETHERSCAN_API_KEY=your_key (optional, can reuse ETHERSCAN_API_KEY)
BASESCAN_API_KEY=your_key
```

#### 3. Compile Contracts

```bash
npm run compile
```

#### 4. Deploy to Testnets

```bash
# Sepolia (Ethereum)
npm run deploy:sepolia

# BSC Testnet
npm run deploy:bsc

# Base Sepolia
npm run deploy:base
```

#### 5. Verify Contracts (Optional)

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Solana (Anchor Framework)

For Solana, we use Anchor framework (standard for Solana development).

#### 1. Install Anchor

```bash
# macOS/Linux
avm install latest
avm use latest

# Or use cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

#### 2. Setup Project

```bash
cd contracts/solana
anchor build
anchor keys list
```

#### 3. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

## Frontend Deployment (GitHub Pages)

The frontend automatically deploys to GitHub Pages on push to `main` branch.

### Manual Deployment

1. Build the frontend:
```bash
cd frontend
npm install
npm run build
```

2. The `dist` folder contains the built files.

3. For GitHub Pages, push to `gh-pages` branch or use GitHub Actions (already configured).

## Backend Deployment

### Options

1. **Railway** (Recommended - Free tier available)
2. **Render** (Free tier available)
3. **Heroku** (Paid)
4. **VPS** (DigitalOcean, AWS, etc.)

### Railway Deployment

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Deploy:
```bash
cd backend
railway init
railway up
```

### Environment Variables

Set these in your hosting provider:

```
PORT=3001
NODE_ENV=production
DATABASE_PATH=./data/crossify.db
REDIS_HOST=your_redis_host
REDIS_PORT=6379
ETHEREUM_RPC_URL=...
# ... (all other env vars from .env.example)
```

## GitHub Actions

Workflows are configured for:
- Frontend → GitHub Pages (automatic)
- Backend → Deploy to hosting provider (configure in `.github/workflows/backend.yml`)
- Contracts → Compile and test (automatic)

## Testing

### Test Contracts

```bash
cd contracts
npm test
```

### Test Backend

```bash
cd backend
npm test
```

### Test Frontend

```bash
cd frontend
npm test
```

## Production Checklist

- [ ] Deploy contracts to mainnets
- [ ] Verify contracts on block explorers
- [ ] Set up production RPC endpoints
- [ ] Configure environment variables
- [ ] Set up monitoring and alerts
- [ ] Test all features on testnets
- [ ] Security audit (recommended)
- [ ] Set up domain and SSL
- [ ] Configure CORS for production domain

## Support

For deployment issues, check:
- Hardhat docs: https://hardhat.org/docs
- Anchor docs: https://www.anchor-lang.com/docs
- GitHub Actions docs: https://docs.github.com/en/actions

