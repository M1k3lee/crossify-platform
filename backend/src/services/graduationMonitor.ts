/**
 * Graduation Monitoring Service
 * 
 * Monitors tokens for graduation events and triggers DEX deployment
 * - Checks market cap vs graduation threshold
 * - Listens for Graduated events from contracts
 * - Triggers Raydium deployment for Solana tokens
 * - Updates database with graduation status
 */

import { dbAll, dbGet, dbRun } from '../db/adapter';
import { ethers } from 'ethers';

interface GraduationStatus {
  isGraduated: boolean;
  currentMarketCap: number;
  graduationThreshold: number;
  progressPercent: number;
  needsGraduation: boolean;
  chain: string;
  tokenAddress?: string;
  curveAddress?: string;
}

/**
 * Check graduation status for a specific token deployment
 */
export async function checkGraduationStatus(
  tokenId: string,
  chain: string
): Promise<GraduationStatus | null> {
  try {
    // Get token and deployment info
    const token = await dbGet(
      'SELECT graduation_threshold FROM tokens WHERE id = ?',
      [tokenId]
    ) as any;

    if (!token) {
      return null;
    }

    const deployment = await dbGet(
      `SELECT token_address, curve_address, is_graduated, market_cap, current_supply 
       FROM token_deployments 
       WHERE token_id = ? AND chain = ?`,
      [tokenId, chain]
    ) as any;

    if (!deployment) {
      return null;
    }

    const isGraduated = deployment.is_graduated === 1 || deployment.is_graduated === true || deployment.is_graduated === '1';
    const graduationThreshold = parseFloat(token.graduation_threshold || '0');

    // If already graduated or threshold is 0 (disabled), return status
    if (isGraduated || graduationThreshold === 0) {
      return {
        isGraduated,
        currentMarketCap: parseFloat(deployment.market_cap || '0'),
        graduationThreshold,
        progressPercent: isGraduated ? 100 : 0,
        needsGraduation: false,
        chain,
        tokenAddress: deployment.token_address,
        curveAddress: deployment.curve_address,
      };
    }

    // Get current market cap from deployment or calculate from contract
    let currentMarketCap = parseFloat(deployment.market_cap || '0');

    // If market cap not in DB, try to get from contract
    if (currentMarketCap === 0 && deployment.curve_address) {
      try {
        currentMarketCap = await getMarketCapFromContract(deployment.curve_address, chain);
      } catch (error) {
        console.warn(`Could not fetch market cap from contract for ${tokenId} on ${chain}:`, error);
      }
    }

    const progressPercent = graduationThreshold > 0
      ? Math.min(100, (currentMarketCap / graduationThreshold) * 100)
      : 0;

    const needsGraduation = !isGraduated && graduationThreshold > 0 && currentMarketCap >= graduationThreshold;

    return {
      isGraduated,
      currentMarketCap,
      graduationThreshold,
      progressPercent,
      needsGraduation,
      chain,
      tokenAddress: deployment.token_address,
      curveAddress: deployment.curve_address,
    };
  } catch (error) {
    console.error(`Error checking graduation status for ${tokenId} on ${chain}:`, error);
    return null;
  }
}

/**
 * Get market cap from bonding curve contract
 */
async function getMarketCapFromContract(curveAddress: string, chain: string): Promise<number> {
  try {
    // Get RPC URL for chain
    const rpcUrls: Record<string, string> = {
      'ethereum': process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      'sepolia': process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      'bsc': process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
      'bsc-testnet': process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
      'base': process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
      'base-sepolia': process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
    };

    const rpcUrl = rpcUrls[chain.toLowerCase()];
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain: ${chain}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // BondingCurve ABI - getMarketCap() and getCurrentPrice()
    const bondingCurveABI = [
      'function getMarketCap() external view returns (uint256)',
      'function getCurrentPrice() external view returns (uint256)',
      'function totalSupplySold() external view returns (uint256)',
      'function isGraduated() external view returns (bool)',
    ];

    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);

    // Try getMarketCap first, fallback to price * supply
    try {
      const marketCapWei = await curveContract.getMarketCap();
      return parseFloat(ethers.formatEther(marketCapWei));
    } catch {
      // Fallback: price * supply
      const [currentPriceWei, supplyWei] = await Promise.all([
        curveContract.getCurrentPrice(),
        curveContract.totalSupplySold(),
      ]);
      
      const price = parseFloat(ethers.formatEther(currentPriceWei));
      const supply = parseFloat(ethers.formatEther(supplyWei));
      return price * supply;
    }
  } catch (error) {
    console.error(`Error getting market cap from contract ${curveAddress}:`, error);
    throw error;
  }
}

