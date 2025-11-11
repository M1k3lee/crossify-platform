import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pgGet, pgAll } from '../db/postgres';
import { getCFYVestingService } from '../services/cfyVesting';
import { getCFYStakingService } from '../services/cfyStaking';

export const router = Router();

// Validation schemas
const stakeSchema = z.object({
  pool_id: z.number().int().positive(),
  amount: z.string().regex(/^\d+$/),
});

const unstakeSchema = z.object({
  position_id: z.number().int().positive(),
});

/**
 * GET /api/cfy/vesting
 * Get vesting schedule for current user or all (admin)
 */
router.get('/vesting', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'address query parameter is required' });
    }

    const vestingService = getCFYVestingService();
    const schedule = await vestingService.getVestingSchedule(address as string);

    if (!schedule) {
      return res.status(404).json({ error: 'Vesting schedule not found' });
    }

    const releasable = await vestingService.calculateReleasableAmount(address as string);
    const releaseHistory = await vestingService.getReleaseHistory(address as string);

    res.json({
      schedule,
      releasable,
      releaseHistory,
    });
  } catch (error: any) {
    console.error('Error fetching vesting:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch vesting schedule' });
  }
});

/**
 * POST /api/cfy/vesting/release-tge
 * Release TGE tokens (20% at launch)
 */
router.post('/vesting/release-tge', async (req: Request, res: Response) => {
  try {
    const { address, transaction_hash } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    const vestingService = getCFYVestingService();
    await vestingService.releaseTGE(address, transaction_hash);

    res.json({ message: 'TGE tokens released successfully' });
  } catch (error: any) {
    console.error('Error releasing TGE:', error);
    res.status(500).json({ error: error.message || 'Failed to release TGE tokens' });
  }
});

/**
 * POST /api/cfy/vesting/release-monthly
 * Release monthly vesting amount
 */
router.post('/vesting/release-monthly', async (req: Request, res: Response) => {
  try {
    const { address, transaction_hash } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    const vestingService = getCFYVestingService();
    const amount = await vestingService.releaseMonthly(address, transaction_hash);

    res.json({
      message: 'Monthly tokens released successfully',
      amount,
    });
  } catch (error: any) {
    console.error('Error releasing monthly tokens:', error);
    res.status(500).json({ error: error.message || 'Failed to release monthly tokens' });
  }
});

/**
 * POST /api/cfy/vesting/initialize-from-presale
 * Initialize vesting schedules from presale allocations (admin only)
 */
router.post('/vesting/initialize-from-presale', async (req: Request, res: Response) => {
  try {
    const { presale_id } = req.body;

    if (!presale_id) {
      return res.status(400).json({ error: 'presale_id is required' });
    }

    const vestingService = getCFYVestingService();
    const count = await vestingService.initializeFromPresale(presale_id);

    res.json({
      message: `Vesting schedules initialized for ${count} beneficiaries`,
      count,
    });
  } catch (error: any) {
    console.error('Error initializing vesting:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize vesting schedules' });
  }
});

/**
 * GET /api/cfy/staking/pools
 * Get all staking pools
 */
router.get('/staking/pools', async (req: Request, res: Response) => {
  try {
    const stakingService = getCFYStakingService();
    const pools = await stakingService.getPools();
    res.json(pools);
  } catch (error: any) {
    console.error('Error fetching staking pools:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch staking pools' });
  }
});

/**
 * GET /api/cfy/staking/pools/:id
 * Get specific staking pool
 */
router.get('/staking/pools/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stakingService = getCFYStakingService();
    const pool = await stakingService.getPool(parseInt(id));

    if (!pool) {
      return res.status(404).json({ error: 'Staking pool not found' });
    }

    res.json(pool);
  } catch (error: any) {
    console.error('Error fetching staking pool:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch staking pool' });
  }
});

/**
 * GET /api/cfy/staking/positions
 * Get staking positions for a user
 */
router.get('/staking/positions', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'address query parameter is required' });
    }

    const stakingService = getCFYStakingService();
    const positions = await stakingService.getUserPositions(address as string);

    // Calculate current rewards for each position
    const positionsWithRewards = await Promise.all(
      positions.map(async (position) => {
        const currentRewards = await stakingService.calculateRewards(position.id);
        const pool = await stakingService.getPool(position.pool_id);
        return {
          ...position,
          currentRewards,
          pool,
        };
      })
    );

    res.json(positionsWithRewards);
  } catch (error: any) {
    console.error('Error fetching staking positions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch staking positions' });
  }
});

/**
 * POST /api/cfy/staking/stake
 * Stake CFY tokens
 */
router.post('/staking/stake', async (req: Request, res: Response) => {
  try {
    const data = stakeSchema.parse(req.body);
    const { address, transaction_hash } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    const stakingService = getCFYStakingService();
    const positionId = await stakingService.stake(
      data.pool_id,
      address,
      data.amount,
      transaction_hash
    );

    res.json({
      message: 'Tokens staked successfully',
      position_id: positionId,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error staking tokens:', error);
    res.status(500).json({ error: error.message || 'Failed to stake tokens' });
  }
});

/**
 * POST /api/cfy/staking/unstake
 * Unstake CFY tokens
 */
router.post('/staking/unstake', async (req: Request, res: Response) => {
  try {
    const data = unstakeSchema.parse(req.body);
    const { transaction_hash } = req.body;

    const stakingService = getCFYStakingService();
    await stakingService.unstake(data.position_id, transaction_hash);

    res.json({ message: 'Tokens unstaked successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error unstaking tokens:', error);
    res.status(500).json({ error: error.message || 'Failed to unstake tokens' });
  }
});

/**
 * POST /api/cfy/staking/claim-rewards
 * Claim staking rewards
 */
router.post('/staking/claim-rewards', async (req: Request, res: Response) => {
  try {
    const { position_id, transaction_hash } = req.body;

    if (!position_id) {
      return res.status(400).json({ error: 'position_id is required' });
    }

    const stakingService = getCFYStakingService();
    const amount = await stakingService.claimRewards(position_id, transaction_hash);

    res.json({
      message: 'Rewards claimed successfully',
      amount,
    });
  } catch (error: any) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({ error: error.message || 'Failed to claim rewards' });
  }
});

/**
 * GET /api/cfy/staking/rewards/:positionId
 * Get reward history for a position
 */
router.get('/staking/rewards/:positionId', async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const stakingService = getCFYStakingService();
    const rewards = await stakingService.getRewardHistory(parseInt(positionId));

    res.json(rewards);
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch rewards' });
  }
});

/**
 * POST /api/cfy/staking/calculate-all
 * Calculate rewards for all active positions (admin/cron job)
 */
router.post('/staking/calculate-all', async (req: Request, res: Response) => {
  try {
    const stakingService = getCFYStakingService();
    const result = await stakingService.calculateAllRewards();

    res.json({
      message: 'Rewards calculated successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error calculating rewards:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate rewards' });
  }
});

/**
 * POST /api/cfy/vesting/process-monthly
 * Process monthly releases for all eligible beneficiaries (admin/cron job)
 */
router.post('/vesting/process-monthly', async (req: Request, res: Response) => {
  try {
    const vestingService = getCFYVestingService();
    const result = await vestingService.processMonthlyReleases();

    res.json({
      message: 'Monthly releases processed successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Error processing monthly releases:', error);
    res.status(500).json({ error: error.message || 'Failed to process monthly releases' });
  }
});

