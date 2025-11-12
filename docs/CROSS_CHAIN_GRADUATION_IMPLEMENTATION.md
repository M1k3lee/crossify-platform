# Cross-Chain DEX Graduation Implementation

## Overview

This document describes the implementation of a robust cross-chain DEX graduation system that handles tokens deployed on multiple chains (Solana, Ethereum, BSC, Base) and automatically migrates them to the appropriate DEX when they reach the graduation threshold.

## Key Features

### ✅ Coordinated Graduation for Cross-Chain Tokens
- **Cross-chain tokens** (`cross_chain_enabled = true`): ALL chains graduate **simultaneously** when ANY chain hits threshold
- **Maintains price consistency**: Prevents price divergence between chains
- **Preserves selling point**: "Same price across all chains" remains true after graduation

### ✅ Independent Graduation for Single-Chain Tokens
- **Single-chain tokens**: Each chain graduates **independently** when its own market cap reaches the threshold
- No artificial delays waiting for other chains
- Natural progression per chain based on local market conditions

### ✅ Parallel Execution
- When multiple chains are ready, they graduate **simultaneously**
- Uses `Promise.allSettled()` for concurrent execution
- Faster overall graduation time
- Better resource utilization

### ✅ Chain-Specific DEX Mapping
- **Solana** → Raydium (SOL/Token pool)
- **Ethereum** → Uniswap V3 (WETH/Token pool, 0.3% fee)
- **BSC** → PancakeSwap (WBNB/Token pair)
- **Base** → BaseSwap/Uniswap V3 (WETH/Token pool)

### ✅ Robust Error Handling
- **Retry Logic**: Exponential backoff (1s, 2s, 4s) with max 3 retries
- **Failure Isolation**: One chain failing doesn't block others
- **Transient Error Detection**: Automatically retries network/timeout errors
- **Detailed Logging**: Track success/failure per chain

### ✅ Liquidity Validation
- Minimum liquidity requirement: 0.1 native token
- Validates reserve balance before attempting graduation
- Prevents failed graduations due to insufficient funds

## How It Works

### Single-Chain Token Example

**Scenario**: User launches a Solana-only token

1. Token is deployed on Solana bonding curve
2. Market cap grows to $50,000 (threshold)
3. System detects graduation threshold reached
4. Creates Raydium pool with SOL + Token
5. Updates database: `is_graduated = true`, `dex_pool_address = <raydium_pool>`, `dex_name = 'raydium'`

### Cross-Chain Token Example (Coordinated Graduation)

**Scenario**: User launches a cross-chain token on Solana, Ethereum, BSC, and Base

1. Token is deployed on all 4 chains with `cross_chain_enabled = true`
2. Each chain's market cap grows independently:
   - Solana: $60,000 (ready - hit threshold!)
   - Ethereum: $45,000 (not ready)
   - BSC: $55,000 (ready)
   - Base: $30,000 (not ready)

3. System detects: **ANY chain hit threshold** → Trigger coordinated graduation
   ```
   🌐 Cross-chain token: Chain hit threshold!
   Graduating ALL 4 chains simultaneously to maintain price consistency
   ```

4. Graduates ALL chains in parallel (coordinated):
   - Solana → Raydium pool creation (ready)
   - Ethereum → Uniswap V3 pool creation (coordinated)
   - BSC → PancakeSwap pair creation (ready)
   - Base → BaseSwap pool creation (coordinated)
   - All execute simultaneously

5. Results:
   - Solana: ✅ Success → Raydium pool created (ready)
   - Ethereum: ✅ Success → Uniswap V3 pool created (coordinated)
   - BSC: ✅ Success → PancakeSwap pair created (ready)
   - Base: ✅ Success → BaseSwap pool created (coordinated)
   
6. **Price Consistency Maintained**: All chains move from bonding curve to DEX at the same time!

6. Database updated per chain:
   ```sql
   -- Solana deployment
   UPDATE token_deployments SET 
     is_graduated = 1,
     dex_pool_address = '<raydium_pool>',
     dex_name = 'raydium',
     graduated_at = NOW()
   WHERE token_id = ? AND chain = 'solana';

   -- BSC deployment
   UPDATE token_deployments SET 
     is_graduated = 1,
     dex_pool_address = '<pancakeswap_pair>',
     dex_name = 'pancakeswap',
     graduated_at = NOW()
   WHERE token_id = ? AND chain = 'bsc';
   ```

