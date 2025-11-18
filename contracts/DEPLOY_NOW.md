# Quick Deploy Instructions

## Step 1: Set Private Key

Edit `contracts/.env` and set:
```env
PRIVATE_KEY=your_private_key_here
```

**Important:**
- Remove `0x` prefix if present
- Should be 64 hex characters
- This is the private key for wallet `0x30314630fEb44E1b1DF77397906240Ff5c40F6D2`

## Step 2: Deploy

Once PRIVATE_KEY is set, run:

```bash
cd contracts
npx hardhat run scripts/deploy-unified-crosschain.ts --network sepolia
npx hardhat run scripts/deploy-unified-crosschain.ts --network bscTestnet
npx hardhat run scripts/deploy-unified-crosschain.ts --network baseSepolia
```

## Step 3: Save Addresses

After each deployment, save the addresses to `.env`:
```env
UNIFIED_SYNC_SEPOLIA=0x...
SUPRA_SYNC_SEPOLIA=0x...
UNIFIED_SYNC_BSC_TESTNET=0x...
SUPRA_SYNC_BSC_TESTNET=0x...
UNIFIED_SYNC_BASE_SEPOLIA=0x...
SUPRA_SYNC_BASE_SEPOLIA=0x...
```

