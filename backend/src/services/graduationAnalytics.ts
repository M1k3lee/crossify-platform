/**
 * Graduation Analytics Service
 * 
 * Tracks graduation metrics:
 * - Graduation success rate
 * - Time-to-graduation statistics
 * - Post-graduation performance
 */

import { dbAll, dbGet } from '../db/adapter';

interface GraduationStats {
  totalTokens: number;
  graduatedTokens: number;
  graduationRate: number;
  averageTimeToGraduation: number; // in hours
  medianTimeToGraduation: number; // in hours
  fastestGraduation: number; // in hours
  slowestGraduation: number; // in hours
}

interface PostGraduationPerformance {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  graduatedAt: string;
  daysSinceGraduation: number;
  dexName: string;
  poolAddress: string;
  currentPrice?: number;
  priceChange?: number; // % change since graduation
  volume24h?: number;
}

/**
 * Get overall graduation statistics
 */
export async function getGraduationStats(): Promise<GraduationStats> {
  try {
    // Get all tokens with graduation threshold > 0
    const tokensWithThreshold = await dbAll(`
      SELECT id, graduation_threshold, created_at
      FROM tokens
      WHERE graduation_threshold > 0
    `) as any[];

    // Get all graduated deployments
    const graduatedDeployments = await dbAll(`
      SELECT td.token_id, td.graduated_at, t.created_at
      FROM token_deployments td
      INNER JOIN tokens t ON td.token_id = t.id
      WHERE td.is_graduated = 1 AND td.graduated_at IS NOT NULL
    `) as any[];

    const totalTokens = tokensWithThreshold.length;
    const graduatedTokens = graduatedDeployments.length;
    const graduationRate = totalTokens > 0 ? (graduatedTokens / totalTokens) * 100 : 0;

    // Calculate time to graduation for each token
    const graduationTimes: number[] = [];
    for (const grad of graduatedDeployments) {
      const createdAt = new Date(grad.created_at).getTime();
      const graduatedAt = new Date(grad.graduated_at).getTime();
      const hours = (graduatedAt - createdAt) / (1000 * 60 * 60);
      graduationTimes.push(hours);
    }

    graduationTimes.sort((a, b) => a - b);

    const averageTimeToGraduation = graduationTimes.length > 0
      ? graduationTimes.reduce((a, b) => a + b, 0) / graduationTimes.length
      : 0;

    const medianTimeToGraduation = graduationTimes.length > 0
      ? graduationTimes[Math.floor(graduationTimes.length / 2)]
      : 0;

    const fastestGraduation = graduationTimes.length > 0 ? graduationTimes[0] : 0;
    const slowestGraduation = graduationTimes.length > 0 ? graduationTimes[graduationTimes.length - 1] : 0;

    return {
      totalTokens,
      graduatedTokens,
      graduationRate,
      averageTimeToGraduation,
      medianTimeToGraduation,
      fastestGraduation,
      slowestGraduation,
    };
  } catch (error) {
    console.error('Error getting graduation stats:', error);
    return {
      totalTokens: 0,
      graduatedTokens: 0,
      graduationRate: 0,
      averageTimeToGraduation: 0,
      medianTimeToGraduation: 0,
      fastestGraduation: 0,
      slowestGraduation: 0,
    };
  }
}

/**
 * Get post-graduation performance for all graduated tokens
 */
