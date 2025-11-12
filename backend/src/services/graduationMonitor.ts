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
 * Enhanced with better error handling and retry logic
 */
export async function checkAndGraduate(tokenId: string, chain: string, retryCount: number = 0): Promise<boolean> {
  const maxRetries = 3;
  
  try {
    const status = await checkGraduationStatus(tokenId, chain);
    
    if (!status || !status.needsGraduation) {
      return false;
    }

    console.log(`🎓 Token ${tokenId} on ${chain} has reached graduation threshold!`);
    console.log(`   Market Cap: $${status.currentMarketCap.toFixed(2)}`);
    console.log(`   Threshold: $${status.graduationThreshold.toFixed(2)}`);
    console.log(`   Chain: ${chain} → DEX: ${getDEXNameForChain(chain)}`);

    // Validate chain support
    const { isChainSupportedForGraduation } = await import('./dexIntegration');
    if (!isChainSupportedForGraduation(chain)) {
      console.warn(`⚠️ Chain ${chain} not supported for DEX graduation`);
      return false;
    }

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

      if (!deployment || !deployment.token_address) {
        console.warn(`⚠️ No deployment found for token ${tokenId} on ${chain}`);
        return false;
      }

      // Check minimum liquidity requirement (0.1 native token)
      const reserveAmount = parseFloat(deployment.reserve_balance || '0');
      const minLiquidity = 0.1;
      
      if (reserveAmount < minLiquidity) {
        console.warn(
          `⚠️ Insufficient liquidity for ${tokenId} on ${chain}: ` +
          `${reserveAmount} < ${minLiquidity} (minimum required)`
        );
        return false;
      }

      // Create DEX pool
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
          [
            result.poolAddress,
            result.dexName || getDEXNameForChain(chain),
            result.txHash || null,
            tokenId,
            chain
          ]
        );

        console.log(
          `✅ Token ${tokenId} graduated on ${chain} to ${result.dexName || getDEXNameForChain(chain)}! ` +
          `Pool: ${result.poolAddress}`
        );
        return true;
      } else {
        const errorMsg = result.error || 'Unknown error';
        console.warn(`⚠️ DEX pool creation failed for ${tokenId} on ${chain}: ${errorMsg}`);
        
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`🔄 Retrying graduation for ${tokenId} on ${chain} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return await checkAndGraduate(tokenId, chain, retryCount + 1);
        }
        
        return false;
      }
    } catch (error: any) {
      console.error(`Error migrating to DEX for ${tokenId} on ${chain}:`, error);
      
      // Retry on transient errors
      if (retryCount < maxRetries && isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying graduation for ${tokenId} on ${chain} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return await checkAndGraduate(tokenId, chain, retryCount + 1);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error checking/graduating token ${tokenId} on ${chain}:`, error);
    return false;
  }
}

/**
 * Get DEX name for a chain
 */
function getDEXNameForChain(chain: string): string {
  const chainLower = chain.toLowerCase();
  
  if (chainLower.includes('solana')) {
    return 'raydium';
  } else if (chainLower.includes('ethereum') || chainLower.includes('sepolia')) {
    return 'uniswap-v3';
  } else if (chainLower.includes('bsc') || chainLower.includes('binance')) {
    return 'pancakeswap';
  } else if (chainLower.includes('base')) {
    return 'baseswap'; // or 'uniswap-v3' if using Uniswap on Base
  }
  
  return 'unknown';
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorMsg = error.message?.toLowerCase() || '';
  const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'econnrefused',
    'etimedout',
    'rate limit',
    'temporary',
    '503',
    '502',
    '504',
  ];
  
  return retryablePatterns.some(pattern => errorMsg.includes(pattern));
}

/**
 * Check and graduate a token on multiple chains in parallel
 * For cross-chain tokens: Graduates ALL chains simultaneously when ANY chain hits threshold
 * For single-chain tokens: Graduates only when that chain hits threshold
 * This maintains price consistency across chains for cross-chain tokens
 */
