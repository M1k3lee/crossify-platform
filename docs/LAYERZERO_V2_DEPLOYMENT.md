# LayerZero v2 Complete Deployment Guide

This guide walks you through the complete deployment of the cross-chain infrastructure using LayerZero v2.

## Prerequisites

- ✅ Contracts compiled successfully
- ✅ Testnet tokens for gas fees (Sepolia ETH, BSC Testnet BNB, Base Sepolia ETH)
- ✅ LayerZero v2 endpoints configured
- ✅ Private key set in `contracts/.env`

## Architecture Overview

```
┌─────────────────┐
│  CrossChainToken│
│  (on each chain)│
└────────┬────────┘
         │
         │ syncSupplyUpdate()
         ▼
┌─────────────────┐      LayerZero v2      ┌─────────────────┐
│ CrossChainSync  │◄──────────────────────►│ CrossChainSync  │
│  (Sepolia)      │      Messaging         │   (BSC Testnet) │
└─────────────────┘                         └─────────────────┘
         │                                           │
         └───────────────────┬───────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ CrossChainSync  │
                    │ (Base Sepolia)  │
                    └─────────────────┘
```

## Step 1: Deploy Infrastructure to All Chains

### Deploy to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy-all-crosschain.ts --network sepolia
```

Save the addresses:
- `DEX_DETECTOR_SEPOLIA`
- `CROSS_CHAIN_SYNC_SEPOLIA`

### Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy-all-crosschain.ts --network bscTestnet
```

Save the addresses:
- `DEX_DETECTOR_BSCTESTNET`
- `CROSS_CHAIN_SYNC_BSCTESTNET`

### Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy-all-crosschain.ts --network baseSepolia
```

Save the addresses:
- `DEX_DETECTOR_BASESEPOLIA`
- `CROSS_CHAIN_SYNC_BASESEPOLIA`

## Step 2: Configure Trusted Remotes

After deploying CrossChainSync to all chains, you need to set trusted remotes so they can communicate.

### On Sepolia CrossChainSync

```typescript
// Connect to Sepolia CrossChainSync
const sepoliaSync = await ethers.getContractAt("CrossChainSync", SEPOLIA_SYNC_ADDRESS);

// Set trusted remote for BSC Testnet
const bscSyncAddressBytes = ethers.solidityPacked(["address"], [BSC_SYNC_ADDRESS]);
await sepoliaSync.setTrustedRemote(40102, bscSyncAddressBytes); // 40102 = BSC Testnet EID

// Set trusted remote for Base Sepolia
const baseSyncAddressBytes = ethers.solidityPacked(["address"], [BASE_SYNC_ADDRESS]);
await sepoliaSync.setTrustedRemote(40245, baseSyncAddressBytes); // 40245 = Base Sepolia EID
```

### On BSC Testnet CrossChainSync

```typescript
const bscSync = await ethers.getContractAt("CrossChainSync", BSC_SYNC_ADDRESS);

// Set trusted remote for Sepolia
const sepoliaSyncAddressBytes = ethers.solidityPacked(["address"], [SEPOLIA_SYNC_ADDRESS]);
await bscSync.setTrustedRemote(40161, sepoliaSyncAddressBytes); // 40161 = Sepolia EID

// Set trusted remote for Base Sepolia
const baseSyncAddressBytes = ethers.solidityPacked(["address"], [BASE_SYNC_ADDRESS]);
await bscSync.setTrustedRemote(40245, baseSyncAddressBytes);
```

### On Base Sepolia CrossChainSync

```typescript
const baseSync = await ethers.getContractAt("CrossChainSync", BASE_SYNC_ADDRESS);

// Set trusted remote for Sepolia
const sepoliaSyncAddressBytes = ethers.solidityPacked(["address"], [SEPOLIA_SYNC_ADDRESS]);
await baseSync.setTrustedRemote(40161, sepoliaSyncAddressBytes);

// Set trusted remote for BSC Testnet
const bscSyncAddressBytes = ethers.solidityPacked(["address"], [BSC_SYNC_ADDRESS]);
await baseSync.setTrustedRemote(40102, bscSyncAddressBytes);
```

## Step 3: Update Environment Variables

### `contracts/.env`

```env
# Cross-Chain Infrastructure
CROSS_CHAIN_SYNC_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSCTESTNET=0x...
CROSS_CHAIN_SYNC_BASESEPOLIA=0x...

