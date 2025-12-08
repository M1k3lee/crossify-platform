# Uniswap v4 Implementation Plan for Crossify.io

## 🎯 Goal
Integrate Uniswap v4 into Crossify while preserving all existing features (Supra, Hedera, cross-chain sync, etc.)

---

## 📋 Phase 0: Backup & Preparation (YOU DO THIS FIRST)

### Step 1: Create Backup

**Run these commands to backup critical files:**

```powershell
# Create backup directory with timestamp
$backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir

# Backup critical directories
Copy-Item -Path "backend" -Destination "$backupDir/backend" -Recurse
Copy-Item -Path "contracts" -Destination "$backupDir/contracts" -Recurse
Copy-Item -Path "frontend" -Destination "$backupDir/frontend" -Recurse
Copy-Item -Path "scripts" -Destination "$backupDir/scripts" -Recurse

# Backup configuration files
Copy-Item -Path "package.json" -Destination "$backupDir/"
Copy-Item -Path "*.md" -Destination "$backupDir/" -Exclude "UNISWAP_V4*.md"

# Backup environment variable templates (if they exist)
if (Test-Path "backend/.env.example") {
    Copy-Item -Path "backend/.env.example" -Destination "$backupDir/backend/"
}
if (Test-Path "contracts/.env.example") {
    Copy-Item -Path "contracts/.env.example" -Destination "$backupDir/contracts/"
}

Write-Host "✅ Backup created in: $backupDir"
```

**Or use the backup script I'll create for you.**

### Step 2: Document Current State

**Before we start, document your current deployment:**

1. **Database Backup** (if using PostgreSQL):
   - Export database schema and data
   - Save to backup directory

2. **Contract Addresses**:
   - Document all deployed contract addresses
   - Save to `$backupDir/CONTRACT_ADDRESSES.md`

3. **Environment Variables**:
   - Export Railway/Vercel environment variables
   - Save to `$backupDir/ENV_VARIABLES.txt` (⚠️ Keep secure!)

4. **Git State**:
   ```bash
   git tag backup-pre-v4-$(date +%Y%m%d)
   git push origin backup-pre-v4-$(date +%Y%m%d)
   ```

---

## 🚀 Phase 1: Research & POC (Safe - No Production Changes)

**Timeline: Week 1-2**  
**Risk Level: ⚪ Low (No production impact)**

### What We'll Do

1. **Set up Uniswap v4 development environment**
2. **Create a simple test hook contract**
3. **Test on testnet only**
4. **No changes to production code**

### Your Tasks

1. ✅ **Review Uniswap v4 documentation**
   - Visit: https://docs.uniswap.org/contracts/v4/overview
   - Understand hooks architecture

2. ✅ **Verify testnet access**
   - Ensure you have Sepolia testnet ETH
   - Testnet RPC URLs are working

3. ✅ **Review the backup** (created in Phase 0)
   - Verify all files are backed up
   - Confirm you can restore if needed

### What I'll Do

1. ✅ Set up v4 development dependencies
2. ✅ Create test hook contract
3. ✅ Test pool creation on testnet
4. ✅ Document findings

**No production code will be touched in this phase.**

---

## 🔧 Phase 2: Hook Development (Testnet Only)

**Timeline: Week 3-4**  
**Risk Level: 🟡 Medium (Testnet only, no production)**

### What We'll Build

**CrossifyGraduationHook** - A custom hook that:
- Integrates with bonding curve system
- Monitors graduation thresholds
- Supports dynamic fees
- Works with cross-chain sync

### Your Tasks

