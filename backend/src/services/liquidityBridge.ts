// Backend service for cross-chain liquidity bridging and rebalancing
import { dbGet, dbAll, dbRun } from '../db/adapter';

interface ChainReserve {
  chain: string;
  reserve: string;
  idealReserve: string;
  status: 'sufficient' | 'low' | 'critical';
}

interface LiquidityRequest {
  tokenId: string;
  sourceChain: string;
  targetChain: string;
  amount: string;
  status: 'pending' | 'bridging' | 'completed' | 'failed';
}

/**
 * Monitor reserve levels across all chains for a token
 */
export async function monitorReserves(tokenId: string): Promise<ChainReserve[]> {
  try {
    // Get all deployments for this token
    const deployments = await dbAll(
      `SELECT chain, reserve_balance, current_supply FROM token_deployments WHERE token_id = ? AND status = 'deployed'`,
      [tokenId]
    ) as any[];

    // Get token parameters
    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [tokenId]) as any;
    if (!token) {
      throw new Error('Token not found');
    }

    // Calculate ideal reserves per chain based on trading volume
    const totalReserve = deployments.reduce((sum, d) => sum + parseFloat(d.reserve_balance || '0'), 0);
    const totalVolume = deployments.reduce((sum, d) => sum + parseFloat(d.current_supply || '0'), 0);

    const reserves: ChainReserve[] = deployments.map(dep => {
      const reserve = parseFloat(dep.reserve_balance || '0');
      const volume = parseFloat(dep.current_supply || '0');
      
      // Ideal reserve = (totalReserve * chainVolume) / totalVolume
      const idealReserve = totalVolume > 0 
        ? (totalReserve * volume) / totalVolume 
        : totalReserve / deployments.length;
      
      // Minimum reserve = 30% of ideal
      const minReserve = idealReserve * 0.3;
      
      let status: 'sufficient' | 'low' | 'critical';
      if (reserve < minReserve * 0.5) {
        status = 'critical';
      } else if (reserve < minReserve) {
        status = 'low';
      } else {
        status = 'sufficient';
      }

      return {
        chain: dep.chain,
        reserve: reserve.toString(),
        idealReserve: idealReserve.toString(),
        status,
      };
    });

    return reserves;
  } catch (error) {
    console.error('Error monitoring reserves:', error);
    throw error;
  }
}

/**
 * Check if rebalancing is needed and trigger if necessary
 */
export async function checkAndRebalance(tokenId: string): Promise<boolean> {
  try {
    const reserves = await monitorReserves(tokenId);
    
    // Find chains with critical or low reserves
    const lowReserveChains = reserves.filter(r => r.status === 'low' || r.status === 'critical');
    const highReserveChains = reserves.filter(r => r.status === 'sufficient' && parseFloat(r.reserve) > parseFloat(r.idealReserve) * 1.5);

    if (lowReserveChains.length === 0) {
      return false; // No rebalancing needed
    }

    // Rebalance from high-reserve chains to low-reserve chains
    for (const lowChain of lowReserveChains) {
      const lowReserve = parseFloat(lowChain.reserve);
      const idealReserve = parseFloat(lowChain.idealReserve);
      const needed = idealReserve - lowReserve;

      // Find a chain with excess liquidity
      for (const highChain of highReserveChains) {
        const highReserve = parseFloat(highChain.reserve);
        const excess = highReserve - parseFloat(highChain.idealReserve);

        if (excess >= needed) {
          // Trigger bridge from highChain to lowChain
          await triggerLiquidityBridge(tokenId, highChain.chain, lowChain.chain, needed.toString());
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking rebalance:', error);
    return false;
  }
}

/**
 * Trigger liquidity bridge between chains
 */
async function triggerLiquidityBridge(
  tokenId: string,
  sourceChain: string,
  targetChain: string,
  amount: string
): Promise<void> {
  try {
    console.log(`🌉 Bridging ${amount} from ${sourceChain} to ${targetChain} for token ${tokenId}`);

    // Import bridge service
    const { executeBridge } = await import('./bridgeService');
    
    // Execute the bridge
    const result = await executeBridge(tokenId, sourceChain, targetChain, amount);
    
    if (result.success) {
      console.log(`✅ Liquidity bridge completed: ${sourceChain} → ${targetChain}, Amount: ${amount}, TX: ${result.txHash}`);
    } else {
      console.error(`❌ Liquidity bridge failed: ${result.message}`);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error triggering liquidity bridge:', error);
    throw error;
  }
}

/**
 * Get reserve status for a specific chain
 */
export async function getChainReserveStatus(tokenId: string, chain: string): Promise<{
  currentReserve: string;
  idealReserve: string;
  minReserve: string;
  status: 'sufficient' | 'low' | 'critical';
  canSell: boolean;
}> {
  const reserves = await monitorReserves(tokenId);
  const chainReserve = reserves.find(r => r.chain === chain);

  if (!chainReserve) {
    throw new Error(`No deployment found for chain ${chain}`);
  }

  const currentReserve = parseFloat(chainReserve.reserve);
  const idealReserve = parseFloat(chainReserve.idealReserve);
  const minReserve = idealReserve * 0.3;

  return {
    currentReserve: chainReserve.reserve,
    idealReserve: chainReserve.idealReserve,
    minReserve: minReserve.toString(),
    status: chainReserve.status,
    canSell: currentReserve >= minReserve * 0.5, // Can sell if reserve > 15% of ideal
  };
}

/**
 * Start liquidity monitoring service
 */
export function startLiquidityMonitoringService() {
  console.log('🔄 Starting liquidity monitoring service...');

  // Monitor all tokens every 30 seconds
  setInterval(async () => {
    try {
      // Get all tokens with cross-chain enabled
      const tokens = await dbAll(
        'SELECT id FROM tokens WHERE cross_chain_enabled = 1'
      ) as any[];

      for (const token of tokens) {
        try {
          const needsRebalance = await checkAndRebalance(token.id);
          if (needsRebalance) {
            console.log(`⚖️  Rebalancing triggered for token ${token.id}`);
          }
        } catch (error) {
          console.error(`Error monitoring token ${token.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in liquidity monitoring:', error);
    }
  }, 30000); // Every 30 seconds

  console.log('✅ Liquidity monitoring service started');
}