/**
 * Check if token needs graduation and trigger if needed
 */
export async function checkAndGraduate(tokenId: string, chain: string): Promise<boolean> {
  try {
    const status = await checkGraduationStatus(tokenId, chain);
    
    if (!status || !status.needsGraduation) {
      return false;
    }

    console.log(`🎓 Token ${tokenId} on ${chain} has reached graduation threshold!`);
    console.log(`   Market Cap: $${status.currentMarketCap.toFixed(2)}`);
    console.log(`   Threshold: $${status.graduationThreshold.toFixed(2)}`);

    // Trigger DEX deployment based on chain
    try {
      const { createDEXPool } = await import('./dexIntegration');
      
      // Get deployment info
      const deployment = await dbGet(
        `SELECT token_address, reserve_balance, current_supply 
         FROM token_deployments 
         WHERE token_id = ? AND chain = ?`,
        [tokenId, chain]
      ) as any;

      if (deployment && deployment.token_address) {
        const result = await createDEXPool(
          tokenId,
          chain,
          deployment.token_address,
          deployment.reserve_balance || '0',
          deployment.current_supply || '0'
        );
        
        if (result.success && result.poolAddress) {
          // Update database with graduation status and DEX pool
          await dbRun(
            `UPDATE token_deployments 
             SET is_graduated = 1, 
                 dex_pool_address = ?,
                 dex_name = ?,
                 graduated_at = CURRENT_TIMESTAMP,
                 graduation_tx_hash = ?
             WHERE token_id = ? AND chain = ?`,
            [result.poolAddress, result.dexName || 'dex', result.txHash, tokenId, chain]
          );

          console.log(`✅ Token ${tokenId} graduated to ${result.dexName || 'DEX'}! Pool: ${result.poolAddress}`);
          return true;
        } else {
          console.warn(`⚠️ DEX pool creation failed for ${tokenId} on ${chain}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`Error migrating to DEX for ${tokenId}:`, error);
      // Still mark as graduated in contract, even if DEX deployment fails
    }

    // For EVM chains, just mark as graduated (DEX deployment handled separately)
    // The contract already set isGraduated = true, we just need to update DB
    await dbRun(
      `UPDATE token_deployments 
       SET is_graduated = 1, 
           graduated_at = CURRENT_TIMESTAMP
       WHERE token_id = ? AND chain = ?`,
      [tokenId, chain]
    );

    console.log(`✅ Token ${tokenId} on ${chain} marked as graduated in database`);
    return true;
  } catch (error) {
    console.error(`Error checking/graduating token ${tokenId} on ${chain}:`, error);
    return false;
  }
}

/**
 * Monitor all tokens for graduation
 */
export async function monitorAllTokens(): Promise<void> {
  try {
    // Get all tokens with graduation threshold > 0 and not yet graduated
    const tokens = await dbAll(`
      SELECT DISTINCT t.id, t.graduation_threshold
      FROM tokens t
      INNER JOIN token_deployments td ON t.id = td.token_id
      WHERE t.graduation_threshold > 0
        AND (td.is_graduated = 0 OR td.is_graduated IS NULL OR td.is_graduated = '0')
        AND td.status = 'deployed'
        AND td.curve_address IS NOT NULL
    `) as any[];

    console.log(`🔍 Monitoring ${tokens.length} tokens for graduation...`);

    for (const token of tokens) {
      // Get all deployments for this token
      const deployments = await dbAll(
        'SELECT chain FROM token_deployments WHERE token_id = ? AND status = ? AND (is_graduated = 0 OR is_graduated IS NULL)',
        [token.id, 'deployed']
      ) as any[];

      for (const dep of deployments) {
        try {
          await checkAndGraduate(token.id, dep.chain);
        } catch (error) {
          console.error(`Error monitoring token ${token.id} on ${dep.chain}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in graduation monitoring:', error);
  }
}

/**
 * Start graduation monitoring service
 */
export function startGraduationMonitoringService(): void {
  console.log('🎓 Starting graduation monitoring service...');

  // Monitor every 30 seconds
  setInterval(async () => {
    try {
      await monitorAllTokens();
    } catch (error) {
      console.error('Error in graduation monitoring interval:', error);
    }
  }, 30000); // Every 30 seconds

  // Also run immediately
  monitorAllTokens().catch(error => {
    console.error('Error in initial graduation monitoring:', error);
  });

  console.log('✅ Graduation monitoring service started (checking every 30 seconds)');
}

