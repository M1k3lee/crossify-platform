# 🚀 Quick Guide: Redeploy TokenFactory with Bridge

## Why Redeploy?

Since you're willing to delete and remake your token, **redeploying TokenFactory is the best approach**:

- ✅ New tokens automatically get bridge support
- ✅ No manual curve updates needed
- ✅ Clean, future-proof solution

## Quick Steps

### 1. Redeploy TokenFactory

```bash
cd contracts

# Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
# Copy the new factory address

# BSC Testnet
npx hardhat run scripts/deploy.ts --network bscTestnet
# Copy the new factory address

# Base Sepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
# Copy the new factory address
```

### 2. Configure Bridge on New Factories

```bash
# Set new factory addresses in contracts/.env
SEPOLIA_FACTORY_ADDRESS=0x... # New address
BSCTESTNET_FACTORY_ADDRESS=0x... # New address
BASESEPOLIA_FACTORY_ADDRESS=0x... # New address

# Configure bridges
npx hardhat run scripts/update-tokenfactory-bridge.ts --network sepolia
npx hardhat run scripts/update-tokenfactory-bridge.ts --network bscTestnet
npx hardhat run scripts/update-tokenfactory-bridge.ts --network baseSepolia
```

### 3. Update Environment Variables

Update factory addresses in:
- `contracts/.env`
- `backend/.env`
- Frontend environment variables (Netlify/GitHub Secrets)

### 4. Delete and Remake Your Token

- Delete existing token (if desired)
- Create new token through updated factory
- **New token automatically has bridge support!** ✅

## That's It!

Your new token will have:
- ✅ Bridge address configured
- ✅ Chain EID set
- ✅ Bridge enabled
- ✅ Automatic liquidity requests when reserves are low

**No manual updates needed!** 🎉

