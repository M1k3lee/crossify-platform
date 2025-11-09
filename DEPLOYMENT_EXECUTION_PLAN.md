# Cross-Chain Deployment Execution Plan

## Quick Start - Execute These Commands

### Prerequisites Check

First, make sure your `.env` file in `contracts/` directory has:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
```

### Phase 1: Deploy on Base Sepolia

```bash
cd contracts

# Option A: Use master script (recommended - does everything)
TRACKER_FUND_AMOUNT=0.05 \
SYNC_FUND_AMOUNT=0.1 \
npx hardhat run scripts/master-deploy-crosschain.ts --network baseSepolia
```

**Save the output addresses!**

### Phase 2: Deploy on BSC Testnet

```bash
# Option A: Use master script
TRACKER_FUND_AMOUNT=0.05 \
SYNC_FUND_AMOUNT=0.1 \
npx hardhat run scripts/master-deploy-crosschain.ts --network bscTestnet
```

**Save the output addresses!**

### Phase 3: Deploy on Sepolia

```bash
# Option A: Use master script
TRACKER_FUND_AMOUNT=0.05 \
SYNC_FUND_AMOUNT=0.1 \
npx hardhat run scripts/master-deploy-crosschain.ts --network sepolia
```

**Save the output addresses!**

### Phase 4: Set Trusted Remotes

After deploying on all 3 chains, update your `.env` with all addresses:

```env
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSC_TESTNET=0x...
CROSS_CHAIN_SYNC_SEPOLIA=0x...
```

Then set trusted remotes on each chain:

```bash
# Base Sepolia
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network baseSepolia

# BSC Testnet
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network bscTestnet

# Sepolia
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/setup-trusted-remotes.ts --network sepolia
```

### Phase 5: Update TokenFactory (If Needed)

If you deployed new GlobalSupplyTracker contracts, update TokenFactory:

```bash
# Base Sepolia
TOKEN_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58 \
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/update-tokenfactory.ts --network baseSepolia

# BSC Testnet
TOKEN_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E \
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/update-tokenfactory.ts --network bscTestnet

# Sepolia
TOKEN_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E \
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/update-tokenfactory.ts --network sepolia
```

### Phase 6: Verify Setup

Verify everything is configured correctly:

```bash
# Base Sepolia
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
npx hardhat run scripts/verify-cross-chain-setup.ts --network baseSepolia

# Repeat for BSC Testnet and Sepolia
```

### Phase 7: Test Cross-Chain Sync

1. **Create a token** on Base Sepolia via your frontend
2. **Authorize its BondingCurve**:

```bash
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
BONDING_CURVE_ADDRESS=0x... \
npx hardhat run scripts/authorize-bonding-curve.ts --network baseSepolia
```

3. **Buy tokens** on Base Sepolia
4. **Check transaction logs** for cross-chain sync events
5. **Verify supply** on other chains

## Alternative: Step-by-Step Deployment

If you prefer to do each step manually, see `DEPLOY_CROSS_CHAIN_STEP_BY_STEP.md` for detailed instructions.

## Helper Scripts Available

1. **master-deploy-crosschain.ts** - Deploy and configure everything in one go
2. **deploy-crosschain-sync.ts** - Deploy CrossChainSync only
3. **deploy-global-supply.ts** - Deploy GlobalSupplyTracker only
4. **setup-cross-chain.ts** - Configure existing contracts
5. **setup-trusted-remotes.ts** - Set trusted remotes
6. **fund-contracts.ts** - Fund contracts with native tokens
7. **authorize-bonding-curve.ts** - Authorize a BondingCurve
8. **update-tokenfactory.ts** - Update TokenFactory addresses
9. **verify-cross-chain-setup.ts** - Verify complete setup
10. **check-global-supply-tracker.ts** - Check existing contracts

## Expected Costs

- **Deployment**: ~0.01-0.02 ETH/BNB per contract
- **Funding**: 0.15 ETH/BNB per chain (0.05 tracker + 0.1 sync)
- **Total per chain**: ~0.17-0.19 ETH/BNB
- **Total for 3 chains**: ~0.5-0.6 ETH/BNB

## Troubleshooting

If you encounter errors:

1. **Private key error**: Make sure `PRIVATE_KEY` is set in `contracts/.env`
2. **Insufficient funds**: Get more testnet tokens from faucets
3. **RPC errors**: Check your RPC URLs in `.env`
4. **Contract not found**: Verify addresses are correct

See `CROSS_CHAIN_SETUP_GUIDE.md` for detailed troubleshooting.

## Status Tracking

Use this checklist:

- [ ] CrossChainSync deployed on Base Sepolia
- [ ] CrossChainSync deployed on BSC Testnet
- [ ] CrossChainSync deployed on Sepolia
- [ ] GlobalSupplyTracker deployed/updated on all chains
- [ ] Contracts configured (authorization, addresses)
- [ ] Trusted remotes set on all chains
- [ ] Contracts funded with native tokens
- [ ] TokenFactory updated (if needed)
- [ ] Setup verified on all chains
- [ ] Test transaction completed
- [ ] Cross-chain sync verified

---

**Ready to deploy!** Start with Phase 1 (Base Sepolia) and proceed through each phase.

