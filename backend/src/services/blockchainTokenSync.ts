// Service to sync tokens from blockchain to database
// Queries TokenFactory contracts to find tokens created by a user

import { ethers } from 'ethers';
import { dbRun, dbGet, dbAll } from '../db';
import { v4 as uuidv4 } from 'uuid';

// TokenFactory ABI (simplified - only what we need)
const TOKEN_FACTORY_ABI = [
  'function tokensByCreator(address) external view returns (address[])',
  'function tokenCreator(address) external view returns (address)',
  'event TokenCreated(address indexed tokenAddress, address indexed creator, address indexed curveAddress, string name, string symbol)',
];

// ERC20 ABI (for token details)
const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
];

// BondingCurve ABI (for curve details)
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
  chainId: number;
  chainName: string;
}

/**
 * Get chain configuration
 */
function getChainConfig(chain: string): ChainConfig | null {
  const factoryAddress = getFactoryAddress(chain);
  if (!factoryAddress) {
    return null;
  }

  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return {
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
        factoryAddress,
        chainId: 1,
        chainName: 'ethereum',
      };
    case 'base':
      return {
        rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
        factoryAddress,
        chainId: 8453,
        chainName: 'base',
      };
    case 'bsc':
      return {
        rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        factoryAddress,
        chainId: 56,
        chainName: 'bsc',
      };
    case 'sepolia':
      return {
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
        factoryAddress,
        chainId: 11155111,
        chainName: 'sepolia',
      };
    case 'base-sepolia':
      return {
        rpcUrl: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
        factoryAddress,
        chainId: 84532,
        chainName: 'base-sepolia',
      };
    case 'bsc-testnet':
      return {
        rpcUrl: process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
        factoryAddress,
        chainId: 97,
        chainName: 'bsc-testnet',
      };
    default:
      return null;
  }
}

/**
 * Get factory address for chain from environment
 */
function getFactoryAddress(chain: string): string | null {
  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return process.env.ETHEREUM_FACTORY_ADDRESS || null;
    case 'base':
      return process.env.BASE_FACTORY_ADDRESS || null;
    case 'bsc':
      return process.env.BSC_FACTORY_ADDRESS || null;
    case 'sepolia':
      return process.env.ETHEREUM_FACTORY_ADDRESS || process.env.SEPOLIA_FACTORY_ADDRESS || null;
    case 'base-sepolia':
      return process.env.BASE_FACTORY_ADDRESS || process.env.BASE_SEPOLIA_FACTORY_ADDRESS || null;
    case 'bsc-testnet':
      return process.env.BSC_FACTORY_ADDRESS || process.env.BSC_TESTNET_FACTORY_ADDRESS || null;
    default:
      return null;
  }
}

/**
 * Sync tokens from blockchain for a user address
 */
export async function syncTokensFromBlockchain(
  userAddress: string,
  chains: string[] = ['base', 'ethereum', 'bsc']
): Promise<{ synced: number; tokens: any[] }> {
  const allTokens: any[] = [];
  let syncedCount = 0;

  for (const chain of chains) {
    try {
      const chainTokens = await syncTokensForChain(userAddress, chain);
      allTokens.push(...chainTokens);
      syncedCount += chainTokens.length;
    } catch (error) {
      console.error(`Error syncing tokens for chain ${chain}:`, error);
      // Continue with other chains
    }
  }

  return { synced: syncedCount, tokens: allTokens };
}

/**
 * Sync tokens from a specific chain
 */
