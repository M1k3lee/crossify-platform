# Cross-Chain Setup Guide

This guide explains how to set up cross-chain price synchronization using LayerZero.

## Overview

The cross-chain synchronization works as follows:

1. **BondingCurve** → calls → **GlobalSupplyTracker.updateSupply()** (with fee)
2. **GlobalSupplyTracker** → calls → **CrossChainSync.syncSupplyUpdate()** (with fee)
3. **CrossChainSync** → sends → **LayerZero messages** to other chains
4. Other chains receive messages and update their local supply

## Deployment Steps

### 1. Deploy CrossChainSync on Each Chain

```bash
# Deploy on Base Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia

# Deploy on BSC Testnet
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet

# Deploy on Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```

**Save the addresses:**
- `CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...`
- `CROSS_CHAIN_SYNC_BSC_TESTNET=0x...`
- `CROSS_CHAIN_SYNC_SEPOLIA=0x...`

### 2. Deploy GlobalSupplyTracker on Each Chain

```bash
# Deploy on Base Sepolia (EID: 40245)
npx hardhat run scripts/deploy-global-supply.ts --network baseSepolia

# Deploy on BSC Testnet (EID: 40102)
npx hardhat run scripts/deploy-global-supply.ts --network bscTestnet

# Deploy on Sepolia (EID: 40161)
npx hardhat run scripts/deploy-global-supply.ts --network sepolia
```

**Save the addresses:**
- `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...`
- `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...`
- `GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...`

### 3. Configure GlobalSupplyTracker

For each chain, you need to:

#### a. Set CrossChainSync address

```javascript
// On Base Sepolia
await globalSupplyTracker.setCrossChainSync(CROSS_CHAIN_SYNC_BASE_SEPOLIA);

// On BSC Testnet
await globalSupplyTracker.setCrossChainSync(CROSS_CHAIN_SYNC_BSC_TESTNET);

// On Sepolia
await globalSupplyTracker.setCrossChainSync(CROSS_CHAIN_SYNC_SEPOLIA);
```

#### b. Fund GlobalSupplyTracker with native tokens (for LayerZero fees)

Each GlobalSupplyTracker needs a small reserve (0.01-0.1 ETH/BNB) to pay for cross-chain messages:

```javascript
// Send 0.05 ETH/BNB to GlobalSupplyTracker for fees
await deployer.sendTransaction({
  to: globalSupplyTrackerAddress,
  value: ethers.parseEther("0.05")
});
```

### 4. Configure CrossChainSync

For each chain, you need to:

#### a. Authorize GlobalSupplyTracker

```javascript
// On Base Sepolia
await crossChainSync.authorizeAddress(GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA);

// On BSC Testnet
await crossChainSync.authorizeAddress(GLOBAL_SUPPLY_TRACKER_BSC_TESTNET);

// On Sepolia
await crossChainSync.authorizeAddress(GLOBAL_SUPPLY_TRACKER_SEPOLIA);
```

#### b. Set Trusted Remotes

For each chain, set the trusted remote addresses for the other chains:

```javascript
// On Base Sepolia (EID: 40245)
// Trust BSC Testnet (EID: 40102)
await crossChainSync.setTrustedRemote(
  40102, 
  ethers.AbiCoder.defaultAbiCoder().encode(["address"], [CROSS_CHAIN_SYNC_BSC_TESTNET])
);

// Trust Sepolia (EID: 40161)
await crossChainSync.setTrustedRemote(
  40161,
  ethers.AbiCoder.defaultAbiCoder().encode(["address"], [CROSS_CHAIN_SYNC_SEPOLIA])
);

// Repeat for BSC Testnet and Sepolia...
```

#### c. Fund CrossChainSync with native tokens

Each CrossChainSync needs native tokens to pay for LayerZero messages:

```javascript
// Send 0.1 ETH/BNB to CrossChainSync for fees
await deployer.sendTransaction({
  to: crossChainSyncAddress,
  value: ethers.parseEther("0.1")
});
```

### 5. Update TokenFactory

When deploying TokenFactory, pass the GlobalSupplyTracker and CrossChainSync addresses:

```javascript
const tokenFactory = await TokenFactory.deploy(
  owner,
  GLOBAL_SUPPLY_TRACKER_ADDRESS,  // GlobalSupplyTracker
  "base-sepolia",                  // Chain name
  true,                            // useGlobalSupply
  LZ_ENDPOINT_ADDRESS,             // LayerZero endpoint
  CROSS_CHAIN_SYNC_ADDRESS,        // CrossChainSync
  PRICE_ORACLE_ADDRESS,            // Price oracle (can be address(0))
  40245                            // Chain EID
);
```