export async function checkAndGraduateTokenOnAllChains(tokenId: string): Promise<{
  totalChains: number;
  eligibleChains: number;
  successful: number;
  failed: number;
  results: Array<{ chain: string; success: boolean; error?: string }>;
}> {
  try {
    // Get token info to check if it's cross-chain enabled
    const token = await dbGet(
      'SELECT cross_chain_enabled FROM tokens WHERE id = ?',
      [tokenId]
    ) as any;

    const isCrossChain = token?.cross_chain_enabled === 1 || token?.cross_chain_enabled === true;

    // Get all deployments for this token
    const deployments = await dbAll(
      `SELECT chain, token_address, reserve_balance, current_supply, is_graduated, curve_address
       FROM token_deployments 
       WHERE token_id = ? AND status = 'deployed' 
         AND (is_graduated = 0 OR is_graduated IS NULL OR is_graduated = '0')
         AND curve_address IS NOT NULL`,
      [tokenId]
    ) as any[];

    if (deployments.length === 0) {
      return { totalChains: 0, eligibleChains: 0, successful: 0, failed: 0, results: [] };
    }

    // Check graduation status for all chains in parallel
    const statusChecks = await Promise.allSettled(
      deployments.map(dep => checkGraduationStatus(tokenId, dep.chain))
    );

    // Identify chains that need graduation
    const eligibleChains: Array<{ deployment: any; status: GraduationStatus }> = [];
    let anyChainReady = false;
    
    for (let i = 0; i < deployments.length; i++) {
      const dep = deployments[i];
      const statusResult = statusChecks[i];
      
      if (statusResult.status === 'fulfilled' && statusResult.value?.needsGraduation) {
        eligibleChains.push({
          deployment: dep,
          status: statusResult.value,
        });
        anyChainReady = true;
      }
    }

    // For cross-chain tokens: If ANY chain is ready, graduate ALL chains simultaneously
    // This maintains price consistency across chains
    if (isCrossChain && anyChainReady && deployments.length > 1) {
      console.log(
        `🌐 Cross-chain token ${tokenId}: Chain hit threshold! ` +
        `Graduating ALL ${deployments.length} chains simultaneously to maintain price consistency`
      );
      
      // Add all chains (even if they haven't hit threshold individually)
      const allChainsToGraduate: Array<{ deployment: any; status: GraduationStatus | null }> = [];
      
      for (let i = 0; i < deployments.length; i++) {
        const dep = deployments[i];
        const statusResult = statusChecks[i];
        const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
        
        allChainsToGraduate.push({
          deployment: dep,
          status: status,
        });
      }

      // Graduate all chains in parallel
      const graduationResults = await Promise.allSettled(
        allChainsToGraduate.map(({ deployment }) =>
          checkAndGraduate(tokenId, deployment.chain)
        )
      );

      // Process results
      const results: Array<{ chain: string; success: boolean; error?: string }> = [];
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < allChainsToGraduate.length; i++) {
        const { deployment, status } = allChainsToGraduate[i];
        const result = graduationResults[i];

        if (result.status === 'fulfilled' && result.value === true) {
          successful++;
          const wasReady = status?.needsGraduation ? ' (ready)' : ' (coordinated)';
          results.push({ chain: deployment.chain, success: true });
          console.log(`✅ Token ${tokenId} graduated on ${deployment.chain}${wasReady}`);
        } else {
          failed++;
          const error = result.status === 'rejected' 
            ? result.reason?.message || 'Unknown error'
            : 'Graduation failed';
          results.push({ chain: deployment.chain, success: false, error });
          console.error(`❌ Token ${tokenId} graduation failed on ${deployment.chain}: ${error}`);
        }
      }

      return {
        totalChains: deployments.length,
        eligibleChains: deployments.length, // All chains for cross-chain tokens
        successful,
        failed,
        results,
      };
    }

    // For single-chain tokens OR if no chain is ready: Only graduate eligible chains
    if (eligibleChains.length === 0) {
      return {
        totalChains: deployments.length,
        eligibleChains: 0,
        successful: 0,
        failed: 0,
        results: deployments.map(d => ({ chain: d.chain, success: false, error: 'Not ready for graduation' })),
      };
    }

    console.log(`🎓 Token ${tokenId}: ${eligibleChains.length} of ${deployments.length} chains ready for graduation`);

    // Graduate all eligible chains in parallel
    const graduationResults = await Promise.allSettled(
      eligibleChains.map(({ deployment, status }) =>
        checkAndGraduate(tokenId, deployment.chain)
      )
    );

    // Process results (for single-chain tokens or when not all chains graduate)
    const results: Array<{ chain: string; success: boolean; error?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < eligibleChains.length; i++) {
      const { deployment } = eligibleChains[i];
      const result = graduationResults[i];

      if (result.status === 'fulfilled' && result.value === true) {
        successful++;
        results.push({ chain: deployment.chain, success: true });
        console.log(`✅ Token ${tokenId} graduated on ${deployment.chain}`);
      } else {
        failed++;
        const error = result.status === 'rejected' 
          ? result.reason?.message || 'Unknown error'
          : 'Graduation failed';
        results.push({ chain: deployment.chain, success: false, error });
        console.error(`❌ Token ${tokenId} graduation failed on ${deployment.chain}: ${error}`);
      }
    }

    // Add chains that weren't eligible
    const eligibleChainNames = new Set(eligibleChains.map(c => c.deployment.chain));
    for (const dep of deployments) {
      if (!eligibleChainNames.has(dep.chain)) {
        results.push({ chain: dep.chain, success: false, error: 'Not ready for graduation' });
      }
    }

    return {
      totalChains: deployments.length,
      eligibleChains: eligibleChains.length,
      successful,
      failed,
      results,
    };
  } catch (error: any) {
    console.error(`Error checking/graduating token ${tokenId} on all chains:`, error);
    return {
      totalChains: 0,
      eligibleChains: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  }
}

/**
 * Monitor all tokens for graduation
 * Enhanced to handle cross-chain tokens with parallel execution
 */
export async function monitorAllTokens(): Promise<void> {
  try {
    // Get all tokens with graduation threshold > 0 and not yet graduated
    const tokens = await dbAll(`
      SELECT DISTINCT t.id, t.graduation_threshold, t.cross_chain_enabled
      FROM tokens t
      INNER JOIN token_deployments td ON t.id = td.token_id
      WHERE t.graduation_threshold > 0
        AND (td.is_graduated = 0 OR td.is_graduated IS NULL OR td.is_graduated = '0')
        AND td.status = 'deployed'
        AND td.curve_address IS NOT NULL
    `) as any[];

    console.log(`🔍 Monitoring ${tokens.length} tokens for graduation...`);

    // Process tokens in parallel batches (max 5 at a time to avoid overwhelming the system)
    const batchSize = 5;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (token) => {
          try {
            const result = await checkAndGraduateTokenOnAllChains(token.id);
            
            if (result.eligibleChains > 0) {
              console.log(
                `📊 Token ${token.id}: ${result.successful}/${result.eligibleChains} chains graduated successfully` +
                (result.failed > 0 ? `, ${result.failed} failed` : '')
              );
            }
          } catch (error) {
            console.error(`Error monitoring token ${token.id}:`, error);
          }
        })
      );
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

