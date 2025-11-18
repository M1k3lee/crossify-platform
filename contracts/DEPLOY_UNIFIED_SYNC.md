# Deploy Unified Cross-Chain Sync Contracts

This guide will help you deploy the UnifiedCrossChainSync and SupraSync contracts to all testnets.

## Prerequisites

1. **Private Key**: Set `PRIVATE_KEY` in `contracts/.env` file
2. **RPC URLs**: Ensure RPC URLs are set in `.env`:
   - `SEPOLIA_RPC_URL` or `ETHEREUM_RPC_URL`
   - `BSC_TESTNET_RPC_URL` or `BSC_RPC_URL`
   - `BASE_SEPOLIA_RPC_URL` or `BASE_RPC_URL`
3. **Existing Contracts** (optional): If you have existing CrossChainSync contracts, set:
   - `CROSS_CHAIN_SYNC_SEPOLIA`
   - `CROSS_CHAIN_SYNC_BSC_TESTNET`
   - `CROSS_CHAIN_SYNC_BASE_SEPOLIA`

## Deployment Steps

### Step 1: Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Step 2: Deploy to Each Testnet

#### Option A: Deploy to All Testnets at Once

```bash
npx ts-node scripts/deploy-all-unified-sync.ts
```

#### Option B: Deploy to Each Testnet Individually

**Sepolia:**
```bash
npx hardhat run scripts/deploy-unified-crosschain.ts --network sepolia
```

**BSC Testnet:**
```bash
npx hardhat run scripts/deploy-unified-crosschain.ts --network bscTestnet
```

**Base Sepolia:**
```bash
npx hardhat run scripts/deploy-unified-crosschain.ts --network baseSepolia
```

### Step 3: Save Contract Addresses

After deployment, save the addresses to your `.env` file:

```env
# Unified Cross-Chain Sync
UNIFIED_SYNC_SEPOLIA=0x...
UNIFIED_SYNC_BSC_TESTNET=0x...
UNIFIED_SYNC_BASE_SEPOLIA=0x...

# Supra Sync
SUPRA_SYNC_SEPOLIA=0x...
SUPRA_SYNC_BSC_TESTNET=0x...
SUPRA_SYNC_BASE_SEPOLIA=0x...
```

### Step 4: Setup Trusted Remotes

For each network, set the remote addresses and run:

```bash
# On Sepolia
export UNIFIED_SYNC_SEPOLIA=0x...
export UNIFIED_SYNC_BSC_TESTNET=0x...
export UNIFIED_SYNC_BASE_SEPOLIA=0x...
npx hardhat run scripts/setup-unified-sync.ts --network sepolia

# On BSC Testnet
npx hardhat run scripts/setup-unified-sync.ts --network bscTestnet

# On Base Sepolia
npx hardhat run scripts/setup-unified-sync.ts --network baseSepolia
```

### Step 5: Authorize GlobalSupplyTracker

If you have GlobalSupplyTracker contracts, authorize them:

```env
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...
```

Then run setup script (it will auto-authorize if addresses are set).

## Verification

After deployment, verify contracts on block explorers:

- **Sepolia**: https://sepolia.etherscan.io
- **BSC Testnet**: https://testnet.bscscan.com
- **Base Sepolia**: https://sepolia.basescan.org

## Next Steps

1. Update TokenFactory to use UnifiedSync
2. Update GlobalSupplyTracker to use UnifiedSync
3. Test cross-chain synchronization
4. Monitor metrics

## Troubleshooting

### "Private key not found"
- Ensure `PRIVATE_KEY` is set in `contracts/.env`
- Private key should be 64 hex characters (without 0x prefix)

### "Cannot connect to RPC endpoint"
- Check RPC URLs in `.env`
- Verify network connectivity
- Try a different RPC provider

### "Insufficient funds"
- Ensure deployer wallet has enough ETH/BNB for gas
- Testnets require testnet tokens

### "Contract deployment failed"
- Check gas limits
- Verify contract compilation
- Check network status

