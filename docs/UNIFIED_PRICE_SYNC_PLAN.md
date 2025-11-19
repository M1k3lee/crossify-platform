# Unified Price Sync Plan: EVM + Hedera + Solana

## 🎯 Goal
Create a bulletproof price synchronization system that works across **all chains** (EVM, Hedera, Solana) using a **hybrid on-chain + off-chain** approach.

---

## 📊 Current Architecture

### What We Have:
1. **Backend Database** (`globalSupply.ts`): Already aggregates supply from ALL chains (EVM + Hedera + Solana)
2. **EVM Chains** (Sepolia, Base Sepolia, BSC Testnet): Use `GlobalSupplyTracker` smart contracts
3. **Hedera**: Has EVM compatibility with its own `GlobalSupplyTracker`, but not connected to EVM trackers
4. **Solana**: Completely different architecture, no EVM compatibility

### The Problem:
- EVM chains sync via `GlobalSupplyTracker` contracts
- Hedera/Solana can't use the same mechanism
- Need a unified solution that works for all chains

---

## 🔧 Solution: Hybrid Backend-First Architecture

### Core Principle: **Backend Database is the Single Source of Truth**

The backend already tracks supply for ALL chains. We'll use it as the authoritative source and sync from there.

---

## 🏗️ Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND DATABASE                          │
│  (Single Source of Truth for Global Supply)                 │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Sepolia  │  │  Base    │  │   BSC    │  │  Hedera  │   │
│  │ Supply   │  │  Supply  │  │  Supply  │  │  Supply  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Global Supply = SUM(all chain supplies)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐         ┌─────▼─────┐        ┌─────▼─────┐
    │  EVM    │         │  Hedera   │        │  Solana   │
    │ Chains  │         │  (EVM)    │        │  (Non-    │
    │         │         │           │        │   EVM)    │
    └─────────┘         └───────────┘        └───────────┘
```

---

## 🔄 Transaction Flow

### When a Purchase Happens on ANY Chain:

```
1. Transaction occurs on Chain X
   ↓
2. Frontend/Backend records transaction
   ↓
3. Backend updates chain-specific supply in database
   ↓
4. Backend calculates NEW global supply (sum of all chains)
   ↓
5. Backend triggers sync to ALL chains:
   ├─→ EVM Chains: Update GlobalSupplyTracker contracts
   ├─→ Hedera: Update Hedera GlobalSupplyTracker (if EVM-compatible)
   └─→ Solana: Update price oracle (backend API)
   ↓
6. All chains now show the same price (based on global supply)
```

---

## 📝 Implementation Plan

### Phase 1: Enhanced Backend Sync Service

**File**: `backend/src/services/unifiedPriceSync.ts` (NEW)

```typescript
/**
 * Unified Price Sync Service
 * Syncs prices across ALL chains (EVM + Hedera + Solana)
 */

interface ChainSyncResult {
  chain: string;
  success: boolean;
  message: string;
  method: 'on-chain' | 'api' | 'oracle';
}

/**
 * Sync global supply to all chains after a transaction
 */
