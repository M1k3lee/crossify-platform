# Cross-Chain Price Synchronization Architecture

## Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-CHAIN PRICE SYNCHRONIZATION                         │
│                    (Virtual Liquidity System)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  ETHEREUM    │     │     BSC      │     │     BASE     │     │   SOLANA     │     │   HEDERA     │
│   Chain      │     │    Chain     │     │    Chain     │     │    Chain     │     │    Chain     │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────┤
│              │     │              │     │              │     │              │
│ BondingCurve │     │ BondingCurve │     │ BondingCurve │     │ BondingCurve │
│ Contract     │     │ Contract     │     │ Contract     │     │ Contract     │
│              │     │              │     │              │     │              │
│ Local Supply │     │ Local Supply │     │ Local Supply │     │ Local Supply │     │ Local Supply │
│ = 1,000      │     │ = 500        │     │ = 300        │     │ = 200        │     │ = 100        │
│              │     │              │     │              │     │              │     │              │
│ Price Query  │     │ Price Query  │     │ Price Query  │     │ Price Query  │     │ Price Query  │
│      │       │     │      │       │     │      │       │     │      │       │     │      │       │
│      │       │     │      │       │     │      │       │     │      │       │     │      │       │
│      ▼       │     │      ▼       │     │      ▼       │     │      ▼       │     │      ▼       │
│   Query      │     │   Query      │     │   Query      │     │   Query      │     │   Query      │
│   Global     │     │   Global     │     │   Global     │     │   Global     │     │   Global     │
│   Supply     │     │   Supply     │     │   Supply     │     │   Supply     │     │   Supply     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │                    │
       │                    │                    │                    │                    │
       └────────────────────┼────────────────────┼────────────────────┼────────────────────┘
                            │                    │
                            ▼                    │
              ┌─────────────────────────────────────┐
              │   GLOBAL SUPPLY TRACKER              │
              │   (Backend Database Service)         │
              ├─────────────────────────────────────┤
              │                                     │
              │  Global Supply = Sum of All Chains │
              │  = 1,000 + 500 + 300 + 200 + 100   │
              │  = 2,100 tokens                     │
              │                                     │
              │  Price Formula:                     │
              │  price = basePrice + (slope ×       │
              │                     globalSupply)   │
              │                                     │
              │  Example:                           │
              │  basePrice = $0.001                 │
              │  slope = $0.0001 per token          │
              │  globalSupply = 2,100               │
              │  price = $0.001 + ($0.0001 × 2100) │
              │  price = $0.001 + $0.21            │
              │  price = $0.211 per token          │
              │                                     │
              └─────────────────────────────────────┘
                            │
                            │ Returns: globalSupply = 2,100
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  ETHEREUM    │     │     BSC      │     │     BASE     │     │   SOLANA     │     │   HEDERA     │
│              │     │              │     │              │     │              │     │              │
│ Price =      │     │ Price =      │     │ Price =      │     │ Price =      │     │ Price =      │
│ $0.211       │     │ $0.211       │     │ $0.211       │     │ $0.211       │     │ $0.211       │
│              │     │              │     │              │     │              │     │              │
│ (Same on     │     │ (Same on     │     │ (Same on     │     │ (Same on     │     │ (Same on     │
│  all chains) │     │  all chains) │     │  all chains) │     │  all chains) │     │  all chains) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

