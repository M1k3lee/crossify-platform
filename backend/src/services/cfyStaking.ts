import { pgGet, pgAll, pgRun } from '../db/postgres';

interface StakingPool {
  id: number;
  pool_name: string;
  pool_type: string;
  apy_percentage: number;
  lock_period_days: number | null;
  min_stake_amount: string;
  max_stake_amount: string | null;
  total_staked: string;
  total_rewards_distributed: string;
  is_active: boolean;
}

interface StakingPosition {
  id: number;
  pool_id: number;
  staker_address: string;
  staked_amount: string;
  staked_at: string;
  lock_until: string | null;
  total_rewards_earned: string;
  rewards_claimed: string;
  last_reward_calculation: string;
  is_active: boolean;
}

/**
 * CFY Staking Service
 * Manages staking pools and rewards for CFY token
 */
export class CFYStakingService {
  /**
   * Initialize default staking pools
   */
  async initializePools(): Promise<void> {
    const pools = [
      {
        pool_name: 'Flexible Staking',
        pool_type: 'flexible',
        apy_percentage: 15,
        lock_period_days: null,
        min_stake_amount: '1000',
        max_stake_amount: null,
      },
      {
        pool_name: '30-Day Lock',
        pool_type: '30day',
        apy_percentage: 30,
        lock_period_days: 30,
        min_stake_amount: '1000',
        max_stake_amount: null,
      },
      {
        pool_name: '90-Day Lock',
        pool_type: '90day',
        apy_percentage: 40,
        lock_period_days: 90,
        min_stake_amount: '1000',
        max_stake_amount: null,
      },
      {
        pool_name: '180-Day Lock',
        pool_type: '180day',
        apy_percentage: 50,
        lock_period_days: 180,
        min_stake_amount: '1000',
        max_stake_amount: null,
      },
    ];

    for (const pool of pools) {
      await pgRun(
        `INSERT INTO cfy_staking_pools 
         (pool_name, pool_type, apy_percentage, lock_period_days, min_stake_amount, max_stake_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (pool_name) DO NOTHING`,
        [
          pool.pool_name,
          pool.pool_type,
          pool.apy_percentage,
          pool.lock_period_days,
          pool.min_stake_amount,
          pool.max_stake_amount,
        ]
      );
    }
  }

  /**
   * Get all staking pools
   */
  async getPools(): Promise<StakingPool[]> {
    return await pgAll<StakingPool>(
      'SELECT * FROM cfy_staking_pools WHERE is_active = true ORDER BY apy_percentage DESC'
    );
  }

  /**
   * Get a specific pool
   */
  async getPool(poolId: number): Promise<StakingPool | null> {
    return await pgGet<StakingPool>(
      'SELECT * FROM cfy_staking_pools WHERE id = $1',
      [poolId]
    );
  }

