# Cross-Chain Liquidity Bridge - Deployment Checklist

Use this checklist to ensure all steps are completed for deploying the liquidity bridge system.

## Pre-Deployment

- [ ] Review `docs/LIQUIDITY_BRIDGE_IMPLEMENTATION.md` for system overview
- [ ] Review `docs/DEPLOY_LIQUIDITY_BRIDGE.md` for deployment steps
- [ ] Ensure sufficient balance on deployer wallet for all chains
- [ ] Set up environment variables in `contracts/.env`
- [ ] Set up environment variables in `backend/.env`

## Step 1: Deploy CrossChainSync (if needed)

- [ ] Deploy CrossChainSync on Sepolia
- [ ] Deploy CrossChainSync on BSC Testnet
- [ ] Deploy CrossChainSync on Base Sepolia
- [ ] Save addresses to `.env`:
  - `CROSS_CHAIN_SYNC_SEPOLIA=0x...`
  - `CROSS_CHAIN_SYNC_BSC_TESTNET=0x...`
  - `CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x...`

## Step 2: Configure CrossChainSync Trusted Remotes

- [ ] Set trusted remotes on Sepolia
- [ ] Set trusted remotes on BSC Testnet
- [ ] Set trusted remotes on Base Sepolia
- [ ] Verify all remotes are set correctly

## Step 3: Deploy Liquidity Bridge

- [ ] Deploy bridge on Sepolia
  - Command: `npx hardhat run scripts/deploy-liquidity-bridge.ts --network sepolia`
  - Save address: `SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...`
- [ ] Deploy bridge on BSC Testnet
  - Command: `npx hardhat run scripts/deploy-liquidity-bridge.ts --network bscTestnet`
  - Save address: `BSC_TESTNET_LIQUIDITY_BRIDGE_ADDRESS=0x...`
- [ ] Deploy bridge on Base Sepolia
  - Command: `npx hardhat run scripts/deploy-liquidity-bridge.ts --network baseSepolia`
  - Save address: `BASE_SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS=0x...`

### Mainnet Deployment (when ready)

- [ ] Deploy bridge on Ethereum Mainnet
- [ ] Deploy bridge on BSC Mainnet
- [ ] Deploy bridge on Base Mainnet
- [ ] Save all mainnet addresses

## Step 4: Configure Bridge Contracts

- [ ] Configure bridge on Sepolia
  - Command: `npx hardhat run scripts/setup-liquidity-bridge.ts --network sepolia`
- [ ] Configure bridge on BSC Testnet
  - Command: `npx hardhat run scripts/setup-liquidity-bridge.ts --network bscTestnet`
- [ ] Configure bridge on Base Sepolia
  - Command: `npx hardhat run scripts/setup-liquidity-bridge.ts --network baseSepolia`
- [ ] Verify configuration (fees, reserves, etc.)

## Step 5: Authorize Bonding Curves

- [ ] List all bonding curve addresses
- [ ] Set `BONDING_CURVE_ADDRESSES` in `.env`
- [ ] Authorize on Sepolia
  - Command: `npx hardhat run scripts/authorize-bonding-curves-bridge.ts --network sepolia`
- [ ] Authorize on BSC Testnet
- [ ] Authorize on Base Sepolia

## Step 6: Update Bonding Curves

- [ ] Create/update script to set bridge on all curves
- [ ] Update curves on Sepolia:
  - `setLiquidityBridge(bridgeAddress)`
  - `setChainEID(40161)`
  - `setUseLiquidityBridge(true)`
- [ ] Update curves on BSC Testnet:
  - `setChainEID(40102)`
- [ ] Update curves on Base Sepolia:
  - `setChainEID(40245)`

## Step 7: Update Backend Configuration

- [ ] Add bridge addresses to `backend/.env`:
  - `ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x...`
  - `BSC_LIQUIDITY_BRIDGE_ADDRESS=0x...`
  - `BASE_LIQUIDITY_BRIDGE_ADDRESS=0x...`
- [ ] Add private keys for bridge operations:
  - `ETHEREUM_PRIVATE_KEY=0x...`
  - `BSC_PRIVATE_KEY=0x...`
  - `BASE_PRIVATE_KEY=0x...`
  - OR: `BRIDGE_PRIVATE_KEY=0x...` (shared key)
- [ ] Verify RPC URLs are set
- [ ] Restart backend to load new configuration

## Step 8: Verification & Testing

- [ ] Verify all contracts on block explorers
- [ ] Test reserve monitoring API:
  ```bash
  curl http://localhost:3000/api/crosschain/liquidity/reserves/TOKEN_ID
  ```
- [ ] Test manual rebalance:
  ```bash
  curl -X POST http://localhost:3000/api/crosschain/liquidity/rebalance \
    -H "Content-Type: application/json" \
    -d '{"tokenId": "TOKEN_ID"}'
  ```
- [ ] Check backend logs for monitoring service:
  - Should see: "✅ Liquidity monitoring service started"
- [ ] Test with small amounts first
- [ ] Monitor for any errors

## Step 9: Production Readiness

- [ ] All contracts verified on block explorers
- [ ] All environment variables documented
- [ ] Monitoring and alerting set up
- [ ] Documentation updated with actual addresses
- [ ] Team trained on bridge operations
- [ ] Emergency procedures documented

## Post-Deployment

- [ ] Monitor bridge operations for 24-48 hours
- [ ] Check reserve levels are being maintained
- [ ] Verify automatic rebalancing is working
- [ ] Test edge cases (large amounts, multiple chains)
- [ ] Gather user feedback
- [ ] Document any issues and resolutions

## Rollback Plan (if needed)

- [ ] Disable bridge on bonding curves: `setUseLiquidityBridge(false)`
- [ ] Stop monitoring service (if issues)
- [ ] Document issues for future fixes

## Notes

- Keep all contract addresses in a secure location
- Document any deviations from standard deployment
- Test thoroughly on testnets before mainnet deployment
- Have rollback plan ready before production deployment
