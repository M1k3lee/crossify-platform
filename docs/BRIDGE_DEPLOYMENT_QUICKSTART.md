# Quick Start: Deploy Liquidity Bridge

This is a condensed guide for quickly deploying the liquidity bridge. For detailed steps, see `DEPLOY_LIQUIDITY_BRIDGE.md`.

## Prerequisites

✅ CrossChainSync deployed on all chains  
✅ Environment variables configured  
✅ Sufficient balance for gas fees

## Quick Deployment (Testnets)

### 1. Deploy Bridge on All Chains

```bash
cd contracts

# Deploy on Sepolia
npx hardhat run scripts/deploy-liquidity-bridge.ts --network sepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy-liquidity-bridge.ts --network bscTestnet

# Deploy on Base Sepolia
npx hardhat run scripts/deploy-liquidity-bridge.ts --network baseSepolia
```

**Save addresses to `contracts/.env`:**
```bash
SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_TESTNET_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...
```

### 2. Configure Bridges

```bash
npx hardhat run scripts/setup-liquidity-bridge.ts --network sepolia
npx hardhat run scripts/setup-liquidity-bridge.ts --network bscTestnet
npx hardhat run scripts/setup-liquidity-bridge.ts --network baseSepolia
```

### 3. Update Backend `.env`

```bash
# Add to backend/.env
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x...  # Use Sepolia address for testnet
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_LIQUIDITY_BRIDGE_ADDRESS=0x...

# Add private keys
ETHEREUM_PRIVATE_KEY=0x...
BSC_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...
```

### 4. Update Bonding Curves

For each bonding curve, call:
```solidity
bondingCurve.setLiquidityBridge(bridgeAddress);
bondingCurve.setChainEID(chainEID); // 40161 for Sepolia, 40102 for BSC, 40245 for Base
bondingCurve.setUseLiquidityBridge(true);
```

### 5. Restart Backend

```bash
cd backend
npm run dev
```

Check logs for: `✅ Liquidity monitoring service started`

## Verify

```bash
# Test API
curl http://localhost:3000/api/crosschain/liquidity/reserves/TOKEN_ID
```

## That's It! 🎉

The bridge is now operational. The monitoring service will automatically:
- Check reserves every 30 seconds
- Rebalance when needed
- Handle bridge requests from bonding curves

## Next Steps

- Test with small amounts
- Monitor logs for 24-48 hours
- Gradually enable for production tokens

