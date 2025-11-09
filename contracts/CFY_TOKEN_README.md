# CFY Token - Crossify Platform Token

## Overview

The CFY (Crossify Token) is the native platform token for Crossify.io, designed to power the entire ecosystem with advanced tokenomics and utility features.

## Token Details

- **Name:** Crossify Token
- **Symbol:** CFY
- **Total Supply:** 1,000,000,000 CFY (1 billion)
- **Decimals:** 18
- **Type:** ERC20 (EVM) with cross-chain capability

## Tokenomics Features

### 1. Automatic Buyback (50% of fees)
- 50% of all platform fees are used to buy back CFY tokens
- Distribution: 80% to liquidity pools, 20% burned
- Triggers: Daily ($1K+) or Weekly ($5K+)

### 2. Liquidity Provision (30% of fees)
- 30% of platform fees automatically added to CFY liquidity pools
- Ensures deep liquidity across all supported chains
- Supports trading and price stability

### 3. Deflationary Burns (10% of fees)
- 10% of platform fees used for permanent token burns
- Reduces supply over time, increasing scarcity
- Quarterly burns with annual maximum of 5% of supply

### 4. Staking Rewards (Up to 100% APY)
- **Flexible Staking:** 15% APY, no lock period
- **Locked Staking:** 
  - 1 month lock: 30% APY
  - 3 month lock: 40% APY
  - 6 month lock: 50% APY
- **LP Staking:** Up to 100% APY
- Total rewards: 100M CFY distributed over 4 years (with halving)

### 5. Fee Discounts
- **1K CFY:** 5% discount on platform fees
- **10K CFY:** 10% discount
- **100K CFY:** 20% discount + premium features
- **1M CFY:** 50% discount + VIP features

### 6. Governance
- **Voting:** 1 CFY = 1 vote
- **Proposals:** Minimum 10K CFY to create a proposal
- **Voting Period:** 7 days
- **Quorum:** 5% of total supply
- **Execution Delay:** 2 days after voting ends

## Token Distribution

| Category | Percentage | Amount | Details |
|----------|-----------|--------|---------|
| Presale | 30% | 300M CFY | Public presale with tiered pricing (20% TGE, 80% linear vesting over 12 months) |
| Liquidity Pool | 25% | 250M CFY | Initial DEX liquidity (15%) and reserve pool (10%) |
| Team & Advisors | 15% | 150M CFY | 6-month cliff, 24-month linear vesting |
| Ecosystem | 15% | 150M CFY | Partnerships (8%), Marketing (5%), Development (2%) |
| Staking Rewards | 10% | 100M CFY | Distributed over 4 years with halving |
| Treasury | 5% | 50M CFY | Reserve fund for platform operations |

## Platform Fee Sources

1. **Token Creation:** 0.01 ETH per token
2. **Mint Operations:** 0.1% of minted tokens
3. **Cross-Chain Sync:** 0.5% of DEX trade value
4. **Liquidity Bridge:** 0.1% + LayerZero costs

## Fee Distribution (100%)

- **Buyback:** 50% (80% to liquidity, 20% burned)
- **Liquidity Provision:** 30%
- **Burns:** 10%
- **Operations:** 7%
- **Treasury:** 3%

## Contracts

### 1. CFYToken.sol
Main token contract with all tokenomics features:
- Automatic fee collection and distribution
- Buyback mechanism integration
- Liquidity provision integration
- Deflationary burns
- Fee discount calculation
- Governance voting power

### 2. CFYVesting.sol
Vesting contract for team/advisor tokens:
- Cliff period support
- Linear vesting after cliff
- Multiple vesting schedules per address
- Revocable (emergency only)

### 3. CFYStaking.sol
Staking contract with multiple pools:
- Flexible staking (15% APY)
- Locked staking (30-50% APY)
- LP staking (up to 100% APY)
- Reward distribution over 4 years
- Halving mechanism

### 4. CFYGovernance.sol
Governance contract for voting:
- Proposal creation (min 10K CFY)
- Voting (1 CFY = 1 vote)
- Quorum requirement (5% of supply)
- Proposal execution

### 5. BuybackContract.sol
Automatic buyback mechanism:
- Buys CFY from DEX using platform fees
- Distributes 80% to liquidity, 20% burned
- Threshold-based execution

### 6. LiquidityProvisionContract.sol
Automatic liquidity provision:
- Adds liquidity to CFY pools
- Stakes LP tokens in staking contract
- Ensures deep liquidity

## Deployment Strategy

### Recommended Chain: Base Mainnet

**Why Base?**
- ✅ Lower fees than Ethereum (~$0.01-0.05 per transaction)
- ✅ EVM-compatible (reuse Solidity contracts)
- ✅ Fast transactions (~2 second block time)
- ✅ Coinbase-backed (legitimacy)
- ✅ Growing ecosystem
- ✅ Easy to expand to other chains later

### Deployment Steps

1. **Deploy to Base Mainnet**
   ```bash
   npx hardhat run scripts/deploy-cfy-platform-token.ts --network base
   ```

2. **Verify Contracts**
   ```bash
   npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

3. **Distribute Tokens**
   ```bash
   npx hardhat run scripts/distribute-cfy-tokens.ts --network base
   ```

4. **Create Initial Liquidity**
   - Create CFY/ETH pool on Uniswap V2 (Base)
   - Add initial liquidity (250M CFY)

5. **Set Up Vesting**
   - Create vesting schedules for team/advisor tokens
   - Verify vesting schedules

6. **Fund Staking Contract**
   - Transfer 100M CFY to staking contract

7. **Launch Presale**
   - Deploy presale contract
   - Begin token sale

### Future Expansion

After Base deployment:
1. Deploy to Ethereum mainnet
2. Deploy to BSC mainnet
3. Deploy to Solana (requires Rust/Anchor development)

## Security

- ✅ Built on OpenZeppelin's audited contracts
- ✅ ReentrancyGuard protection
- ✅ Ownable access control
- ✅ Comprehensive input validation
- ⚠️ **Recommended:** Get contracts audited before mainnet deployment

## Testing

Before mainnet deployment:
1. Test on Base Sepolia testnet
2. Test all tokenomics features
3. Test vesting schedules
4. Test staking rewards
5. Test governance voting
6. Test buyback mechanism
7. Test liquidity provision

## Integration

After deployment, integrate with platform:
1. Update backend to collect fees in CFY
2. Update frontend to display CFY balance
3. Implement fee discount calculation
4. Integrate staking interface
5. Integrate governance interface
6. Enable buyback mechanism

## Support

For questions or issues, contact the Crossify team.

