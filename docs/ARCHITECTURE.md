# Crossify.io Architecture

## Overview

Crossify.io is a multichain token launch platform that enables users to create and deploy tokens across Ethereum, BSC, Solana, and Base with bonding curve sales and automatic graduation to DEX.

## Technology Stack

### Smart Contracts
- **EVM Chains (Ethereum, BSC, Base)**: Hardhat + Solidity
- **Solana**: Anchor Framework + Rust

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (MVP) / PostgreSQL (production)
- **Cache**: Redis
- **IPFS**: For logo/metadata storage

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Wallet Integration**: 
  - EVM: Wagmi + RainbowKit
  - Solana: @solana/wallet-adapter

## Architecture Components

### 1. Smart Contracts

#### TokenFactory
- Creates ERC20/SPL tokens with custom metadata
- Supports burnable and pausable tokens
- Stores metadata URI (IPFS hash)

#### BondingCurve
- Linear pricing formula: `price = basePrice + (slope * supplySold)`
- Handles buy/sell operations
- Automatic graduation when market cap threshold reached
- Configurable buy/sell fees

#### Migration
- Migrates tokens from bonding curve to DEX (Uniswap V3 / Raydium)
- Transfers liquidity to DEX pool
- Freezes bonding curve trading

### 2. Backend API

#### Endpoints
- `POST /api/tokens/create` - Create token configuration
- `POST /api/tokens/:id/deploy` - Deploy to selected chains
- `POST /api/tokens/:id/buy` - Buy tokens from curve
- `POST /api/tokens/:id/migrate` - Manually trigger graduation
- `GET /api/tokens/:id/status` - Get token status across chains
- `GET /api/tokens/:id/metadata` - Get token metadata
- `GET /api/tokens/:id/price-sync` - Get cross-chain price sync status
- `GET /api/pools/shared-liquidity` - Get shared liquidity pools
- `GET /api/transactions` - Get transaction history

#### Services
- **Blockchain Service**: Abstraction layer for multichain operations
- **Price Sync Service**: Monitors and syncs prices across chains
- **IPFS Service**: Handles logo uploads and metadata storage

### 3. Frontend

#### Pages
- **Home**: Landing page with features overview
- **Builder**: Multi-step token creation wizard
- **Dashboard**: User's token portfolio
- **Token Detail**: Token status, price charts, chain info

#### Features
- Wallet connection (MetaMask, WalletConnect, Phantom, Solflare)
- Real-time price monitoring
- Cross-chain price variance alerts
- Transaction history
- Graduation progress tracking

## Deployment Strategy

### Smart Contracts
- **Development**: Local Hardhat network / Solana localnet
- **Testing**: Sepolia, BSC Testnet, Base Sepolia, Solana Devnet
- **Production**: Mainnets (Ethereum, BSC, Base, Solana)

### Backend
- **Hosting**: Railway, Render, or VPS
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **Redis**: Managed Redis service

### Frontend
- **Hosting**: GitHub Pages (free) or Vercel
- **CDN**: Automatic via hosting provider

## Security Considerations

1. **Smart Contracts**
   - OpenZeppelin libraries for standard contracts
   - ReentrancyGuard for bonding curve
   - Access control for migration
   - Comprehensive testing

2. **Backend**
   - Rate limiting
   - Input validation (Zod)
   - CORS configuration
   - Environment variable security

3. **Frontend**
   - Wallet connection security
   - Transaction signing confirmation
   - Error handling

## Future Enhancements

- [ ] Cross-chain bridge integration (Wormhole/Synapse)
- [ ] Advanced bonding curve formulas (quadratic, etc.)
- [ ] Staking mechanisms
- [ ] Governance features
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Social features (comments, voting)








