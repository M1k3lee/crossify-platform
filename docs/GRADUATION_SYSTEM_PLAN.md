# DEX Graduation System - Implementation Plan

## Current State

### ✅ What's Already Implemented

1. **Smart Contract Graduation Logic**
   - `BondingCurve.sol` checks graduation threshold during buy transactions
   - When threshold is reached, `_graduate()` is called automatically
   - Sets `isGraduated = true` and emits `Graduated` event
   - Transaction reverts with "Token has graduated. Please use DEX."

2. **Database Support**
   - `token_deployments` table has `is_graduated` field
   - Backend tracks graduation status per chain

3. **Frontend Display**
   - TokenDetail page shows "Graduated" or "On Curve" status
   - Basic graduation status indicators

### ❌ What's Missing

1. **Backend Monitoring Service**
   - No service monitoring for graduation events
   - No automatic Raydium deployment when threshold is reached
   - No real-time graduation status updates

2. **Frontend UX**
   - No progress bar showing % progress to graduation threshold
   - No celebration/confetti when token graduates
   - No real-time updates when graduation happens
   - No DEX pool details display after migration

3. **Raydium Integration**
   - No Raydium pool creation service
   - No automatic liquidity migration
   - No DEX pool address tracking

## Proposed Implementation

### Phase 1: Backend Graduation Monitoring Service

**File: `backend/src/services/graduationMonitor.ts`**

```typescript
/**
 * Monitors tokens for graduation events
 * - Checks market cap vs graduation threshold
 * - Listens for Graduated events from contracts
 * - Triggers Raydium deployment for Solana tokens
 * - Updates database with graduation status
 */

export async function checkGraduationStatus(tokenId: string, chain: string): Promise<{
  isGraduated: boolean;
  currentMarketCap: number;
  graduationThreshold: number;
  progressPercent: number;
  needsGraduation: boolean;
}>

export async function monitorGraduationEvents(): Promise<void>
export function startGraduationMonitoringService(): void
```

**Features:**
- Polls bonding curve contracts every 30 seconds
- Checks if `isGraduated()` returns true
- Calculates current market cap vs threshold
- Triggers Raydium deployment for Solana tokens
- Updates database with graduation status and DEX pool address

### Phase 2: Raydium Integration Service

**File: `backend/src/services/raydiumIntegration.ts`**

```typescript
/**
 * Handles Raydium pool creation and liquidity migration
 * - Creates Raydium pool with bonding curve reserves
 * - Migrates tokens and SOL to pool
 * - Returns pool address for tracking
 */

export async function createRaydiumPool(
  tokenMint: string,
  reserveAmount: bigint,
  tokenAmount: bigint
): Promise<{
  poolAddress: string;
  txHash: string;
  liquidity: bigint;
}>

export async function migrateLiquidityToRaydium(
  tokenId: string,
  chain: string
): Promise<{
  success: boolean;
  poolAddress: string;
  txHash: string;
}>
```

### Phase 3: Frontend Graduation Progress Component

**File: `frontend/src/components/GraduationProgress.tsx`**

```typescript
interface GraduationProgressProps {
  tokenId: string;
  chain: string;
  graduationThreshold: number;
  currentMarketCap: number;
  isGraduated: boolean;
}

export default function GraduationProgress({ ... }: GraduationProgressProps)
```

**Features:**
- Progress bar showing % to threshold
- Real-time market cap updates
- Celebration animation when threshold is reached
- Countdown/ETA to graduation (if possible)

### Phase 4: Celebration Component

**File: `frontend/src/components/GraduationCelebration.tsx`**

```typescript
interface GraduationCelebrationProps {
  isVisible: boolean;
  tokenName: string;
  dexPoolAddress?: string;
  onClose: () => void;
}

export default function GraduationCelebration({ ... }: GraduationCelebrationProps)
```

**Features:**
- Confetti animation using `react-confetti` or `canvas-confetti`
- Congratulations message
- DEX pool address display
- Link to trade on Raydium
- Auto-dismiss after 10 seconds

### Phase 5: Real-time Updates

**Implementation Options:**

