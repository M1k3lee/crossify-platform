# Crossify.io - Multichain Token Launch Platform

A complete multichain token launch platform that lets users create and launch tokens across Ethereum, BSC, Solana (SPL), and Base with bonding curve sales and automatic graduation to DEX.

## Features

- 🚀 **Multichain Deployment**: Deploy tokens on Ethereum, BSC, Solana, and Base
- 📈 **Bonding Curve Sales**: Auto-pricing with capped graduation threshold
- 🎓 **Pump.fun-style Graduation**: Automatic migration to DEX when market cap threshold is reached
- 🌉 **Cross-chain Bridge**: Shared/synchronized liquidity pools across chains
- 📊 **Real-time Price Sync**: Monitor and sync prices across chains (max 0.5% variance)
- 🎨 **Token Metadata**: IPFS logo upload, social links, and descriptions
- 📱 **Dashboard**: Real-time stats, transaction history, and cross-chain monitoring

## Project Structure

```
crossify-platform/
├── backend/          # Node.js/TypeScript API server
├── frontend/         # React + TypeScript frontend
├── contracts/        # Smart contracts (Solidity + Solana)
├── scripts/          # Deployment and utility scripts
└── docs/             # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Solidity compiler (via Hardhat)
- Solana CLI tools (for Solana contracts)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Set up environment variables (see `.env.example` files)

4. Run migrations and deploy contracts

5. Start the backend:
   ```bash
   cd backend && npm run dev
   ```

6. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

## Documentation

See the `docs/` directory for detailed documentation on:
- Smart contract architecture
- API endpoints
- Frontend components
- Deployment guide

## Repository

- **GitHub**: https://github.com/M1k3lee/crossify-platform
- **Live Site**: https://www.crossify.io

## License

MIT








