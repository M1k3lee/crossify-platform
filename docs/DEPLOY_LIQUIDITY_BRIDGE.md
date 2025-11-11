# Deploy Cross-Chain Liquidity Bridge

This guide walks you through deploying and configuring the Cross-Chain Liquidity Bridge system on all chains.

## Prerequisites

1. **Deploy CrossChainSync first** - The bridge depends on CrossChainSync for cross-chain messaging
2. **Environment variables set** - RPC URLs, private keys, and contract addresses
3. **Sufficient balance** - For deployment gas fees on each chain

## Step 1: Deploy CrossChainSync (if not already deployed)

The bridge requires CrossChainSync to be deployed first:

```bash
# Deploy on each chain
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia
```

Save the addresses to your `.env` file:
```bash
CROSS_CHAIN_SYNC_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSC_TESTNET=0x...
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...
```

## Step 2: Set Up Trusted Remotes

Configure CrossChainSync to trust remote chains:

```bash
# On each chain, set trusted remotes
npx hardhat run scripts/setup-trusted-remotes.ts --network sepolia
npx hardhat run scripts/setup-trusted-remotes.ts --network bscTestnet
npx hardhat run scripts/setup-trusted-remotes.ts --network baseSepolia
```

## Step 3: Deploy Liquidity Bridge

Deploy the bridge on each chain:

```bash
# Deploy on Sepolia
npx hardhat run scripts/deploy-liquidity-bridge.ts --network sepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy-liquidity-bridge.ts --network bscTestnet

# Deploy on Base Sepolia
npx hardhat run scripts/deploy-liquidity-bridge.ts --network baseSepolia
```

For mainnets:
```bash
npx hardhat run scripts/deploy-liquidity-bridge.ts --network ethereum
npx hardhat run scripts/deploy-liquidity-bridge.ts --network bsc
npx hardhat run scripts/deploy-liquidity-bridge.ts --network base
```

Save the addresses to your `.env` file:
```bash
# Testnets
SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_TESTNET_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...

# Mainnets
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_LIQUIDITY_BRIDGE_ADDRESS=0x...
```

## Step 4: Configure Bridge

Set up bridge parameters on each chain:

```bash
# Configure on each chain
npx hardhat run scripts/setup-liquidity-bridge.ts --network sepolia
npx hardhat run scripts/setup-liquidity-bridge.ts --network bscTestnet
npx hardhat run scripts/setup-liquidity-bridge.ts --network baseSepolia
```

This sets:
- Default minimum reserve percentage (30%)
- Bridge fee (0.1%)
- Fee collector address

## Step 5: Authorize Bonding Curves

Authorize existing bonding curves to update reserves:

```bash
# Set bonding curve addresses in .env
BONDING_CURVE_ADDRESSES=0x...,0x...,0x...

# Authorize on each chain
npx hardhat run scripts/authorize-bonding-curves-bridge.ts --network sepolia
npx hardhat run scripts/authorize-bonding-curves-bridge.ts --network bscTestnet
npx hardhat run scripts/authorize-bonding-curves-bridge.ts --network baseSepolia
```

## Step 6: Update Bonding Curves

Update existing bonding curves to use the bridge:

```typescript
// For each bonding curve on each chain
const bondingCurve = await ethers.getContractAt("BondingCurve", curveAddress);

// Set bridge address
await bondingCurve.setLiquidityBridge(bridgeAddress);

// Set chain EID
const chainEID = 40161; // Sepolia
// const chainEID = 40102; // BSC Testnet
// const chainEID = 40245; // Base Sepolia
await bondingCurve.setChainEID(chainEID);

// Enable bridge usage
await bondingCurve.setUseLiquidityBridge(true);
```

Or create a script:

```typescript
// scripts/update-bonding-curves-bridge.ts
import { ethers } from "hardhat";

const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

async function main() {
  const network = hre.network.name;
  const bridgeAddress = process.env[`${network.toUpperCase()}_LIQUIDITY_BRIDGE_ADDRESS`];
  const curveAddresses = process.env.BONDING_CURVE_ADDRESSES?.split(',') || [];
  
  for (const curveAddress of curveAddresses) {
    const curve = await ethers.getContractAt("BondingCurve", curveAddress);
    await curve.setLiquidityBridge(bridgeAddress);
    await curve.setChainEID(CHAIN_EIDS[network]);
    await curve.setUseLiquidityBridge(true);
    console.log(`✅ Updated ${curveAddress}`);
  }
}
```

