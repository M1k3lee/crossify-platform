# 🚀 Deploy Liquidity Bridge - Execute Now

## Prerequisites Check

Before deploying, ensure you have:

1. ✅ **PRIVATE_KEY set** in `contracts/.env`
2. ✅ **Sufficient balance** for gas fees on all chains
3. ✅ **CrossChainSync deployed** (already done - addresses below)

## Known CrossChainSync Addresses

From `DEPLOYMENT_RESULTS.md`:
- **Sepolia**: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- **BSC Testnet**: `0xf5446E2690B2eb161231fB647476A98e1b6b7736`
- **Base Sepolia**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`

## Quick Deployment Commands

### Step 1: Set Environment Variables

Add to `contracts/.env`:
```bash
# CrossChainSync addresses (already deployed)
CROSS_CHAIN_SYNC_SEPOLIA=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
CROSS_CHAIN_SYNC_BSCTESTNET=0xf5446E2690B2eb161231fB647476A98e1b6b7736
CROSS_CHAIN_SYNC_BASESEPOLIA=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E

# Make sure PRIVATE_KEY is set
PRIVATE_KEY=0x...your_private_key_here...
```

### Step 2: Deploy Bridges

Run these commands from the `contracts` directory:

```bash
cd contracts

# Deploy on Sepolia
npx hardhat run scripts/deploy-liquidity-bridge.ts --network sepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy-liquidity-bridge.ts --network bscTestnet

# Deploy on Base Sepolia
npx hardhat run scripts/deploy-liquidity-bridge.ts --network baseSepolia
```

**Save the bridge addresses** that are printed to your `contracts/.env`:
```bash
SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...
BSC_TESTNET_LIQUIDITY_BRIDGE_ADDRESS=0x...
BASE_SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...
```

### Step 3: Configure Bridges

```bash
# Configure Sepolia
npx hardhat run scripts/setup-liquidity-bridge.ts --network sepolia

# Configure BSC Testnet
npx hardhat run scripts/setup-liquidity-bridge.ts --network bscTestnet

# Configure Base Sepolia
npx hardhat run scripts/setup-liquidity-bridge.ts --network baseSepolia
```

### Step 4: Update Backend Environment

Add to `backend/.env`:
```bash
# Bridge addresses (use testnet addresses for now)
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x... # Sepolia address
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x... # BSC Testnet address
BASE_LIQUIDITY_BRIDGE_ADDRESS=0x... # Base Sepolia address

# Private keys for bridge operations
ETHEREUM_PRIVATE_KEY=0x... # Same as contracts PRIVATE_KEY or separate
BSC_PRIVATE_KEY=0x...
BASE_PRIVATE_KEY=0x...
# OR use shared key:
BRIDGE_PRIVATE_KEY=0x...
```

### Step 5: Update TokenFactory (Optional)

If you want new tokens to automatically use the bridge, update TokenFactory:

```bash
# For each network, call on TokenFactory:
# factory.setLiquidityBridge(bridgeAddress)
# factory.setUseLiquidityBridge(true)
```

### Step 6: Restart Backend

```bash
cd backend
npm run dev
```

Check logs for: `✅ Liquidity monitoring service started`

## Verify Deployment

1. **Check contracts on block explorers:**
   - Sepolia: https://sepolia.etherscan.io/address/BRIDGE_ADDRESS
   - BSC Testnet: https://testnet.bscscan.com/address/BRIDGE_ADDRESS
   - Base Sepolia: https://sepolia.basescan.org/address/BRIDGE_ADDRESS

2. **Test API:**
   ```bash
   curl http://localhost:3000/api/crosschain/liquidity/reserves/TOKEN_ID
   ```

3. **Check monitoring service:**
   - Look for logs every 30 seconds showing reserve checks
   - Should see: `🔄 Starting liquidity monitoring service...`

## Troubleshooting

### "Private key too short"
- Make sure `PRIVATE_KEY` in `contracts/.env` is a valid 64-character hex string (with or without 0x prefix)
- Format: `PRIVATE_KEY=0x1234567890abcdef...` (64 hex chars after 0x)

### "Cannot connect to RPC"
- Check RPC URLs in `contracts/.env`:
  - `SEPOLIA_RPC_URL=...`
  - `BSC_TESTNET_RPC_URL=...`
  - `BASE_SEPOLIA_RPC_URL=...`

### "Insufficient balance"
- Ensure deployer wallet has enough ETH/BNB for gas fees
- Testnets: Get free testnet tokens from faucets

## Next Steps After Deployment

1. ✅ Test with small amounts first
2. ✅ Monitor logs for 24-48 hours
3. ✅ Gradually enable for production tokens
4. ✅ Update existing bonding curves to use bridge

## Support

If you encounter issues:
- Check `docs/LIQUIDITY_BRIDGE_IMPLEMENTATION.md` for detailed docs
- Review `docs/DEPLOY_LIQUIDITY_BRIDGE.md` for full deployment guide
- Check deployment logs for specific errors

