// Unified Liquidity Pool Service
// This service maintains price consistency across multiple chains by:
// 1. Monitoring prices on each chain
// 2. Detecting price deviations
// 3. Triggering arbitrage or rebalancing when thresholds are exceeded

import { dbAll, dbGet, dbRun } from '../db';
import { getBlockchainService } from './blockchain';

interface ChainPrice {
  chain: string;
  tokenAddress: string;
  poolAddress: string;
  price: number; // Price in USD or native token
  balance: string; // Token balance in pool
  reserve: string; // Native token reserve (ETH/BNB)
  timestamp: number;
}

interface PriceDeviation {
  chain: string;
  deviation: number; // Percentage deviation from average
  price: number;
  avgPrice: number;
}

/**
 * Get current price for a token on a specific chain
 */
export async function getChainPrice(
  tokenId: string,
  chain: string
): Promise<ChainPrice | null> {
  try {
    // Get deployment info
    const deployment = await dbGet(
      `SELECT token_address, pool_address, curve_address, reserve_balance, current_supply
       FROM token_deployments
       WHERE token_id = ? AND chain = ?`,
      [tokenId, chain]
    ) as any;

    if (!deployment || !deployment.token_address) {
      return null;
    }

    // Get blockchain service
    const service = getBlockchainService(chain);
    if (!service) {
      return null;
    }

    // Get pool balance and reserve from blockchain
    // For bonding curve with VIRTUAL LIQUIDITY: price = basePrice + (slope * globalSupply)
    // Import global supply service
    const { getGlobalSupply, calculatePriceWithGlobalSupply } = await import('./globalSupply');
    
    // Initialize reserve and supply from deployment (will be updated if needed)
    let reserve = deployment.reserve_balance || '0';
    let supply = deployment.current_supply || '0';
    
    // Get token parameters for price calculation
    const token = await dbGet(
      `SELECT base_price, slope FROM tokens WHERE id = ?`,
      [tokenId]
    ) as any;
    
    let price = 0;
    if (token) {
      // Use global supply for virtual liquidity pricing
      const globalSupply = await getGlobalSupply(tokenId);
      price = await calculatePriceWithGlobalSupply(tokenId, token.base_price, token.slope);
      
      // For virtual liquidity, we may need to calculate reserve based on bonding curve
      // For now, keep existing reserve and supply values from database
    } else {
      // Fallback to old calculation
      if (supply && parseFloat(supply) > 0) {
        price = parseFloat(reserve) / parseFloat(supply);
      }
    }

    // Update database with latest prices
    await dbRun(
      `UPDATE token_deployments 
       SET reserve_balance = ?, current_supply = ?, updated_at = CURRENT_TIMESTAMP
       WHERE token_id = ? AND chain = ?`,
      [reserve, supply, tokenId, chain]
    );

    // Update shared liquidity pool
    if (deployment.pool_address) {
      await dbRun(
        `INSERT OR REPLACE INTO shared_liquidity_pools (
          token_id, chain, pool_address, balance, tvl, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          tokenId,
          chain,
          deployment.pool_address,
          supply,
          parseFloat(reserve) * 2, // TVL = reserve * 2 (assuming 50/50 pool)
        ]
      );
    }

    return {
      chain,
      tokenAddress: deployment.token_address,
      poolAddress: deployment.pool_address || deployment.curve_address,
      price,
      balance: supply,
      reserve,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Error getting price for ${chain}:`, error);
    return null;
  }
}

/**
 * Get prices across all chains for a token
 */
export async function getAllChainPrices(tokenId: string): Promise<ChainPrice[]> {
  const chains = ['ethereum', 'bsc', 'base', 'solana'];
  const prices: ChainPrice[] = [];

  for (const chain of chains) {
    const price = await getChainPrice(tokenId, chain);
    if (price) {
      prices.push(price);
    }
  }

  return prices;
}

/**
 * Calculate price deviations across chains
 */
export function calculatePriceDeviations(prices: ChainPrice[]): PriceDeviation[] {
  if (prices.length < 2) {
    return [];
  }

  // Calculate average price
  const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;

  // Calculate deviations
  const deviations: PriceDeviation[] = prices.map((price) => {
    const deviation = ((price.price - avgPrice) / avgPrice) * 100;
    return {
      chain: price.chain,
      deviation: Math.abs(deviation),
      price: price.price,
      avgPrice,
    };
  });

  return deviations.sort((a, b) => b.deviation - a.deviation);
}

/**
 * Check if price sync is needed (deviation exceeds threshold)
 */
export async function needsPriceSync(
  tokenId: string,
  threshold: number = 1.0 // 1% default threshold
): Promise<{ needsSync: boolean; deviations: PriceDeviation[] }> {
  const prices = await getAllChainPrices(tokenId);
  if (prices.length < 2) {
    return { needsSync: false, deviations: [] };
  }

  const deviations = calculatePriceDeviations(prices);
  const maxDeviation = deviations[0]?.deviation || 0;

  return {
    needsSync: maxDeviation > threshold,
    deviations,
  };
}

/**
 * Sync prices across chains by rebalancing liquidity
 * This is a simplified version - in production, you'd use bridge contracts
 */
export async function syncPrices(
  tokenId: string,
  targetChain: string
): Promise<{ success: boolean; message: string }> {
  try {
    const prices = await getAllChainPrices(tokenId);
    if (prices.length < 2) {
      return { success: false, message: 'Need at least 2 chains to sync' };
    }

    const deviations = calculatePriceDeviations(prices);
    const targetPrice = prices.find(p => p.chain === targetChain);

    if (!targetPrice) {
      return { success: false, message: 'Target chain not found' };
    }

    // Find chains with highest and lowest prices
    const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
    const lowestPrice = sortedPrices[0];
    const highestPrice = sortedPrices[sortedPrices.length - 1];

    // Calculate rebalancing needed
    const priceDiff = highestPrice.price - lowestPrice.price;
    const rebalanceAmount = (priceDiff / highestPrice.price) * parseFloat(highestPrice.balance);

    console.log(`Price sync needed for token ${tokenId}:`);
    console.log(`  Lowest: ${lowestPrice.chain} @ ${lowestPrice.price}`);
    console.log(`  Highest: ${highestPrice.chain} @ ${highestPrice.price}`);
    console.log(`  Rebalance amount: ${rebalanceAmount}`);

    // In production, this would:
    // 1. Use bridge contracts to transfer tokens
    // 2. Execute swaps on DEX pools
    // 3. Update liquidity pools

    // For now, we'll just log and update the database
    await dbRun(
      `UPDATE shared_liquidity_pools 
       SET balance = CAST(balance AS REAL) + ?, 
           tvl = CAST(tvl AS REAL) + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE token_id = ? AND chain = ?`,
      [rebalanceAmount.toString(), (rebalanceAmount * targetPrice.price).toString(), tokenId, targetChain]
    );

    return {
      success: true,
      message: `Prices synced. Rebalanced ${rebalanceAmount} tokens to ${targetChain}`,
    };
  } catch (error) {
    console.error('Error syncing prices:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Monitor all tokens and sync prices when needed
 */
export async function monitorAndSyncPrices(): Promise<void> {
  try {
    // Get all tokens with deployments on multiple chains
    const tokens = await dbAll(`
      SELECT DISTINCT t.id, t.name, t.symbol
      FROM tokens t
      INNER JOIN token_deployments td ON t.id = td.token_id
      GROUP BY t.id
      HAVING COUNT(DISTINCT td.chain) > 1
    `) as any[];

    console.log(`Monitoring ${tokens.length} tokens for price sync...`);

    for (const token of tokens) {
      const { needsSync, deviations } = await needsPriceSync(token.id, 1.0);

      if (needsSync) {
        console.log(`⚠️ Price deviation detected for ${token.name} (${token.symbol}):`);
        deviations.forEach((dev) => {
          console.log(`  ${dev.chain}: ${dev.deviation.toFixed(2)}% deviation`);
        });

        // Sync to the chain with the average price
        const prices = await getAllChainPrices(token.id);
        const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        
        // Find chain closest to average
        const targetChain = prices.reduce((closest, current) => {
          const closestDiff = Math.abs(closest.price - avgPrice);
          const currentDiff = Math.abs(current.price - avgPrice);
          return currentDiff < closestDiff ? current : closest;
        });

        await syncPrices(token.id, targetChain.chain);
      }
    }
  } catch (error) {
    console.error('Error in price monitoring:', error);
  }
}

/**
 * Start continuous price monitoring (runs every 5 minutes)
 */
export function startPriceMonitoring(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  console.log('Starting unified liquidity price monitoring...');
  
  // Run immediately
  monitorAndSyncPrices();
  
  // Then run at intervals
  return setInterval(() => {
    monitorAndSyncPrices();
  }, intervalMs);
}