## Purchase Flow: User Buys on Ethereum

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: User initiates purchase on Ethereum                                │
└─────────────────────────────────────────────────────────────────────────────┘

         User
           │
           │ buy(500 tokens)
           ▼
    ┌──────────────┐
    │  ETHEREUM    │
    │ BondingCurve │
    │              │
    │ 1. Calculate │
    │    price using│
    │    globalSupply│
    │    (2,000)   │
    │              │
    │ 2. Execute   │
    │    purchase  │
    │              │
    │ 3. Update    │
    │    localSupply│
    │    += 500    │
    │    (now 1,500)│
    └──────┬───────┘
           │
           │ Emit event: SupplyUpdated(500)
           ▼
    ┌─────────────────────────────────────┐
    │   GLOBAL SUPPLY TRACKER              │
    │   (Backend Service)                  │
    ├─────────────────────────────────────┤
    │                                     │
    │  Receives update from Ethereum      │
    │                                     │
    │  Old:                               │
    │    Ethereum: 1,000                  │
    │    BSC:       500                   │
    │    Base:      300                   │
    │    Solana:    200                   │
    │    ─────────────────                │
    │    Global:   2,000                  │
    │                                     │
    │  New:                               │
    │    Ethereum: 1,500  ← Updated       │
    │    BSC:       500                   │
    │    Base:      300                   │
    │    Solana:    200                   │
    │    ─────────────────                │
    │    Global:   2,500  ← Recalculated │
    │                                     │
    │  Triggers: syncPriceAcrossChains()  │
    └──────┬──────────────────────────────┘
           │
           │ Broadcasts new globalSupply = 2,500
           │
    ┌──────┴──────────────────────────────┐
    │                                      │
    ▼                                      ▼
┌──────────────┐                   ┌──────────────┐
│  ETHEREUM    │                   │     BSC      │
│              │                   │              │
│ Price =      │                   │ Price =      │
│ $0.001 +     │                   │ $0.001 +     │
│ ($0.0001 ×   │                   │ ($0.0001 ×   │
│  2,500)      │                   │  2,500)      │
│ = $0.251     │                   │ = $0.251     │
│              │                   │              │
│ ✅ Synced!   │                   │ ✅ Synced!   │
└──────────────┘                   └──────────────┘
           │                                      │
           │                                      │
    ┌──────┴──────────────────────────────┐
    │                                      │
    ▼                                      ▼
┌──────────────┐                   ┌──────────────┐
│     BASE     │                   │   SOLANA     │
│              │                   │              │
│ Price =      │                   │ Price =      │
│ $0.001 +     │                   │ $0.001 +     │
│ ($0.0001 ×   │                   │ ($0.0001 ×   │
│  2,500)      │                   │  2,500)      │
│ = $0.251     │                   │ = $0.251     │
│              │                   │              │
│ ✅ Synced!   │                   │ ✅ Synced!   │
└──────────────┘                   └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  RESULT: All chains now show the same price ($0.261)                        │
│  Price increased on ALL chains (Ethereum, BSC, Base, Solana, Hedera)!       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Price Monitoring & Deviation Detection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRICE MONITORING SERVICE (Runs every 5 minutes)                            │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────┐
    │   Price Monitor Service              │
    │   (monitorAndSyncPrices)             │
    ├─────────────────────────────────────┤
    │                                     │
    │  1. Fetch prices from all chains    │
    │     ┌─────────┬─────────┬─────────┐ │
    │     │ Ethereum│   BSC   │  Base   │ │
    │     │ $0.251  │ $0.251  │ $0.251  │ │
    │     └─────────┴─────────┴─────────┘ │
    │                                     │
    │  2. Calculate average price         │
    │     avg = ($0.251 + $0.251 + $0.251) / 3
    │     avg = $0.251                    │
    │                                     │
    │  3. Calculate deviations             │
    │     Ethereum: |$0.251 - $0.251| = 0%│
    │     BSC:      |$0.251 - $0.251| = 0%│
    │     Base:     |$0.251 - $0.251| = 0%│
    │                                     │
    │  4. Check threshold (1% default)    │
    │     Max deviation = 0% < 1%          │
    │     ✅ No sync needed                │
    │                                     │
    └─────────────────────────────────────┘

    ┌─────────────────────────────────────┐
    │   IF DEVIATION DETECTED (>1%)       │
    ├─────────────────────────────────────┤
    │                                     │
    │  Example:                           │
    │  Ethereum: $0.261                   │
    │  BSC:      $0.258  ← 1.2% lower    │
    │  Base:     $0.261                   │
    │  Solana:   $0.261                   │
    │  Hedera:   $0.261                   │
    │                                     │
    │  ⚠️ Deviation detected!             │
    │                                     │
    │  Action: syncPrices()               │
    │  - Rebalance liquidity              │
    │  - Adjust pool balances             │
    │  - Restore price parity             │
    │                                     │
    └─────────────────────────────────────┘