1. **Polling (Simpler)**
   - Frontend polls `/tokens/:id/status` every 5 seconds
   - Backend graduation service updates database
   - Frontend detects graduation status change

2. **WebSocket (Better UX)**
   - Backend emits graduation events via WebSocket
   - Frontend subscribes to token-specific channel
   - Instant updates when graduation happens

### Phase 6: DEX Pool Display

**Update `TokenDetail.tsx`:**

- Show Raydium pool address after graduation
- Display pool liquidity and volume
- Link to Raydium for trading
- Show "Trading on Raydium" badge
- Hide bonding curve widget, show DEX trading widget

## User Experience Flow

### Scenario 1: Token Reaches Threshold

1. **User buys tokens** → Market cap approaches threshold
2. **Progress bar updates** → Shows 95%, 98%, 99%...
3. **Threshold reached** → Contract emits `Graduated` event
4. **Backend detects** → Graduation monitoring service triggers
5. **Raydium deployment** → Pool created automatically
6. **Database updated** → `is_graduated = true`, `dex_pool_address` set
7. **Frontend updates** → Real-time status change detected
8. **Celebration shown** → Confetti + congratulations message
9. **Page updates** → Shows DEX pool details, hides bonding curve

### Scenario 2: User Views Graduated Token

1. **Token page loads** → Shows "Graduated" status
2. **DEX pool displayed** → Raydium pool address and stats
3. **Trading widget** → Shows DEX trading interface (or link to Raydium)
4. **No bonding curve** → Curve widget hidden

## API Endpoints Needed

### GET /tokens/:id/graduation-status
```json
{
  "tokenId": "...",
  "chain": "solana",
  "isGraduated": false,
  "currentMarketCap": 45000,
  "graduationThreshold": 50000,
  "progressPercent": 90,
  "estimatedTimeToGraduation": "2 hours" // optional
}
```

### POST /tokens/:id/graduate
```json
{
  "chain": "solana",
  "force": false // Force graduation even if threshold not met
}
```

### GET /tokens/:id/dex-pools
```json
{
  "pools": [
    {
      "chain": "solana",
      "dex": "raydium",
      "poolAddress": "...",
      "liquidity": "100000",
      "volume24h": "50000"
    }
  ]
}
```

## Database Schema Updates

### `token_deployments` table (already has `is_graduated`)
- Add `dex_pool_address` VARCHAR(255) NULL
- Add `dex_name` VARCHAR(50) NULL (e.g., "raydium", "uniswap")
- Add `graduated_at` TIMESTAMP NULL
- Add `graduation_tx_hash` VARCHAR(255) NULL

## Implementation Priority

1. **High Priority:**
   - Backend graduation monitoring service
   - Frontend progress bar
   - Celebration component
   - Real-time status updates (polling)

2. **Medium Priority:**
   - Raydium integration service
   - DEX pool display
   - WebSocket for real-time updates

3. **Low Priority:**
   - ETA calculation for graduation
   - Historical graduation tracking
   - Graduation analytics

## Testing Strategy

1. **Unit Tests:**
   - Graduation threshold calculation
   - Market cap vs threshold comparison
   - Progress percentage calculation

2. **Integration Tests:**
   - Graduation event detection
   - Database updates
   - Raydium pool creation (testnet)

3. **E2E Tests:**
   - Full graduation flow
   - Frontend celebration display
   - DEX pool display after graduation

## Security Considerations

1. **Graduation Verification:**
   - Verify graduation on-chain before updating database
   - Prevent double-graduation
   - Validate Raydium pool creation

2. **Access Control:**
   - Only authorized services can trigger graduation
   - Rate limiting on graduation endpoints
   - Validate token ownership for manual graduation

## Future Enhancements

1. **Multi-DEX Support:**
   - Uniswap V3 for Ethereum
   - PancakeSwap for BSC
   - BaseSwap for Base

2. **Graduation Options:**
   - User choice of DEX
   - Custom liquidity parameters
   - Graduation scheduling

3. **Analytics:**
   - Graduation success rate
   - Time to graduation statistics
   - Post-graduation performance tracking

