/**
 * DefiLlama Adapter for Crossify Protocol
 * 
 * This adapter fetches protocol statistics from Crossify's API and formats them
 * for DefiLlama's TVL tracking system.
 * 
 * TVL Calculation:
 * - Bonding Curve TVL: Sum of all reserve balances * 2 (50/50 pool assumption)
 * - DEX Pool TVL: Sum of TVL from graduated tokens' DEX pools
 * 
 * Usage:
 * 1. Fork https://github.com/DefiLlama/DefiLlama-Adapters
 * 2. Place this file in projects/crossify/index.js
 * 3. Test: node test.js projects/crossify/index.js
 * 4. Submit PR to DefiLlama-Adapters repository
 */

// API endpoint - update this with your production API URL
// For now, using placeholder - you'll need to set this to your actual API URL
const API_BASE_URL = process.env.CROSSIFY_API_URL || 'https://api.crossify.io';

/**
 * Fetch protocol statistics from Crossify API
 */
async function fetchProtocolStats() {
  try {
    // Use node-fetch or built-in fetch depending on Node version
    const fetch = (await import('node-fetch')).default || global.fetch;
    
    const response = await fetch(`${API_BASE_URL}/api/protocol/stats`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching protocol stats:', error);
    throw error;
  }
}

/**
 * Map Crossify chain names to DefiLlama chain identifiers
 */
function mapChainToDefiLlama(chainName) {
  const normalized = chainName.toLowerCase().replace(/_/g, '-');
  
  // DefiLlama chain mappings
  const chainMap = {
    'ethereum': 'ethereum',
    'sepolia': 'ethereum', // Sepolia is Ethereum testnet
    'base': 'base',
    'base-sepolia': 'base', // Base Sepolia is Base testnet
    'bsc': 'bsc',
    'bsc-testnet': 'bsc', // BSC Testnet
    'binance': 'bsc',
    'binance-smart-chain': 'bsc',
    'hedera': 'hedera',
    'hedera-testnet': 'hedera',
    'unichain': 'unichain',
    'unichain-testnet': 'unichain',
  };

  // Exact match first
  if (chainMap[normalized]) {
    return chainMap[normalized];
  }

  // Partial match fallback
  if (normalized.includes('ethereum') || normalized.includes('sepolia')) {
    return 'ethereum';
  }
  if (normalized.includes('base')) {
    return 'base';
  }
  if (normalized.includes('bsc') || normalized.includes('binance')) {
    return 'bsc';
  }
  if (normalized.includes('hedera')) {
    return 'hedera';
  }
  if (normalized.includes('unichain')) {
    return 'unichain';
  }

  // Default to ethereum if unknown
  console.warn(`Unknown chain: ${chainName}, defaulting to ethereum`);
  return 'ethereum';
}

/**
 * Calculate TVL by chain from protocol stats
 * Returns DefiLlama format: { [chainId]: { [tokenAddress]: amount } }
 */
async function tvl() {
  const stats = await fetchProtocolStats();
  
  if (!stats.success || !stats.tvl) {
    throw new Error('Failed to fetch TVL data from API');
  }

  const balances = {};
  const { byChain } = stats.tvl;

  // Map Crossify chain names to DefiLlama chain IDs and aggregate TVL
  Object.entries(byChain).forEach(([chain, tvlValue]) => {
    const defiLlamaChain = mapChainToDefiLlama(chain);
    
    if (!balances[defiLlamaChain]) {
      balances[defiLlamaChain] = {};
    }
    
    // DefiLlama expects balances in format: { [chainId]: { [tokenAddress]: amount } }
    // We use a placeholder address '0x0000000000000000000000000000000000000000' for aggregate TVL
    // DefiLlama will sum all balances for each chain
    // For more granular tracking, you could break this down by actual token addresses
    const existing = balances[defiLlamaChain]['0x0000000000000000000000000000000000000000'] || 0;
    balances[defiLlamaChain]['0x0000000000000000000000000000000000000000'] = existing + tvlValue;
  });

  return balances;
}

/**
 * Export adapter functions
 * DefiLlama expects these specific function names
 */
module.exports = {
  timetravel: false, // We use API data, not historical blockchain queries
  methodology: `
    Crossify TVL is calculated as:
    1. Bonding Curve TVL: Sum of all reserve balances across all deployed tokens, multiplied by 2 (assuming 50/50 pools)
    2. DEX Pool TVL: Sum of TVL from tokens that have graduated to DEX pools (Uniswap V3, PancakeSwap, etc.)
    3. Cross-chain liquidity is aggregated across all supported chains: Ethereum, Base, BSC, Hedera, and Unichain
    
    Data source: Crossify API endpoint at ${API_BASE_URL}/api/protocol/stats
  `,
  start: 1735689600000, // Set this to your protocol launch timestamp (Jan 2025 - update with actual launch date)
  
  // Main TVL function - required by DefiLlama
  tvl,
};

