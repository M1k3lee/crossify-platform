# Crossify.io - Multichain Token Launch Platform

A complete multichain token launch platform that lets users create and launch tokens across Ethereum, BSC, Solana (SPL), Base, and Hedera with bonding curve sales and automatic graduation to DEX.

## Features

- 🚀 **Multichain Deployment**: Deploy tokens on Ethereum, BSC, Solana, Base, and Hedera
- ⚡ **Hedera Integration**: Ultra-fast (3-5s finality) and ultra-cheap (~$0.0001/tx) token launches
- 📝 **Immutable Audit Logs**: Powered by Hedera Consensus Service (HCS) for enterprise-grade audit trails
- 📁 **Decentralized Storage**: Token metadata stored on Hedera File Service (HFS) - permanent, immutable, ultra-low cost
- 📈 **Bonding Curve Sales**: Auto-pricing with capped graduation threshold
- 🎓 **Automatic DEX Graduation**: ✅ **Fully Implemented** - Automatic migration to DEX when market cap threshold is reached
  - **Multi-DEX Support**: Raydium (Solana), Uniswap V3 (Ethereum), PancakeSwap (BSC), BaseSwap (Base)
  - **Epic Celebrations**: Confetti animations and celebration modals
  - **Progress Tracking**: Real-time progress bars and analytics
- 🌉 **Cross-chain Bridge**: ✅ **Fully Deployed** - Shared/synchronized liquidity pools with automatic rebalancing
- 📊 **Real-time Price Sync**: Monitor and sync prices across chains (max 0.5% variance)
- 💧 **Automatic Liquidity Bridging**: ✅ **Fully Deployed** - Automatically bridges liquidity when reserves are low
- ⚖️ **Proactive Rebalancing**: ✅ **Active** - Monitors and rebalances reserves every 30 seconds
- 📊 **Graduation Analytics**: ✅ **Fully Implemented** - Comprehensive analytics dashboard with success rates, time-to-graduation stats, and post-graduation performance
- 🎨 **Token Metadata**: IPFS logo upload, social links, and descriptions
- 📱 **Dashboard**: Real-time stats, transaction history, cross-chain monitoring, and graduation analytics

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
- **DEX Graduation System**: `docs/DEX_GRADUATION_COMPLETE.md` - Complete graduation system guide
- **Graduation Implementation**: `docs/GRADUATION_IMPLEMENTATION_SUMMARY.md` - Implementation details
- **Cross-Chain Liquidity Bridge**: `docs/LIQUIDITY_BRIDGE_IMPLEMENTATION.md` - Complete bridge system guide
- **Bridge Deployment**: `docs/DEPLOY_LIQUIDITY_BRIDGE.md` - Step-by-step deployment guide
- **DEX Integration**: `docs/DEX_INTEGRATION_GUIDE.md` - DEX integration details
- **Deployment Results**: `LIQUIDITY_BRIDGE_DEPLOYMENT_RESULTS.md` - All deployed contract addresses
- **Final Summary**: `FINAL_DEPLOYMENT_SUMMARY.md` - Complete deployment status
- Smart contract architecture
- API endpoints
- Frontend components
- Deployment guides

## 🎉 Cross-Chain Liquidity Bridge - DEPLOYED!

The cross-chain liquidity bridge system is **fully deployed and operational** on all testnets:

- **Sepolia**: `0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29`
- **BSC Testnet**: `0x08BA4231c0843375714Ef89999C9F908735E0Ec2`
- **Base Sepolia**: `0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA`

The system automatically monitors reserves every 30 seconds and rebalances liquidity across chains.

### 🚀 Quick Activation

1. **Update `backend/.env`** with bridge addresses (see `backend/ENV_BRIDGE_TEMPLATE.md`)
2. **Restart backend** to activate monitoring service

See `COMPLETE_SETUP_INSTRUCTIONS.md` for complete setup guide.

## Repository

- **GitHub**: https://github.com/M1k3lee/crossify-platform
- **Live Site**: https://www.crossify.io

## License

MIT








