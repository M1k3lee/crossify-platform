# CFY Token Deployment Guide

## Overview

This guide covers deploying the Crossify Platform Token (CFY) with all associated contracts:
- CFY Token (CrossifyToken.sol)
- Buyback Contract (BuybackContract.sol)
- Liquidity Provision Contract (LiquidityProvisionContract.sol)

## Prerequisites

1. **Environment Setup**
   ```bash
   cd contracts
   npm install
   ```

2. **Environment Variables**
   Create `.env` file in `contracts/` directory:
   ```env
   # Network Configuration
   NETWORK=sepolia
   PRIVATE_KEY=your_private_key
   
   # LayerZero Configuration
   LAYERZERO_ENDPOINT=0x6EDCE65403992e310A62460808c4b910D972f10f
   CROSS_CHAIN_SYNC=0x...
   PRICE_ORACLE=0x...
   CHAIN_EID=30110
   
   # Uniswap Configuration (Testnet)
   UNISWAP_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
   UNISWAP_FACTORY=0x...
   
   # Contract Addresses
   FEE_COLLECTOR=0x...
   LIQUIDITY_POOL=0x...
   STAKING_CONTRACT=0x...
   ```

## Deployment Steps

### 1. Deploy CFY Token

```bash
cd contracts
npx hardhat run scripts/deploy-cfy-token.ts --network sepolia
```

This will:
- Deploy CFY token with 1 billion supply
- Deploy Buyback Contract
- Deploy Liquidity Provision Contract
- Configure all contracts

### 2. Verify Contracts

```bash
npx hardhat verify --network sepolia <CFY_TOKEN_ADDRESS> \
  "Crossify Token" \
  "CFY" \
  1000000000000000000000000000 \
  <OWNER_ADDRESS> \
  <LZ_ENDPOINT> \
  <CROSS_CHAIN_SYNC> \
  <PRICE_ORACLE> \
  <CHAIN_EID>
```

### 3. Deploy to Other Chains

Repeat deployment for:
- **BSC Testnet**: Update `CHAIN_EID` and network config
- **Base Sepolia**: Update `CHAIN_EID` and network config
- **Solana**: Use separate Solana deployment script

### 4. Create Initial Liquidity

```bash
# Add liquidity to Uniswap
# CFY/ETH pair on Ethereum
# CFY/BNB pair on BSC
# CFY/ETH pair on Base
```

### 5. Configure Cross-Chain Sync

```bash
# Authorize CFY token on CrossChainSync contract
# Set trusted remotes for all chains
# Configure LayerZero endpoints
```

## Contract Addresses

After deployment, save addresses:

```env
# Ethereum Sepolia
CFY_TOKEN_ETH=0x...
BUYBACK_CONTRACT_ETH=0x...
LIQUIDITY_CONTRACT_ETH=0x...

# BSC Testnet
CFY_TOKEN_BSC=0x...
BUYBACK_CONTRACT_BSC=0x...
LIQUIDITY_CONTRACT_BSC=0x...

# Base Sepolia
CFY_TOKEN_BASE=0x...
BUYBACK_CONTRACT_BASE=0x...
LIQUIDITY_CONTRACT_BASE=0x...
```

## Post-Deployment

### 1. Initialize Tokenomics

```javascript
// Set buyback threshold
await buybackContract.setBuybackThreshold(ethers.parseEther("1"));

// Set distribution percentages (80% liquidity, 20% burn)
await buybackContract.setDistributionPercentages(80, 20);

// Set liquidity threshold
await liquidityContract.setLiquidityThreshold(ethers.parseEther("0.5"));
```

### 2. Configure Fee Collection

```javascript
// Set fee collector address
await cfyToken.setFeeCollector(FEE_COLLECTOR_ADDRESS);
await buybackContract.setFeeCollector(FEE_COLLECTOR_ADDRESS);
await liquidityContract.setFeeCollector(FEE_COLLECTOR_ADDRESS);
```

### 3. Enable Cross-Chain

```javascript
// Authorize on CrossChainSync
await crossChainSync.authorizeToken(cfyTokenAddress, true);

// Set trusted remotes
await crossChainSync.setTrustedRemote(chainEID, remoteAddress);
```

### 4. Create Liquidity Pools

1. **Ethereum**: Create CFY/ETH pool on Uniswap V2
2. **BSC**: Create CFY/BNB pool on PancakeSwap
3. **Base**: Create CFY/ETH pool on Uniswap V2
4. **Solana**: Create CFY/SOL pool on Raydium

### 5. Launch Presale

1. Deploy presale contract
2. Allocate 300M CFY for presale
3. Configure tiers and pricing
4. Launch presale website

## Testing

### Test Buyback

```javascript
// Send ETH to buyback contract
await buybackContract.executeBuyback({ value: ethers.parseEther("1") });

// Verify CFY was bought
// Verify liquidity was added
// Verify tokens were burned
```

### Test Liquidity Provision

```javascript
// Send ETH to liquidity contract
await liquidityContract.addLiquidity({ value: ethers.parseEther("0.5") });

// Verify liquidity was added
// Verify LP tokens were staked (if staking contract set)
```

### Test Fee Collection

```javascript
// Mint tokens with platform fee
await tokenContract.mint(recipient, amount, { value: fee });

// Verify fee was collected
// Verify buyback was triggered (if threshold reached)
```

## Security Checklist

- [ ] Contracts verified on block explorer
- [ ] Multi-signature wallet for owner
- [ ] Fee collector address set
- [ ] Buyback thresholds configured
- [ ] Liquidity thresholds configured
- [ ] Cross-chain sync configured
- [ ] Initial liquidity added
- [ ] Security audit completed
- [ ] Emergency withdrawal tested

## Monitoring

### Key Metrics
- Total fees collected
- CFY tokens bought back
- Liquidity added
- Tokens burned
- Buyback frequency
- Liquidity provision frequency

### Alerts
- Buyback threshold reached
- Liquidity threshold reached
- Unusual fee activity
- Contract balance changes

## Troubleshooting

### Buyback Not Executing
- Check buyback threshold
- Verify fee collector is sending ETH
- Check Uniswap router address
- Verify CFY token address

### Liquidity Not Adding
- Check liquidity threshold
- Verify CFY token balance
- Check Uniswap router address
- Verify slippage settings

### Cross-Chain Sync Issues
- Verify LayerZero endpoint
- Check trusted remotes
- Verify chain EIDs
- Check authorization status

## Next Steps

1. **Deploy to Mainnet** (after testnet testing)
2. **Launch Presale** (allocate 300M CFY)
3. **Create Initial Liquidity** (on all chains)
4. **Activate Buyback** (when fees reach threshold)
5. **Launch Staking** (deploy staking contract)
6. **Enable Governance** (deploy governance contract)

## Support

For issues or questions:
- Check contract documentation
- Review deployment logs
- Contact development team
- Check GitHub issues