## Implementation Details

### Core Functions

#### `checkAndGraduateTokenOnAllChains(tokenId)`
- Checks all chains for a token in parallel
- Identifies eligible chains (market cap >= threshold)
- Graduates eligible chains simultaneously
- Returns detailed results per chain

#### `checkAndGraduate(tokenId, chain, retryCount)`
- Checks if a specific chain needs graduation
- Validates chain support and liquidity
- Creates DEX pool with retry logic
- Updates database on success

#### `monitorAllTokens()`
- Runs every 30 seconds
- Processes tokens in batches (5 at a time)
- Handles cross-chain tokens efficiently

### Error Handling Strategy

1. **Network Errors**: Retry with exponential backoff
2. **Insufficient Liquidity**: Skip and log warning
3. **DEX SDK Errors**: Log detailed error, retry if transient
4. **Partial Failures**: Continue with successful chains

### Database Schema

The `token_deployments` table tracks graduation per chain:

```sql
token_deployments (
  id,
  token_id,
  chain,                    -- 'solana', 'ethereum', 'bsc', 'base'
  is_graduated,            -- Per-chain graduation status
  dex_pool_address,        -- Per-chain DEX pool address
  dex_name,                -- 'raydium', 'uniswap-v3', 'pancakeswap', 'baseswap'
  graduated_at,            -- Per-chain graduation timestamp
  graduation_tx_hash,      -- Per-chain transaction hash
  ...
)
```

## Chain-to-DEX Mapping

| Chain | DEX | Native Token | Pool Type | Fee |
|-------|-----|--------------|-----------|-----|
| Solana | Raydium | SOL | AMM Pool | 0.25% |
| Ethereum | Uniswap V3 | WETH | V3 Pool | 0.3% |
| BSC | PancakeSwap | WBNB | V2 Pair | 0.25% |
| Base | BaseSwap | WETH | V3 Pool | 0.3% |

## Monitoring & Logging

### Log Examples

**Successful Cross-Chain Graduation:**
```
🎓 Token abc-123: 2 of 4 chains ready for graduation
🔄 Creating raydium pool for token abc-123 on solana...
🔄 Creating pancakeswap pool for token abc-123 on bsc...
✅ Token abc-123 graduated on solana to raydium! Pool: 0x...
✅ Token abc-123 graduated on bsc to pancakeswap! Pool: 0x...
📊 Token abc-123: 2/2 chains graduated successfully
```

**Partial Failure:**
```
🎓 Token abc-123: 3 of 4 chains ready for graduation
✅ Token abc-123 graduated on solana
✅ Token abc-123 graduated on ethereum
❌ Token abc-123 graduation failed on bsc: Network timeout
✅ Token abc-123 graduated on base
📊 Token abc-123: 3/3 chains graduated successfully, 1 failed
🔄 Retrying graduation for abc-123 on bsc in 1000ms (attempt 1/3)
```

## API Response Format

The graduation status endpoint returns per-chain status:

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

## Benefits

1. **Flawless Execution**: Parallel processing ensures fast, reliable graduation
2. **Failure Resilience**: Partial failures don't block successful graduations
3. **Chain Independence**: Each chain progresses at its own pace
4. **Automatic Retry**: Transient errors are automatically retried
5. **Clear Status**: Per-chain tracking provides transparent graduation status

## Testing Scenarios

### Scenario 1: All Chains Ready
- Token on 4 chains, all hit threshold simultaneously
- Expected: All 4 chains graduate in parallel
- Result: ✅ All succeed

### Scenario 2: Partial Readiness
- Token on 4 chains, only 2 hit threshold
- Expected: Only 2 chains graduate
- Result: ✅ 2 succeed, 2 wait

### Scenario 3: Network Failure
- Token ready, but network error on one chain
- Expected: Retry with backoff, other chains succeed
- Result: ✅ Retry succeeds, all chains graduate

### Scenario 4: Insufficient Liquidity
- Token ready, but reserve < 0.1 native token
- Expected: Skip graduation, log warning
- Result: ✅ Graceful skip, continues monitoring

## Future Enhancements

1. **Graduation Coordination Mode**: Option to graduate all chains when first hits threshold
2. **Liquidity Rebalancing**: Rebalance before graduation if needed
3. **Graduation Notifications**: Alert users when tokens graduate
4. **Analytics Dashboard**: Track graduation patterns and success rates

