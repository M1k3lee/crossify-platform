import { Router, Request, Response } from 'express';
import { getCrossChainRelayer } from '../services/crossChainRelayer';
import { requestLiquidity, executeBridge, checkReserves, updateReserve } from '../services/bridgeService';
import { monitorReserves, getChainReserveStatus, checkAndRebalance } from '../services/liquidityBridge';

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

// POST /crosschain/liquidity/request
// Request liquidity from another chain
router.post('/liquidity/request', async (req: Request, res: Response) => {
  try {
    const { tokenId, targetChain, amount } = req.body;

    if (!tokenId || !targetChain || !amount) {
      return res.status(400).json({
        error: 'tokenId, targetChain, and amount are required',
      });
    }

    const result = await requestLiquidity(tokenId, targetChain, amount);

    if (result.success) {
      res.json({
        success: true,
        requestId: result.requestId,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error: any) {
    console.error('Error requesting liquidity:', error);
    res.status(500).json({
      error: 'Failed to request liquidity',
      message: error.message,
    });
  }
});

// POST /crosschain/liquidity/bridge
// Execute liquidity bridge between chains
router.post('/liquidity/bridge', async (req: Request, res: Response) => {
  try {
    const { tokenId, sourceChain, targetChain, amount, requestId } = req.body;

    if (!tokenId || !sourceChain || !targetChain || !amount) {
      return res.status(400).json({
        error: 'tokenId, sourceChain, targetChain, and amount are required',
      });
    }

    const result = await executeBridge(tokenId, sourceChain, targetChain, amount, requestId);

    if (result.success) {
      res.json({
        success: true,
        txHash: result.txHash,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error: any) {
    console.error('Error executing bridge:', error);
    res.status(500).json({
      error: 'Failed to execute bridge',
      message: error.message,
    });
  }
});

// GET /crosschain/liquidity/reserves/:tokenId
// Get reserve status for all chains
router.get('/liquidity/reserves/:tokenId', async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;
    const reserves = await monitorReserves(tokenId);

    res.json({
      success: true,
      reserves,
    });
  } catch (error: any) {
    console.error('Error getting reserves:', error);
    res.status(500).json({
      error: 'Failed to get reserves',
      message: error.message,
    });
  }
});

// GET /crosschain/liquidity/reserves/:tokenId/:chain
// Get reserve status for a specific chain
router.get('/liquidity/reserves/:tokenId/:chain', async (req: Request, res: Response) => {
  try {
    const { tokenId, chain } = req.params;
    const status = await getChainReserveStatus(tokenId, chain);

    res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('Error getting chain reserve status:', error);
    res.status(500).json({
      error: 'Failed to get chain reserve status',
      message: error.message,
    });
  }
});

// POST /crosschain/liquidity/check
// Check if chain has sufficient reserves
router.post('/liquidity/check', async (req: Request, res: Response) => {
  try {
    const { tokenId, chain, requiredAmount } = req.body;

    if (!tokenId || !chain || !requiredAmount) {
      return res.status(400).json({
        error: 'tokenId, chain, and requiredAmount are required',
      });
    }

    const result = await checkReserves(tokenId, chain, requiredAmount);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error checking reserves:', error);
    res.status(500).json({
      error: 'Failed to check reserves',
      message: error.message,
    });
  }
});

// POST /crosschain/liquidity/rebalance
// Manually trigger rebalancing for a token
router.post('/liquidity/rebalance', async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        error: 'tokenId is required',
      });
    }

    const needsRebalance = await checkAndRebalance(tokenId);

    res.json({
      success: true,
      rebalanced: needsRebalance,
      message: needsRebalance 
        ? 'Rebalancing triggered successfully' 
        : 'No rebalancing needed',
    });
  } catch (error: any) {
    console.error('Error rebalancing:', error);
    res.status(500).json({
      error: 'Failed to rebalance',
      message: error.message,
    });
  }
});

// POST /crosschain/liquidity/update-reserve
// Update reserve on bridge contract (called after buy/sell)
router.post('/liquidity/update-reserve', async (req: Request, res: Response) => {
  try {
    const { tokenId, chain, newReserve } = req.body;

    if (!tokenId || !chain || !newReserve) {
      return res.status(400).json({
        error: 'tokenId, chain, and newReserve are required',
      });
    }

    const result = await updateReserve(tokenId, chain, newReserve);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error: any) {
    console.error('Error updating reserve:', error);
    res.status(500).json({
      error: 'Failed to update reserve',
      message: error.message,
    });
  }
});




