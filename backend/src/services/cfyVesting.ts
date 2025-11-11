import { pgGet, pgAll, pgRun } from '../db/postgres';

interface VestingSchedule {
  id: number;
  beneficiary_address: string;
  total_amount: string;
  tge_amount: string;
  vesting_amount: string;
  tge_released: boolean;
  vesting_start_date: string;
  vesting_duration_months: number;
  monthly_release_amount: string;
  total_released: string;
  last_release_date: string | null;
}

/**
 * CFY Vesting Service
 * Manages token vesting for presale buyers
 * Schedule: 20% at TGE, 80% linear over 18 months
 */
export class CFYVestingService {
  /**
   * Create vesting schedule from presale allocation
   */
  async createVestingSchedule(
    beneficiaryAddress: string,
    totalTokens: string,
    tgePercentage: number = 20,
    vestingMonths: number = 18
  ): Promise<number> {
    const total = BigInt(totalTokens);
    const tgeAmount = (total * BigInt(tgePercentage)) / BigInt(100);
    const vestingAmount = total - tgeAmount;
    const monthlyRelease = vestingAmount / BigInt(vestingMonths);

    const result = await pgRun(
      `INSERT INTO cfy_vesting_schedules 
       (beneficiary_address, total_amount, tge_amount, vesting_amount, 
        vesting_start_date, vesting_duration_months, monthly_release_amount)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
       ON CONFLICT (beneficiary_address) DO UPDATE SET
         total_amount = EXCLUDED.total_amount,
         tge_amount = EXCLUDED.tge_amount,
         vesting_amount = EXCLUDED.vesting_amount,
         monthly_release_amount = EXCLUDED.monthly_release_amount,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        beneficiaryAddress,
        totalTokens,
        tgeAmount.toString(),
        vestingAmount.toString(),
        vestingMonths,
        monthlyRelease.toString(),
      ]
    );

    return result.lastID;
  }

  /**
   * Get vesting schedule for a beneficiary
   */
  async getVestingSchedule(beneficiaryAddress: string): Promise<VestingSchedule | null> {
    return await pgGet<VestingSchedule>(
      'SELECT * FROM cfy_vesting_schedules WHERE beneficiary_address = $1',
      [beneficiaryAddress]
    );
  }

  /**
   * Get all vesting schedules
   */
  async getAllVestingSchedules(): Promise<VestingSchedule[]> {
    return await pgAll<VestingSchedule>(
      'SELECT * FROM cfy_vesting_schedules ORDER BY created_at DESC'
    );
  }

  /**
   * Calculate currently releasable amount
   */
  async calculateReleasableAmount(beneficiaryAddress: string): Promise<{
    tgeReleasable: string;
    monthlyReleasable: string;
    totalReleasable: string;
    nextReleaseDate: string | null;
  }> {
    const schedule = await this.getVestingSchedule(beneficiaryAddress);
    if (!schedule) {
      return {
        tgeReleasable: '0',
        monthlyReleasable: '0',
        totalReleasable: '0',
        nextReleaseDate: null,
      };
    }

    let tgeReleasable = '0';
    if (!schedule.tge_released) {
      tgeReleasable = schedule.tge_amount;
    }

    // Calculate monthly releases
    const now = new Date();
    const vestingStart = new Date(schedule.vesting_start_date);
    const monthsElapsed = Math.floor(
      (now.getTime() - vestingStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const totalReleased = BigInt(schedule.total_released);
    const tgeReleased = schedule.tge_released ? BigInt(schedule.tge_amount) : BigInt(0);
    const monthlyReleased = totalReleased - tgeReleased;

    const expectedMonthlyReleases = BigInt(monthsElapsed) * BigInt(schedule.monthly_release_amount);
    const monthlyReleasable = expectedMonthlyReleases > monthlyReleased
      ? (expectedMonthlyReleases - monthlyReleased).toString()
      : '0';

    const totalReleasable = (BigInt(tgeReleasable) + BigInt(monthlyReleasable)).toString();

    // Calculate next release date (first of next month)
    const nextReleaseDate = new Date(vestingStart);
    nextReleaseDate.setMonth(nextReleaseDate.getMonth() + monthsElapsed + 1);
    nextReleaseDate.setDate(1);

    return {
      tgeReleasable,
      monthlyReleasable,
      totalReleasable,
      nextReleaseDate: nextReleaseDate.toISOString(),
    };
  }

  /**
   * Release TGE tokens (20% at launch)
   */
  async releaseTGE(beneficiaryAddress: string, transactionHash?: string): Promise<void> {
    const schedule = await this.getVestingSchedule(beneficiaryAddress);
    if (!schedule) {
      throw new Error('Vesting schedule not found');
    }

    if (schedule.tge_released) {
      throw new Error('TGE already released');
    }

    // Record release
    await pgRun(
      `INSERT INTO cfy_vesting_releases 
       (vesting_schedule_id, beneficiary_address, release_amount, release_type, release_date, transaction_hash, status)
       VALUES ($1, $2, $3, 'tge', CURRENT_TIMESTAMP, $4, 'completed')`,
      [schedule.id, beneficiaryAddress, schedule.tge_amount, transactionHash || null]
    );

    // Update schedule
    await pgRun(
      `UPDATE cfy_vesting_schedules 
       SET tge_released = true,
           tge_released_at = CURRENT_TIMESTAMP,
           total_released = tge_amount,
           last_release_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [schedule.id]
    );
  }

