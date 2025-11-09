# Cross-Chain Deployment Action Plan

## Current Status

✅ **Code Changes**: Complete and pushed to repository
✅ **TokenFactory**: Deployed on all testnets
⚠️ **GlobalSupplyTracker**: Deployed but may need redeployment (old version)
❌ **CrossChainSync**: Not deployed yet
❌ **Configuration**: Not configured yet

## Deployment Steps (In Order)

### Phase 1: Verify Existing Contracts

#### Step 1.1: Check Existing GlobalSupplyTracker

```bash
cd contracts

# Check Base Sepolia
npx hardhat run scripts/check-global-supply-tracker.ts --network baseSepolia

# Check BSC Testnet
npx hardhat run scripts/check-global-supply-tracker.ts --network bscTestnet

# Check Sepolia
npx hardhat run scripts/check-global-supply-tracker.ts --network sepolia
```

**Expected Result:**
- If functions exist: ✅ Can use existing contracts
- If functions missing: ⚠️ Need to redeploy

### Phase 2: Deploy CrossChainSync

#### Step 2.1: Deploy on Base Sepolia

```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia
```

**Save:** `CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...`

#### Step 2.2: Deploy on BSC Testnet

```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet
```

**Save:** `CROSS_CHAIN_SYNC_BSC_TESTNET=0x...`

#### Step 2.3: Deploy on Sepolia

```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```

**Save:** `CROSS_CHAIN_SYNC_SEPOLIA=0x...`

### Phase 3: Deploy/Update GlobalSupplyTracker

#### Option A: If Existing Contracts Are Compatible

Skip to Phase 4 (Configuration)

#### Option B: If Redeployment Needed

```bash
# Deploy on Base Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network baseSepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy-global-supply.ts --network bscTestnet

# Deploy on Sepolia
npx hardhat run scripts/deploy-global-supply.ts --network sepolia
```

**Save addresses:**
- `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...`
- `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...`
- `GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...`

### Phase 4: Configure Contracts

#### Step 4.1: Set CrossChainSync in GlobalSupplyTracker

For each chain, use the setup script:

```bash
# Base Sepolia
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network baseSepolia

# BSC Testnet
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network bscTestnet

# Sepolia
GLOBAL_SUPPLY_TRACKER_ADDRESS=0x... \
CROSS_CHAIN_SYNC_ADDRESS=0x... \
FUND_AMOUNT=0.05 \
npx hardhat run scripts/setup-cross-chain.ts --network sepolia
```

This will:
- ✅ Set CrossChainSync address in GlobalSupplyTracker
- ✅ Authorize GlobalSupplyTracker in CrossChainSync
- ✅ Fund contracts with native tokens

#### Step 4.2: Set Trusted Remotes

Update `.env` with all CrossChainSync addresses:

```env
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSC_TESTNET=0x...
CROSS_CHAIN_SYNC_SEPOLIA=0x...
```

Then run for each chain:

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

If TokenFactory needs to use new GlobalSupplyTracker addresses:

```bash
# Use Hardhat console
npx hardhat console --network baseSepolia
```

```javascript
const TokenFactory = await ethers.getContractFactory("TokenFactory");
const factory = TokenFactory.attach("0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58"); // Base Sepolia

// Update GlobalSupplyTracker
await factory.setGlobalSupplyTracker("NEW_GLOBAL_SUPPLY_TRACKER_ADDRESS");

// Update CrossChainSync (if needed)
await factory.setCrossChainInfrastructure(
  "0x6EDCE65403992e310A62460808c4b910D972f10f", // LayerZero endpoint
  "CROSS_CHAIN_SYNC_ADDRESS",
  "0x0000000000000000000000000000000000000000", // Price oracle (optional)
  40245 // Chain EID for Base Sepolia
);
```

Repeat for BSC Testnet and Sepolia.

### Phase 6: Test Cross-Chain Sync

#### Step 6.1: Create a Test Token

1. Go to your frontend
2. Create a new token on Base Sepolia
3. Note the token address and bonding curve address

#### Step 6.2: Authorize BondingCurve

```javascript
const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
const tracker = GlobalSupplyTracker.attach("GLOBAL_SUPPLY_TRACKER_ADDRESS");

// Authorize the bonding curve
await tracker.authorizeUpdater("BONDING_CURVE_ADDRESS");
```

#### Step 6.3: Buy Tokens and Verify

1. Buy tokens on Base Sepolia
2. Check transaction logs for:
   - ✅ `TokenBought` event
   - ✅ `SupplyUpdated` event
   - ✅ `SupplySynced` event (if cross-chain sync worked)
   - ✅ LayerZero events

3. Check other chains:

```javascript
// On BSC Testnet
const trackerBSC = GlobalSupplyTracker.attach("GLOBAL_SUPPLY_TRACKER_BSC_TESTNET");
const globalSupply = await trackerBSC.getGlobalSupply("TOKEN_ADDRESS");
console.log("Global supply on BSC:", globalSupply.toString());
```

### Phase 7: Update Environment Variables

#### Railway (Backend)

Add/update:
```env
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSC_TESTNET=0x...
CROSS_CHAIN_SYNC_SEPOLIA=0x...
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...
```

#### Vercel (Frontend)

No frontend changes needed (cross-chain sync is backend/contract level)

## Verification Checklist

- [ ] CrossChainSync deployed on all 3 chains
- [ ] GlobalSupplyTracker deployed/updated on all 3 chains
- [ ] CrossChainSync address set in GlobalSupplyTracker (all chains)
- [ ] GlobalSupplyTracker authorized in CrossChainSync (all chains)
- [ ] Trusted remotes set (all chains)
- [ ] Contracts funded with native tokens (all chains)
- [ ] TokenFactory updated (if needed)
- [ ] Test transaction completed
- [ ] Cross-chain sync verified
- [ ] Environment variables updated

## Expected Costs

- **Deployment**: ~0.01-0.02 ETH/BNB per contract (6 contracts = ~0.06-0.12 total)
- **Funding**: 0.05 ETH/BNB per GlobalSupplyTracker (3 = 0.15 total)
- **Funding**: 0.1 ETH/BNB per CrossChainSync (3 = 0.3 total)
- **Total**: ~0.5-0.6 ETH/BNB for complete setup

## Troubleshooting

See `CROSS_CHAIN_SETUP_GUIDE.md` for detailed troubleshooting.

## Next Steps After Deployment

1. ✅ Monitor cross-chain sync events
2. ✅ Adjust fee reserves if needed
3. ✅ Set up monitoring/alerts for sync failures
4. ✅ Document any issues or improvements needed

## Quick Start (All-in-One)

If you want to deploy and configure everything at once:

```bash
# Base Sepolia
FUND_AMOUNT=0.05 npx hardhat run scripts/deploy-and-setup-crosschain.ts --network baseSepolia

# Then set trusted remotes manually or use setup-trusted-remotes.ts
```

---

**Status**: Ready to deploy
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

