# CFY Token Presale Configuration Recommendations

## Token Information
- **Token Name**: Crossify
- **Token Symbol**: CFY
- **Total Supply**: 1,000,000,000 CFY (1 billion)
- **Presale Allocation**: 300,000,000 CFY (30% of total supply)
  - Public Presale: 200,000,000 CFY (20%)
  - Private Sale: 100,000,000 CFY (10%)

## Presale Price Recommendations

Based on your existing tokenomics document, you have tiered pricing in USD. Here are the SOL price recommendations:

### Current SOL Price Assumption
Assuming SOL is around **$150-200 USD**, here are the price conversions:

### Option 1: Single Price (Simpler for Presale System)
**Recommended Presale Price: 0.0001 SOL per CFY**

This equals approximately **$0.015-0.02 USD** per CFY (mid-range of your tiers), which is:
- Fair for early supporters
- Competitive with similar projects
- Allows for good token distribution

**Calculation:**
- If you raise 1,000 SOL at 0.0001 SOL/CFY = 10,000,000 CFY sold
- If you raise 5,000 SOL = 50,000,000 CFY sold
- If you raise 10,000 SOL = 100,000,000 CFY sold

### Option 2: Tiered Pricing (More Complex)
If you want to implement tiered pricing like your tokenomics document:

| Tier | CFY Amount | USD Price | SOL Price (at $150/SOL) | SOL Price (at $200/SOL) |
|------|------------|-----------|-------------------------|-------------------------|
| Tier 1 | First 50M | $0.01 | 0.0000667 SOL | 0.00005 SOL |
| Tier 2 | Next 50M | $0.015 | 0.0001 SOL | 0.000075 SOL |
| Tier 3 | Next 50M | $0.02 | 0.000133 SOL | 0.0001 SOL |
| Tier 4 | Last 50M | $0.025 | 0.000167 SOL | 0.000125 SOL |

**Recommendation**: Start with **Option 1 (0.0001 SOL/CFY)** for simplicity. You can always adjust the price or add tiers later if needed.

## Min/Max Purchase Recommendations

Based on your tokenomics document:
- **Minimum Purchase**: 1,000 CFY
- **Maximum Purchase**: 1,000,000 CFY per wallet

### In SOL Terms (at 0.0001 SOL/CFY):
- **Minimum Purchase**: **0.1 SOL** (1,000 CFY × 0.0001)
- **Maximum Purchase**: **100 SOL** (1,000,000 CFY × 0.0001)

### Alternative Recommendations:

**Conservative Approach** (Wider participation):
- Min: **0.05 SOL** (~500 CFY)
- Max: **50 SOL** (~500,000 CFY)

**Aggressive Approach** (Larger contributions):
- Min: **0.2 SOL** (~2,000 CFY)
- Max: **200 SOL** (~2,000,000 CFY)

**Recommended**: **0.1 SOL minimum, 100 SOL maximum**
- This matches your tokenomics document
- Allows both small and large investors
- Prevents whale dominance while allowing meaningful contributions

## Tokenomics for Raised SOL

Based on your existing tokenomics and the need to:
1. Add liquidity when token launches
2. Pay developers
3. Fund marketing/advertising

### Recommended Allocation:

```
Liquidity Pool:     60%  → For adding liquidity to DEX when token launches
Development:        20%  → Pay developers for building
Marketing:          20%  → Advertising and promotion
```

**Rationale:**
- **60% Liquidity**: Ensures strong liquidity when token launches, which is critical for price stability and trading
- **20% Development**: Covers ongoing development costs
- **20% Marketing**: Drives awareness and adoption

### Alternative Allocation (More Conservative):

```
Liquidity Pool:     70%  → Maximum liquidity for launch
Development:        15%  → Essential development only
Marketing:          15%  → Core marketing activities
```

### Alternative Allocation (More Aggressive Marketing):

```
Liquidity Pool:     50%  → Good liquidity base
Development:        20%  → Development costs
Marketing:          30%  → Aggressive marketing push
```

