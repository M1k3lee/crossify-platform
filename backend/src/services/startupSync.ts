// Service to sync all tokens from blockchain on startup
// This ensures tokens are re-discovered after database resets (e.g., Railway deployments)

import { ethers } from 'ethers';
import { dbRun, dbGet, dbAll } from '../db/adapter';
import { v4 as uuidv4 } from 'uuid';

// TokenFactory ABI
const TOKEN_FACTORY_ABI = [
  'event TokenCreated(address indexed tokenAddress, address indexed creator, address indexed curveAddress, string name, string symbol)',
  'function tokensByCreator(address) external view returns (address[])',
];

// ERC20 ABI
const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
];

// BondingCurve ABI
const BONDING_CURVE_ABI = [
  'function basePrice() external view returns (uint256)',
  'function slope() external view returns (uint256)',
  'function graduationThreshold() external view returns (uint256)',
  'function buyFeePercent() external view returns (uint256)',
  'function sellFeePercent() external view returns (uint256)',
];

interface ChainConfig {
  rpcUrl: string;
  factoryAddress: string;
  chainName: string;
}

/**
 * Get chain configurations for all testnet chains
 */
function getChainConfigs(): ChainConfig[] {
  const chains: ChainConfig[] = [];

  // Base Sepolia
  const baseSepoliaFactory = process.env.BASE_FACTORY_ADDRESS || process.env.BASE_SEPOLIA_FACTORY_ADDRESS;
  if (baseSepoliaFactory) {
    chains.push({
      rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
      factoryAddress: baseSepoliaFactory,
      chainName: 'base-sepolia',
    });
  }

  // BSC Testnet
  const bscTestnetFactory = process.env.BSC_FACTORY_ADDRESS || process.env.BSC_TESTNET_FACTORY_ADDRESS;
  if (bscTestnetFactory) {
    chains.push({
      rpcUrl: process.env.BSC_TESTNET_RPC_URL || process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
      factoryAddress: bscTestnetFactory,
      chainName: 'bsc-testnet',
    });
  }

  // Sepolia
  const sepoliaFactory = process.env.ETHEREUM_FACTORY_ADDRESS || process.env.SEPOLIA_FACTORY_ADDRESS;
  if (sepoliaFactory) {
    chains.push({
      rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      factoryAddress: sepoliaFactory,
      chainName: 'sepolia',
    });
  }

  return chains;
}

/**
 * Query all TokenCreated events from a factory
 */
/**
 * Query events in batches to avoid RPC block range limits
 */
async function queryEventsInBatches(
  factoryContract: ethers.Contract,
  fromBlock: number,
  toBlock: number,
  batchSize: number = 45000 // Use 45k to be safe (RPC limit is usually 50k)
): Promise<ethers.EventLog[]> {
  const allEvents: ethers.EventLog[] = [];
  let currentFrom = fromBlock;
  
  while (currentFrom < toBlock) {
    const currentTo = Math.min(currentFrom + batchSize, toBlock);
    
    try {
      console.log(`  📦 Querying events from block ${currentFrom} to ${currentTo}...`);
      const filter = factoryContract.filters.TokenCreated();
      const batchEvents = await factoryContract.queryFilter(filter, currentFrom, currentTo);
      
      const eventLogs = batchEvents.filter((event): event is ethers.EventLog => 'args' in event);
      allEvents.push(...eventLogs);
      
      console.log(`  ✅ Found ${eventLogs.length} events in this batch (total: ${allEvents.length})`);
      
      currentFrom = currentTo + 1;
    } catch (error: any) {
      console.error(`  ❌ Error querying batch ${currentFrom}-${currentTo}: ${error.message}`);
      // If batch fails, try smaller batches
      if (batchSize > 10000) {
        batchSize = Math.floor(batchSize / 2);
        console.log(`  🔄 Retrying with smaller batch size: ${batchSize}`);
        continue;
      } else {
        // Skip this batch and continue
        console.warn(`  ⚠️ Skipping batch ${currentFrom}-${currentTo}`);
        currentFrom = currentTo + 1;
      }
    }
  }
  
  return allEvents;
}

