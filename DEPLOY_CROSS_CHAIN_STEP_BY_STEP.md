# Cross-Chain Deployment - Step by Step

## Current Status

✅ **TokenFactory** deployed on all testnets:
- Base Sepolia: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`
- BSC Testnet: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- Sepolia: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`

⚠️ **GlobalSupplyTracker** deployed (but may need redeployment with new constructor)
- Base Sepolia: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`
- BSC Testnet: `0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e`
- Sepolia: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`

❌ **CrossChainSync** NOT deployed yet

## Step-by-Step Deployment

### Step 1: Deploy CrossChainSync on All Chains

#### 1.1 Deploy on Base Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia
```

**Save the address:** `CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...`

#### 1.2 Deploy on BSC Testnet

```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet
```

**Save the address:** `CROSS_CHAIN_SYNC_BSC_TESTNET=0x...`

#### 1.3 Deploy on Sepolia

```bash
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```

**Save the address:** `CROSS_CHAIN_SYNC_SEPOLIA=0x...`

### Step 2: Check GlobalSupplyTracker Constructor

The old GlobalSupplyTracker was deployed without a chain EID parameter. We need to check if the existing deployments are compatible or if we need to redeploy.

#### Option A: If existing GlobalSupplyTracker works (no constructor params)
- We can configure it manually
- Skip to Step 3

#### Option B: If we need to redeploy (new constructor requires chain EID)
- Deploy new GlobalSupplyTracker on each chain:

```bash
# Base Sepolia (EID: 40245)
npx hardhat run scripts/deploy-global-supply.ts --network baseSepolia

# BSC Testnet (EID: 40102)
npx hardhat run scripts/deploy-global-supply.ts --network bscTestnet

# Sepolia (EID: 40161)
npx hardhat run scripts/deploy-global-supply.ts --network sepolia
```

**Save the addresses** (if redeployed):
- `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...`
- `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...`
- `GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...`

### Step 3: Configure Contracts

#### 3.1 Set CrossChainSync in GlobalSupplyTracker

For each chain, run this in a Hardhat console or script:

```bash
npx hardhat console --network baseSepolia
```

```javascript
const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
const tracker = GlobalSupplyTracker.attach("GLOBAL_SUPPLY_TRACKER_ADDRESS");

// Set CrossChainSync address
await tracker.setCrossChainSync("CROSS_CHAIN_SYNC_ADDRESS");

// Verify
const syncAddress = await tracker.crossChainSync();
console.log("CrossChainSync address:", syncAddress);
```

Repeat for BSC Testnet and Sepolia.

#### 3.2 Authorize GlobalSupplyTracker in CrossChainSync

```javascript
const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
const sync = CrossChainSync.attach("CROSS_CHAIN_SYNC_ADDRESS");

// Authorize GlobalSupplyTracker
await sync.authorizeAddress("GLOBAL_SUPPLY_TRACKER_ADDRESS");

// Verify
const isAuthorized = await sync.authorizedTokens("GLOBAL_SUPPLY_TRACKER_ADDRESS");
console.log("Authorized:", isAuthorized);
```

Repeat for all chains.

#### 3.3 Set Trusted Remotes

For each chain, set trusted remotes for the other two chains:

**On Base Sepolia:**
```javascript
const sync = CrossChainSync.attach("CROSS_CHAIN_SYNC_BASE_SEPOLIA");

// Trust BSC Testnet (EID: 40102)
const bscRemote = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address"], 
  ["CROSS_CHAIN_SYNC_BSC_TESTNET"]
);
await sync.setTrustedRemote(40102, bscRemote);

// Trust Sepolia (EID: 40161)
const sepoliaRemote = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address"], 
  ["CROSS_CHAIN_SYNC_SEPOLIA"]
);
await sync.setTrustedRemote(40161, sepoliaRemote);
```

**On BSC Testnet:**
```javascript
const sync = CrossChainSync.attach("CROSS_CHAIN_SYNC_BSC_TESTNET");

// Trust Base Sepolia (EID: 40245)
const baseRemote = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address"], 
  ["CROSS_CHAIN_SYNC_BASE_SEPOLIA"]
);
await sync.setTrustedRemote(40245, baseRemote);

// Trust Sepolia (EID: 40161)
const sepoliaRemote = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address"], 
  ["CROSS_CHAIN_SYNC_SEPOLIA"]
);
await sync.setTrustedRemote(40161, sepoliaRemote);
```

**On Sepolia:**
```javascript
const sync = CrossChainSync.attach("CROSS_CHAIN_SYNC_SEPOLIA");

