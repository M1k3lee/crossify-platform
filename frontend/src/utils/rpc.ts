// Shared RPC resolution helper for browser-safe JSON-RPC requests
// Ensures we pick endpoints with permissive CORS (e.g. thirdweb) unless explicitly overridden

const getEnvVars = (): Record<string, string | undefined> => {
  return import.meta.env as Record<string, string | undefined>;
};

const getEnvRpcUrl = (keys: string[]): { url: string; source: string } | null => {
  const env = getEnvVars();
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim()) {
      return { url: value.trim(), source: key };
    }
  }
  return null;
};

export const getRpcUrlForChain = (chainName: string): string => {
  const chainLower = chainName.toLowerCase().trim();

  console.log(`🔍 Getting RPC URL for chain: "${chainName}" (normalized: "${chainLower}")`);

  if (chainLower === 'base-sepolia' || (chainLower.includes('base') && chainLower.includes('sepolia'))) {
    console.log(`   → Using Base Sepolia RPC`);
    return 'https://base-sepolia-rpc.publicnode.com';
  }

  if (chainLower === 'bsc-testnet' || (chainLower.includes('bsc') && chainLower.includes('testnet'))) {
    const envOverride = getEnvRpcUrl(['VITE_BSC_TESTNET_RPC_URL', 'VITE_BSC_RPC_URL']);
    if (envOverride) {
      console.log(`   → Using BSC Testnet RPC override from ${envOverride.source}`);
      return envOverride.url;
    }
    console.log(`   → Using BSC Testnet RPC (thirdweb)`);
    return 'https://bsc-testnet.rpc.thirdweb.com';
  }

  if (chainLower === 'sepolia' || chainLower.includes('sepolia')) {
    console.log(`   → Using Sepolia RPC`);
    return 'https://ethereum-sepolia-rpc.publicnode.com';
  }

  if (chainLower === 'base') {
    console.log(`   → Using Base Sepolia RPC (defaulting to testnet)`);
    return 'https://base-sepolia-rpc.publicnode.com';
  }

  if (chainLower === 'bsc' || chainLower === 'binance') {
    const envOverride = getEnvRpcUrl(['VITE_BSC_RPC_URL']);
    if (envOverride) {
      console.log(`   → Using BSC RPC override from ${envOverride.source}`);
      return envOverride.url;
    }
    console.log(`   → Using BSC RPC (defaulting to BSC Testnet thirdweb endpoint)`);
    return 'https://bsc-testnet.rpc.thirdweb.com';
  }

  if (chainLower === 'ethereum' || chainLower === 'eth') {
    console.log(`   → Using Sepolia RPC (defaulting to testnet)`);
    return 'https://ethereum-sepolia-rpc.publicnode.com';
  }

  if (chainLower === 'hedera-testnet' || chainLower.includes('hedera')) {
    console.log(`   → Using Hedera Testnet RPC`);
    return 'https://testnet.hashio.io/api';
  }

  console.log(`   → Using Base Sepolia RPC (default fallback)`);
  return 'https://base-sepolia-rpc.publicnode.com';
};

