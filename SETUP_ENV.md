# Environment Variables Setup Guide

This guide will walk you through setting up all the environment variables needed for Crossify.io.

## Quick Setup (5 minutes)

### Step 1: Backend Environment Variables

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Copy the example file:**
   ```bash
   # On Windows (PowerShell):
   Copy-Item .env.example .env
   
   # On Mac/Linux:
   cp .env.example .env
   ```

3. **Open `.env` file** in a text editor (VS Code, Notepad++, etc.)

4. **Fill in the minimum required values** (see below for details)

### Step 2: Contracts Environment Variables

1. **Navigate to the contracts folder:**
   ```bash
   cd ../contracts
   ```

2. **Copy the example file:**
   ```bash
   # On Windows (PowerShell):
   Copy-Item .env.example .env
   
   # On Mac/Linux:
   cp .env.example .env
   ```

3. **Open `.env` file** and fill in your RPC URLs and private keys

---

## Detailed Configuration Guide

### 🔴 Required Values (Must Have)

#### Backend `.env` - Minimum Required:
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/crossify.db
CORS_ORIGIN=http://localhost:3000
```

#### Contracts `.env` - Minimum Required:
You need at least ONE of these to deploy contracts:
```env
# For Ethereum Sepolia testnet:
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_PRIVATE_KEY=your_private_key

# OR for BSC testnet:
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_PRIVATE_KEY=your_private_key
```

---

## Getting Free RPC URLs

### Option 1: Infura (Recommended - Free tier available)

1. Go to https://infura.io
2. Sign up for a free account
3. Create a new project
4. Copy the "HTTPS" endpoint URL
5. It will look like: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### Option 2: Alchemy (Free tier available)

1. Go to https://alchemy.com
2. Sign up for a free account
3. Create a new app
4. Copy the HTTP URL
5. It will look like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### Option 3: Public RPCs (Free, but rate-limited)

**Ethereum Sepolia:**
- `https://sepolia.infura.io/v3/YOUR_PROJECT_ID` (requires Infura account)
- `https://eth-sepolia.publicnode.com` (completely free, no account)

**BSC Testnet:**
- `https://data-seed-prebsc-1-s1.binance.org:8545/` (free)
- `https://bsc-testnet.publicnode.com` (free)

**Base Sepolia:**
- `https://sepolia.base.org` (free)
- `https://base-sepolia.publicnode.com` (free)

**Solana Devnet:**
- `https://api.devnet.solana.com` (free)
- `https://solana-devnet.publicnode.com` (free)

---

## Getting Private Keys

### ⚠️ IMPORTANT: Security Warning

**NEVER use your mainnet wallet's private key!** Always use a separate testnet wallet.

### For Testnets (Safe for Development):

1. **Create a new MetaMask wallet** (or use an existing test wallet)
2. **Get the private key:**
   - Open MetaMask
   - Click the account menu (three dots)
   - Select "Account Details"
   - Click "Show Private Key"
   - Enter your password
   - Copy the private key (it starts with `0x`)

3. **Fund it with testnet tokens:**
   - **Sepolia ETH**: https://sepoliafaucet.com or https://faucet.quicknode.com/ethereum/sepolia
   - **BSC Testnet BNB**: https://testnet.bnbchain.org/faucet-smart
   - **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - **Solana Devnet SOL**: https://faucet.solana.com

### Format:
Private keys should be in hex format, either:
- `0x1234567890abcdef...` (with 0x prefix)
- `1234567890abcdef...` (without 0x prefix)

Both formats work.

---

## Complete Configuration Examples

### Backend `.env` - Full Example (Development)
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/crossify.db

# Redis (optional - can skip for MVP)
REDIS_HOST=localhost
REDIS_PORT=6379

# IPFS (optional - can use public gateway)
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY=https://ipfs.io/ipfs/

# Ethereum - using public RPC
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
ETHEREUM_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# BSC - using public RPC
BSC_RPC_URL=https://bsc-testnet.publicnode.com
BSC_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Base - using public RPC
BASE_RPC_URL=https://base-sepolia.publicnode.com
BASE_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Solana - using public RPC
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_solana_private_key_in_base58_format

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT (generate random string)
JWT_SECRET=my_super_secret_jwt_key_12345
```

### Contracts `.env` - Full Example
```env
# Ethereum Sepolia
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
ETHEREUM_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
ETHERSCAN_API_KEY=your_etherscan_key_here

# BSC Testnet
BSC_RPC_URL=https://bsc-testnet.publicnode.com
BSC_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
# Note: BSC now uses Etherscan API V2 - you can use the same ETHERSCAN_API_KEY
# BSC_ETHERSCAN_API_KEY=your_etherscan_key_here (optional, can use ETHERSCAN_API_KEY)

# Base Sepolia
BASE_RPC_URL=https://base-sepolia.publicnode.com
BASE_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
BASESCAN_API_KEY=your_basescan_key_here
```

---

## Quick Start (Minimal Setup)

If you just want to get started quickly, here's the **absolute minimum**:

### Backend `.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/crossify.db
CORS_ORIGIN=http://localhost:3000
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
ETHEREUM_PRIVATE_KEY=your_testnet_private_key_here
```

### Contracts `.env`:
```env
ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
ETHEREUM_PRIVATE_KEY=your_testnet_private_key_here
```

That's it! You can add the other chains later.

---

## Verification

### Check if your backend `.env` is working:
```bash
cd backend
npm run dev
```

If you see "✅ Database initialized" and "🚀 Server running on port 3001", you're good!

### Check if your contracts `.env` is working:
```bash
cd contracts
npm run compile
```

If it compiles without errors, you're set!

---

## Troubleshooting

### "Cannot find module 'dotenv'"
```bash
cd backend
npm install
```

### "Invalid RPC URL"
- Make sure your RPC URL is correct
- Try a different public RPC
- Check if you need an API key

### "Insufficient funds"
- Get testnet tokens from faucets (links above)
- Make sure you're using the correct network

### "Private key format error"
- Make sure it starts with `0x` or is a valid hex string
- Remove any extra spaces or newlines

---

## Need Help?

If you're stuck:
1. Check that your `.env` files are in the correct directories (`backend/` and `contracts/`)
2. Make sure there are no syntax errors (no missing quotes, etc.)
3. Verify your RPC URLs are accessible
4. Ensure your private keys are from testnet wallets

---

## Next Steps

Once your environment is configured:
1. ✅ Test the backend: `cd backend && npm run dev`
2. ✅ Test the frontend: `cd frontend && npm run dev`
3. ✅ Deploy contracts: `cd contracts && npm run compile && npm run deploy:sepolia`

Happy coding! 🚀

