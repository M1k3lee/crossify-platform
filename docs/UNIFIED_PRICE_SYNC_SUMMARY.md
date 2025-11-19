# Unified Price Sync: Quick Summary

## 🎯 The Solution

**Backend Database = Single Source of Truth**

All chains (EVM, Hedera, Solana) get their prices from the backend database, which already tracks supply for ALL chains.

---

## 🔄 How It Works

```
Transaction on ANY chain
    ↓
Backend updates database
    ↓
Backend calculates global supply (sum of all chains)
    ↓
Backend syncs to ALL chains:
    ├─ EVM: Update GlobalSupplyTracker contracts
    ├─ Hedera: Update Hedera GlobalSupplyTracker (EVM-compatible)
    └─ Solana: Price oracle API (backend provides price)
    ↓
All chains show same price ✅
```

---

## 📝 Key Changes Needed

### 1. **Backend Sync Service** (NEW)
- Read global supply from **backend database** (not from contracts)
- Update all chain trackers with backend-calculated supply
- Works for EVM + Hedera + Solana

### 2. **Hedera Support** (MODIFY)
- Add Hedera to `getChainConfig()` in `activePriceSync.ts`
- Treat Hedera like EVM (it has EVM compatibility)

### 3. **Solana Price Oracle** (ENHANCE)
- Enhance `GET /tokens/:id/price-oracle` endpoint
- Solana bonding curve queries backend for price
- Backend returns price based on global supply

### 4. **Transaction Flow** (MODIFY)
- When transaction recorded → trigger unified sync
- Sync to ALL chains, not just EVM

---

## ✅ Benefits

- ✅ Works for ALL chains (EVM + Hedera + Solana)
- ✅ Single source of truth (backend database)
- ✅ No complex cross-chain messaging needed
- ✅ Backend already has the infrastructure
- ✅ Graceful degradation if backend is down

---

## 🚀 Implementation Priority

1. **Phase 1**: Backend-first sync for EVM chains (1-2 days)
2. **Phase 2**: Add Hedera support (1 day)
3. **Phase 3**: Solana price oracle API (1-2 days)
4. **Phase 4**: Testing & production rollout (2-3 days)

**Total: ~1 week**

---

## 📚 Full Plan

See `docs/UNIFIED_PRICE_SYNC_PLAN.md` for detailed architecture, code examples, and implementation checklist.

