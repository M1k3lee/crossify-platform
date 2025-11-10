// Global Supply Tracking Service
// Tracks token supply across all chains for virtual liquidity and price synchronization

import { dbAll, dbGet, dbRun } from '../db/adapter';

/**
 * Update global supply for a token across all chains
 * This enables virtual liquidity where price is calculated from global supply
 */
export async function updateGlobalSupply(
  tokenId: string,
  chain: string,
  supplySold: string
): Promise<void> {
  try {
    // Update chain-specific supply
    await dbRun(
      `UPDATE token_deployments 
       SET current_supply = ?, updated_at = CURRENT_TIMESTAMP
       WHERE token_id = ? AND chain = ?`,
      [supplySold, tokenId, chain]
    );

    // Calculate global supply (sum across all chains)
    const result = await dbGet(
      `SELECT SUM(CAST(current_supply AS REAL)) as total FROM token_deployments WHERE token_id = ?`,
      [tokenId]
    ) as any;

    const globalSupply = result?.total?.toString() || '0';

    // Store global supply (could be in a separate table or cache)
    // For now, we'll calculate it on-demand
    console.log(`Updated global supply for ${tokenId}: ${globalSupply} (${chain}: +${supplySold})`);
  } catch (error) {
    console.error('Error updating global supply:', error);
    throw error;
  }
}

/**
 * Get global supply for a token (sum across all chains)
 */
export async function getGlobalSupply(tokenId: string): Promise<string> {
  try {
    const result = await dbGet(
      `SELECT SUM(CAST(current_supply AS REAL)) as total FROM token_deployments WHERE token_id = ?`,
      [tokenId]
    ) as any;

    return result?.total?.toString() || '0';
  } catch (error) {
    console.error('Error getting global supply:', error);
    return '0';
  }
}

/**
 * Get supply breakdown by chain
 */
export async function getSupplyByChain(tokenId: string): Promise<Record<string, string>> {
  try {
    const deployments = await dbAll(
      `SELECT chain, current_supply FROM token_deployments WHERE token_id = ?`,
      [tokenId]
    ) as Array<{ chain: string; current_supply: string }>;

    const breakdown: Record<string, string> = {};
    deployments.forEach((dep) => {
      breakdown[dep.chain] = dep.current_supply || '0';
    });

    return breakdown;
  } catch (error) {
    console.error('Error getting supply by chain:', error);
    return {};
  }
}

/**
 * Calculate price using global supply (virtual liquidity)
 * Price = basePrice + (slope * globalSupply)
 */
export async function calculatePriceWithGlobalSupply(
  tokenId: string,
  basePrice: number,
  slope: number
): Promise<number> {
  try {
    const globalSupply = await getGlobalSupply(tokenId);
    const supply = parseFloat(globalSupply) || 0;
    
    // Price formula: basePrice + (slope * supply)
    const price = basePrice + (slope * supply);
    
    return price;
  } catch (error) {
    console.error('Error calculating price:', error);
    return basePrice;
  }
}

/**
 * Sync prices across chains using global supply
 * When a purchase happens on one chain, all chains should reflect the new price
 */
export async function syncPriceAcrossChains(tokenId: string): Promise<void> {
  try {
    // Get token parameters
    const token = await dbGet(
      `SELECT base_price, slope FROM tokens WHERE id = ?`,
      [tokenId]
    ) as any;

    if (!token) {
      return;
    }

    // Calculate global price
    const globalPrice = await calculatePriceWithGlobalSupply(
      tokenId,
      token.base_price,
      token.slope
    );

    // Update market cap for all deployments
    const deployments = await dbAll(
      `SELECT chain, current_supply FROM token_deployments WHERE token_id = ?`,
      [tokenId]
    ) as Array<{ chain: string; current_supply: string }>;

    for (const dep of deployments) {
      const supply = parseFloat(dep.current_supply) || 0;
      const marketCap = globalPrice * supply; // Using global price, not local

      await dbRun(
        `UPDATE token_deployments 
         SET market_cap = ?, updated_at = CURRENT_TIMESTAMP
         WHERE token_id = ? AND chain = ?`,
        [marketCap, tokenId, dep.chain]
      );
    }

    console.log(`Synced prices for ${tokenId} across all chains: $${globalPrice.toFixed(6)}`);
  } catch (error) {
    console.error('Error syncing prices:', error);
  }
}





