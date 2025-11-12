# Cross-Chain DEX Graduation Architecture

## Overview

This document outlines the architecture for handling DEX graduation for cross-chain tokens. The system must gracefully handle:
- Single-chain tokens (e.g., Solana-only → Raydium)
- Multi-chain tokens (e.g., Solana + Ethereum + BSC + Base → Raydium + Uniswap + PancakeSwap + BaseSwap)
- Partial failures (some chains succeed, others fail)
- Chain-specific DEX requirements

## Design Principles

### 1. **Independent Per-Chain Graduation**
Each chain graduates **independently** when its own market cap reaches the threshold. This ensures:
- Natural progression per chain
- No artificial delays waiting for other chains
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

### Cross-Chain Token Graduation

```
Token (Solana + Ethereum + BSC + Base)
  ↓
Monitor All Chains in Parallel
  ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Solana    │  Ethereum   │     BSC     │    Base     │
│ Market Cap  │ Market Cap  │ Market Cap  │ Market Cap  │
└─────────────┴─────────────┴─────────────┴─────────────┘
  ↓              ↓              ↓              ↓
Threshold?    Threshold?    Threshold?    Threshold?
  ↓              ↓              ↓              ↓
Yes → Raydium  Yes → Uniswap  Yes → Pancake  Yes → BaseSwap
  ↓              ↓              ↓              ↓
Update DB     Update DB     Update DB     Update DB
```

## Implementation Strategy

### Phase 1: Enhanced Monitoring
- Check all chains for a token simultaneously
- Identify which chains are ready for graduation
- Group eligible chains for parallel execution

### Phase 2: Parallel Graduation
- Execute DEX pool creation for all eligible chains in parallel
- Use Promise.all() or Promise.allSettled() for concurrent execution
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

## Future Enhancements

1. **Graduation Coordination Mode**: Option to graduate all chains simultaneously when first chain hits threshold
2. **Liquidity Rebalancing**: Before graduation, rebalance liquidity across chains if needed
3. **Graduation Notifications**: Alert users when their tokens graduate
4. **Graduation Analytics**: Track graduation patterns and optimize thresholds