### 6. Authorize BondingCurves in GlobalSupplyTracker

When a token is created, authorize its BondingCurve in GlobalSupplyTracker:

```javascript
// After token creation
await globalSupplyTracker.authorizeUpdater(bondingCurveAddress);
```

## Verification

### Test Cross-Chain Sync

1. **Create a token on Base Sepolia**
2. **Buy tokens on Base Sepolia**
3. **Check the transaction logs:**
   - Should see `TokenBought` event
   - Should see `SupplyUpdated` event
   - Should see `SupplySynced` event (if cross-chain sync worked)
   - Should see LayerZero events

4. **Check other chains:**
   ```javascript
   // On BSC Testnet
   const globalSupply = await globalSupplyTrackerBSC.getGlobalSupply(tokenAddress);
   console.log("Global supply on BSC:", globalSupply.toString());
   
   // Should match the supply on Base Sepolia
   ```

### Troubleshooting

#### Issue: Cross-chain sync not working

1. **Check if GlobalSupplyTracker is authorized in CrossChainSync:**
   ```javascript
   const isAuthorized = await crossChainSync.authorizedTokens(globalSupplyTrackerAddress);
   console.log("Authorized:", isAuthorized);
   ```

2. **Check if trusted remotes are set:**
   ```javascript
   const trustedRemote = await crossChainSync.trustedRemotes(targetEID);
   console.log("Trusted remote:", trustedRemote);
   ```

3. **Check if contracts have native tokens for fees:**
   ```javascript
   const balance = await ethers.provider.getBalance(globalSupplyTrackerAddress);
   console.log("Balance:", ethers.formatEther(balance));
   ```

4. **Check if CrossChainSync is enabled in GlobalSupplyTracker:**
   ```javascript
   const isEnabled = await globalSupplyTracker.crossChainEnabled();
   const syncAddress = await globalSupplyTracker.crossChainSync();
   console.log("Enabled:", isEnabled, "Address:", syncAddress);
   ```

#### Issue: "Insufficient fees" error

- Fund GlobalSupplyTracker with more native tokens (0.01-0.1 ETH/BNB)
- Check if minFeeReserve is set correctly:
  ```javascript
  const minReserve = await globalSupplyTracker.minFeeReserve();
  console.log("Min reserve:", ethers.formatEther(minReserve));
  ```

#### Issue: "Not authorized" error

- Authorize GlobalSupplyTracker in CrossChainSync:
  ```javascript
  await crossChainSync.authorizeAddress(globalSupplyTrackerAddress);
  ```

#### Issue: "Source EID not configured" error

- Set the current chain EID in GlobalSupplyTracker:
  ```javascript
  // For Base Sepolia
  await globalSupplyTracker.setCurrentChainEID(40245);
  ```

## LayerZero Endpoint Addresses

### Testnets

- **Sepolia**: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- **BSC Testnet**: `0x6EDCE65403992e310A62460808c4b910D972f10f`
- **Base Sepolia**: `0x6EDCE65403992e310A62460808c4b910D972f10f`

### LayerZero Endpoint IDs (EIDs)

- **Sepolia**: 40161
- **BSC Testnet**: 40102
- **Base Sepolia**: 40245

## Cost Estimation

### Cross-Chain Message Fees

- **Per message**: ~0.001-0.01 ETH/BNB (depending on gas prices)
- **For 3 chains**: ~0.003-0.03 ETH/BNB per update
- **Recommended reserve**: 0.05-0.1 ETH/BNB per contract

### Gas Costs

- **Buy transaction**: ~200k-300k gas (includes cross-chain sync attempt)
- **Cross-chain message**: ~100k-200k gas per destination chain

## Security Considerations

1. **Authorization**: Only authorized contracts can update supply
2. **Trusted Remotes**: Only messages from trusted remotes are accepted
3. **Fee Management**: Contracts need sufficient funds for cross-chain messages
4. **Error Handling**: Cross-chain sync failures don't block local transactions (best effort)

## Next Steps

After setup:
1. Test with a small token purchase
2. Verify supply updates on all chains
3. Monitor gas costs and adjust fee reserves
4. Set up monitoring for cross-chain sync failures

