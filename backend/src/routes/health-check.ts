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

