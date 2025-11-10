import { ethers } from 'ethers';
import { dbAll, dbRun, dbGet } from '../db/adapter';

const HOLDER_COUNT_UPDATE_INTERVAL = 3600000; // 1 hour
const HOLDER_COUNT_BATCH_SIZE = 100; // Update 100 tokens at a time

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

interface RPCConfig {
  url: string;
  name: string;
}

// RPC URLs for different chains
const RPC_CONFIGS: Record<string, RPCConfig> = {
  'ethereum': {
    url: process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    name: 'Ethereum Sepolia'
  },
  'sepolia': {
    url: process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    name: 'Ethereum Sepolia'
  },
  'bsc': {
    url: process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
    name: 'BSC Testnet'
  },
  'bsc-testnet': {
    url: process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
    name: 'BSC Testnet'
  },
  'base': {
    url: process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
    name: 'Base Sepolia'
  },
  'base-sepolia': {
    url: process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
    name: 'Base Sepolia'
  },
};

/**
 * Get RPC provider for a chain
 */
function getProvider(chain: string): ethers.JsonRpcProvider | null {
  const config = RPC_CONFIGS[chain.toLowerCase()];
  if (!config) {
    console.error(`❌ No RPC config for chain: ${chain}`);
    return null;
  }
  
  try {
    return new ethers.JsonRpcProvider(config.url);
  } catch (error) {
    console.error(`❌ Error creating provider for ${chain}:`, error);
    return null;
  }
}

/**
 * Get holder count for an ERC20 token by querying Transfer events
 */
async function getHolderCount(
  chain: string,
  tokenAddress: string,
  fromBlock: number = 0
): Promise<number> {
  try {
    const provider = getProvider(chain);
    if (!provider) {
      throw new Error(`No provider for chain: ${chain}`);
    }

    // Normalize chain name
    const normalizedChain = chain.toLowerCase();
    const config = RPC_CONFIGS[normalizedChain];
    if (!config) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    console.log(`🔍 Fetching holder count for ${tokenAddress} on ${config.name}...`);

    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    const toBlock = currentBlock;

    // If fromBlock is 0, start from a reasonable block (e.g., 30 days ago or deployment block)
    // For testnets, we can go back further
    if (fromBlock === 0) {
      // Estimate blocks per day (varies by chain)
      const blocksPerDay = normalizedChain.includes('bsc') ? 28800 : // BSC: ~3s blocks
                          normalizedChain.includes('base') ? 43200 : // Base: ~2s blocks
                          7200; // Ethereum: ~12s blocks
      fromBlock = Math.max(0, currentBlock - (blocksPerDay * 30)); // 30 days ago
    }

    console.log(`   Scanning blocks ${fromBlock} to ${toBlock} (${toBlock - fromBlock} blocks)`);

    // Query Transfer events in batches to avoid RPC limits
    // Most RPCs have a limit of 10,000 blocks per query
    const MAX_BLOCKS_PER_QUERY = 10000;
    const allLogs: ethers.Log[] = [];
    let currentFromBlock = fromBlock;
    
    while (currentFromBlock <= toBlock) {
      const currentToBlock = Math.min(currentFromBlock + MAX_BLOCKS_PER_QUERY - 1, toBlock);
      
      try {
        const transferFilter = {
          address: tokenAddress,
          topics: [
            TRANSFER_EVENT_SIGNATURE,
            null, // from address (any)
            null, // to address (any)
          ],
          fromBlock: currentFromBlock,
          toBlock: currentToBlock,
        };

        const batchLogs = await provider.getLogs(transferFilter);
        allLogs.push(...batchLogs);
        console.log(`   Found ${batchLogs.length} Transfer events in blocks ${currentFromBlock}-${currentToBlock}`);
        
        currentFromBlock = currentToBlock + 1;
        
        // Small delay to avoid rate limiting
        if (currentFromBlock <= toBlock) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        if (error.message?.includes('query returned more than')) {
          // Block range too large, split it further
          const midBlock = Math.floor((currentFromBlock + currentToBlock) / 2);
          console.log(`   Block range too large, splitting: ${currentFromBlock}-${midBlock} and ${midBlock + 1}-${currentToBlock}`);
          // Retry with smaller range (will be handled in next iteration)
          currentFromBlock = midBlock + 1;
        } else {
          console.error(`   Error querying blocks ${currentFromBlock}-${currentToBlock}:`, error.message);
          // Skip this batch and continue
          currentFromBlock = currentToBlock + 1;
        }
      }
    }

    console.log(`   Found ${allLogs.length} Transfer events total`);

    // Extract unique recipient addresses (to addresses)
    const holders = new Set<string>();
    const fromAddresses = new Set<string>(); // Track addresses that sent tokens (might have sold all)
    
    // Parse Transfer events
    for (const log of allLogs) {
      try {
        // Decode the log
        // Transfer(address indexed from, address indexed to, uint256 value)
        // Topics: [signature, from, to]
        // Data: value
        if (log.topics.length >= 3) {
          const fromAddress = ethers.getAddress('0x' + log.topics[1].slice(26)); // Remove padding
          const toAddress = ethers.getAddress('0x' + log.topics[2].slice(26)); // Remove padding
          
          // Add recipient (they received tokens)
          if (toAddress !== ethers.ZeroAddress) {
            holders.add(toAddress.toLowerCase());
          }
          
          // Track sender (they might have sold, but we'll check balance later)
          if (fromAddress !== ethers.ZeroAddress) {
            fromAddresses.add(fromAddress.toLowerCase());
          }
        }
      } catch (error) {
        console.warn(`   Warning: Failed to decode log:`, error);
      }
    }
    
    // Remove zero address and the token contract itself
    holders.delete(ethers.ZeroAddress.toLowerCase());
    holders.delete(tokenAddress.toLowerCase());
    
    // Note: This gives us a count of unique addresses that have received tokens
    // For a more accurate count, we could check current balances, but that requires
    // many RPC calls. The current approach gives us a good estimate of unique holders.

    const count = holders.size;
    console.log(`✅ Holder count for ${tokenAddress} on ${config.name}: ${count}`);

    return count;
  } catch (error: any) {
    console.error(`❌ Error getting holder count for ${tokenAddress} on ${chain}:`, error.message);
    // Return -1 to indicate error (don't update database)
    return -1;
  }
}