async function queryAllTokens(
  provider: ethers.JsonRpcProvider,
  factoryAddress: string,
  fromBlock: number = 0
): Promise<Array<{
  tokenAddress: string;
  creator: string;
  curveAddress: string;
  name: string;
  symbol: string;
  blockNumber: number;
}>> {
  const factoryContract = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, provider);
  
  try {
    const currentBlock = await provider.getBlockNumber();
    
    // Query from a reasonable starting point to avoid huge queries
    // For testnets, query from last 100k blocks (about 2 weeks) or from block 0 if current block is small
    const maxLookbackBlocks = 100000;
    const startBlock = currentBlock > maxLookbackBlocks 
      ? Math.max(0, currentBlock - maxLookbackBlocks)
      : 0;
    
    console.log(`  📊 Current block: ${currentBlock}`);
    console.log(`  📊 Querying TokenCreated events from block ${startBlock} to ${currentBlock}...`);
    console.log(`  📊 Block range: ${currentBlock - startBlock} blocks`);
    
    // Use batch querying to avoid RPC limits (45k blocks per batch)
    const events = await queryEventsInBatches(factoryContract, startBlock, currentBlock);
    
    console.log(`  ✅ Found ${events.length} TokenCreated events total`);
    
    if (events.length > 0) {
      console.log(`  📋 Sample events:`);
      events.slice(0, 3).forEach((event, idx) => {
        if ('args' in event) {
          console.log(`     ${idx + 1}. ${event.args.name} (${event.args.symbol}) at block ${event.blockNumber}`);
        }
      });
    } else {
      console.log(`  💡 No tokens found. This could mean:`);
      console.log(`     - No tokens have been created yet`);
      console.log(`     - Factory address is incorrect (verify on block explorer)`);
      console.log(`     - Tokens were created with a different factory`);
      console.log(`  🔍 Verify on block explorer:`);
      console.log(`     - Check TokenCreated events for factory ${factoryAddress}`);
    }
    
    return events.map((event) => ({
      tokenAddress: event.args.tokenAddress as string,
      creator: event.args.creator as string,
      curveAddress: event.args.curveAddress as string,
      name: event.args.name as string,
      symbol: event.args.symbol as string,
      blockNumber: event.blockNumber,
    }));
  } catch (error: any) {
    console.error(`  ❌ Error querying events: ${error.message}`);
    if (error.stack) {
      console.error(`  Stack: ${error.stack}`);
    }
    return [];
  }
}

/**
 * Sync a token to database
 */
