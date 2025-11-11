# Update TokenFactory Contracts - Guide

## Current Situation

The existing TokenFactory contracts were deployed **before** the bridge functionality was added to the codebase. To enable bridge support for **new tokens**, you have two options:

## Option 1: Redeploy TokenFactory (Recommended)

### Step 1: Redeploy with Updated Code

The updated `TokenFactory.sol` now includes:
- `setLiquidityBridge()` function
- `setUseLiquidityBridge()` function  
- Bridge parameters in BondingCurve constructor

Deploy new factories:

```bash
cd contracts

# Deploy on Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy on Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Step 2: Update Environment Variables

Update factory addresses in:
- `contracts/.env`
- `backend/.env` (for token syncing)
- Frontend environment variables (for UI)

### Step 3: Configure New Factories

```bash
# Set new factory addresses
SEPOLIA_FACTORY_ADDRESS=0x... # New address
BSCTESTNET_FACTORY_ADDRESS=0x... # New address
BASESEPOLIA_FACTORY_ADDRESS=0x... # New address

# Update to use bridge
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia
```

## Option 2: Update Existing Factories (If Functions Exist)

If your deployed TokenFactory contracts already have the bridge functions (from a previous update), you can update them directly:

```bash
cd contracts

# Set factory addresses
TOKEN_FACTORY_ADDRESS=0x8eF1A74d477448630282EFC130ac9D17f495Bca4 # Sepolia
# Or use:
SEPOLIA_FACTORY_ADDRESS=0x8eF1A74d477448630282EFC130ac9D17f495Bca4

# Update Sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia

# Update BSC Testnet
TOKEN_FACTORY_ADDRESS=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet

# Update Base Sepolia
TOKEN_FACTORY_ADDRESS=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia
```

## Option 3: Skip TokenFactory Update

**This is acceptable!** The bridge system works independently:

- ✅ **Existing tokens**: Can be updated directly (see bonding curves guide)
- ✅ **New tokens**: Can be created with bridge support via updated factory later
- ✅ **Monitoring**: Works for all tokens regardless of factory version
- ✅ **Rebalancing**: Works automatically for all tokens

## Current TokenFactory Addresses

From deployment records:
- **Sepolia**: `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- **BSC Testnet**: `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- **Base Sepolia**: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`

## Recommendation

**For now**: Skip TokenFactory update and focus on:
1. ✅ Update backend `.env` (enables monitoring)
2. ✅ Update existing bonding curves (enables bridge for current tokens)

**Later**: Redeploy TokenFactory when convenient to enable bridge for new tokens automatically.