export async function syncGlobalSupplyToAllChains(
  tokenId: string,
  sourceChain: string
): Promise<ChainSyncResult[]> {
  // 1. Get global supply from backend database
  const globalSupply = await getGlobalSupply(tokenId);
  
  // 2. Get all deployments
  const deployments = await getAllDeployments(tokenId);
  
  // 3. Sync to each chain based on type
  const results = await Promise.allSettled(
    deployments.map(async (dep) => {
      if (isEVMChain(dep.chain)) {
        return await syncToEVMChain(dep, globalSupply);
      } else if (dep.chain === 'hedera-testnet') {
        return await syncToHedera(dep, globalSupply);
      } else if (dep.chain === 'solana-devnet') {
        return await syncToSolana(dep, globalSupply);
      }
    })
  );
  
  return results;
}
```

---

### Phase 2: EVM Chain Sync (Enhanced)

**File**: `backend/src/services/activePriceSync.ts` (MODIFY)

**Changes**:
- Instead of reading from bonding curves and updating tracker, we'll:
  1. Read global supply from **backend database**
  2. Update GlobalSupplyTracker contracts with backend-calculated supply
  3. This ensures all EVM chains use the same global supply (including Hedera/Solana)

```typescript
export async function syncGlobalSupplyToEVMChains(
  tokenId: string,
  globalSupply: string
): Promise<ChainSyncResult[]> {
  const evmChains = ['sepolia', 'base-sepolia', 'bsc-testnet'];
  
  return await Promise.allSettled(
    evmChains.map(async (chain) => {
      const config = getChainConfig(chain);
      if (!config) return { chain, success: false, message: 'No config' };
      
      // Update GlobalSupplyTracker with backend-calculated global supply
      const tracker = new ethers.Contract(
        config.globalSupplyTrackerAddress,
        GLOBAL_SUPPLY_TRACKER_ABI,
        signer
      );
      
      await tracker.updateGlobalSupply(tokenAddress, globalSupply);
      
      return { chain, success: true, message: 'Synced' };
    })
  );
}
```

---

### Phase 3: Hedera Integration

**Option A: Use Hedera's EVM Compatibility** (Recommended)
- Hedera has EVM compatibility, so we can deploy the same `GlobalSupplyTracker` contract
- Sync it the same way as EVM chains
- **File**: `backend/src/services/activePriceSync.ts` (ADD Hedera support)

```typescript
function getChainConfig(chain: string): ChainConfig | null {
  // ... existing EVM chains ...
  
  if (chain === 'hedera-testnet') {
    return {
      rpcUrl: process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_HEDERA,
      privateKey: process.env.HEDERA_PRIVATE_KEY,
      chainName: 'hedera',
    };
  }
}
```

**Option B: Backend API for Hedera** (Fallback)
- If Hedera's GlobalSupplyTracker can't be updated on-chain
- Hedera bonding curves query backend API for current price
- **File**: `backend/src/routes/tokens.ts` (ADD endpoint)

```typescript
// GET /tokens/:id/current-price/:chain
router.get('/:id/current-price/:chain', async (req, res) => {
  const { id, chain } = req.params;
  
  // Get global supply from database
  const globalSupply = await getGlobalSupply(id);
  
  // Get token parameters
  const token = await dbGet('SELECT base_price, slope FROM tokens WHERE id = ?', [id]);
  
  // Calculate price
  const price = token.base_price + (token.slope * parseFloat(globalSupply));
  
  res.json({ price, globalSupply, chain });
});
```

---

### Phase 4: Solana Integration

**Solana is NOT EVM-compatible**, so we need a different approach:

**Solution: Backend Price Oracle API**

1. **Backend provides price API** (already exists in `globalSupply.ts`)
2. **Solana bonding curve queries backend** for current price
3. **Or**: Solana uses a price oracle program that queries the backend

**File**: `backend/src/routes/tokens.ts` (ENHANCE existing endpoint)

```typescript
// GET /tokens/:id/price-oracle
// Returns current price based on global supply
// Used by Solana (and optionally Hedera) bonding curves
router.get('/:id/price-oracle', async (req, res) => {
  const { id } = req.params;
  
  const globalSupply = await getGlobalSupply(id);
  const token = await dbGet('SELECT base_price, slope FROM tokens WHERE id = ?', [id]);
  
  const price = await calculatePriceWithGlobalSupply(id, token.base_price, token.slope);
  
  res.json({
    tokenId: id,
    globalSupply,
    price,
    priceWei: (price * 1e18).toString(),
    timestamp: Date.now(),
  });
});
```

**Solana Bonding Curve Program** (if we have one):
- Queries backend API: `GET /api/tokens/{tokenId}/price-oracle`
- Uses returned price for buy/sell calculations
- Updates supply to backend after each transaction

---

## 🔐 Security & Reliability

### 1. **Backend as Source of Truth**
- ✅ Single source of truth (database)
- ✅ No cross-chain messaging needed
- ✅ Works for all chain types
- ⚠️ Requires backend to be always available

### 2. **Fallback Mechanisms**
- If backend is down, EVM chains can still use their local `GlobalSupplyTracker`
- Hedera/Solana can fall back to local supply if API unavailable
- Frontend can cache prices for offline use

### 3. **Data Integrity**
- All transactions are recorded in backend database
- Global supply is recalculated on every transaction
- Audit trail via Hedera Consensus Service (HCS)

---

## 📋 Implementation Checklist

### Backend Changes:
- [ ] Create `backend/src/services/unifiedPriceSync.ts`
- [ ] Modify `backend/src/services/activePriceSync.ts` to sync FROM backend (not TO backend)
- [ ] Add Hedera support to `getChainConfig()` in `activePriceSync.ts`
- [ ] Enhance `GET /tokens/:id/price-oracle` endpoint
- [ ] Update `POST /transactions` to trigger unified sync
- [ ] Add chain type detection (`isEVMChain()`, `isHedera()`, `isSolana()`)

### Frontend Changes:
- [ ] Update price display to show "Synced" status for all chains
- [ ] Add indicator for Hedera/Solana price sync status
- [ ] Show global supply breakdown by chain

### Smart Contract Changes (if needed):
- [ ] Verify Hedera GlobalSupplyTracker contract compatibility
- [ ] Deploy price oracle for Solana (if using on-chain oracle)

---

## 🚀 Migration Strategy

### Step 1: Backend-First Sync (Week 1)
1. Implement `unifiedPriceSync.ts`
2. Modify transaction recording to trigger unified sync
3. Test with EVM chains first

### Step 2: Hedera Integration (Week 2)
1. Add Hedera to `getChainConfig()`
2. Test Hedera sync with EVM chains
3. Verify Hedera bonding curves use global supply

### Step 3: Solana Integration (Week 3)
1. Enhance price oracle API endpoint
2. Update Solana bonding curve to query backend
3. Test end-to-end: Purchase on Solana → All chains update

### Step 4: Production Rollout (Week 4)
1. Deploy to production
2. Monitor sync success rates
3. Add alerting for sync failures

---

## 🎯 Success Criteria

✅ **All chains show the same price** after any transaction  
✅ **Sync completes within 30 seconds** of transaction  
✅ **99%+ sync success rate** across all chains  
✅ **Backend remains single source of truth**  
✅ **Graceful degradation** if backend is unavailable  

---

## 🔍 Monitoring & Debugging

### Metrics to Track:
- Sync success rate per chain
- Sync latency (time from transaction to all chains updated)
- Backend API response times
- GlobalSupplyTracker transaction success rates

### Logging:
- Every sync attempt (chain, success/failure, error message)
- Global supply calculations
- Chain-specific supply updates

### Alerts:
- Sync failure rate > 5%
- Backend API down
- GlobalSupplyTracker transaction failures

---

## 💡 Future Enhancements

1. **Caching Layer**: Redis cache for global supply to reduce database load
2. **WebSocket Updates**: Real-time price updates to frontend
3. **Cross-Chain Messaging**: Use LayerZero/CCIP for EVM chains (optional optimization)
4. **Price Oracle Aggregation**: Chainlink oracles for additional price verification

---

## 📚 Related Files

- `backend/src/services/globalSupply.ts` - Global supply calculation
- `backend/src/services/activePriceSync.ts` - EVM chain sync
- `backend/src/services/autoConfigureBondingCurves.ts` - Bonding curve configuration
- `backend/src/routes/tokens.ts` - Token API endpoints
- `backend/src/routes/transactions.ts` - Transaction recording

---

## ❓ Questions to Resolve

1. **Hedera EVM Compatibility**: Can we use the same GlobalSupplyTracker contract on Hedera?
2. **Solana Bonding Curve**: Do we have a Solana bonding curve program, or is it backend-only?
3. **Update Frequency**: Should we sync on every transaction, or batch updates?
4. **Gas Costs**: How much gas does updating GlobalSupplyTracker cost per chain?

---

## 🎉 Expected Outcome

After implementation:
- ✅ Purchase on Sepolia → All chains (Base, BSC, Hedera, Solana) show updated price
- ✅ Purchase on Hedera → All chains show updated price
- ✅ Purchase on Solana → All chains show updated price
- ✅ Prices stay in sync across all chains automatically
- ✅ No manual sync button needed (but keep it as backup)

