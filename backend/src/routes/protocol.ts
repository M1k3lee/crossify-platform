import { Router, Request, Response } from 'express';
import { dbAll, dbGet } from '../db';

export const router = Router();

/**
 * GET /protocol/stats
 * Public endpoint for protocol statistics (DefiLlama compatible)
 * Returns TVL, volumes, and fees across all chains
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Get TVL from bonding curves (reserve_balance) and DEX pools
    // For bonding curves: TVL = reserve_balance * 2 (50/50 pool assumption)
    // For DEX pools: use pool TVL directly
    const deployments = await dbAll(`
      SELECT 
        chain,
        SUM(CAST(reserve_balance AS REAL)) as total_reserve_balance,
        COUNT(*) as token_count
      FROM token_deployments
      WHERE status = 'deployed' AND reserve_balance IS NOT NULL AND reserve_balance != '0'
      GROUP BY chain
    `) as any[];

    // Get TVL from shared liquidity pools (DEX pools)
    const pools = await dbAll(`
      SELECT 
        chain,
        SUM(CAST(tvl AS REAL)) as total_pool_tvl
      FROM shared_liquidity_pools
      GROUP BY chain
    `) as any[];

    // Combine bonding curve reserves and DEX pool TVL per chain
    const chainTVL: Record<string, number> = {};
    
    deployments.forEach((dep: any) => {
      const reserve = parseFloat(dep.total_reserve_balance || '0');
      // Bonding curve TVL = reserve * 2 (assuming 50/50 pools, reserve represents one side)
      chainTVL[dep.chain] = (chainTVL[dep.chain] || 0) + (reserve * 2);
    });

    pools.forEach((pool: any) => {
      chainTVL[pool.chain] = (chainTVL[pool.chain] || 0) + parseFloat(pool.total_pool_tvl || '0');
    });

    // Get total TVL across all chains
    const totalTVL = Object.values(chainTVL).reduce((sum, tvl) => sum + tvl, 0);

    // Get trading volumes (24h, 7d, 30d) in USD
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Volume query - get volumes by time period
    const volume24h = await dbGet(`
      SELECT SUM(CAST(amount AS REAL) * CAST(price AS REAL)) as total_volume
      FROM transactions
      WHERE status = 'confirmed' AND created_at >= ?
    `, [oneDayAgo.toISOString()]) as any;

    const volume7d = await dbGet(`
      SELECT SUM(CAST(amount AS REAL) * CAST(price AS REAL)) as total_volume
      FROM transactions
      WHERE status = 'confirmed' AND created_at >= ?
    `, [sevenDaysAgo.toISOString()]) as any;

    const volume30d = await dbGet(`
      SELECT SUM(CAST(amount AS REAL) * CAST(price AS REAL)) as total_volume
      FROM transactions
      WHERE status = 'confirmed' AND created_at >= ?
    `, [thirtyDaysAgo.toISOString()]) as any;

    // Convert volumes from native token to USD if needed (handle legacy data)
    const convertVolume = (volume: number): number => {
      // If volume seems too low, it might be in native token (heuristic)
      // For now, assume prices are already in USD (as per recent fixes)
      return volume || 0;
    };

    const volume24hUSD = convertVolume(parseFloat(volume24h?.total_volume || '0'));
    const volume7dUSD = convertVolume(parseFloat(volume7d?.total_volume || '0'));
    const volume30dUSD = convertVolume(parseFloat(volume30d?.total_volume || '0'));

    // Get protocol fees (revenue)
    const fees24h = await dbGet(`
      SELECT SUM(amount_usd) as total_fees
      FROM platform_fees
      WHERE status = 'confirmed' AND collected_at >= ?
    `, [oneDayAgo.toISOString()]) as any;

    const fees7d = await dbGet(`
      SELECT SUM(amount_usd) as total_fees
      FROM platform_fees
      WHERE status = 'confirmed' AND collected_at >= ?
    `, [sevenDaysAgo.toISOString()]) as any;

    const fees30d = await dbGet(`
      SELECT SUM(amount_usd) as total_fees
      FROM platform_fees
      WHERE status = 'confirmed' AND collected_at >= ?
    `, [thirtyDaysAgo.toISOString()]) as any;

    // Get protocol metrics
    const totalTokens = await dbGet('SELECT COUNT(*) as count FROM tokens') as any;
    const activeDeployments = await dbGet(`
      SELECT COUNT(*) as count 
      FROM token_deployments 
      WHERE status = 'deployed'
    `) as any;

    // Format response for DefiLlama compatibility
    res.json({
      success: true,
      timestamp: Date.now(),
      protocol: {
        name: 'Crossify',
        category: 'Launchpad',
        description: 'Cross-chain token launch platform with bonding curves and automatic DEX graduation',
      },
      tvl: {
        total: totalTVL,
        byChain: chainTVL,
      },
      volume: {
        daily24h: volume24hUSD,
        weekly7d: volume7dUSD,
        monthly30d: volume30dUSD,
      },
      fees: {
        daily24h: parseFloat(fees24h?.total_fees || '0'),
        weekly7d: parseFloat(fees7d?.total_fees || '0'),
        monthly30d: parseFloat(fees30d?.total_fees || '0'),
      },
      metrics: {
        totalTokens: parseInt(totalTokens?.count || '0'),
        activeDeployments: parseInt(activeDeployments?.count || '0'),
        chains: Object.keys(chainTVL),
      },
    });
  } catch (error) {
    console.error('Error fetching protocol stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch protocol statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