  /**
   * Stake tokens
   */
  async stake(
    poolId: number,
    stakerAddress: string,
    amount: string,
    transactionHash?: string
  ): Promise<number> {
    const pool = await this.getPool(poolId);
    if (!pool) {
      throw new Error('Staking pool not found');
    }

    if (!pool.is_active) {
      throw new Error('Staking pool is not active');
    }

    const stakeAmount = BigInt(amount);
    const minStake = BigInt(pool.min_stake_amount);
    if (stakeAmount < minStake) {
      throw new Error(`Minimum stake amount is ${pool.min_stake_amount} CFY`);
    }

    if (pool.max_stake_amount) {
      const maxStake = BigInt(pool.max_stake_amount);
      if (stakeAmount > maxStake) {
        throw new Error(`Maximum stake amount is ${pool.max_stake_amount} CFY`);
      }
    }

    // Calculate lock until date
    let lockUntil: Date | null = null;
    if (pool.lock_period_days) {
      lockUntil = new Date();
      lockUntil.setDate(lockUntil.getDate() + pool.lock_period_days);
    }

    // Create staking position
    const result = await pgRun(
      `INSERT INTO cfy_staking_positions 
       (pool_id, staker_address, staked_amount, staked_at, lock_until)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
       RETURNING id`,
      [poolId, stakerAddress, amount, lockUntil?.toISOString() || null]
    );

    // Update pool total staked
    const newTotalStaked = (BigInt(pool.total_staked) + stakeAmount).toString();
    await pgRun(
      `UPDATE cfy_staking_pools 
       SET total_staked = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newTotalStaked, poolId]
    );

    return result.lastID;
  }

  /**
   * Unstake tokens
   */
  async unstake(positionId: number, transactionHash?: string): Promise<void> {
    const position = await pgGet<StakingPosition>(
      'SELECT * FROM cfy_staking_positions WHERE id = $1',
      [positionId]
    );

    if (!position) {
      throw new Error('Staking position not found');
    }

    if (!position.is_active) {
      throw new Error('Position already unstaked');
    }

    // Check lock period
    if (position.lock_until) {
      const lockUntil = new Date(position.lock_until);
      const now = new Date();
      if (now < lockUntil) {
        throw new Error(`Tokens are locked until ${lockUntil.toISOString()}`);
      }
    }

    // Calculate final rewards before unstaking
    await this.calculateRewards(positionId);

    // Update position
    await pgRun(
      `UPDATE cfy_staking_positions 
       SET is_active = false,
           unstaked_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [positionId]
    );

    // Update pool total staked
    const pool = await this.getPool(position.pool_id);
    if (pool) {
      const newTotalStaked = (BigInt(pool.total_staked) - BigInt(position.staked_amount)).toString();
      await pgRun(
        `UPDATE cfy_staking_pools 
         SET total_staked = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newTotalStaked, pool.id]
      );
    }
  }

  /**
   * Calculate rewards for a staking position
   */
  async calculateRewards(positionId: number): Promise<string> {
    const position = await pgGet<StakingPosition>(
      'SELECT * FROM cfy_staking_positions WHERE id = $1',
      [positionId]
    );

    if (!position || !position.is_active) {
      return '0';
    }

    const pool = await this.getPool(position.pool_id);
    if (!pool) {
      return '0';
    }

    // Calculate time elapsed since last calculation
    const lastCalc = new Date(position.last_reward_calculation);
    const now = new Date();
    const daysElapsed = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60 * 24);
    const yearsElapsed = daysElapsed / 365;

    // Calculate rewards: amount * APY * years_elapsed
    const stakedAmount = BigInt(position.staked_amount);
    const apyDecimal = pool.apy_percentage / 100;
    const rewards = stakedAmount * BigInt(Math.floor(apyDecimal * yearsElapsed * 10000)) / BigInt(10000);

    if (rewards > BigInt(0)) {
      // Record reward
      await pgRun(
        `INSERT INTO cfy_staking_rewards 
         (position_id, staker_address, reward_amount, reward_period_start, reward_period_end)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          positionId,
          position.staker_address,
          rewards.toString(),
          position.last_reward_calculation,
          now.toISOString(),
        ]
      );

      // Update position
      const newTotalRewards = (BigInt(position.total_rewards_earned) + rewards).toString();
      await pgRun(
        `UPDATE cfy_staking_positions 
         SET total_rewards_earned = $1,
             last_reward_calculation = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newTotalRewards, positionId]
      );

      // Update pool
      const newTotalDistributed = (BigInt(pool.total_rewards_distributed) + rewards).toString();
      await pgRun(
        `UPDATE cfy_staking_pools 
         SET total_rewards_distributed = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newTotalDistributed, pool.id]
      );
    }

    return rewards.toString();
  }

  /**
   * Get staking positions for a user
   */
  async getUserPositions(stakerAddress: string): Promise<StakingPosition[]> {
    return await pgAll<StakingPosition>(
      `SELECT * FROM cfy_staking_positions 
       WHERE staker_address = $1 
       ORDER BY staked_at DESC`,
      [stakerAddress]
    );
  }

  /**
   * Get active position for user in a pool
   */
  async getUserPoolPosition(stakerAddress: string, poolId: number): Promise<StakingPosition | null> {
    return await pgGet<StakingPosition>(
      `SELECT * FROM cfy_staking_positions 
       WHERE staker_address = $1 AND pool_id = $2 AND is_active = true
       ORDER BY staked_at DESC
       LIMIT 1`,
      [stakerAddress, poolId]
    );
  }

  /**
   * Claim rewards
   */
  async claimRewards(positionId: number, transactionHash?: string): Promise<string> {
    // Calculate current rewards
    await this.calculateRewards(positionId);

    const position = await pgGet<StakingPosition>(
      'SELECT * FROM cfy_staking_positions WHERE id = $1',
      [positionId]
    );

    if (!position) {
      throw new Error('Position not found');
    }

    const claimable = BigInt(position.total_rewards_earned) - BigInt(position.rewards_claimed);
    if (claimable <= BigInt(0)) {
      throw new Error('No rewards available to claim');
    }

    // Update position
    const newClaimed = (BigInt(position.rewards_claimed) + claimable).toString();
    await pgRun(
      `UPDATE cfy_staking_positions 
       SET rewards_claimed = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newClaimed, positionId]
    );

    // Update rewards records
    await pgRun(
      `UPDATE cfy_staking_rewards 
       SET claimed_at = CURRENT_TIMESTAMP, transaction_hash = $1
       WHERE position_id = $2 AND claimed_at IS NULL`,
      [transactionHash || null, positionId]
    );

    return claimable.toString();
  }

  /**
   * Get reward history for a position
   */
  async getRewardHistory(positionId: number) {
    return await pgAll(
      `SELECT * FROM cfy_staking_rewards 
       WHERE position_id = $1 
       ORDER BY reward_period_start DESC`,
      [positionId]
    );
  }

  /**
   * Calculate total rewards for all active positions
   * Should be run periodically (via cron job)
   */
  async calculateAllRewards(): Promise<{ calculated: number; totalRewards: string }> {
    const positions = await pgAll<StakingPosition>(
      'SELECT * FROM cfy_staking_positions WHERE is_active = true'
    );

    let calculated = 0;
    let totalRewards = BigInt(0);

    for (const position of positions) {
      try {
        const rewards = await this.calculateRewards(position.id);
        totalRewards += BigInt(rewards);
        calculated++;
      } catch (error) {
        console.error(`Error calculating rewards for position ${position.id}:`, error);
      }
    }

    return {
      calculated,
      totalRewards: totalRewards.toString(),
    };
  }
}

// Singleton instance
let stakingServiceInstance: CFYStakingService | null = null;

export function getCFYStakingService(): CFYStakingService {
  if (!stakingServiceInstance) {
    stakingServiceInstance = new CFYStakingService();
    // Initialize pools on first use
    stakingServiceInstance.initializePools().catch(console.error);
  }
  return stakingServiceInstance;
}

