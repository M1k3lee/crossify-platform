# Hedera Integration Implementation Guide

## Overview

This guide covers the implementation of Hedera integration for Crossify.io, including Phase 1 (Hedera as deployment chain) and Phase 2 (HCS audit logging) preparations.

## Phase 1: Hedera as Deployment Chain ✅ COMPLETE

### What Was Implemented

1. **Hardhat Configuration**
   - Added `hederaTestnet` and `hedera` networks to `hardhat.config.ts`
   - Configured RPC URLs and chain IDs (296 for testnet, 295 for mainnet)

2. **Frontend Integration**
   - Updated `DeploymentConfig` type to include `'hedera'`
   - Added Hedera to `CHAIN_CONFIGS` with MetaMask network configuration
   - Added Hedera to factory addresses configuration
   - Updated `switchNetwork` and `deployTokenOnEVM` functions
   - Updated Builder UI to show Hedera as a chain option with "⚡ Fast & Cheap" badge

3. **Backend Integration**
   - Created `HederaService` class in `backend/src/services/blockchain/hedera.ts`
   - Added Hedera to `getBlockchainService` factory function
   - Updated `unifiedLiquidity.ts` to include Hedera in price monitoring

4. **Smart Contracts**
   - Updated `CrossChainSync.sol` to include Hedera EID placeholder
   - Added note about LayerZero support verification

5. **Deployment Scripts**
   - Created `contracts/scripts/deploy-hedera.ts` for deploying contracts to Hedera

### Next Steps for Phase 1

1. **Deploy Contracts to Hedera Testnet**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet
   ```

2. **Get Testnet HBAR**
   - Visit: https://portal.hedera.com/
   - Request testnet HBAR for your account

3. **Update Environment Variables**
   ```env
   # Frontend (.env or Netlify)
   VITE_HEDERA_FACTORY=0x... # From deployment output
   
   # Backend (.env)
   HEDERA_RPC_URL=https://testnet.hashio.io/api
   HEDERA_PRIVATE_KEY=your_private_key
   ```

4. **Verify LayerZero Support**
   - Check if LayerZero supports Hedera
   - If not, plan for Chainlink CCIP integration (Phase 3)

## Phase 2: HCS Audit Logging (Foundation Ready)

### What Was Implemented

1. **HCS Audit Service Foundation**
   - Created `backend/src/services/hederaAudit.ts`
   - Implemented `HederaAuditService` class with:
     - `logPriceSyncEvent()` - Log cross-chain price syncs
     - `logBondingCurveTransaction()` - Log buy/sell transactions
     - `initialize()` - Set up HCS topic
     - Singleton pattern for easy access

### Next Steps for Phase 2

1. **Install Hedera SDK**
   ```bash
   cd backend
   npm install @hashgraph/sdk
   ```

2. **Set Up Hedera Account**
   - Create Hedera account at https://portal.hedera.com/
   - Get account ID (format: 0.0.xxxxx)
   - Export private key

3. **Configure Environment Variables**
   ```env
   # Backend (.env)
   HEDERA_ACCOUNT_ID=0.0.xxxxx
   HEDERA_PRIVATE_KEY=your_private_key_hex
   HEDERA_HCS_TOPIC_ID=0.0.xxxxx  # Will be created on first run
   ```

4. **Initialize Service at Startup**
   ```typescript
   // backend/src/index.ts or app.ts
   import { initializeHederaAudit } from './services/hederaAudit';
   
   // At app startup
   await initializeHederaAudit();
   ```

5. **Integrate with Event Listeners**
   ```typescript
   // backend/src/services/eventListener.ts
   import { getHederaAuditService } from './hederaAudit';
   
   // Listen to CrossChainSync events
   crossChainSync.on("SupplySynced", async (event) => {
     const auditService = getHederaAuditService();
     await auditService.logPriceSyncEvent({
       tokenAddress: event.token,
       sourceChain: eidToChain[event.sourceEID],
       targetChains: event.targetEIDs.map(eid => eidToChain[eid]),
       oldGlobalSupply: event.oldGlobalSupply,
       newGlobalSupply: event.newGlobalSupply,
       timestamp: Date.now(),
       layerZeroTxHash: event.txHash
     });
   });
   ```

6. **Create Frontend Audit Log Viewer**
   - Create component to query and display HCS logs
   - Show verifiable timestamps and event details
   - Add to token detail page

## Testing Checklist

### Phase 1 Testing

- [ ] Deploy TokenFactory to Hedera testnet
- [ ] Create a test token on Hedera via frontend
- [ ] Verify token appears in marketplace
- [ ] Test buying tokens on Hedera bonding curve
- [ ] Verify price sync works (if LayerZero supports Hedera)
- [ ] Test cross-chain price synchronization with Hedera

### Phase 2 Testing

- [ ] Initialize HCS topic
- [ ] Log test price sync event
- [ ] Verify event appears in HashScan explorer
- [ ] Query audit logs via API
- [ ] Display audit logs in frontend
- [ ] Test with real bonding curve transactions

## Known Issues & Considerations

1. **LayerZero Support for Hedera**
   - Status: Unknown - needs verification
   - Fallback: Use Chainlink CCIP (Phase 3)
   - Impact: Cross-chain sync may need alternative messaging

2. **Hedera Account Setup**
   - Requires account ID (not just wallet address)
   - Format: 0.0.xxxxx
   - Need to handle account creation in onboarding flow

3. **Gas Fees**
   - Hedera uses HBAR (not ETH/BNB)
   - Very cheap (~$0.0001 per transaction)
   - Need to update UI to show HBAR instead of ETH

4. **Network Switching**
   - MetaMask needs to support Hedera network
   - May need custom network addition flow
   - Consider HashPack wallet integration

## Cost Estimates

### Phase 1 (Deployment)
- Contract deployment: ~$0.01-0.05 per contract
- Token creation: ~$0.0001 per token
- Transactions: ~$0.0001 per transaction

### Phase 2 (HCS Audit)
- Topic creation: ~$0.01 (one-time)
- Message submission: ~$0.0001 per message
- For 100,000 events/month: ~$10/month

## Resources

- Hedera Documentation: https://docs.hedera.com/
- Hedera Portal: https://portal.hedera.com/
- HashScan Explorer: https://hashscan.io/
- Hedera SDK: https://github.com/hashgraph/hedera-sdk-js
- HCS Documentation: https://docs.hedera.com/hedera/core-concepts/consensus-service

## Support

For issues or questions:
1. Check Hedera Discord: https://discord.gg/hedera
2. Review Hedera documentation
3. Check LayerZero/CCIP documentation for cross-chain support

