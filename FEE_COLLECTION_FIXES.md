# Fee Collection Fixes Implementation Plan

## Critical Issues to Fix

### Issue 1: Deployment Fee - Platform Pays Instead of User
**Status**: ⚠️ Requires Frontend Changes
**Priority**: HIGH
**Solution**: This requires modifying the deployment flow to collect fee from user before deployment. For now, documenting the issue.

### Issue 2: No Platform Fees from Bonding Curve
**Status**: ✅ Can Fix in Contract
**Priority**: CRITICAL
**Solution**: Add platform fee collection to BondingCurve contract

### Issue 3: No Platform Revenue from DEX Trades
**Status**: ✅ Can Fix in Contract
**Priority**: HIGH
**Solution**: Split DEX fee to include platform portion

---

## Implementation Details

### Fix 2: Bonding Curve Platform Fees

**Changes Required**:
1. Add `platformFeePercent` to BondingCurve constructor
2. Add `platformFeeCollector` address to BondingCurve
3. Collect platform fee on buy/sell transactions
4. Send platform fee to CFY contract or fee collector

**Fee Split**:
- Current: 100% of bonding curve fees stay in contract
- New: 
  - 80% stays in bonding curve (for liquidity)
  - 20% goes to platform (via CFY contract)

### Fix 3: DEX Trade Platform Fees

**Changes Required**:
1. Split 0.5% DEX fee:
   - 0.3% for cross-chain sync (current cost)
   - 0.2% for platform revenue
2. Send platform portion to CFY contract

**Alternative**: Add 0.2% platform fee on top of 0.5% sync fee (total 0.7%)

---

## Fee Recipient Verification

**Current Fee Recipients**:
- CFY Token Contract: Receives fees via `collectFees()` function
- Fee Collector Wallet: Receives 7% of fees (operations)
- Treasury Wallet: Receives 3% of fees
- Buyback Contract: Receives 50% of fees
- Liquidity Contract: Receives 30% of fees

**Verification**:
- ✅ Fee collector address: Set via `FEE_COLLECTOR_ADDRESS` env var
- ✅ CFY contract address: Set via `CFY_TOKEN_ADDRESS` env var
- ⚠️ Need to verify these are set correctly in production




