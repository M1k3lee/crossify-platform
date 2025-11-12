# Cross-Chain DEX Graduation Architecture

## Overview

This document outlines the architecture for handling DEX graduation for cross-chain tokens. The system must gracefully handle:
- Single-chain tokens (e.g., Solana-only → Raydium)
- Multi-chain tokens (e.g., Solana + Ethereum + BSC + Base → Raydium + Uniswap + PancakeSwap + BaseSwap)
- Partial failures (some chains succeed, others fail)
- Chain-specific DEX requirements

## Design Principles

### 1. **Cross-Chain Coordination (Price Consistency)**
For **cross-chain tokens** (cross_chain_enabled = true), ALL chains graduate **simultaneously** when ANY chain hits the threshold. This ensures:
- **Price consistency**: All chains move from bonding curve to DEX at the same time
- **No price divergence**: Prevents one chain being on DEX while others are on bonding curve
- **Maintains selling point**: "Same price across all chains" remains true after graduation

### 2. **Independent Per-Chain Graduation (Single-Chain Tokens)**
For **single-chain tokens**, each chain graduates **independently** when its own market cap reaches the threshold. This ensures:
- Natural progression per chain
- No artificial delays
- Better user experience (tokens graduate as they grow)

### 2. **Parallel Execution**
When multiple chains are ready for graduation, execute them **in parallel** for speed:
- Faster overall graduation time
- Better resource utilization
- Reduced risk of state inconsistencies

### 3. **Chain-Specific Liquidity**
Each chain uses its **own reserve balance** for DEX pool creation:
- Solana uses SOL reserve → Raydium pool
- Ethereum uses ETH reserve → Uniswap V3 pool
- BSC uses BNB reserve → PancakeSwap pool
- Base uses ETH reserve → BaseSwap/Uniswap V3 pool

### 4. **Failure Isolation**
Failures on one chain **do not block** other chains:
- Track success/failure per chain
- Retry failed chains independently
- Maintain partial graduation state

### 5. **State Consistency**
Track graduation status **per chain** in the database:
- `is_graduated` per deployment (already exists)
- `dex_pool_address` per chain
- `graduation_tx_hash` per chain
- `graduated_at` timestamp per chain

## Architecture Flow

### Single-Chain Token Graduation

```
Token (Solana-only)
  ↓
Market Cap Check (Solana)
  ↓
Threshold Reached?
  ↓ Yes
Create Raydium Pool
  ↓
Update Database (is_graduated = true, dex_pool_address, etc.)
```

### Cross-Chain Token Graduation (Coordinated)

```
Token (Solana + Ethereum + BSC + Base) [cross_chain_enabled = true]
  ↓
Monitor All Chains in Parallel
  ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Solana    │  Ethereum   │     BSC     │    Base     │
│ Market Cap  │ Market Cap  │ Market Cap  │ Market Cap  │
│   $60,000   │   $45,000   │   $55,000   │   $30,000   │
└─────────────┴─────────────┴─────────────┴─────────────┘
  ↓              ↓              ↓              ↓
Threshold?    Threshold?    Threshold?    Threshold?
  ✅ YES        ❌ NO          ✅ YES        ❌ NO
  ↓
ANY CHAIN READY? → YES (Solana hit threshold)
  ↓
🌐 COORDINATED GRADUATION: Graduate ALL chains simultaneously
  ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Solana    │  Ethereum   │     BSC     │    Base     │
│  → Raydium  │ → Uniswap   │ → Pancake   │ → BaseSwap  │
│  (ready)    │ (coordinated)│ (ready)     │ (coordinated)│
└─────────────┴─────────────┴─────────────┴─────────────┘
  ↓              ↓              ↓              ↓
Update DB     Update DB     Update DB     Update DB
✅ All chains graduate together → Price consistency maintained!
```

## Implementation Strategy

### Phase 1: Enhanced Monitoring
- Check all chains for a token simultaneously
- Identify which chains are ready for graduation
- **For cross-chain tokens**: If ANY chain is ready, mark ALL chains for graduation
- **For single-chain tokens**: Only graduate chains that hit threshold

### Phase 2: Coordinated Parallel Graduation
- **Cross-chain tokens**: Execute DEX pool creation for ALL chains in parallel (coordinated)
- **Single-chain tokens**: Execute DEX pool creation for eligible chains only
- Use Promise.allSettled() for concurrent execution
- Track results per chain

### Phase 3: Error Handling
- Retry failed graduations with exponential backoff
- Log detailed error information per chain
- Update database only for successful graduations

