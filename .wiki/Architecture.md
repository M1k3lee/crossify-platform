# System Architecture

**Written by MikeLee**

The Crossify platform is built on a foundation of interconnected smart contracts, backend services, and frontend interfaces. Understanding how these pieces fit together is key to appreciating what we've built.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)                 │
│              - Token Creation UI                              │
│              - Trading Interface                              │
│              - Dashboard & Analytics                          │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼───────────────────────────────────────┐
│              Backend (Node.js/TypeScript)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  API Server (Express)                                   │ │
│  │  - Token Management                                      │ │
│  │  - Transaction Tracking                                  │ │
│  │  - Price Monitoring                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Services Layer                                          │ │
│  │  - Price Sync Service                                    │ │
│  │  - Liquidity Bridge Monitor                             │ │
│  │  - Graduation Monitor                                    │ │
│  │  - Hedera Audit Service                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Database (PostgreSQL)                                   │ │
│  │  - Tokens                                                │ │
│  │  - Deployments                                           │ │
│  │  - Transactions                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Blockchain RPC Calls
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  Ethereum    │ │     BSC     │ │    Base     │
│  Sepolia     │ │  Testnet    │ │  Sepolia    │
│              │ │             │ │             │
│ TokenFactory │ │ TokenFactory│ │ TokenFactory│
│ BondingCurve │ │ BondingCurve│ │ BondingCurve│
│ GlobalSupply │ │ GlobalSupply│ │ GlobalSupply│
│ Liquidity    │ │ Liquidity   │ │ Liquidity   │
│ Bridge       │ │ Bridge      │ │ Bridge      │
└──────────────┘ └─────────────┘ └─────────────┘
```

## Core Components

### 1. Smart Contract Layer

#### TokenFactory
The entry point for all token creation. When a user wants to launch a token, they interact with the TokenFactory, which:
- Deploys a new ERC20 token contract
- Creates a BondingCurve for that token
- Registers everything with the GlobalSupplyTracker
- Enables cross-chain synchronization

**Key Design Decision**: We made TokenFactory chain-aware. Each deployment knows which chain it's on and can communicate with other chains through the cross-chain infrastructure.

#### BondingCurve
This is where the magic happens. Each token gets its own BondingCurve that:
- Manages buy/sell operations
- Calculates prices using the formula: `price = basePrice + (slope * globalSupply)`
- Tracks local supply and updates global supply
- Monitors for graduation conditions
- Handles liquidity bridging when reserves are low

**The Innovation**: Instead of using local supply for pricing, we use **global supply** from the GlobalSupplyTracker. This means a buy on BSC Testnet affects the price on Base Sepolia instantly.

#### GlobalSupplyTracker
The heart of our cross-chain synchronization. This contract:
- Maintains a global supply counter for each token
- Receives updates from all chains
- Provides unified supply data to all BondingCurves
- Integrates with UnifiedCrossChainSync for cross-chain messaging

**Why This Matters**: Traditional bonding curves use local supply, meaning prices diverge across chains. Our global supply approach keeps prices synchronized within 0.5% variance.

#### UnifiedCrossChainSync
Our next-generation cross-chain synchronization layer that supports multiple protocols in parallel:
- **Protocol Abstraction**: Unified interface for LayerZero and Supra HyperNova
- **Dual Protocol Support**: Can use LayerZero, Supra, or both simultaneously
- **Message Deduplication**: Prevents double-processing when both protocols deliver messages
- **Metrics Tracking**: Performance comparison between protocols
- **Automatic Failover**: If one protocol fails, the other handles it
- **Protocol Selection**: Auto-selects best protocol based on metrics, or manual selection per token

**Deployed Addresses** (All Networks):
- UnifiedCrossChainSync: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`
- SupraSync: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`

**Why This Matters**: Provides redundancy, performance optimization, and future-proofing. LayerZero is battle-tested and reliable, while Supra HyperNova offers enhanced security with L1-to-L1 cryptographic consensus. Running both in parallel gives us the best of both worlds.

#### CrossChainLiquidityBridge
Manages liquidity across chains. When a chain runs low on reserves:
- The bridge automatically requests liquidity from other chains
- Uses LayerZero to send liquidity requests
- Receives liquidity and updates reserves
- Maintains balance across all chains

**The Problem We Solved**: Without this, each chain would need its own liquidity pool. With the bridge, all chains share a unified liquidity pool that automatically rebalances.

### 2. Backend Services

#### Price Sync Service
Continuously monitors prices across all chains and:
- Detects price discrepancies
- Triggers synchronization when variance > 0.5%
- Logs all sync events to Hedera HCS
- Provides real-time price data to the frontend

#### Liquidity Bridge Monitor
Runs every 30 seconds to:
- Check reserve balances on all chains
- Identify chains with insufficient reserves
- Trigger automatic liquidity bridging
- Maintain optimal liquidity distribution

#### Graduation Monitor
Watches for tokens ready to graduate:
- Monitors market cap on all chains
- Calculates total market cap (sum across chains)
- Triggers graduation when threshold is reached
- Creates DEX pools automatically

#### Hedera Audit Service
Provides immutable audit logging:
- Records all transactions to Hedera Consensus Service
- Creates permanent, tamper-proof logs
- Enables full transaction history verification
- Powers the audit trail widget in the frontend

### 3. Frontend Layer

Built with React and TypeScript, the frontend provides:
- **Token Creation Interface**: Simple form to launch tokens
- **Trading Widget**: Buy/sell interface with real-time price updates
- **Dashboard**: Analytics, transaction history, cross-chain monitoring
- **Token Detail Pages**: Comprehensive token information with all chain deployments

**Key UX Innovation**: Users can see all their token's activity across all chains in one place. No more switching between explorers.

## Data Flow: A Token Purchase

Let's trace what happens when someone buys tokens:

1. **User Action**: User clicks "Buy" in the frontend, specifying amount
2. **Frontend**: Calculates estimated price, shows confirmation
3. **Wallet**: User approves transaction, sends to BondingCurve
4. **BondingCurve**: 
   - Receives payment (ETH/BNB/etc.)
   - Queries GlobalSupplyTracker for current global supply
   - Calculates price: `basePrice + (slope * globalSupply)`
   - Mints tokens to buyer
   - Updates local supply
   - Calls GlobalSupplyTracker to update global supply
5. **GlobalSupplyTracker**:
   - Updates its global supply counter
   - Calls UnifiedCrossChainSync to sync across chains
6. **UnifiedCrossChainSync**:
   - Routes message to selected protocol(s) (LayerZero, Supra, or both)
   - Tracks metrics for performance comparison
   - Handles message deduplication if both protocols deliver
7. **Other Chains**:
   - Receive cross-chain message via selected protocol
   - Update their GlobalSupplyTracker instances
   - All BondingCurves now see the new global supply
   - Prices update on all chains
8. **Backend**:
   - Monitors transaction via RPC
   - Records transaction in database
   - Logs to Hedera HCS
   - Updates frontend via WebSocket/polling
9. **Frontend**:
   - Shows transaction confirmation
   - Updates price display
   - Refreshes transaction history

**Total Time**: ~30-60 seconds for full cross-chain synchronization

## Security Architecture

### Multi-Layer Security

1. **Smart Contract Level**:
   - OpenZeppelin libraries for battle-tested code
   - Reentrancy guards on all external functions
   - Access control with Ownable pattern
   - Input validation on all parameters

2. **Cross-Chain Security**:
   - Dual protocol support (LayerZero + Supra) for redundancy
   - Message verification before state updates
   - Message deduplication prevents double-processing
   - Rate limiting on cross-chain updates
   - Fallback to local pricing if cross-chain fails
   - Automatic failover if one protocol fails

3. **Backend Security**:
   - Rate limiting on API endpoints
   - Input sanitization
   - Database query parameterization
   - CORS configuration

4. **Frontend Security**:
   - Wallet connection validation
   - Transaction simulation before execution
   - Price validation to prevent manipulation
   - Error handling and user feedback

## Scalability Considerations

### Current Capacity
- **Tokens**: Unlimited (database-backed)
- **Chains**: Currently 5, designed for easy expansion
- **Transactions**: ~1000 per 15 minutes per IP (rate limited)
- **Price Sync**: Real-time with 30-second monitoring

### Future Scaling
- **Horizontal Scaling**: Backend can run multiple instances
- **Database**: PostgreSQL supports high concurrency
- **Caching**: Redis integration for frequently accessed data
- **CDN**: Frontend served via GitHub Pages/Vercel

## Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.20
- **Hardhat**: Development and testing framework
- **OpenZeppelin**: Security libraries
- **LayerZero**: Cross-chain messaging (primary)
- **Supra HyperNova**: Cross-chain messaging (alternative, when EVM support launches)

### Backend
- **Node.js**: Runtime
- **TypeScript**: Type safety
- **Express**: Web framework
- **PostgreSQL**: Primary database
- **Redis**: Caching (optional)
- **Ethers.js**: Blockchain interaction

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Wagmi**: Wallet connection
- **TanStack Query**: Data fetching
- **Framer Motion**: Animations

## Design Principles

Throughout development, I followed these principles:

1. **Security First**: Every feature was designed with security in mind
2. **User Experience**: Complex technology, simple interface
3. **Transparency**: All transactions are logged and verifiable
4. **Reliability**: Fallbacks for every critical path
5. **Extensibility**: Easy to add new chains or features

## What Makes This Special

Most token launch platforms are single-chain. Some support multiple chains but treat them as separate markets. Crossify is different:

- **Unified Market**: One token, one price across all chains
- **Shared Liquidity**: Automatic rebalancing maintains optimal liquidity
- **True Multichain**: Not just deployment, but synchronized operation
- **Enterprise Grade**: Immutable audit trails via Hedera

This architecture represents months of research, development, and testing. Every component was built with care, tested thoroughly, and integrated seamlessly.

**- MikeLee**

---

*For detailed contract documentation, see [Contracts](Contracts)*
*For development process, see [Development Process](Development-Process)*

