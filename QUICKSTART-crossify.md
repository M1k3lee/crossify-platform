# Quick Start Guide

Get Crossify.io up and running quickly!

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/M1k3lee/crossify-platform.git
cd crossify-platform
```

2. **Install all dependencies**
```bash
npm run install:all
```

Or install individually:
```bash
cd backend && npm install
cd ../frontend && npm install
cd ../contracts && npm install
```

## Configuration

### Quick Setup Script (Easiest!)

**Windows (PowerShell):**
```powershell
.\setup-env.ps1
```

**Mac/Linux:**
```bash
chmod +x setup-env.sh
./setup-env.sh
```

This will automatically create `.env` files from the examples!

### Manual Setup

### Backend

1. **Copy the example file:**
   ```bash
   cd backend
   # Windows PowerShell:
   Copy-Item .env.example .env
   # Mac/Linux:
   cp .env.example .env
   ```

2. **Open `backend/.env`** and fill in:
   - `PORT=3001` (default, can leave as is)
   - `CORS_ORIGIN=http://localhost:3000` (default, can leave as is)
   - `ETHEREUM_RPC_URL` - Get free RPC from [Infura](https://infura.io) or use public: `https://eth-sepolia.publicnode.com`
   - `ETHEREUM_PRIVATE_KEY` - Your testnet wallet private key (create a new MetaMask wallet for testing!)

   **📖 See `SETUP_ENV.md` for detailed step-by-step instructions!**

### Frontend

1. Update `frontend/src/config/wagmi.ts` with your WalletConnect Project ID (get from https://cloud.walletconnect.com)
   - This is optional for local development, but needed for production

### Contracts

1. **Copy the example file:**
   ```bash
   cd contracts
   # Windows PowerShell:
   Copy-Item .env.example .env
   # Mac/Linux:
   cp .env.example .env
   ```

2. **Open `contracts/.env`** and fill in:
   - `ETHEREUM_RPC_URL` - Same as backend
   - `ETHEREUM_PRIVATE_KEY` - Same as backend

   **📖 See `SETUP_ENV.md` for detailed instructions and free RPC options!**

## Running Locally

### Start Backend
```bash
npm run dev:backend
```
Backend runs on http://localhost:3001

### Start Frontend
```bash
npm run dev:frontend
```
Frontend runs on http://localhost:3000

## Deploying Smart Contracts

### EVM Chains (Ethereum, BSC, Base)

```bash
cd contracts
npm run compile
npm run deploy:sepolia  # or deploy:bsc, deploy:base
```

### Solana

See `contracts/solana/README.md` for Anchor setup instructions.

## Deploying to Production

### Frontend (GitHub Pages)

1. Push to `main` branch
2. GitHub Actions will automatically deploy to GitHub Pages
3. Or manually: `cd frontend && npm run build` and push `dist/` to `gh-pages` branch

### Backend

1. Set up hosting (Railway, Render, etc.)
2. Configure environment variables
3. Deploy using your provider's CLI or dashboard

See `DEPLOYMENT.md` for detailed instructions.

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

## Need Help?

- Check `DEPLOYMENT.md` for detailed deployment instructions
- See `docs/ARCHITECTURE.md` for system architecture
- Review `README.md` for project overview

## Next Steps

1. Deploy contracts to testnets
2. Test token creation flow
3. Test bonding curve buy/sell
4. Test graduation to DEX
5. Deploy to production!