async function syncTokensForChain(userAddress: string, chain: string): Promise<any[]> {
  const config = getChainConfig(chain);
  if (!config) {
    console.warn(`No configuration found for chain: ${chain} - skipping`);
    return [];
  }
  
  if (!config.factoryAddress) {
    console.warn(`No TokenFactory address configured for chain: ${chain} - skipping. Please set ${chain.toUpperCase()}_FACTORY_ADDRESS in .env`);
    return [];
  }

  let provider: ethers.JsonRpcProvider;
  try {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    // Test connection
    await provider.getBlockNumber();
  } catch (error: any) {
    console.error(`Failed to connect to RPC for ${chain} (${config.rpcUrl}):`, error?.message || error);
    return [];
  }

  const factoryContract = new ethers.Contract(config.factoryAddress, TOKEN_FACTORY_ABI, provider);

  // Query tokensByCreator mapping
  let tokenAddresses: string[] = [];
  try {
    tokenAddresses = await factoryContract.tokensByCreator(userAddress);
    console.log(`✅ Found ${tokenAddresses.length} tokens for ${userAddress} on ${chain}`);
  } catch (error: any) {
    console.warn(`Error querying tokensByCreator for ${chain}: ${error?.message || error}`);
    // Try querying events as fallback
    try {
      tokenAddresses = await queryTokensFromEvents(provider, config.factoryAddress, userAddress);
      console.log(`✅ Found ${tokenAddresses.length} tokens via events for ${userAddress} on ${chain}`);
    } catch (eventError: any) {
      console.error(`Error querying events for ${chain}: ${eventError?.message || eventError}`);
      return [];
    }
  }

  const tokens: any[] = [];

  for (const tokenAddress of tokenAddresses) {
    try {
      const token = await syncTokenFromBlockchain(tokenAddress, userAddress, chain, provider);
      if (token) {
        tokens.push(token);
      }
    } catch (error) {
      console.error(`Error syncing token ${tokenAddress} on ${chain}:`, error);
      // Continue with other tokens
    }
  }

  return tokens;
}

/**
 * Query tokens from TokenCreated events
 */
async function queryTokensFromEvents(
  provider: ethers.JsonRpcProvider,
  factoryAddress: string,
  userAddress: string
): Promise<string[]> {
  const factoryContract = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, provider);
  
  // Query events from last 10000 blocks (adjust as needed)
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 10000);
  
  const filter = factoryContract.filters.TokenCreated(null, userAddress, null);
  const events = await factoryContract.queryFilter(filter, fromBlock, currentBlock);
  
  return events.map((event: any) => event.args.tokenAddress);
}

/**
 * Sync a single token from blockchain to database
 */