export async function getPostGraduationPerformance(): Promise<PostGraduationPerformance[]> {
  try {
    const graduated = await dbAll(`
      SELECT 
        td.token_id,
        td.dex_name,
        td.dex_pool_address,
        td.graduated_at,
        t.name as token_name,
        t.symbol as token_symbol,
        t.created_at
      FROM token_deployments td
      INNER JOIN tokens t ON td.token_id = t.id
      WHERE td.is_graduated = 1 
        AND td.graduated_at IS NOT NULL
        AND td.dex_pool_address IS NOT NULL
      ORDER BY td.graduated_at DESC
    `) as any[];

    const performance: PostGraduationPerformance[] = [];

    for (const grad of graduated) {
      const graduatedAt = new Date(grad.graduated_at);
      const now = new Date();
      const daysSinceGraduation = (now.getTime() - graduatedAt.getTime()) / (1000 * 60 * 60 * 24);

      // Get current price from deployment (if available)
      const deployment = await dbGet(
        'SELECT market_cap, current_supply FROM token_deployments WHERE token_id = ? AND chain = ? LIMIT 1',
        [grad.token_id, 'ethereum'] // Get from first available chain
      ) as any;

      const currentPrice = deployment?.market_cap && deployment?.current_supply
        ? parseFloat(deployment.market_cap) / parseFloat(deployment.current_supply)
        : undefined;

      performance.push({
        tokenId: grad.token_id,
        tokenName: grad.token_name,
        tokenSymbol: grad.token_symbol,
        graduatedAt: grad.graduated_at,
        daysSinceGraduation: Math.floor(daysSinceGraduation),
        dexName: grad.dex_name || 'dex',
        poolAddress: grad.dex_pool_address,
        currentPrice,
        // TODO: Calculate price change and volume from DEX APIs
      });
    }

    return performance;
  } catch (error) {
    console.error('Error getting post-graduation performance:', error);
    return [];
  }
}

/**
 * Get graduation timeline (tokens graduated over time)
 */
export async function getGraduationTimeline(days: number = 30): Promise<Array<{
  date: string;
  count: number;
  tokens: Array<{ id: string; name: string; symbol: string }>;
}>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const graduations = await dbAll(`
      SELECT 
        DATE(td.graduated_at) as graduation_date,
        td.token_id,
        t.name as token_name,
        t.symbol as token_symbol
      FROM token_deployments td
      INNER JOIN tokens t ON td.token_id = t.id
      WHERE td.is_graduated = 1 
        AND td.graduated_at >= ?
      ORDER BY td.graduated_at ASC
    `, [startDate.toISOString()]) as any[];

    // Group by date
    const timeline: Record<string, Array<{ id: string; name: string; symbol: string }>> = {};
    
    for (const grad of graduations) {
      const date = grad.graduation_date;
      if (!timeline[date]) {
        timeline[date] = [];
      }
      timeline[date].push({
        id: grad.token_id,
        name: grad.token_name,
        symbol: grad.token_symbol,
      });
    }

    // Convert to array format
    return Object.entries(timeline).map(([date, tokens]) => ({
      date,
      count: tokens.length,
      tokens,
    }));
  } catch (error) {
    console.error('Error getting graduation timeline:', error);
    return [];
  }
}

/**
 * Get graduation success rate by threshold range
 */
export async function getGraduationRateByThreshold(): Promise<Array<{
  thresholdRange: string;
  totalTokens: number;
  graduatedTokens: number;
  successRate: number;
}>> {
  try {
    const ranges = [
      { min: 0, max: 10000, label: '$0 - $10K' },
      { min: 10000, max: 50000, label: '$10K - $50K' },
      { min: 50000, max: 100000, label: '$50K - $100K' },
      { min: 100000, max: 500000, label: '$100K - $500K' },
      { min: 500000, max: Infinity, label: '$500K+' },
    ];

    const results = [];

    for (const range of ranges) {
      const tokens = await dbAll(`
        SELECT id FROM tokens
        WHERE graduation_threshold >= ? AND graduation_threshold < ?
      `, [range.min, range.max === Infinity ? 999999999 : range.max]) as any[];

      const graduated = await dbAll(`
        SELECT DISTINCT td.token_id
        FROM token_deployments td
        INNER JOIN tokens t ON td.token_id = t.id
        WHERE td.is_graduated = 1
          AND t.graduation_threshold >= ?
          AND t.graduation_threshold < ?
      `, [range.min, range.max === Infinity ? 999999999 : range.max]) as any[];

      const totalTokens = tokens.length;
      const graduatedTokens = graduated.length;
      const successRate = totalTokens > 0 ? (graduatedTokens / totalTokens) * 100 : 0;

      results.push({
        thresholdRange: range.label,
        totalTokens,
        graduatedTokens,
        successRate,
      });
    }

    return results;
  } catch (error) {
    console.error('Error getting graduation rate by threshold:', error);
    return [];
  }
}