```

## Key Components

### 1. Global Supply Tracker (`globalSupply.ts`)
```
┌─────────────────────────────────────┐
│  updateGlobalSupply()               │
│  - Updates chain-specific supply    │
│  - Recalculates global total        │
│  - Triggers price sync              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  getGlobalSupply()                  │
│  - Returns: SUM(all chain supplies) │
│  - Used by all chains for pricing   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  calculatePriceWithGlobalSupply()   │
│  - Formula: basePrice + (slope ×    │
│             globalSupply)            │
│  - Returns unified price            │
└─────────────────────────────────────┘
```

### 2. Bonding Curve Contract (`BondingCurve.sol`)
```solidity
function getCurrentPrice() public view returns (uint256) {
    uint256 globalSupply = globalSupplyTracker.getGlobalSupply(token);
    uint256 supplyInTokens = globalSupply / 1 ether;
    return basePrice + (slope * supplyInTokens);
}
```

### 3. Price Sync Service (`unifiedLiquidity.ts`)
```
┌─────────────────────────────────────┐
│  getAllChainPrices()                │
│  - Fetches price from each chain    │
│  - Uses global supply for pricing   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  needsPriceSync()                   │
│  - Checks deviation threshold        │
│  - Returns true if > 1% variance    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  syncPrices()                       │
│  - Rebalances liquidity pools       │
│  - Adjusts reserves                 │
│  - Restores price parity            │
└─────────────────────────────────────┘
```

## Mathematical Formula

```
┌─────────────────────────────────────────────────────────────┐
│  PRICE CALCULATION FORMULA                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Global Supply = Σ(supplySold on each chain)                │
│                                                              │
│  Price = basePrice + (slope × Global Supply)                │
│                                                              │
│  Where:                                                      │
│    basePrice = Initial price per token (e.g., $0.001)       │
│    slope = Price increase per token sold (e.g., $0.0001)    │
│    Global Supply = Sum of tokens sold across ALL chains     │
│                                                              │
│  Example:                                                    │
│    basePrice = $0.001                                        │
│    slope = $0.0001 per token                                 │
│    Global Supply = 2,000 tokens                             │
│                                                              │
│    Price = $0.001 + ($0.0001 × 2,000)                       │
│    Price = $0.001 + $0.20                                    │
│    Price = $0.201 per token                                  │
│                                                              │
│  ✅ This price is the SAME on all chains!                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│  COMPLETE DATA FLOW                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User buys tokens on Chain A                             │
│     │                                                        │
│  2. BondingCurve updates local supply on Chain A            │
│     │                                                        │
│  3. Event emitted: SupplyUpdated(amount)                    │
│     │                                                        │
│  4. Backend receives event                                  │
│     │                                                        │
│  5. updateGlobalSupply() called                             │
│     - Updates Chain A supply in database                     │
│     - Recalculates: Global = Σ(all chains)                  │
│     │                                                        │
│  6. syncPriceAcrossChains() called                          │
│     - Calculates new price using global supply               │
│     - Updates market cap for all deployments                 │
│     │                                                        │
│  7. All chains query getGlobalSupply()                      │
│     - Returns same global supply value                       │
│     │                                                        │
│  8. All chains calculate price using same formula            │
│     - Price = basePrice + (slope × globalSupply)            │
│     │                                                        │
│  9. ✅ All chains show identical price!                      │
│                                                              │
│  10. Price Monitor (every 5 min)                            │
│      - Checks for deviations                                 │
│      - Triggers rebalancing if needed                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Price Consistency: Same price on all chains              │
│  ✅ No Arbitrage: No profit from price differences          │
│  ✅ Virtual Liquidity: Efficient capital usage               │
│  ✅ Better UX: Users get fair price regardless of chain      │
│  ✅ Real-time Sync: Prices update within seconds             │
│  ✅ Automatic Monitoring: Detects and fixes deviations       │
└─────────────────────────────────────────────────────────────┘
```


