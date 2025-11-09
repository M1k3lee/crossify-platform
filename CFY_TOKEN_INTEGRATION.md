# CFY Token Integration Guide

## Overview

This document outlines the complete CFY (Crossify) token integration for the Crossify platform, including smart contracts, backend services, and deployment scripts.

## What Was Built

### 1. Smart Contracts

#### CFY Token (`contracts/contracts/CFYToken.sol`)
- **Total Supply:** 1,000,000,000 CFY (1 billion)
- **Features:**
  - Automatic fee collection and distribution
  - Fee discounts based on holder balance (5%, 10%, 20%, 50%)
  - Buyback mechanism (50% of fees)
  - Liquidity provision (30% of fees)
  - Token burns (10% of fees)
  - Staking rewards support
  - Governance support

#### CFY Presale (`contracts/contracts/CFYPresale.sol`)
- **Public Presale:** 200M CFY with tiered pricing
  - Tier 1 (First 50M): $0.01/CFY
  - Tier 2 (Next 50M): $0.015/CFY
  - Tier 3 (Next 50M): $0.02/CFY
  - Tier 4 (Last 50M): $0.025/CFY
- **Private Sale:** 100M CFY at $0.008/CFY (20% discount)
- **Vesting:**
  - Public: 20% TGE, 80% linear over 12 months
  - Private: 6-month cliff, 18-month linear vesting

#### CFY Vesting (`contracts/contracts/CFYVesting.sol`)
- Flexible vesting schedules
- Cliff and linear vesting support
- Batch vesting schedule creation

#### CFY Staking (`contracts/contracts/CFYStaking.sol`)
- Multiple staking pools (Flexible, 30-day, 90-day, 180-day)
- APY: 15%, 25%, 50%, 100%
- Lock-up periods and penalties
- Reward distribution

#### CFY Governance (`contracts/contracts/CFYGovernance.sol`)
- Proposal creation (requires 10K CFY)
- Voting (1 CFY = 1 vote)
- Quorum: 5% of total supply
- Execution threshold: Simple majority

### 2. Backend Services

#### CFY Fee Collection Service (`backend/src/services/cfyFeeCollection.ts`)
- Calculates fee discounts based on CFY balance
- Collects platform fees and sends to CFY token contract
- Records fees in database
- Supports multiple chains (Ethereum, Base, BSC)

#### Fee Integration
- **Token Creation Endpoint** (`/tokens/create`): Calculates and returns fee info with discounts
- **Token Deployment Endpoint** (`/tokens/:id/deploy`): Collects fees via CFY contract after successful deployment

### 3. Deployment Scripts

#### Test Script (`contracts/scripts/test-cfy-contracts.ts`)
- Comprehensive testing of all CFY contracts
- Tests fee discounts, vesting, staking, governance
- Validates tokenomics

#### Base Mainnet Deployment (`contracts/scripts/deploy-cfy-base.ts`)
- Deploys all CFY contracts on Base mainnet
- Configures contracts and token distribution
- Saves deployment information

## Token Distribution

- **Presale:** 30% (300M CFY)
- **Liquidity Pool:** 25% (250M CFY)
- **Team & Advisors:** 15% (150M CFY) - 6 month cliff, 24 month vesting
- **Ecosystem:** 15% (150M CFY)
- **Staking Rewards:** 10% (100M CFY) - distributed over 4 years
- **Treasury:** 5% (50M CFY)

## Fee Distribution

When platform fees are collected:
- **50%** → Buyback (automatic CFY token buyback)
- **30%** → Liquidity (added to DEX pools)
- **10%** → Burns (deflationary mechanism)
- **7%** → Operations (fee collector)
- **3%** → Treasury

## Fee Discounts

Fee discounts are applied based on CFY token balance:
- **1K CFY:** 5% discount
- **10K CFY:** 10% discount
- **100K CFY:** 20% discount
- **1M CFY:** 50% discount

## Environment Variables

Required environment variables for CFY integration:

```bash
# CFY Token Configuration
CFY_TOKEN_ADDRESS=0x... # CFY token contract address
FEE_COLLECTOR_ADDRESS=0x... # Address authorized to collect fees
FEE_COLLECTOR_PRIVATE_KEY=0x... # Private key for fee collector
TREASURY_ADDRESS=0x... # Treasury address
PRESALE_ADDRESS=0x... # Presale contract address
VESTING_ADDRESS=0x... # Vesting contract address

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

## Deployment Steps

### 1. Test on Testnet

```bash
cd contracts
npx hardhat run scripts/test-cfy-contracts.ts --network base-sepolia
```

### 2. Deploy to Base Mainnet

```bash
cd contracts
npx hardhat run scripts/deploy-cfy-base.ts --network base-mainnet
```

### 3. Verify Contracts

Verify all contracts on BaseScan:
- CFY Token
- CFY Presale
- CFY Vesting
- CFY Staking
- CFY Governance

### 4. Configure Backend

Update `.env` file with deployed contract addresses:
```bash
CFY_TOKEN_ADDRESS=0x...
FEE_COLLECTOR_ADDRESS=0x...
TREASURY_ADDRESS=0x...
```

### 5. Create DEX Liquidity Pool

1. Create Uniswap V3 pool on Base
2. Add initial liquidity (250M CFY)
3. Update staking contract with LP token address

### 6. Start Presale

1. Configure presale parameters
2. Add whitelist addresses (for private sale)
3. Start public and private presales
4. Set TGE time

### 7. Create Vesting Schedules

1. Create vesting schedules for team/advisors
2. Set cliff and vesting periods
3. Transfer tokens to vesting contract

## API Integration

### Token Creation with CFY Discount

When a user creates a token, the API automatically:
1. Checks CFY balance
2. Calculates fee discount
3. Returns fee info in response

**Example Response:**
```json
{
  "success": true,
  "tokenId": "...",
  "message": "Token created successfully",
  "feeInfo": {
    "baseFee": 0.01,
    "finalFee": 0.008,
    "discountPercent": 20,
    "currency": "ETH"
  }
}
```

### Fee Collection on Deployment

When a token is deployed, the API:
1. Collects fee via CFY contract (with discount applied)
2. Records fee in database
3. Distributes fees according to tokenomics

## Next Steps

1. **Deploy Contracts:** Deploy all CFY contracts to Base mainnet
2. **Create Liquidity Pool:** Set up Uniswap V3 pool with initial liquidity
3. **Start Presale:** Launch public and private presales
4. **Configure Staking:** Set up staking pools and rewards
5. **Enable Governance:** Activate governance for token holders
6. **Monitor Fees:** Track fee collection and distribution
7. **Buyback Execution:** Monitor and execute buybacks when thresholds are reached

## Security Considerations

1. **Multi-sig Wallet:** Transfer contract ownership to multi-sig wallet
2. **Access Control:** Ensure only authorized addresses can collect fees
3. **Vesting Security:** Protect vesting schedules from unauthorized access
4. **Governance Security:** Implement proper quorum and voting mechanisms
5. **Audit:** Conduct security audit before mainnet deployment

## Support

For questions or issues:
- Check contract documentation in `contracts/contracts/`
- Review test scripts in `contracts/scripts/`
- Check backend service logs for fee collection issues

## License

MIT