  /**
   * Release monthly vesting amount
   */
  async releaseMonthly(beneficiaryAddress: string, transactionHash?: string): Promise<string> {
    const schedule = await this.getVestingSchedule(beneficiaryAddress);
    if (!schedule) {
      throw new Error('Vesting schedule not found');
    }

    const releasable = await this.calculateReleasableAmount(beneficiaryAddress);
    const monthlyAmount = releasable.monthlyReleasable;

    if (monthlyAmount === '0' || BigInt(monthlyAmount) === BigInt(0)) {
      throw new Error('No monthly tokens available for release');
    }

    // Record release
    await pgRun(
      `INSERT INTO cfy_vesting_releases 
       (vesting_schedule_id, beneficiary_address, release_amount, release_type, release_date, transaction_hash, status)
       VALUES ($1, $2, $3, 'monthly', CURRENT_TIMESTAMP, $4, 'completed')`,
      [schedule.id, beneficiaryAddress, monthlyAmount, transactionHash || null]
    );

    // Update schedule
    const newTotalReleased = (BigInt(schedule.total_released) + BigInt(monthlyAmount)).toString();
    await pgRun(
      `UPDATE cfy_vesting_schedules 
       SET total_released = $1,
           last_release_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newTotalReleased, schedule.id]
    );

    return monthlyAmount;
  }

  /**
   * Get release history for a beneficiary
   */
  async getReleaseHistory(beneficiaryAddress: string) {
    return await pgAll(
      `SELECT vr.*, vs.total_amount, vs.vesting_duration_months
       FROM cfy_vesting_releases vr
       JOIN cfy_vesting_schedules vs ON vr.vesting_schedule_id = vs.id
       WHERE vr.beneficiary_address = $1
       ORDER BY vr.release_date DESC`,
      [beneficiaryAddress]
    );
  }

  /**
   * Initialize vesting schedules from presale allocations
   * Call this after presale ends and token is deployed
   */
  async initializeFromPresale(presaleId: string): Promise<number> {
    const allocations = await pgAll(
      'SELECT buyer_address, total_tokens_allocated FROM presale_allocations WHERE presale_id = $1',
      [presaleId]
    );

    let count = 0;
    for (const allocation of allocations) {
      try {
        await this.createVestingSchedule(
          allocation.buyer_address,
          allocation.total_tokens_allocated,
          20, // 20% TGE
          18  // 18 months
        );
        count++;
      } catch (error) {
        console.error(`Error creating vesting for ${allocation.buyer_address}:`, error);
      }
    }

    return count;
  }

  /**
   * Process monthly releases for all eligible beneficiaries
   * Should be run monthly (via cron job)
   */
  async processMonthlyReleases(): Promise<{ released: number; totalAmount: string }> {
    const schedules = await this.getAllVestingSchedules();
    let released = 0;
    let totalAmount = BigInt(0);

    for (const schedule of schedules) {
      try {
        const releasable = await this.calculateReleasableAmount(schedule.beneficiary_address);
        if (BigInt(releasable.monthlyReleasable) > BigInt(0)) {
          await this.releaseMonthly(schedule.beneficiary_address);
          totalAmount += BigInt(releasable.monthlyReleasable);
          released++;
        }
      } catch (error) {
        console.error(`Error processing release for ${schedule.beneficiary_address}:`, error);
      }
    }

    return {
      released,
      totalAmount: totalAmount.toString(),
    };
  }
}

// Singleton instance
let vestingServiceInstance: CFYVestingService | null = null;

export function getCFYVestingService(): CFYVestingService {
  if (!vestingServiceInstance) {
    vestingServiceInstance = new CFYVestingService();
  }
  return vestingServiceInstance;
}