## Step 7: Update Backend Environment

Add bridge addresses to backend `.env`:

```bash
# Backend .env
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_LIQUIDITY_BRIDGE_ADDRESS=0x...

# Private keys for bridge operations
ETHEREUM_PRIVATE_KEY=0x...
BSC_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...
# OR use shared key:
BRIDGE_PRIVATE_KEY=0x...
```

## Step 8: Verify Deployment

1. **Check bridge contracts:**
   ```bash
   # Verify on block explorer
   # Sepolia: https://sepolia.etherscan.io/address/BRIDGE_ADDRESS
   # BSC Testnet: https://testnet.bscscan.com/address/BRIDGE_ADDRESS
   # Base Sepolia: https://sepolia.basescan.org/address/BRIDGE_ADDRESS
   ```

2. **Test bridge functionality:**
   ```bash
   # Use API endpoints
   curl http://localhost:3000/api/crosschain/liquidity/reserves/TOKEN_ID
   ```

3. **Monitor logs:**
   ```bash
   # Check backend logs for monitoring service
   # Should see: "✅ Liquidity monitoring service started"
   ```

## Environment Variables Summary

### Contracts `.env`
```bash
# RPC URLs
SEPOLIA_RPC_URL=https://...
BSC_TESTNET_RPC_URL=https://...
BASE_SEPOLIA_RPC_URL=https://...

# Private Key
PRIVATE_KEY=0x...

# CrossChainSync addresses
CROSS_CHAIN_SYNC_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSC_TESTNET=0x...
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...

# Bridge addresses (set after deployment)
SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_TESTNET_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...

# Fee collector
FEE_COLLECTOR_ADDRESS=0x...
```

### Backend `.env`
```bash
# Bridge addresses
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_LIQUIDITY_BRIDGE_ADDRESS=0x...

# Private keys for bridge operations
ETHEREUM_PRIVATE_KEY=0x...
BSC_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...
# OR shared key:
BRIDGE_PRIVATE_KEY=0x...

# RPC URLs (if not already set)
ETHEREUM_RPC_URL=https://...
BSC_RPC_URL=https://...
BASE_RPC_URL=https://...
```

## Troubleshooting

### Bridge Deployment Fails

1. **Check RPC connection:**
   ```bash
   # Test RPC
   curl -X POST $RPC_URL -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

2. **Check balance:**
   ```bash
   # Ensure deployer has sufficient balance for gas
   ```

3. **Check CrossChainSync:**
   ```bash
   # Verify CrossChainSync is deployed and address is correct
   ```

### Bridge Not Working

1. **Check authorization:**
   - Verify bonding curves are authorized
   - Check bridge contract owner is correct

2. **Check trusted remotes:**
   - Verify CrossChainSync has trusted remotes set
   - Check LayerZero endpoint configuration

3. **Check backend configuration:**
   - Verify bridge addresses in backend `.env`
   - Check private keys have sufficient balance
   - Verify RPC URLs are correct

### Reserves Not Updating

1. **Check bonding curve integration:**
   - Verify `setLiquidityBridge()` was called
   - Check `useLiquidityBridge` is enabled
   - Verify chain EID is set correctly

2. **Check bridge contract:**
   - Verify `updateReserve()` is being called
   - Check authorization status

## Next Steps

After deployment:

1. ✅ Test with small amounts first
2. ✅ Monitor logs for any errors
3. ✅ Gradually enable for production tokens
4. ✅ Set up monitoring/alerts for bridge operations

## Support

For issues:
- Check `docs/LIQUIDITY_BRIDGE_IMPLEMENTATION.md` for detailed documentation
- Review contract code in `contracts/contracts/CrossChainLiquidityBridge.sol`
- Check API documentation in implementation guide