DEX_DETECTOR_SEPOLIA=0x...
DEX_DETECTOR_BSCTESTNET=0x...
DEX_DETECTOR_BASESEPOLIA=0x...
```

### `frontend/.env`

```env
VITE_CROSS_CHAIN_SYNC_SEPOLIA=0x...
VITE_CROSS_CHAIN_SYNC_BSCTESTNET=0x...
VITE_CROSS_CHAIN_SYNC_BASESEPOLIA=0x...

VITE_DEX_DETECTOR_SEPOLIA=0x...
VITE_DEX_DETECTOR_BSCTESTNET=0x...
VITE_DEX_DETECTOR_BASESEPOLIA=0x...
```

## Step 4: Deploy TokenFactory with Cross-Chain Support

Now deploy TokenFactory with cross-chain addresses:

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

The TokenFactory will automatically use cross-chain features if addresses are configured.

## Step 5: Configure DEX Detector

Set Uniswap/PancakeSwap factory addresses for DEX detection:

```typescript
// On Sepolia
const dexDetector = await ethers.getContractAt("DEXDetector", DEX_DETECTOR_SEPOLIA);
await dexDetector.setUniswapV2Factory("ethereum", UNISWAP_V2_FACTORY_SEPOLIA);
await dexDetector.setWETHAddress("ethereum", WETH_SEPOLIA);

// On BSC Testnet
await dexDetector.setUniswapV2Factory("bsc", PANCAKESWAP_V2_FACTORY_BSC_TESTNET);
await dexDetector.setWETHAddress("bsc", WBNB_BSC_TESTNET);

// On Base Sepolia
await dexDetector.setUniswapV2Factory("base", UNISWAP_V2_FACTORY_BASE_SEPOLIA);
await dexDetector.setWETHAddress("base", WETH_BASE_SEPOLIA);
```

## Step 6: Start Relayer Service

The relayer service automatically converts token fees to native tokens for LayerZero messaging:

```bash
cd backend
npm run dev
```

The relayer will:
- Monitor all CrossChainToken contracts
- Swap accumulated fees to native tokens
- Provide native tokens to contracts for LayerZero fees

## Step 7: Test Cross-Chain Sync

### Test Flow

1. **Deploy a Cross-Chain Token** on Sepolia
2. **Buy tokens** on Sepolia bonding curve
3. **Verify** price syncs to BSC Testnet and Base Sepolia
4. **Buy tokens** on BSC Testnet
5. **Verify** price reflects on all chains

### Test Script

```typescript
// 1. Deploy token on Sepolia
const tokenAddress = await tokenFactory.createToken(...);

// 2. Authorize token in CrossChainSync
await sepoliaSync.authorizeToken(tokenAddress);

// 3. Buy tokens on Sepolia
await bondingCurve.buy({ value: ethers.parseEther("0.1") });

// 4. Wait for cross-chain message (~1-2 minutes)
await new Promise(r => setTimeout(r, 120000));

// 5. Check global supply on BSC Testnet
const bscSync = await ethers.getContractAt("CrossChainSync", BSC_SYNC_ADDRESS);
const globalSupply = await bscSync.getGlobalSupply(tokenAddress);
console.log("Global supply on BSC:", globalSupply.toString());
```

## Troubleshooting

### "Untrusted source" error

- Verify trusted remotes are set correctly
- Check that the sender address matches the trusted remote
- Ensure EIDs are correct (40161, 40102, 40245)

### "Insufficient fee" error

- Ensure token contract has native tokens (ETH/BNB)
- Check relayer service is running
- Verify fee estimation is correct

### Messages not arriving

- Check LayerZero endpoint is correct
- Verify contracts are deployed on all chains
- Check trusted remotes are configured
- Wait longer (LayerZero can take 1-2 minutes)

## Verification

After deployment, verify everything works:

1. ✅ CrossChainSync deployed on all chains
2. ✅ Trusted remotes configured
3. ✅ TokenFactory deployed with cross-chain support
4. ✅ DEX detector configured
5. ✅ Relayer service running
6. ✅ Test token deployed and syncing

## Next Steps

- Monitor cross-chain sync events
- Set up alerts for failed syncs
- Optimize fee collection
- Add more chains (Solana, etc.)

## Support

For issues:
- Check LayerZero documentation: https://docs.layerzero.network/v2
- Review contract events on block explorers
- Check relayer service logs