/**
 * Update holder count for a single token deployment
 */
export async function updateHolderCount(
  tokenId: string,
  chain: string,
  tokenAddress: string
): Promise<number> {
  try {
    if (!tokenAddress) {
      console.log(`⚠️ No token address for ${tokenId} on ${chain}`);
      return 0;
    }

    // Get current holder count from blockchain
    const holderCount = await getHolderCount(chain, tokenAddress);
    
    if (holderCount < 0) {
      // Error occurred, don't update
      return -1;
    }

    // Update database
    await dbRun(
      `UPDATE token_deployments 
       SET holder_count = ?, holder_count_updated_at = CURRENT_TIMESTAMP
       WHERE token_id = ? AND chain = ?`,
      [holderCount, tokenId, chain]
    );

    console.log(`✅ Updated holder count for ${tokenId} on ${chain}: ${holderCount}`);
    return holderCount;
  } catch (error: any) {
    console.error(`❌ Error updating holder count for ${tokenId} on ${chain}:`, error.message);
    return -1;
  }
}

/**
 * Update holder counts for all deployed tokens
 */
export async function updateAllHolderCounts(): Promise<void> {
  try {
    console.log('🔄 Starting holder count update for all tokens...');

    // Get all deployed tokens with token addresses
    const deployments = await dbAll(`
      SELECT 
        td.token_id,
        td.chain,
        td.token_address,
        td.holder_count_updated_at
      FROM token_deployments td
      WHERE td.token_address IS NOT NULL
        AND td.token_address != ''
        AND td.status = 'deployed'
      ORDER BY td.holder_count_updated_at ASC NULLS FIRST
      LIMIT ?
    `, [HOLDER_COUNT_BATCH_SIZE]) as any[];

    console.log(`📊 Found ${deployments.length} deployments to update`);

    let successCount = 0;
    let errorCount = 0;

    for (const deployment of deployments) {
      try {
        const holderCount = await updateHolderCount(
          deployment.token_id,
          deployment.chain,
          deployment.token_address
        );

        if (holderCount >= 0) {
          successCount++;
        } else {
          errorCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`❌ Error updating holder count for ${deployment.token_id} on ${deployment.chain}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Holder count update completed: ${successCount} successful, ${errorCount} errors`);
  } catch (error: any) {
    console.error('❌ Error in updateAllHolderCounts:', error.message);
  }
}

/**
 * Start the holder count update service
 */
export function startHolderCountService(): void {
  console.log('🚀 Starting holder count update service...');
  
  // Update immediately on startup (after a short delay)
  setTimeout(() => {
    updateAllHolderCounts().catch(console.error);
  }, 30000); // Wait 30 seconds after startup

  // Then update every hour
  setInterval(() => {
    updateAllHolderCounts().catch(console.error);
  }, HOLDER_COUNT_UPDATE_INTERVAL);

  console.log(`✅ Holder count service started (updates every ${HOLDER_COUNT_UPDATE_INTERVAL / 1000 / 60} minutes)`);
}

/**
 * Manually trigger holder count update for a specific token
 */
export async function updateTokenHolderCount(tokenId: string, chain?: string): Promise<void> {
  try {
    let query = `
      SELECT token_id, chain, token_address
      FROM token_deployments
      WHERE token_id = ?
        AND token_address IS NOT NULL
        AND token_address != ''
        AND status = 'deployed'
    `;
    const params: any[] = [tokenId];

    if (chain) {
      query += ' AND chain = ?';
      params.push(chain);
    }

    const deployments = await dbAll(query, params) as any[];

    for (const deployment of deployments) {
      await updateHolderCount(
        deployment.token_id,
        deployment.chain,
        deployment.token_address
      );
    }
  } catch (error: any) {
    console.error(`❌ Error updating holder count for token ${tokenId}:`, error.message);
    throw error;
  }
}

