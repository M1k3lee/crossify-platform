// Service to sync all tokens from blockchain on startup
// This ensures tokens are re-discovered after database resets (e.g., Railway deployments)

import { ethers } from 'ethers';
import { dbRun, dbGet, dbAll } from '../db';
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
    // Query from a reasonable range (last 50k blocks, or from deployment block)
    const startBlock = Math.max(fromBlock, currentBlock - 50000);
    
    console.log(`  📊 Querying TokenCreated events from block ${startBlock} to ${currentBlock}...`);
    
    const filter = factoryContract.filters.TokenCreated();
    const events = await factoryContract.queryFilter(filter, startBlock, currentBlock);
    
    console.log(`  ✅ Found ${events.length} TokenCreated events`);
    
    return events
      .filter((event): event is ethers.EventLog => 'args' in event)
      .map((event) => ({
        tokenAddress: event.args.tokenAddress as string,
        creator: event.args.creator as string,
        curveAddress: event.args.curveAddress as string,
        name: event.args.name as string,
        symbol: event.args.symbol as string,
        blockNumber: event.blockNumber,
      }));
  } catch (error: any) {
    console.error(`  ❌ Error querying events: ${error.message}`);
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
    // Check if token already exists
    const existing = await dbGet(
      `SELECT id FROM token_deployments WHERE token_address = ? AND chain = ?`,
      [tokenAddress.toLowerCase(), chain]
    ) as any;

    if (existing) {
      // Token already exists, skip
      return false;
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

    if (curveAddress && curveAddress !== ethers.ZeroAddress) {
      try {
        const curveContract = new ethers.Contract(curveAddress, BONDING_CURVE_ABI, provider);
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
        console.warn(`    ⚠️ Could not fetch curve details for ${curveAddress}:`, error);
      }
    }

    // Generate token ID
    const tokenId = uuidv4();

    // Insert token
    await dbRun(
      `INSERT OR IGNORE INTO tokens (
        id, name, symbol, decimals, initial_supply,
        base_price, slope, graduation_threshold, buy_fee_percent, sell_fee_percent,
        creator_address, cross_chain_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    );

    // Insert deployment
    await dbRun(
      `INSERT OR IGNORE INTO token_deployments (
        token_id, chain, token_address, curve_address, status
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        tokenId,
        chain,
        tokenAddress.toLowerCase(),
        curveAddress?.toLowerCase() || null,
        'deployed',
      ]
    );

    console.log(`    ✅ Synced ${name} (${symbol}) on ${chain}`);
    return true;
  } catch (error: any) {
    console.error(`    ❌ Error syncing token ${tokenAddress}:`, error.message);
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

    // Query all tokens
    const tokens = await queryAllTokens(provider, config.factoryAddress);

    if (tokens.length === 0) {
      console.log(`   ℹ️  No tokens found on ${config.chainName}`);
      console.log(`   💡 This could mean:`);
      console.log(`      - No tokens have been created yet`);
      console.log(`      - Factory address is incorrect`);
      console.log(`      - Tokens were created before the query range (last 50k blocks)`);
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
 */
export async function syncAllTokensFromBlockchain(): Promise<{
  totalSynced: number;
  chainsSynced: number;
}> {
  console.log('\n🚀 Starting startup token sync...');
  console.log('   This will sync all tokens from blockchain to database');

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