### Phase 4: State Management
- Track graduation status per chain
- Support partial graduation (some chains graduated, others not)
- Provide clear status in API responses

## Chain-to-DEX Mapping

| Chain | DEX | Native Token | Pool Type |
|-------|-----|--------------|-----------|
| Solana | Raydium | SOL | AMM Pool |
| Ethereum | Uniswap V3 | WETH | V3 Pool (0.3% fee) |
| BSC | PancakeSwap | WBNB | V2 Pair |
| Base | BaseSwap/Uniswap V3 | WETH | V3 Pool (0.3% fee) |

## Database Schema

The existing `token_deployments` table already supports per-chain graduation:

```sql
token_deployments (
  id,
  token_id,
  chain,                    -- Chain identifier
  is_graduated,             -- Per-chain graduation status
  dex_pool_address,         -- Per-chain DEX pool address
  dex_name,                 -- Per-chain DEX name
  graduated_at,             -- Per-chain graduation timestamp
  graduation_tx_hash,       -- Per-chain graduation transaction
  ...
)
```

## Error Scenarios & Handling

### Scenario 1: Partial Success
**Problem**: Solana and Ethereum graduate successfully, but BSC fails.

**Solution**:
- Mark Solana and Ethereum as graduated in database
- Log BSC failure with error details
- Retry BSC graduation in next monitoring cycle
- API shows partial graduation status

### Scenario 2: Network Failure
**Problem**: Temporary network issue prevents graduation.

**Solution**:
- Retry with exponential backoff (1s, 2s, 4s, 8s)
- Maximum 3 retries per chain
- Log all retry attempts
- Continue monitoring other chains

### Scenario 3: Insufficient Liquidity
**Problem**: Chain has low reserve balance for DEX pool.

**Solution**:
- Check reserve balance before attempting graduation
- Require minimum liquidity threshold
- Log warning if below threshold
- Skip graduation until sufficient liquidity

### Scenario 4: DEX Integration Failure
**Problem**: DEX SDK/API is unavailable or returns error.

**Solution**:
- Graceful error handling per DEX
- Return detailed error message
- Mark as "graduation_pending" in database
- Retry in next cycle

## API Response Format

```json
{
  "tokenId": "abc-123",
  "graduationStatus": {
    "solana": {
      "isGraduated": true,
      "dexName": "raydium",
      "poolAddress": "0x...",
      "graduatedAt": "2025-11-12T10:00:00Z"
    },
    "ethereum": {
      "isGraduated": false,
      "needsGraduation": true,
      "currentMarketCap": 45000,
      "threshold": 50000,
      "progressPercent": 90
    },
    "bsc": {
      "isGraduated": true,
      "dexName": "pancakeswap",
      "poolAddress": "0x...",
      "graduatedAt": "2025-11-12T09:30:00Z"
    },
    "base": {
      "isGraduated": false,
      "needsGraduation": false,
      "currentMarketCap": 30000,
      "threshold": 50000,
      "progressPercent": 60
    }
  }
}
```

## Monitoring & Logging

### Logging Strategy
- **Info**: Graduation attempts, successes
- **Warn**: Partial failures, retries
- **Error**: Complete failures, critical errors

### Metrics to Track
- Graduation success rate per chain
- Average graduation time per chain
- Retry count per chain
- Partial graduation rate (cross-chain tokens)

## Why Coordinated Graduation for Cross-Chain Tokens?

### The Problem
If cross-chain tokens graduate independently:
- **Chain A** graduates → Price now from DEX pool (e.g., $0.50)
- **Chain B** still on bonding curve → Price from curve (e.g., $0.45)
- **Result**: Price divergence! The "same price across chains" selling point is broken

### The Solution
Graduate ALL chains simultaneously:
- **All chains** move from bonding curve to DEX at the same time
- **Price consistency** maintained throughout graduation
- **Selling point preserved**: "Same price across all chains" remains true

### Trade-offs
- **Pro**: Maintains price consistency (critical for cross-chain value prop)
- **Pro**: Better user experience (all chains graduate together)
- **Con**: Some chains may graduate before hitting individual threshold
- **Mitigation**: Only applies to cross-chain tokens; single-chain tokens still graduate independently

## Future Enhancements

1. **Liquidity Rebalancing**: Before coordinated graduation, rebalance liquidity across chains if needed
2. **Graduation Notifications**: Alert users when their tokens graduate
3. **Graduation Analytics**: Track graduation patterns and optimize thresholds
4. **Graduation Preview**: Show users which chains will graduate before execution