async function syncTokenToDatabase(
  tokenAddress: string,
  creator: string,
  curveAddress: string,
  name: string,
  symbol: string,
  chain: string,
  provider: ethers.JsonRpcProvider
): Promise<boolean> {
  try {
    const normalizedTokenAddress = tokenAddress.toLowerCase();
    const normalizedCurveAddress = curveAddress?.toLowerCase() || null;
    
    // Check if deployment already exists for this token address + chain
    const existingDeployment = await dbGet(
      `SELECT token_id FROM token_deployments WHERE token_address = ? AND chain = ?`,
      [normalizedTokenAddress, chain]
    ) as any;

    if (existingDeployment) {
      // Deployment already exists - check if we need to update curve address
      if (normalizedCurveAddress) {
        const currentDeployment = await dbGet(
          `SELECT curve_address FROM token_deployments WHERE token_id = ? AND chain = ?`,
          [existingDeployment.token_id, chain]
        ) as any;
        
        if (!currentDeployment?.curve_address && normalizedCurveAddress) {
          // Update curve address if it's missing
          await dbRun(
            `UPDATE token_deployments SET curve_address = ?, updated_at = CURRENT_TIMESTAMP WHERE token_id = ? AND chain = ?`,
            [normalizedCurveAddress, existingDeployment.token_id, chain]
          );
          console.log(`    ✅ Updated curve address for ${name} (${symbol}) on ${chain}`);
        }
      }
      
      // Ensure token is visible in marketplace (even if deployment already exists)
      try {
        const updateResult = await dbRun(
          'UPDATE tokens SET visible_in_marketplace = 1 WHERE id = ? AND (visible_in_marketplace = 0 OR visible_in_marketplace IS NULL)',
          [existingDeployment.token_id]
        );
        const updated = (updateResult as any)?.changes ?? (updateResult as any)?.rowCount ?? 0;
        if (updated > 0) {
          console.log(`    ✅ Made token ${existingDeployment.token_id} visible in marketplace`);
        }
      } catch (updateError) {
        // Non-critical error - log but don't fail
        console.warn(`    ⚠️  Could not update token visibility for ${existingDeployment.token_id}:`, updateError);
      }
      
      return false; // Already exists
    }

    // Check if token exists by token address (across all chains)
    // If token exists in another chain, reuse the same token ID
    let tokenId: string;
    const existingTokenByAddress = await dbGet(
      `SELECT DISTINCT t.id FROM tokens t 
       JOIN token_deployments td ON t.id = td.token_id 
       WHERE td.token_address = ? LIMIT 1`,
      [normalizedTokenAddress]
    ) as any;

    if (existingTokenByAddress) {
      // Token exists in another chain - reuse the token ID
      tokenId = existingTokenByAddress.id;
      console.log(`    🔄 Token ${name} (${symbol}) exists by address in another chain, reusing token ID: ${tokenId}`);
    } else {
      // Try to match by name + symbol (for cross-chain tokens with different addresses)
      // During sync, we're more aggressive about matching since we know tokens from blockchain events are related
      // First try with creator address (more specific)
      let existingTokenByMetadata = null;
      if (creator && creator !== ethers.ZeroAddress) {
        const normalizedCreator = creator.toLowerCase();
        // Use a 7-day window for sync (tokens might be created over time)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        existingTokenByMetadata = await dbGet(
          `SELECT t.id, t.created_at FROM tokens t 
           WHERE LOWER(t.name) = LOWER(?) 
             AND LOWER(t.symbol) = LOWER(?)
             AND LOWER(t.creator_address) = ?
             AND t.created_at >= ?
           ORDER BY t.created_at DESC
           LIMIT 1`,
          [name, symbol, normalizedCreator, sevenDaysAgo]
        ) as any;
        
        if (existingTokenByMetadata) {
          console.log(`    🔄 Token ${name} (${symbol}) exists by metadata (name+symbol+creator), reusing token ID: ${existingTokenByMetadata.id}`);
        }
      }
      
      // If not found with creator, try without creator (name+symbol only)
      // This is useful for tokens that might have been created by different addresses or creator wasn't set
      if (!existingTokenByMetadata) {
        // Use a 30-day window for name+symbol matching (more lenient)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        existingTokenByMetadata = await dbGet(
          `SELECT t.id, t.created_at FROM tokens t 
           WHERE LOWER(t.name) = LOWER(?) 
             AND LOWER(t.symbol) = LOWER(?)
             AND t.created_at >= ?
           ORDER BY t.created_at DESC
           LIMIT 1`,
          [name, symbol, thirtyDaysAgo]
        ) as any;
        
        if (existingTokenByMetadata) {
          console.log(`    🔄 Token ${name} (${symbol}) exists by metadata (name+symbol), reusing token ID: ${existingTokenByMetadata.id}`);
          console.log(`       Created at: ${existingTokenByMetadata.created_at}, matching deployment on ${chain}`);
        }
      }

      if (existingTokenByMetadata) {
        // Found token by metadata - reuse the token ID
        tokenId = existingTokenByMetadata.id;
      } else {
        // No matching token found - generate new token ID
        tokenId = uuidv4();
        console.log(`    ✨ Creating new token record for ${name} (${symbol}) on ${chain}`);
      }
    }

    // Fetch token details
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    let decimals = 18;
    let totalSupply = '0';

    try {
      decimals = await tokenContract.decimals();
      const supply = await tokenContract.totalSupply();
      totalSupply = ethers.formatUnits(supply, decimals);
    } catch (error) {
      console.warn(`    ⚠️ Could not fetch token details for ${tokenAddress}:`, error);
    }

    // Fetch curve details
    let basePrice = '0.0001';
    let slope = '0.00001';
    let graduationThreshold = '0';
    let buyFeePercent = '0';
    let sellFeePercent = '0';

    if (normalizedCurveAddress && normalizedCurveAddress !== ethers.ZeroAddress.toLowerCase()) {
      try {
        const curveContract = new ethers.Contract(normalizedCurveAddress, BONDING_CURVE_ABI, provider);
        const basePriceWei = await curveContract.basePrice();
        const slopeWei = await curveContract.slope();
        const gradThreshold = await curveContract.graduationThreshold();
        const buyFee = await curveContract.buyFeePercent();
        const sellFee = await curveContract.sellFeePercent();

        basePrice = ethers.formatEther(basePriceWei);
        slope = ethers.formatEther(slopeWei);
        graduationThreshold = ethers.formatEther(gradThreshold);
        buyFeePercent = buyFee.toString();
        sellFeePercent = sellFee.toString();
      } catch (error) {
        console.warn(`    ⚠️ Could not fetch curve details for ${normalizedCurveAddress}:`, error);
      }
    }

    // Insert token - try INSERT OR IGNORE first, then verify
    let tokenInserted = false;
    try {
      const insertResult = await dbRun(
        `INSERT OR IGNORE INTO tokens (
          id, name, symbol, decimals, initial_supply,
          base_price, slope, graduation_threshold, buy_fee_percent, sell_fee_percent,
          creator_address, cross_chain_enabled, visible_in_marketplace
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tokenId,
          name,
          symbol,
          decimals,
          totalSupply,
          parseFloat(basePrice) || 0.0001,
          parseFloat(slope) || 0.00001,
          parseFloat(graduationThreshold) || 0,
          parseFloat(buyFeePercent) || 0,
          parseFloat(sellFeePercent) || 0,
          creator.toLowerCase(),
          0,
          1, // Explicitly set visible_in_marketplace = 1
        ]
      );
      
      // Check if insert actually happened (changes > 0 means row was inserted)
      // For PostgreSQL, changes might be in a different format
      const changes = (insertResult as any)?.changes ?? (insertResult as any)?.rowCount ?? 0;
      if (changes > 0) {
        tokenInserted = true;
        console.log(`    ✅ Token ${tokenId} inserted (changes: ${changes})`);
      } else {
        console.log(`    ℹ️  Token insert was ignored (token may already exist)`);
      }
    } catch (error: any) {
      console.error(`    ⚠️  Token insert error:`, error.message);
      // Continue to verification step
    }

    // Verify token exists (it might have been inserted or might already exist)
    let verifyToken = await dbGet('SELECT id FROM tokens WHERE id = ?', [tokenId]) as any;
    
    // If token doesn't exist, try to find it by address or insert directly
    if (!verifyToken) {
      console.log(`    🔍 Token ${tokenId} not found after insert, checking alternatives...`);
      
      // Check if token exists by address in another deployment
      const tokenByAddress = await dbGet(
        `SELECT t.id FROM tokens t 
         JOIN token_deployments td ON t.id = td.token_id 
         WHERE td.token_address = ? LIMIT 1`,
        [normalizedTokenAddress]
      ) as any;
      
      if (tokenByAddress && tokenByAddress.id) {
        // Token exists with different ID - use that ID instead
        tokenId = tokenByAddress.id;
        console.log(`    🔄 Found token by address, using existing token ID: ${tokenId}`);
        verifyToken = { id: tokenId };
      } else {
        // Token truly doesn't exist - try direct insert (might fail if it exists, but that's OK)
        console.log(`    🔄 Token doesn't exist, attempting direct insert without IGNORE...`);
        try {
          await dbRun(
            `INSERT INTO tokens (
              id, name, symbol, decimals, initial_supply,
              base_price, slope, graduation_threshold, buy_fee_percent, sell_fee_percent,
              creator_address, cross_chain_enabled, visible_in_marketplace
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              tokenId,
              name,
              symbol,
              decimals,
              totalSupply,
              parseFloat(basePrice) || 0.0001,
              parseFloat(slope) || 0.00001,
              parseFloat(graduationThreshold) || 0,
              parseFloat(buyFeePercent) || 0,
              parseFloat(sellFeePercent) || 0,
              creator.toLowerCase(),
              0,
              1, // Explicitly set visible_in_marketplace = 1
            ]
          );
          verifyToken = await dbGet('SELECT id FROM tokens WHERE id = ?', [tokenId]) as any;
          if (verifyToken) {
            console.log(`    ✅ Token ${tokenId} inserted successfully via direct insert`);
          }
        } catch (insertError: any) {
          // If insert fails due to UNIQUE constraint, token already exists - verify it
          if (insertError.message?.includes('UNIQUE') || insertError.message?.includes('duplicate') || insertError.code === 'SQLITE_CONSTRAINT') {
            console.log(`    ℹ️  Token insert failed due to constraint, checking if token exists...`);
            verifyToken = await dbGet('SELECT id FROM tokens WHERE id = ?', [tokenId]) as any;
            if (!verifyToken) {
              // Token doesn't exist but insert failed - this is a problem
              console.error(`    ❌ Token insert failed but token doesn't exist:`, insertError.message);
              throw new Error(`Failed to insert token: ${insertError.message}`);
            }
          } else {
            console.error(`    ❌ Failed to insert token ${tokenId}:`, insertError.message);
            throw new Error(`Failed to insert token: ${insertError.message}`);
          }
        }
      }
    } else {
      console.log(`    ✅ Token ${tokenId} verified in database`);
    }

    // Final verification - token must exist now
    if (!verifyToken || !verifyToken.id) {
      console.error(`    ❌ Token ${tokenId} does not exist after all attempts`);
      console.error(`    💡 This might indicate a database connection or transaction issue`);
      throw new Error(`Token ${tokenId} not found in database`);
    }
    
    // Ensure token is visible in marketplace (update if it's hidden)
    try {
      const updateResult = await dbRun(
        'UPDATE tokens SET visible_in_marketplace = 1 WHERE id = ? AND (visible_in_marketplace = 0 OR visible_in_marketplace IS NULL)',
        [tokenId]
      );
      const updated = (updateResult as any)?.changes ?? (updateResult as any)?.rowCount ?? 0;
      if (updated > 0) {
        console.log(`    ✅ Made token ${tokenId} visible in marketplace`);
      }
    } catch (updateError) {
      // Non-critical error - log but don't fail
      console.warn(`    ⚠️  Could not update token visibility for ${tokenId}:`, updateError);
    }
    
    console.log(`    ✅ Token ${tokenId} confirmed in database, proceeding with deployment`);

    // Insert deployment
    try {
      await dbRun(
        `INSERT INTO token_deployments (
          token_id, chain, token_address, curve_address, status
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          tokenId,
          chain,
          normalizedTokenAddress,
          normalizedCurveAddress,
          'deployed',
        ]
      );
      console.log(`    ✅ Synced ${name} (${symbol}) on ${chain} with token ID: ${tokenId}`);
      return true;
    } catch (error: any) {
      // If deployment insert fails due to UNIQUE constraint, it already exists
      if (error.message?.includes('UNIQUE constraint') || error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
        console.log(`    ℹ️  Deployment for ${name} (${symbol}) on ${chain} already exists`);
        
        // Even though deployment exists, ensure token is visible
        try {
          const updateResult = await dbRun(
            'UPDATE tokens SET visible_in_marketplace = 1 WHERE id = ? AND (visible_in_marketplace = 0 OR visible_in_marketplace IS NULL)',
            [tokenId]
          );
          const updated = (updateResult as any)?.changes ?? (updateResult as any)?.rowCount ?? 0;
          if (updated > 0) {
            console.log(`    ✅ Made token ${tokenId} visible in marketplace`);
          }
        } catch (updateError) {
          // Non-critical error - log but don't fail
          console.warn(`    ⚠️  Could not update token visibility for ${tokenId}:`, updateError);
        }
        
        return false;
      }
      throw error;
    }
  } catch (error: any) {
    console.error(`    ❌ Error syncing token ${tokenAddress}:`, error.message);
    if (error.code) {
      console.error(`    Error code: ${error.code}`);
    }
    if (error.stack) {
      console.error(`    Stack: ${error.stack}`);
    }
    return false;
  }
}

/**
 * Sync all tokens from a chain
 */
async function syncChain(config: ChainConfig): Promise<number> {
  console.log(`\n🔍 Syncing tokens from ${config.chainName}...`);
  console.log(`   Factory: ${config.factoryAddress}`);
  console.log(`   RPC: ${config.rpcUrl}`);

  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const blockNumber = await provider.getBlockNumber(); // Test connection
    console.log(`   ✅ Connected to ${config.chainName} (block: ${blockNumber})`);

    // Verify factory contract exists
    try {
      const factoryCode = await provider.getCode(config.factoryAddress);
      if (!factoryCode || factoryCode === '0x') {
        console.error(`   ❌ Factory contract does not exist at ${config.factoryAddress}`);
        return 0;
      }
      console.log(`   ✅ Factory contract verified (code size: ${(factoryCode.length - 2) / 2} bytes)`);
    } catch (error: any) {
      console.error(`   ❌ Error checking factory contract: ${error.message}`);
      return 0;
    }

    // Query all tokens
    const tokens = await queryAllTokens(provider, config.factoryAddress);

    if (tokens.length === 0) {
      console.log(`   ℹ️  No tokens found on ${config.chainName}`);
      console.log(`   💡 This could mean:`);
      console.log(`      - No tokens have been created yet`);
      console.log(`      - Factory address is incorrect (verify on block explorer)`);
      console.log(`      - Tokens were created with a different factory`);
      console.log(`   🔍 Verify on block explorer:`);
      console.log(`      - Check TokenCreated events for factory ${config.factoryAddress}`);
      return 0;
    }

    console.log(`   📦 Found ${tokens.length} tokens, syncing to database...`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const token of tokens) {
      try {
        const success = await syncTokenToDatabase(
          token.tokenAddress,
          token.creator,
          token.curveAddress,
          token.name,
          token.symbol,
          config.chainName,
          provider
        );
        if (success) {
          synced++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        console.error(`   ⚠️  Error syncing token ${token.tokenAddress}:`, error.message);
        errors++;
      }
    }

    console.log(`   ✅ Synced ${synced} new tokens from ${config.chainName}`);
    console.log(`   ℹ️  ${skipped} already existed, ${errors} errors`);
    return synced;
  } catch (error: any) {
    console.error(`   ❌ Error syncing ${config.chainName}:`, error.message);
    console.error(`   💡 Check:`);
    console.error(`      - RPC URL is correct and accessible`);
    console.error(`      - Factory address is correct`);
    console.error(`      - Network is available`);
    return 0;
  }
}

/**
 * Sync all tokens from all configured chains
 * This is critical for Railway deployments where the database is ephemeral
 */
export async function syncAllTokensFromBlockchain(): Promise<{
  totalSynced: number;
  chainsSynced: number;
}> {
  console.log('\n🚀 Starting startup token sync...');
  console.log('   This will sync all tokens from blockchain to database');
  console.log('   ⚠️  IMPORTANT: On Railway, database is ephemeral - sync repopulates tokens from blockchain');

  const chains = getChainConfigs();

  if (chains.length === 0) {
    console.warn('⚠️  No chain configurations found. Please set factory addresses in environment variables.');
    return { totalSynced: 0, chainsSynced: 0 };
  }

  console.log(`\n📋 Found ${chains.length} configured chains`);

  let totalSynced = 0;
  let chainsSynced = 0;

  for (const chain of chains) {
    try {
      const synced = await syncChain(chain);
      if (synced > 0) {
        chainsSynced++;
        totalSynced += synced;
      }
    } catch (error: any) {
      console.error(`❌ Failed to sync ${chain.chainName}:`, error.message);
    }
  }

  console.log(`\n✅ Startup sync complete: ${totalSynced} tokens synced from ${chainsSynced} chains\n`);

  return { totalSynced, chainsSynced };
}

/**
 * Start startup sync (non-blocking)
 */
export function startStartupSync(): void {
  // Run sync in background (don't block server startup)
  setTimeout(async () => {
    try {
      await syncAllTokensFromBlockchain();
    } catch (error) {
      console.error('Error in startup sync:', error);
    }
  }, 5000); // Wait 5 seconds after server startup to ensure database is ready
}

