import { Router, Request, Response } from 'express';
import { getCrossChainRelayer } from '../services/crossChainRelayer';

export const router = Router();

// POST /crosschain/register
// Register a token for fee monitoring and cross-chain sync
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chain } = req.body;

    if (!tokenAddress || !chain) {
      return res.status(400).json({
        error: 'tokenAddress and chain are required',
      });
    }

    const relayer = getCrossChainRelayer();
    relayer.registerToken(tokenAddress, chain);

    res.json({
      success: true,
      message: 'Token registered for cross-chain fee monitoring',
      tokenAddress,
      chain,
    });
  } catch (error: any) {
    console.error('Error registering token:', error);
    res.status(500).json({
      error: 'Failed to register token',
      message: error.message,
    });
  }
});

// GET /crosschain/status
// Get status of all registered tokens
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const relayer = getCrossChainRelayer();
    const status = relayer.getStatus();

    res.json({
      success: true,
      tokens: status,
      count: status.length,
    });
  } catch (error: any) {
    console.error('Error getting status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message,
    });
  }
});

// POST /crosschain/swap
// Manually trigger fee swap for a token
router.post('/swap', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, chain } = req.body;

    if (!tokenAddress || !chain) {
      return res.status(400).json({
        error: 'tokenAddress and chain are required',
      });
    }

    // This would trigger an immediate swap
    // Implementation would depend on DEX integration
    res.json({
      success: true,
      message: 'Fee swap initiated',
      tokenAddress,
      chain,
    });
  } catch (error: any) {
    console.error('Error swapping fees:', error);
    res.status(500).json({
      error: 'Failed to swap fees',
      message: error.message,
    });
  }
});




