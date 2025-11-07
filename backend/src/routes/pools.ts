import { Router, Request, Response } from 'express';
import { dbAll } from '../db';

export const router = Router();

// GET /pools/shared-liquidity
router.get('/shared-liquidity', async (_req: Request, res: Response) => {
  try {
    const pools = await dbAll(`
      SELECT 
        slp.*,
        t.name as token_name,
        t.symbol as token_symbol
      FROM shared_liquidity_pools slp
      JOIN tokens t ON slp.token_id = t.id
      ORDER BY slp.tvl DESC
    `) as any[];
    
    const totalTVL = pools.reduce((sum, pool) => sum + pool.tvl, 0);
    
    res.json({
      pools: pools.map(pool => ({
        tokenId: pool.token_id,
        tokenName: pool.token_name,
        tokenSymbol: pool.token_symbol,
        chain: pool.chain,
        poolAddress: pool.pool_address,
        balance: pool.balance,
        tvl: pool.tvl,
        updatedAt: pool.updated_at,
      })),
      totalTVL,
    });
  } catch (error) {
    console.error('Error fetching shared liquidity pools:', error);
    res.status(500).json({ error: 'Failed to fetch shared liquidity pools' });
  }
});

