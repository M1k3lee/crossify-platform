# Crossify Smart Contracts

Smart contracts for the Crossify.io multichain token launch platform.

## Contracts

- **TokenFactory**: Factory for creating ERC20 tokens
- **BondingCurve**: Linear bonding curve for token sales with automatic graduation
- **Migration**: Handles migration from bonding curve to DEX (Uniswap V3)

## Deployment

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHEREUM_PRIVATE_KEY=your_private_key
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://sepolia.base.org
BASE_PRIVATE_KEY=your_private_key
```

### Deploy to Testnets

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia (Ethereum)
npm run deploy:sepolia

# Deploy to BSC Testnet
npm run deploy:bsc

# Deploy to Base Sepolia
npm run deploy:base
```

### Verify Contracts

After deployment, verify on block explorers:
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## Testing

```bash
npm test
```

## Solana Contracts

For Solana contracts, we'll use Anchor framework. See `solana/` directory for SPL token and bonding curve programs.








