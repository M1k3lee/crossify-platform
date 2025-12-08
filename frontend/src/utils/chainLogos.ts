// Chain logo URLs - using publicly available chain logos
// Sources: ChainList CDN (defillama), CoinGecko, and official chain resources

export const CHAIN_LOGOS: Record<string, string> = {
  // Ethereum (using DefiLlama ChainList CDN)
  'ethereum': 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
  'sepolia': 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
  
  // Base (using DefiLlama ChainList CDN)
  'base': 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
  'base-sepolia': 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
  
  // BSC (Binance Smart Chain) - using DefiLlama ChainList CDN
  'bsc': 'https://icons.llamao.fi/icons/chains/rsz_bnb.jpg',
  'bsc-testnet': 'https://icons.llamao.fi/icons/chains/rsz_bnb.jpg',
  'binance': 'https://icons.llamao.fi/icons/chains/rsz_bnb.jpg',
  
  // Solana (using DefiLlama ChainList CDN)
  'solana': 'https://icons.llamao.fi/icons/chains/rsz_solana.jpg',
  
  // Hedera (using CoinGecko - reliable CDN)
  'hedera': 'https://assets.coingecko.com/coins/images/3688/small/hedera.png',
  'hedera-testnet': 'https://assets.coingecko.com/coins/images/3688/small/hedera.png',
  
  // Unichain (placeholder - official logo may not be widely available)
  // Using a generic chain icon as fallback until official logo is available
  'unichain': 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg', // Placeholder
  'unichain-sepolia': 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg', // Placeholder
};

/**
 * Get the logo URL for a chain
 * @param chainName - The chain name (case-insensitive)
 * @returns The logo URL or null if not found
 */
export function getChainLogo(chainName: string): string | null {
  if (!chainName) return null;
  
  const normalized = chainName.toLowerCase().trim();
  
  // Try exact match first
  if (CHAIN_LOGOS[normalized]) {
    return CHAIN_LOGOS[normalized];
  }
  
  // Try partial matches (e.g., "base-sepolia" matches "base")
  for (const [key, url] of Object.entries(CHAIN_LOGOS) as [string, string][]) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }
  
  return null;
}