async function syncTokenFromBlockchain(
  tokenAddress: string,
  creatorAddress: string,
  chain: string,
  provider: ethers.JsonRpcProvider
): Promise<any | null> {
  try {
    // Check if token already exists in database
    const existing = await dbGet(
      `SELECT id FROM token_deployments WHERE token_address = ? AND chain = ?`,
      [tokenAddress.toLowerCase(), chain]
    ) as any;

    if (existing) {
      // Token already in database, return it
      const token = await dbGet(
        `SELECT t.*, td.curve_address, td.status 
         FROM tokens t 
         JOIN token_deployments td ON t.id = td.token_id 
         WHERE td.token_address = ? AND td.chain = ?`,
        [tokenAddress.toLowerCase(), chain]
      ) as any;
      return token;
    }

    // Fetch token details from blockchain
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    const totalSupply = await tokenContract.totalSupply();

    // Try to find curve address from TokenCreated events
    const factoryAddress = getFactoryAddress(chain);
    let curveAddress: string | null = null;
    let basePrice = '0';
    let slope = '0';
    let graduationThreshold = '0';
    let buyFeePercent = '0';
    let sellFeePercent = '0';

    if (factoryAddress) {
      try {
        const factoryContract = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, provider);
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000);
        const filter = factoryContract.filters.TokenCreated(tokenAddress, creatorAddress, null);
        const events = await factoryContract.queryFilter(filter, fromBlock, currentBlock);
        
        if (events.length > 0) {
          curveAddress = events[0].args.curveAddress;
          
          // Fetch curve details
          if (curveAddress) {
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
              console.warn(`Could not fetch curve details for ${curveAddress}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn(`Could not fetch curve address from events:`, error);
      }
    }

    // Create token entry in database
    const tokenId = uuidv4();
    await dbRun(
      `INSERT INTO tokens (
        id, name, symbol, decimals, initial_supply,
        base_price, slope, graduation_threshold, buy_fee_percent, sell_fee_percent,
        creator_address, cross_chain_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tokenId,
        name,
        symbol,
        decimals,
        ethers.formatEther(totalSupply),
        parseFloat(basePrice) || 0.0001,
        parseFloat(slope) || 0.00001,
        parseFloat(graduationThreshold) || 0,
        parseFloat(buyFeePercent) || 0,
        parseFloat(sellFeePercent) || 0,
        creatorAddress.toLowerCase(),
        0, // cross_chain_enabled (can be updated later)
      ]
    );

    // Create deployment entry
    await dbRun(
      `INSERT INTO token_deployments (
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

    console.log(`✅ Synced token ${name} (${symbol}) from blockchain on ${chain}`);

    return {
      id: tokenId,
      name,
      symbol,
      decimals,
      initialSupply: ethers.formatEther(totalSupply),
      basePrice: parseFloat(basePrice) || 0.0001,
      slope: parseFloat(slope) || 0.00001,
      graduationThreshold: parseFloat(graduationThreshold) || 0,
      buyFeePercent: parseFloat(buyFeePercent) || 0,
      sellFeePercent: parseFloat(sellFeePercent) || 0,
      creatorAddress: creatorAddress.toLowerCase(),
      chain,
      tokenAddress: tokenAddress.toLowerCase(),
      curveAddress: curveAddress?.toLowerCase() || null,
      status: 'deployed',
    };
  } catch (error) {
    console.error(`Error syncing token ${tokenAddress} from blockchain:`, error);
    return null;
  }
}

/**
 * Get all tokens for a user (from database + blockchain sync)
 */
export async function getUserTokens(userAddress: string, chains: string[] = ['base', 'ethereum', 'bsc']): Promise<any[]> {
  // First, sync tokens from blockchain
  await syncTokensFromBlockchain(userAddress, chains);
  
  // Then query database (which now includes synced tokens)
  const tokens = await dbAll(
    `SELECT 
      t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
      t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
      t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
      t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
      COALESCE(t.archived, 0) as archived, COALESCE(t.pinned, 0) as pinned, COALESCE(t.deleted, 0) as deleted,
      GROUP_CONCAT(td.chain) as chains,
      GROUP_CONCAT(td.token_address) as token_addresses,
      GROUP_CONCAT(td.curve_address) as curve_addresses,
      GROUP_CONCAT(td.status) as deployment_statuses,
      GROUP_CONCAT(td.is_graduated) as graduation_statuses,
      GROUP_CONCAT(td.market_cap) as market_caps
    FROM tokens t
    LEFT JOIN token_deployments td ON t.id = td.token_id
    WHERE LOWER(t.creator_address) = LOWER(?)
      AND (t.deleted IS NULL OR t.deleted = 0)
    GROUP BY t.id
    ORDER BY t.pinned DESC, t.created_at DESC`,
    [userAddress]
  ) as any[];

  return tokens.map(token => {
    const chains = token.chains ? token.chains.split(',') : [];
    const tokenAddresses = token.token_addresses ? token.token_addresses.split(',') : [];
    const curveAddresses = token.curve_addresses ? token.curve_addresses.split(',') : [];
    const statuses = token.deployment_statuses ? token.deployment_statuses.split(',') : [];
    const graduations = token.graduation_statuses ? token.graduation_statuses.split(',') : [];
    const marketCaps = token.market_caps ? token.market_caps.split(',') : [];

    const deployments = chains.map((chain: string, idx: number) => ({
      chain,
      tokenAddress: tokenAddresses[idx] || null,
      curveAddress: curveAddresses[idx] || null,
      status: statuses[idx] || 'pending',
      isGraduated: graduations[idx] === '1',
      marketCap: parseFloat(marketCaps[idx] || '0') || 0,
    }));

    return {
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      initialSupply: token.initial_supply,
      logoIpfs: token.logo_ipfs,
      logoUrl: token.logo_ipfs ? `https://ipfs.io/ipfs/${token.logo_ipfs}` : null,
      description: token.description,
      twitterUrl: token.twitter_url,
      discordUrl: token.discord_url,
      telegramUrl: token.telegram_url,
      websiteUrl: token.website_url,
      basePrice: token.base_price,
      slope: token.slope,
      graduationThreshold: token.graduation_threshold,
      buyFeePercent: token.buy_fee_percent,
      sellFeePercent: token.sell_fee_percent,
      creatorAddress: token.creator_address || null,
      crossChainEnabled: token.cross_chain_enabled === 1,
      advancedSettings: token.advanced_settings ? JSON.parse(token.advanced_settings) : {},
      createdAt: token.created_at,
      archived: token.archived === 1,
      pinned: token.pinned === 1,
      deleted: token.deleted === 1,
      deployments,
    };
  });
}

