import { Router, Request, Response } from 'express';
import { isUsingPostgreSQL } from '../db/adapter';
import { dbGet } from '../db/adapter';

export const router = Router();

// Health check endpoint that shows database status
router.get('/health/database', async (_req: Request, res: Response) => {
  try {
    const usingPostgreSQL = isUsingPostgreSQL();
    
    // Try to query the database
    const result = await dbGet('SELECT COUNT(*) as count FROM tokens');
    const tokenCount = (result as any)?.count || 0;
    
    // Try to query deployments
    const deploymentResult = await dbGet('SELECT COUNT(*) as count FROM token_deployments');
    const deploymentCount = (deploymentResult as any)?.count || 0;
    
    res.json({
      status: 'ok',
      database: {
        type: usingPostgreSQL ? 'PostgreSQL' : 'SQLite',
        connected: true,
        tokens: tokenCount,
        deployments: deploymentCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      database: {
        connected: false,
      },
    });
  }
});

// Simple health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check token count and sample tokens
router.get('/health/tokens', async (_req: Request, res: Response) => {
  try {
    const { dbAll } = await import('../db/adapter');
    
    const totalTokens = await dbAll('SELECT COUNT(*) as count FROM tokens', []) as any[];
    const visibleTokens = await dbAll('SELECT COUNT(*) as count FROM tokens WHERE (deleted IS NULL OR deleted = 0) AND (visible_in_marketplace IS NULL OR visible_in_marketplace = 1)', []) as any[];
    const deletedTokens = await dbAll('SELECT COUNT(*) as count FROM tokens WHERE deleted = 1', []) as any[];
    const hiddenTokens = await dbAll('SELECT COUNT(*) as count FROM tokens WHERE visible_in_marketplace = 0', []) as any[];
    const sampleTokens = await dbAll('SELECT id, name, symbol, deleted, visible_in_marketplace FROM tokens LIMIT 5', []) as any[];
    
    res.json({
      status: 'ok',
      database: {
        totalTokens: totalTokens[0]?.count || 0,
        visibleTokens: visibleTokens[0]?.count || 0,
        deletedTokens: deletedTokens[0]?.count || 0,
        hiddenTokens: hiddenTokens[0]?.count || 0,
        sampleTokens: sampleTokens.map((t: any) => ({
          id: t.id,
          name: t.name,
          symbol: t.symbol,
          deleted: t.deleted,
          visible: t.visible_in_marketplace,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

