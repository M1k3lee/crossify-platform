# Uniswap v4 Development Environment Setup

## Current Status: Pre-Mainnet

**Note:** Uniswap v4 is currently in development. This setup prepares for integration when v4 launches on mainnet.

---

## Phase 1: Development Environment Setup

### Step 1: Install Uniswap v4 Dependencies

**For Contracts (`contracts/` directory):**

```bash
cd contracts
npm install --save-dev @uniswap/v4-core @uniswap/v4-periphery
```

**Note:** If packages aren't published yet, we'll use:
- Direct GitHub installation
- Or local development setup

### Step 2: Update Hardhat Config

We'll add v4-specific compiler settings to `hardhat.config.ts`.

### Step 3: Create Hook Development Structure

```
contracts/
├── contracts/
│   ├── v4/
│   │   ├── hooks/
│   │   │   └── CrossifyGraduationHook.sol
│   │   └── interfaces/
│   │       └── ICrossifyHook.sol
│   └── [existing contracts - untouched]
├── scripts/
│   └── v4/
│       ├── deploy-hook.ts
│       └── test-hook.ts
└── test/
    └── v4/
        └── CrossifyHook.test.ts
```

---

## Development Approach

### Option A: Use Uniswap v4 Testnet (When Available)

1. Deploy hook to v4 testnet
2. Test pool creation
3. Test graduation flow

### Option B: Local Development (Current)

1. Use Foundry/Hardhat for local testing
2. Mock v4 contracts for development
3. Test hook logic independently

### Option C: Wait for Mainnet Launch

1. Prepare all code
2. Test thoroughly on testnet
3. Deploy when v4 launches

---

## Next Steps

1. **You:** Run backup script
2. **Me:** Set up development environment
3. **Together:** Test on testnet when ready

---

**Status:** Ready to begin setup when you confirm backup is complete.

