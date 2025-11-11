import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { pgGet, pgAll, pgRun } from '../db/postgres';
import { getPresaleMonitor } from '../services/presaleSolanaMonitor';

export const router = Router();

// Validation schemas
const createPresaleSchema = z.object({
  id: z.string().min(1).max(100).optional(), // Allow custom ID (e.g., "default")
  token_symbol: z.string().min(1).max(10),
  token_name: z.string().min(1).max(100),
  solana_address: z.string().min(32).max(44), // Solana address format
  presale_price: z.number().positive(),
  total_tokens_for_presale: z.string().regex(/^\d+$/),
  min_purchase_sol: z.number().positive().default(0.1),
  max_purchase_sol: z.number().positive().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  liquidity_percentage: z.number().min(0).max(100).default(60),
  dev_percentage: z.number().min(0).max(100).default(20),
  marketing_percentage: z.number().min(0).max(100).default(20),
  affiliate_reward_percentage: z.number().min(0).max(50).default(5),
});

const updatePresaleStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'paused', 'completed', 'cancelled']),
});

const createAffiliateSchema = z.object({
  referral_code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/i),
  affiliate_address: z.string().min(32).max(44),
});

/**
 * GET /api/presale
 * Get all presales or a specific presale
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    if (id) {
      // Get specific presale
      const presale = await pgGet(
        `SELECT * FROM presale_config WHERE id = $1`,
        [id]
      );

      if (!presale) {
        return res.status(404).json({ error: 'Presale not found' });
      }

      // Get transaction count and recent transactions
      const stats = await pgGet(
        `SELECT 
          COUNT(*) as total_transactions,
          SUM(sol_amount) as total_raised,
          COUNT(DISTINCT buyer_address) as unique_buyers
         FROM presale_transactions 
         WHERE presale_id = $1 AND status = 'confirmed'`,
        [id]
      );

      return res.json({
        ...presale,
        stats: {
          total_transactions: parseInt(stats?.total_transactions || '0'),
          total_raised: parseFloat(stats?.total_raised || '0'),
          unique_buyers: parseInt(stats?.unique_buyers || '0'),
        },
      });
    }

    // Get all presales
    const presales = await pgAll(
      `SELECT * FROM presale_config ORDER BY created_at DESC`
    );

    res.json(presales);
  } catch (error: any) {
    console.error('Error fetching presales:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch presales' });
  }
});

/**
 * POST /api/presale
 * Create a new presale
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createPresaleSchema.parse(req.body);

    // Validate percentages sum to 100
    const totalPercentage = data.liquidity_percentage + data.dev_percentage + data.marketing_percentage;
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        error: 'liquidity_percentage + dev_percentage + marketing_percentage must equal 100',
      });
    }

    // Use provided ID or generate UUID
    const presaleId = data.id || uuidv4();
    
    // Check if presale with this ID already exists
    const existing = await pgGet('SELECT id FROM presale_config WHERE id = $1', [presaleId]);
    if (existing) {
      return res.status(400).json({
        error: `Presale with id '${presaleId}' already exists`,
      });
    }

    await pgRun(
      `INSERT INTO presale_config 
       (id, token_symbol, token_name, solana_address, presale_price, total_tokens_for_presale,
        min_purchase_sol, max_purchase_sol, start_date, end_date, status,
        liquidity_percentage, dev_percentage, marketing_percentage, affiliate_reward_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13, $14)`,
      [
        presaleId,
        data.token_symbol,
        data.token_name,
        data.solana_address,
        data.presale_price,
        data.total_tokens_for_presale,
        data.min_purchase_sol,
        data.max_purchase_sol || null,
        data.start_date || null,
        data.end_date || null,
        data.liquidity_percentage,
        data.dev_percentage,
        data.marketing_percentage,
        data.affiliate_reward_percentage,
      ]
    );

    res.status(201).json({
      id: presaleId,
      message: 'Presale created successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating presale:', error);
    res.status(500).json({ error: error.message || 'Failed to create presale' });
  }
});

/**
 * PATCH /api/presale/:id/status
 * Update presale status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = updatePresaleStatusSchema.parse(req.body);

    const presale = await pgGet('SELECT * FROM presale_config WHERE id = $1', [id]);
    if (!presale) {
      return res.status(404).json({ error: 'Presale not found' });
    }

    await pgRun(
      `UPDATE presale_config SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, id]
    );

    // Start/stop monitoring based on status
    const monitor = getPresaleMonitor();
    if (status === 'active') {
      await monitor.startMonitoring(id, presale.solana_address);
    } else {
      monitor.stopMonitoring(id);
    }

    res.json({ message: 'Presale status updated', status });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating presale status:', error);
    res.status(500).json({ error: error.message || 'Failed to update presale status' });
  }
});

/**
 * GET /api/presale/:id/transactions
 * Get transactions for a presale
 */
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const transactions = await pgAll(
      `SELECT * FROM presale_transactions 
       WHERE presale_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit as string), parseInt(offset as string)]
    );

    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/presale/:id/allocations
 * Get allocations for a presale (or specific user)
 */
router.get('/:id/allocations', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { address } = req.query;

    if (address) {
      // Get specific user's allocation
      const allocation = await pgGet(
        `SELECT * FROM presale_allocations 
         WHERE presale_id = $1 AND buyer_address = $2`,
        [id, address]
      );

      if (!allocation) {
        return res.status(404).json({ error: 'Allocation not found' });
      }

      // Get user's transactions
      const transactions = await pgAll(
        `SELECT * FROM presale_transactions 
         WHERE presale_id = $1 AND buyer_address = $2 
         ORDER BY created_at DESC`,
        [id, address]
      );

      return res.json({
        ...allocation,
        transactions,
      });
    }

    // Get all allocations
    const allocations = await pgAll(
      `SELECT * FROM presale_allocations 
       WHERE presale_id = $1 
       ORDER BY total_sol_contributed DESC`,
      [id]
    );

    res.json(allocations);
  } catch (error: any) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch allocations' });
  }
});

/**
 * POST /api/presale/:id/affiliates
 * Create an affiliate referral code
 */
router.post('/:id/affiliates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = createAffiliateSchema.parse(req.body);

    // Check if presale exists
    const presale = await pgGet('SELECT * FROM presale_config WHERE id = $1', [id]);
    if (!presale) {
      return res.status(404).json({ error: 'Presale not found' });
    }

    // Check if referral code already exists
    const existing = await pgGet(
      'SELECT * FROM presale_affiliates WHERE referral_code = $1',
      [data.referral_code]
    );

    if (existing) {
      return res.status(400).json({ error: 'Referral code already exists' });
    }

    await pgRun(
      `INSERT INTO presale_affiliates 
       (presale_id, referral_code, affiliate_address)
       VALUES ($1, $2, $3)`,
      [id, data.referral_code.toUpperCase(), data.affiliate_address]
    );

    res.status(201).json({
      message: 'Affiliate created successfully',
      referral_code: data.referral_code.toUpperCase(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating affiliate:', error);
    res.status(500).json({ error: error.message || 'Failed to create affiliate' });
  }
});

/**
 * GET /api/presale/:id/affiliates
 * Get affiliates for a presale
 */
router.get('/:id/affiliates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code } = req.query;

    if (code) {
      // Get specific affiliate
      const affiliate = await pgGet(
        `SELECT * FROM presale_affiliates 
         WHERE presale_id = $1 AND referral_code = $2`,
        [id, code]
      );

      if (!affiliate) {
        return res.status(404).json({ error: 'Affiliate not found' });
      }

      // Get referrals
      const referrals = await pgAll(
        `SELECT * FROM presale_referrals 
         WHERE affiliate_id = $1 
         ORDER BY created_at DESC`,
        [affiliate.id]
      );

      return res.json({
        ...affiliate,
        referrals,
      });
    }

    // Get all affiliates
    const affiliates = await pgAll(
      `SELECT * FROM presale_affiliates 
       WHERE presale_id = $1 
       ORDER BY total_volume_sol DESC`,
      [id]
    );

    res.json(affiliates);
  } catch (error: any) {
    console.error('Error fetching affiliates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch affiliates' });
  }
});

/**
 * POST /api/presale/:id/process-transaction
 * Manually process a transaction (for testing or manual entry)
 */
router.post('/:id/process-transaction', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tx_hash } = req.body;

    if (!tx_hash) {
      return res.status(400).json({ error: 'tx_hash is required' });
    }

    const monitor = getPresaleMonitor();
    await monitor.processTransactionManually(id, tx_hash);

    res.json({ message: 'Transaction processed successfully' });
  } catch (error: any) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to process transaction' });
  }
});

/**
 * GET /api/presale/:id/stats
 * Get presale statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const presale = await pgGet('SELECT * FROM presale_config WHERE id = $1', [id]);
    if (!presale) {
      return res.status(404).json({ error: 'Presale not found' });
    }

    const stats = await pgGet(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(sol_amount) as total_raised,
        COUNT(DISTINCT buyer_address) as unique_buyers,
        AVG(sol_amount) as avg_contribution,
        MAX(sol_amount) as max_contribution,
        MIN(sol_amount) as min_contribution
       FROM presale_transactions 
       WHERE presale_id = $1 AND status = 'confirmed'`,
      [id]
    );

    const topContributors = await pgAll(
      `SELECT buyer_address, total_sol_contributed, total_tokens_allocated, transaction_count
       FROM presale_allocations 
       WHERE presale_id = $1 
       ORDER BY total_sol_contributed DESC 
       LIMIT 10`,
      [id]
    );

    res.json({
      presale,
      stats: {
        total_transactions: parseInt(stats?.total_transactions || '0'),
        total_raised: parseFloat(stats?.total_raised || '0'),
        unique_buyers: parseInt(stats?.unique_buyers || '0'),
        avg_contribution: parseFloat(stats?.avg_contribution || '0'),
        max_contribution: parseFloat(stats?.max_contribution || '0'),
        min_contribution: parseFloat(stats?.min_contribution || '0'),
      },
      top_contributors: topContributors,
    });
  } catch (error: any) {
    console.error('Error fetching presale stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch presale stats' });
  }
});

