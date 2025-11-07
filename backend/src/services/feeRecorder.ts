// Service for recording platform fees to the database
import axios from 'axios';
import { dbRun, dbAll } from '../db';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || 'your-api-key';

interface FeeRecord {
  tokenId?: string;
  chain: string;
  feeType: 'token_creation' | 'mint' | 'cross_chain' | 'bridge' | 'pause' | 'fee_update';
  amount: string;
  amountUsd?: number;
  nativeAmount?: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
}

/**
 * Record a platform fee to the database
 */
export async function recordFee(fee: FeeRecord): Promise<void> {
  try {
    // Calculate USD amount if not provided
    let amountUsd = fee.amountUsd;
    if (!amountUsd && fee.nativeAmount) {
      // In production, use oracle to get current ETH/USD price
      // For now, use a default price (should be updated with real oracle)
      const ethPrice = await getETHPrice();
      amountUsd = parseFloat(fee.nativeAmount) * ethPrice;
    }
    
    // Record in database
    await dbRun(
      `INSERT INTO platform_fees (
        token_id, chain, fee_type, amount, amount_usd, native_amount,
        from_address, to_address, tx_hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        fee.tokenId || null,
        fee.chain,
        fee.feeType,
        fee.amount,
        amountUsd || null,
        fee.nativeAmount || null,
        fee.fromAddress || null,
        fee.toAddress || null,
        fee.txHash || null,
      ]
    );
    
    // Update daily statistics
    const today = new Date().toISOString().split('T')[0];
    const feeTypeColumn = `${fee.feeType}_fees`;
    
    await dbRun(
      `INSERT OR REPLACE INTO fee_statistics (date, ${feeTypeColumn}, total_fees_usd)
       SELECT 
         ? as date,
         COALESCE(SUM(CASE WHEN fee_type = ? THEN amount_usd ELSE 0 END), 0) + ? as ${feeTypeColumn},
         COALESCE(SUM(amount_usd), 0) + ? as total_fees_usd
       FROM platform_fees
       WHERE DATE(collected_at) = ?
       UNION ALL
       SELECT ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM fee_statistics WHERE date = ?)`,
      [
        today, fee.feeType, amountUsd || 0, amountUsd || 0, today,
        today, amountUsd || 0, amountUsd || 0, today
      ]
    );
    
    console.log(`✅ Fee recorded: ${fee.feeType} on ${fee.chain} - ${fee.amount} ($${amountUsd?.toFixed(2) || 'N/A'})`);
  } catch (error) {
    console.error('Error recording fee:', error);
    // Don't throw - fee recording should not break main flow
  }
}

/**
 * Get current ETH price in USD (simplified - use oracle in production)
 */
async function getETHPrice(): Promise<number> {
  try {
    // In production, use Chainlink oracle or similar
    // For now, use a default price or fetch from CoinGecko
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    return response.data.ethereum?.usd || 2500; // Default to $2500 if API fails
  } catch (error) {
    console.warn('Failed to fetch ETH price, using default:', error);
    return 2500; // Default fallback price
  }
}

/**
 * Record token creation fee
 */
export async function recordTokenCreationFee(
  tokenId: string,
  chain: string,
  amount: string,
  txHash?: string
): Promise<void> {
  await recordFee({
    tokenId,
    chain,
    feeType: 'token_creation',
    amount: '0', // Token creation fee is in native token
    nativeAmount: amount,
    txHash,
  });
}

/**
 * Record mint fee
 */
export async function recordMintFee(
  tokenId: string,
  chain: string,
  amount: string,
  amountUsd: number,
  fromAddress: string,
  toAddress: string,
  txHash?: string
): Promise<void> {
  await recordFee({
    tokenId,
    chain,
    feeType: 'mint',
    amount,
    amountUsd,
    fromAddress,
    toAddress,
    txHash,
  });
}

/**
 * Record cross-chain sync fee
 */
export async function recordCrossChainFee(
  tokenId: string,
  chain: string,
  amount: string,
  amountUsd: number,
  txHash?: string
): Promise<void> {
  await recordFee({
    tokenId,
    chain,
    feeType: 'cross_chain',
    amount,
    amountUsd,
    txHash,
  });
}

/**
 * Record bridge fee
 */
export async function recordBridgeFee(
  tokenId: string,
  chain: string,
  amount: string,
  amountUsd: number,
  txHash?: string
): Promise<void> {
  await recordFee({
    tokenId,
    chain,
    feeType: 'bridge',
    amount,
    amountUsd,
    txHash,
  });
}

/**
 * Confirm fee transaction (update status to 'confirmed')
 */
export async function confirmFee(txHash: string): Promise<void> {
  try {
    await dbRun(
      `UPDATE platform_fees SET status = 'confirmed' WHERE tx_hash = ?`,
      [txHash]
    );
    console.log(`✅ Fee confirmed: ${txHash}`);
  } catch (error) {
    console.error('Error confirming fee:', error);
  }
}

/**
 * Get total fees collected (for buyback/liquidity calculations)
 */
export async function getTotalFeesCollected(period: 'day' | 'week' | 'month' = 'month'): Promise<{
  totalUsd: number;
  byType: Record<string, number>;
}> {
  try {
    let dateFilter = "datetime('now', '-30 days')";
    if (period === 'day') dateFilter = "datetime('now', '-1 day')";
    if (period === 'week') dateFilter = "datetime('now', '-7 days')";
    
    const fees = await dbAll<{ fee_type: string; total: number }>(
      `SELECT 
        fee_type,
        SUM(amount_usd) as total
      FROM platform_fees
      WHERE collected_at >= ${dateFilter}
      AND status = 'confirmed'
      GROUP BY fee_type`
    );
    
    const byType: Record<string, number> = {};
    let totalUsd = 0;
    
    fees.forEach((fee: any) => {
      byType[fee.fee_type] = fee.total || 0;
      totalUsd += fee.total || 0;
    });
    
    return { totalUsd, byType };
  } catch (error) {
    console.error('Error getting total fees:', error);
    return { totalUsd: 0, byType: {} };
  }
}




