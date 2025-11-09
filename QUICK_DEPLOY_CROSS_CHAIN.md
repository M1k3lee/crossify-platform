# Quick Deploy Cross-Chain - Step by Step

## Prerequisites

1. ✅ Node.js installed
2. ✅ Hardhat configured with `.env` file
3. ✅ Testnet tokens (ETH/BNB) in your wallet
4. ✅ Private key in `contracts/.env`

## Step 1: Deploy CrossChainSync on All Chains

### Base Sepolia
```bash
cd contracts
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia
```
**Save the address:** `CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...`

### BSC Testnet
```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet
```
**Save the address:** `CROSS_CHAIN_SYNC_BSC_TESTNET=0x...`

### Sepolia
```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```
**Save the address:** `CROSS_CHAIN_SYNC_SEPOLIA=0x...`

## Step 2: Deploy/Update GlobalSupplyTracker

⚠️ **Important**: The existing GlobalSupplyTracker contracts were deployed without the chain EID parameter. We need to check if they're compatible or redeploy.

### Option A: Check Existing Contracts (Recommended First)

Try to configure the existing contracts first. If they don't have the `setCrossChainSync` function, we'll need to redeploy.

### Option B: Redeploy GlobalSupplyTracker (If Needed)

If the existing contracts don't have the new functions, redeploy:

```bash
# Base Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/deploy-global-supply.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network sepolia
```

**Save the addresses:**
- `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...`
- `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...`
- `GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...`

## Step 3: Configure Contracts

### 3.1 Set CrossChainSync in GlobalSupplyTracker

Create a file `contracts/scripts/configure-crosschain.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const network = process.argv[2];
  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS!;
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS!;

  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const tracker = GlobalSupplyTracker.attach(globalSupplyTrackerAddress);

  console.log(`Setting CrossChainSync: ${crossChainSyncAddress}`);
  const tx = await tracker.setCrossChainSync(crossChainSyncAddress);
  await tx.wait();
  console.log("✅ Done!");
}

main();
```

Run for each chain:
```bash
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... CROSS_CHAIN_SYNC_ADDRESS=0x... npx hardhat run scripts/configure-crosschain.ts --network baseSepolia
```

### 3.2 Authorize GlobalSupplyTracker in CrossChainSync

```bash
CROSS_CHAIN_SYNC_ADDRESS=0x... GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... npx hardhat run scripts/setup-cross-chain.ts --network baseSepolia
```

## Step 4: Set Trusted Remotes

After deploying CrossChainSync on all chains, set trusted remotes:

### Update .env with all addresses:
```env
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSC_TESTNET=0x...
CROSS_CHAIN_SYNC_SEPOLIA=0x...
```

### Run setup script for each chain:
```bash
# Base Sepolia
CROSS_CHAIN_SYNC_ADDRESS=0x... npx hardhat run scripts/setup-trusted-remotes.ts --network baseSepolia

# BSC Testnet
CROSS_CHAIN_SYNC_ADDRESS=0x... npx hardhat run scripts/setup-trusted-remotes.ts --network bscTestnet

# Sepolia
CROSS_CHAIN_SYNC_ADDRESS=0x... npx hardhat run scripts/setup-trusted-remotes.ts --network sepolia
```

## Step 5: Fund Contracts

Each contract needs native tokens for LayerZero fees:

```bash
# Fund GlobalSupplyTracker (0.05 ETH/BNB each)
# Fund CrossChainSync (0.1 ETH/BNB each)
```

You can do this via MetaMask or a script.

## Step 6: Update TokenFactory (If Needed)

If TokenFactory needs to use the new GlobalSupplyTracker addresses:

```bash
# Use Hardhat console or a script to call:
# factory.setGlobalSupplyTracker(newAddress)
# factory.setCrossChainInfrastructure(...)
```

## Step 7: Test

1. Create a token on Base Sepolia
2. Buy tokens
3. Check if supply updates on other chains
4. Verify cross-chain sync events in transaction logs

## Troubleshooting

See `CROSS_CHAIN_SETUP_GUIDE.md` for detailed troubleshooting.

## Quick Reference

### Chain EIDs
- Base Sepolia: 40245
- BSC Testnet: 40102
- Sepolia: 40161

### LayerZero Endpoint
- All testnets: `0x6EDCE65403992e310A62460808c4b910D972f10f`

### Recommended Funding
- GlobalSupplyTracker: 0.05 ETH/BNB
- CrossChainSync: 0.1 ETH/BNB

