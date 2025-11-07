# Cross-Chain Deployment Guide

This guide walks you through deploying the cross-chain infrastructure for Crossify.io tokens.

## Overview

The cross-chain system enables tokens to automatically sync prices across all chains (Ethereum, BSC, Base, Solana) when traded on any DEX. Users pay a small 0.5% fee that covers LayerZero messaging costs.

## Architecture

1. **CrossChainToken**: Token contract with built-in cross-chain sync
2. **CrossChainSync**: Central contract for LayerZero messaging
3. **DEXDetector**: Automatically detects DEX pairs (Uniswap, PancakeSwap)
4. **Relayer Service**: Converts token fees to native tokens for LayerZero

## Prerequisites

- Deployed GlobalSupplyTracker on all chains
- LayerZero endpoint addresses for each chain
- Testnet tokens for gas fees

## Step-by-Step Deployment

### Step 1: Deploy DEXDetector (All Chains)

```bash
cd contracts
npx hardhat run scripts/deploy-dex-detector.ts --network sepolia
npx hardhat run scripts/deploy-dex-detector.ts --network bscTestnet
npx hardhat run scripts/deploy-dex-detector.ts --network baseSepolia
```

**Save the addresses:**
```env
# contracts/.env
DEX_DETECTOR_SEPOLIA=0x...
DEX_DETECTOR_BSCTESTNET=0x...
DEX_DETECTOR_BASESEPOLIA=0x...
```

### Step 2: Deploy CrossChainSync (All Chains)

```bash
cd contracts
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia
```

**Save the addresses:**
```env
# contracts/.env
CROSS_CHAIN_SYNC_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSCTESTNET=0x...
CROSS_CHAIN_SYNC_BASESEPOLIA=0x...
```

### Step 3: Configure CrossChainSync

For each deployed CrossChainSync contract, you need to:

1. **Set trusted remotes** (so chains can communicate):
```bash
# On Sepolia, trust BSC and Base
# On BSC, trust Sepolia and Base
# On Base, trust Sepolia and BSC
```

2. **Authorize tokens** (done automatically by TokenFactory)

### Step 4: Update TokenFactory Deployment

The TokenFactory deployment script now automatically includes cross-chain support if addresses are set in `.env`:

```bash
cd contracts
# Make sure .env has:
# CROSS_CHAIN_SYNC_SEPOLIA=0x...
# CROSS_CHAIN_SYNC_BSCTESTNET=0x...
# CROSS_CHAIN_SYNC_BASESEPOLIA=0x...

npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network bscTestnet
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Step 5: Start Relayer Service

The relayer service automatically converts accumulated token fees to native tokens:

```bash
cd backend
npm run dev
```

The relayer monitors all deployed CrossChainToken contracts and swaps fees every 5 minutes (configurable).

### Step 6: Test Cross-Chain Sync

1. Deploy a cross-chain token using the Builder UI
2. Buy tokens on Ethereum (Sepolia)
3. Check price on BSC Testnet - should reflect the purchase
4. Buy tokens on BSC Testnet
5. Check price on Base Sepolia - should reflect both purchases

## Configuration

### LayerZero Endpoints

Current testnet endpoints (hardcoded in deployment scripts):
- **Sepolia**: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- **BSC Testnet**: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- **Base Sepolia**: `0x6EDCE65403992e310A62460808c4b910D972f10f`

⚠️ **Note**: These are placeholder addresses. Verify actual LayerZero endpoint addresses for testnets.

### LayerZero Chain IDs

- **Sepolia**: `40161`
- **BSC Testnet**: `40102`
- **Base Sepolia**: `40245`

### Fee Structure

- **Cross-Chain Fee**: 0.5% (50 basis points)
- **Minimum Swap Amount**: 100 tokens
- **Swap Interval**: 5 minutes

## Troubleshooting

### "LayerZero endpoint not found"

- Verify the endpoint address is correct for your network
- Check LayerZero documentation for updated addresses

### "Cross-chain sync not working"

1. Verify CrossChainSync is deployed on all chains
2. Check that trusted remotes are configured
3. Ensure tokens are authorized in CrossChainSync
4. Verify relayer service is running

### "Fees not being swapped"

1. Check relayer service logs
2. Verify minimum swap threshold (100 tokens)
3. Ensure DEX router is configured
4. Check token contract has accumulated fees

## Next Steps

- [ ] Deploy PriceOracle contract (for additional verification)
- [ ] Configure Supra Oracle integration
- [ ] Set up monitoring and alerts
- [ ] Test on mainnet (after thorough testing)

## Support

For issues or questions, check:
- [LayerZero Documentation](https://docs.layerzero.network)
- [Cross-Chain Architecture Docs](./docs/CROSS_CHAIN_ARCHITECTURE.md)
- [DEX Integration Guide](./docs/DEX_INTEGRATION_GUIDE.md)