1. ✅ **Review hook design** (I'll provide)
2. ✅ **Approve hook functionality**
3. ✅ **Test on testnet** (I'll provide test scripts)

### What I'll Do

1. ✅ Develop `CrossifyGraduationHook.sol`
2. ✅ Write tests
3. ✅ Deploy to testnet
4. ✅ Test integration with bonding curves

**Still no production changes.**

---

## 🔌 Phase 3: Backend Integration (Additive - Preserves V3)

**Timeline: Week 5-6**  
**Risk Level: 🟡 Medium (Additive changes, V3 still works)**

### Strategy: Add V4 Support Alongside V3

**Key Principle:** V3 continues to work. V4 is an additional option.

### Changes to `dexIntegration.ts`

```typescript
// NEW: Add v4 support
async function createUniswapV4Pool(...) { ... }

// EXISTING: Keep v3 working
async function createUniswapV3Pool(...) { ... } // Still works!

// UPDATED: Choose v3 or v4
export async function createDEXPool(...) {
  // Check if v4 is available and enabled
  if (useV4 && isV4Available(chain)) {
    return await createUniswapV4Pool(...);
  } else {
    // Fallback to v3 (existing code)
    return await createUniswapV3Pool(...);
  }
}
```

### Your Tasks

1. ✅ **Review backend changes** (I'll show you)
2. ✅ **Test on testnet** (I'll provide test endpoints)
3. ✅ **Verify V3 still works** (critical!)

### What I'll Do

1. ✅ Add v4 functions to `dexIntegration.ts`
2. ✅ Add feature flag: `USE_UNISWAP_V4` (default: false)
3. ✅ Update graduation monitor to support v4
4. ✅ Add tests for both v3 and v4
5. ✅ Ensure Supra/Hedera integrations untouched

**V3 remains fully functional. V4 is opt-in via feature flag.**

---

## 🎨 Phase 4: Frontend Updates (Additive)

**Timeline: Week 7-8**  
**Risk Level: 🟢 Low (UI changes only)**

### Changes

- Display v4 pool information
- Show hook-enabled features
- Native ETH support UI
- Gas savings display

### Your Tasks

1. ✅ **Review UI changes** (I'll show preview)
2. ✅ **Test user flow**
3. ✅ **Approve design**

### What I'll Do

1. ✅ Update token graduation UI
2. ✅ Add v4 pool display
3. ✅ Show feature differences (v3 vs v4)
4. ✅ Ensure existing features work

**No breaking changes to existing UI.**

---

## 🧪 Phase 5: Testing & Validation

**Timeline: Week 9-10**  
**Risk Level: 🟢 Low (Testing only)**

### Test Checklist

- [ ] V3 graduation still works
- [ ] V4 graduation works
- [ ] Supra integration unaffected
- [ ] Hedera integration unaffected
- [ ] Cross-chain sync works
- [ ] Price sync works
- [ ] All existing features functional

### Your Tasks

1. ✅ **Run test suite** (I'll provide)
2. ✅ **Test on testnet**
3. ✅ **Verify all features**

### What I'll Do

1. ✅ Comprehensive test suite
2. ✅ Integration tests
3. ✅ Fix any issues found

---

## 🚀 Phase 6: Production Deployment (When V4 Launches)

**Timeline: After Uniswap v4 mainnet launch**  
**Risk Level: 🟡 Medium (Production deployment)**

### Deployment Strategy

1. **Feature Flag**: V4 disabled by default
2. **Gradual Rollout**: Enable for test tokens first
3. **Monitor**: Watch for issues
4. **Full Rollout**: Enable for all after validation

### Your Tasks

1. ✅ **Approve deployment**
2. ✅ **Monitor production**
3. ✅ **Enable feature flag** (when ready)

### What I'll Do

1. ✅ Deploy hook contract to mainnet
2. ✅ Update production backend
3. ✅ Enable feature flag
4. ✅ Monitor and optimize

---

## 🛡️ Safety Guarantees

### What We're NOT Changing

✅ **Supra Integration** - Completely untouched  
✅ **Hedera Integration** - Completely untouched  
✅ **Cross-Chain Sync** - Enhanced, not replaced  
✅ **Price Sync** - Enhanced, not replaced  
✅ **Bonding Curves** - Enhanced, not replaced  
✅ **Existing DEX Graduation** - V3 still works!  
✅ **Database Schema** - No breaking changes  
✅ **API Endpoints** - Backward compatible  

### What We're Adding

➕ **Uniswap v4 support** - New option  
➕ **Custom hooks** - Enhanced features  
➕ **Native ETH** - Better UX  
➕ **Lower gas costs** - Cost savings  

---

## 📊 Progress Tracking

### Current Status

- [ ] Phase 0: Backup & Preparation
- [ ] Phase 1: Research & POC
- [ ] Phase 2: Hook Development
- [ ] Phase 3: Backend Integration
- [ ] Phase 4: Frontend Updates
- [ ] Phase 5: Testing & Validation
- [ ] Phase 6: Production Deployment

---

## 🚨 Rollback Plan

If anything goes wrong:

1. **Immediate**: Disable v4 feature flag
2. **Short-term**: Revert to backup (Phase 0)
3. **Long-term**: Fix issues and retry

**Backup location:** `backup-YYYYMMDD-HHMMSS/`

---

## 📝 Next Steps (For You)

### Right Now (5 minutes)

1. **Run backup script** (I'll create it)
2. **Review this plan**
3. **Confirm you're ready to proceed**

### This Week

1. **Review Phase 1 work** (I'll start it)
2. **Test on testnet** (I'll guide you)
3. **Provide feedback**

---

## ❓ Questions?

- **Q: Will this break existing features?**  
  A: No. V4 is additive. V3, Supra, Hedera all continue working.

- **Q: Can we test safely?**  
  A: Yes. All testing on testnet first. Production only after validation.

- **Q: What if Uniswap v4 is delayed?**  
  A: No problem. We'll have v4 ready, but v3 continues working.

- **Q: How long will this take?**  
  A: ~10-12 weeks total, but we can pause at any phase.

---

**Ready to start? Let me know and I'll begin with Phase 0 (backup) and Phase 1 (POC)!**