// Trust Base Sepolia (EID: 40245)
const baseRemote = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address"], 
  ["CROSS_CHAIN_SYNC_BASE_SEPOLIA"]
);
await sync.setTrustedRemote(40245, baseRemote);

// Trust BSC Testnet (EID: 40102)
const bscRemote = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address"], 
  ["CROSS_CHAIN_SYNC_BSC_TESTNET"]
);
await sync.setTrustedRemote(40102, bscRemote);
```

#### 3.4 Fund Contracts

Each GlobalSupplyTracker and CrossChainSync needs native tokens for LayerZero fees:

```javascript
const [deployer] = await ethers.getSigners();

// Fund GlobalSupplyTracker (0.05 ETH/BNB)
await deployer.sendTransaction({
  to: "GLOBAL_SUPPLY_TRACKER_ADDRESS",
  value: ethers.parseEther("0.05")
});

// Fund CrossChainSync (0.1 ETH/BNB)
await deployer.sendTransaction({
  to: "CROSS_CHAIN_SYNC_ADDRESS",
  value: ethers.parseEther("0.1")
});
```

Repeat for all chains.

#### 3.5 Update TokenFactory (if needed)

If TokenFactory needs to be updated with new GlobalSupplyTracker or CrossChainSync addresses:

```javascript
const TokenFactory = await ethers.getContractFactory("TokenFactory");
const factory = TokenFactory.attach("TOKEN_FACTORY_ADDRESS");

// Update GlobalSupplyTracker
await factory.setGlobalSupplyTracker("GLOBAL_SUPPLY_TRACKER_ADDRESS");

// Update CrossChainSync
await factory.setCrossChainInfrastructure(
  "LZ_ENDPOINT_ADDRESS",  // LayerZero endpoint (same for all testnets)
  "CROSS_CHAIN_SYNC_ADDRESS",
  "0x0000000000000000000000000000000000000000",  // Price oracle (optional)
  40245  // Chain EID (40245 for Base, 40102 for BSC, 40161 for Sepolia)
);
```

### Step 4: Authorize BondingCurves

When tokens are created, their BondingCurves need to be authorized in GlobalSupplyTracker. This can be done automatically in the TokenFactory, or manually:

```javascript
const tracker = GlobalSupplyTracker.attach("GLOBAL_SUPPLY_TRACKER_ADDRESS");
await tracker.authorizeUpdater("BONDING_CURVE_ADDRESS");
```

### Step 5: Test Cross-Chain Sync

1. **Create a token** on Base Sepolia
2. **Buy tokens** on Base Sepolia
3. **Check transaction logs** for:
   - ✅ `TokenBought` event
   - ✅ `SupplyUpdated` event
   - ✅ `SupplySynced` event (if cross-chain sync worked)
   - ✅ LayerZero events
4. **Check other chains:**
   ```javascript
   // On BSC Testnet
   const trackerBSC = GlobalSupplyTracker.attach("GLOBAL_SUPPLY_TRACKER_BSC_TESTNET");
   const globalSupply = await trackerBSC.getGlobalSupply("TOKEN_ADDRESS");
   console.log("Global supply on BSC:", globalSupply.toString());
   ```

## Quick Setup Script

Use the automated setup script:

```bash
# Set environment variables
export GLOBAL_SUPPLY_TRACKER_ADDRESS=0x...
export CROSS_CHAIN_SYNC_ADDRESS=0x...
export FUND_AMOUNT=0.05

# Run setup
npx hardhat run scripts/setup-cross-chain.ts --network baseSepolia
```

## Verification Checklist

- [ ] CrossChainSync deployed on all 3 chains
- [ ] GlobalSupplyTracker deployed/updated on all 3 chains
- [ ] CrossChainSync address set in GlobalSupplyTracker (all chains)
- [ ] GlobalSupplyTracker authorized in CrossChainSync (all chains)
- [ ] Trusted remotes set (all chains)
- [ ] Contracts funded with native tokens (all chains)
- [ ] TokenFactory updated with new addresses (if needed)
- [ ] Test transaction completed
- [ ] Cross-chain sync verified (supply updated on other chains)

## Troubleshooting

See `CROSS_CHAIN_SETUP_GUIDE.md` for detailed troubleshooting steps.

## Next Steps After Deployment

1. Update environment variables in Railway and Vercel
2. Test with real token creation and trading
3. Monitor gas costs and adjust fee reserves
4. Set up monitoring for cross-chain sync failures