**My Recommendation**: **60% Liquidity, 20% Dev, 20% Marketing**
- Balanced approach
- Ensures strong launch liquidity
- Funds both development and growth

## Affiliate Reward Percentage

**Recommended: 5%**

This means affiliates earn 5% of each referral's purchase amount in SOL.

**Example:**
- Someone buys 10 SOL worth of CFY using your referral code
- You earn: 10 SOL × 5% = 0.5 SOL

**Alternative Options:**
- **3%**: More conservative, lower costs
- **7%**: More aggressive, better incentive for affiliates
- **10%**: Very aggressive, high incentive but reduces your funds

**Recommendation**: Start with **5%** - it's a good balance between incentivizing affiliates and maintaining your fund allocation.

## Complete Presale Configuration

Here's the complete configuration I recommend:

```json
{
  "token_symbol": "CFY",
  "token_name": "Crossify",
  "solana_address": "YOUR_WALLET_ADDRESS_HERE",
  "presale_price": 0.0001,
  "total_tokens_for_presale": "300000000",
  "min_purchase_sol": 0.1,
  "max_purchase_sol": 100,
  "liquidity_percentage": 60,
  "dev_percentage": 20,
  "marketing_percentage": 20,
  "affiliate_reward_percentage": 5
}
```

## Fundraising Scenarios

### Scenario 1: Conservative (1,000 SOL raised)
- CFY Sold: 10,000,000 CFY (3.33% of presale allocation)
- Liquidity: 600 SOL
- Development: 200 SOL
- Marketing: 200 SOL

### Scenario 2: Moderate (5,000 SOL raised)
- CFY Sold: 50,000,000 CFY (16.67% of presale allocation)
- Liquidity: 3,000 SOL
- Development: 1,000 SOL
- Marketing: 1,000 SOL

### Scenario 3: Strong (10,000 SOL raised)
- CFY Sold: 100,000,000 CFY (33.33% of presale allocation)
- Liquidity: 6,000 SOL
- Development: 2,000 SOL
- Marketing: 2,000 SOL

### Scenario 4: Excellent (20,000 SOL raised)
- CFY Sold: 200,000,000 CFY (66.67% of presale allocation)
- Liquidity: 12,000 SOL
- Development: 4,000 SOL
- Marketing: 4,000 SOL

## Important Considerations

### 1. SOL Price Volatility
- SOL price can fluctuate significantly
- Consider setting a USD floor price or adjusting SOL price periodically
- Or accept SOL price volatility as part of the presale

### 2. Presale Duration
- Consider setting a time limit (e.g., 30-60 days)
- Or set a hard cap (e.g., 20,000 SOL or 200M CFY)
- This creates urgency and FOMO

### 3. Vesting Schedule
According to your tokenomics:
- **Public Presale**: 20% at TGE, 80% linear vesting over 12 months
- **Private Sale**: 6-month cliff, 18-month linear vesting

You'll need to implement vesting when distributing tokens after presale.

### 4. Token Distribution
After presale ends:
1. Calculate each buyer's allocation from `presale_allocations` table
2. Deploy CFY token on Solana mainnet
3. Distribute tokens according to vesting schedule
4. Use liquidity portion to create DEX liquidity pool

## Next Steps

1. **Get your Solana wallet address** (secure, preferably hardware wallet)
2. **Decide on final pricing** (I recommend 0.0001 SOL/CFY)
3. **Set min/max limits** (I recommend 0.1-100 SOL)
4. **Confirm tokenomics** (I recommend 60/20/20)
5. **Create the presale** using the API
6. **Activate monitoring** and start accepting contributions!

## Questions to Consider

1. **Do you want a hard cap?** (e.g., stop at 200M CFY or 20,000 SOL)
2. **Do you want time limits?** (e.g., 30-day presale period)
3. **Do you want early bird bonuses?** (e.g., 10% bonus for first 1,000 contributors)
4. **Do you want to adjust price based on SOL/USD?** (more complex but fairer)

Let me know if you'd like me to adjust any of these recommendations based on your specific goals!

