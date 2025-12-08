// Frontend blockchain service for real testnet deployments
import { ethers, BrowserProvider } from 'ethers';

// Helper to check if HashPack wallet is installed
export function isHashPackInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  console.log('🔍 Checking for HashPack wallet...');
  
  // HashPack can expose itself in multiple ways:
  // 1. Via window.hashpack
  // 2. Via window.ethereum with isHashPack flag
  // 3. Via window.ethereum.providers array with HashPack provider
  // 4. HashPack injects as window.ethereum directly (like MetaMask does)
  
  // Check window.hashpack
  if ((window as any).hashpack) {
    console.log('✅ HashPack detected via window.hashpack');
    return true;
  }
  
  // Check if window.ethereum has HashPack flag
  if (window.ethereum && (window.ethereum as any).isHashPack) {
    console.log('✅ HashPack detected via window.ethereum.isHashPack');
    return true;
  }
  
  // Check all window properties for "hashpack" (case-insensitive)
  for (const key in window) {
    if (key.toLowerCase().includes('hashpack')) {
      console.log(`✅ HashPack detected via window.${key}`);
      return true;
    }
  }
  
  // Check if HashPack is in providers array (most common when multiple wallets installed)
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    console.log(`🔍 Checking ${window.ethereum.providers.length} providers in array...`);
    
    // Log all providers for debugging
    window.ethereum.providers.forEach((p: any, idx: number) => {
      console.log(`   Provider ${idx}:`, {
        isMetaMask: p.isMetaMask,
        isPhantom: (p as any).isPhantom,
        isCoinbase: (p as any).isCoinbaseWallet,
        isHashPack: p.isHashPack,
        constructor: p.constructor?.name,
        keys: Object.keys(p).filter(k => k.toLowerCase().includes('hash') || k.toLowerCase().includes('pack')).slice(0, 5),
      });
    });
    
    // Look for HashPack in providers - check multiple possible identifiers
    const hashpack = window.ethereum.providers.find((p: any) => {
      // Check various ways HashPack might identify itself
      if (p.isHashPack) return true;
      if ((p as any).__hashpack) return true;
      if (p.constructor?.name === 'HashPackProvider') return true;
      if ((p as any).isHashPackWallet) return true;
      
      // Check if any property name contains "hashpack"
      const hasHashPackProperty = Object.keys(p).some(k => k.toLowerCase().includes('hashpack'));
      if (hasHashPackProperty) return true;
      
      // HashPack might not have a flag, but we can check if it's NOT MetaMask/Phantom
      // and if it supports Hedera network
      if (!p.isMetaMask && !(p as any).isPhantom && !(p as any).isCoinbaseWallet) {
        // This might be HashPack - check if it has Hedera-specific methods
        // HashPack typically supports Hedera network (chainId 296)
        if (typeof p.request === 'function') {
          // Try to detect by checking if it can handle Hedera-specific requests
          // This is a heuristic - we'll log it but not return true yet
          console.log(`   ⚠️ Provider ${window.ethereum.providers.indexOf(p)} is not MetaMask/Phantom/Coinbase - might be HashPack`);
        }
      }
      return false;
    });
    if (hashpack) {
      console.log('✅ HashPack detected in providers array');
      return true;
    }
    
    // If we have providers but none match, check for any non-MetaMask provider
    // This is a fallback - if user has HashPack installed, it should be in the array
    const nonMetaMaskProviders = window.ethereum.providers.filter((p: any) => 
      !p.isMetaMask && !(p as any).isPhantom && !(p as any).isCoinbaseWallet
    );
    if (nonMetaMaskProviders.length > 0) {
      console.log(`⚠️ Found ${nonMetaMaskProviders.length} non-MetaMask provider(s) - one might be HashPack`);
      // Don't return true here - we need user confirmation
    }
  }
  
  // If window.ethereum exists but is NOT MetaMask/Phantom/Coinbase, it might be HashPack
  // This is a fallback - HashPack injects as window.ethereum when it's the only wallet
  if (window.ethereum) {
    const isMetaMask = window.ethereum.isMetaMask;
    const isPhantom = !!(window.ethereum as any).isPhantom;
    const isCoinbase = !!(window.ethereum as any).isCoinbaseWallet;
    
    console.log('🔍 window.ethereum check:', {
      exists: true,
      isMetaMask,
      isPhantom,
      isCoinbase,
      hasProviders: !!window.ethereum.providers,
      providerCount: window.ethereum.providers?.length || 0,
    });
    
    // If it's not a known wallet, it could be HashPack
    // But we can't be 100% sure, so we'll return false and let the user know
    if (!isMetaMask && !isPhantom && !isCoinbase && !window.ethereum.providers) {
      console.log('⚠️ Unknown wallet provider detected - might be HashPack (no providers array)');
      // Don't return true here - we need more certainty
    }
  } else {
    console.log('❌ window.ethereum not found');
  }
  
  console.log('❌ HashPack not detected with current checks');
  return false;
}

// Type declaration for Chrome extension API
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (extensionId: string, message: any, options?: any) => Promise<any>;
      };
    };
  }
}

// Helper to check if HashPack extension is installed (Chrome extension ID)
export async function checkHashPackExtensionInstalled(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.chrome?.runtime) {
    return false;
  }
  
  try {
    // HashPack Chrome extension ID
    const hashpackExtensionId = 'kpfopkelmapcoecmlbdfiehjdjonljen';
    await window.chrome.runtime.sendMessage(hashpackExtensionId, { method: 'ping' });
    console.log('✅ HashPack extension detected via Chrome extension API');
    return true;
  } catch (e: any) {
    // Extension not found or not responding
    if (e.message?.includes('Could not establish connection')) {
      console.log('⚠️ HashPack extension may be installed but not responding');
    }
    return false;
  }
}

// Helper to get HashPack provider from window.ethereum.providers
export function getHashPackProvider(): any | null {
  if (typeof window === 'undefined') return null;
  
  console.log('🔍 Getting HashPack provider...');
  
  // Check window.hashpack first (most direct method)
  if ((window as any).hashpack) {
    console.log('✅ Found HashPack via window.hashpack');
    // HashPack might expose an ethereum provider via hashpack.provider or hashpack.ethereum
    if ((window as any).hashpack.provider) {
      console.log('   Using hashpack.provider');
      return (window as any).hashpack.provider;
    }
    if ((window as any).hashpack.ethereum) {
      console.log('   Using hashpack.ethereum');
      return (window as any).hashpack.ethereum;
    }
    // If hashpack itself is a provider
    if (typeof (window as any).hashpack.request === 'function') {
      console.log('   Using hashpack directly as provider');
      return (window as any).hashpack;
    }
  }
  
  // Check for HashPack via other possible global variables
  const possibleHashPackKeys = ['HashPack', 'hashpack', 'Hashpack', 'HASHPACK'];
  for (const key of possibleHashPackKeys) {
    if ((window as any)[key]) {
      console.log(`✅ Found potential HashPack via window.${key}`);
      const obj = (window as any)[key];
      if (obj.provider) return obj.provider;
      if (obj.ethereum) return obj.ethereum;
      if (typeof obj.request === 'function') return obj;
    }
  }
  
  // Check if HashPack is in the providers array but not detected
  // Some wallets inject but don't set clear flags
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    // Check if any provider has HashPack-like properties
    for (const provider of window.ethereum.providers) {
      const keys = Object.keys(provider);
      // Look for HashPack-specific keys
      if (keys.some(k => k.toLowerCase().includes('hashpack'))) {
        console.log('✅ Found HashPack in providers (has hashpack-related keys)');
        return provider;
      }
    }
  }
  
  // Check if window.ethereum is HashPack
  if (window.ethereum && (window.ethereum as any).isHashPack) {
    console.log('✅ Found HashPack via window.ethereum.isHashPack');
    return window.ethereum;
  }
  
  // Check all window properties for "hashpack" (case-insensitive)
  for (const key in window) {
    if (key.toLowerCase().includes('hashpack')) {
      console.log(`✅ Found HashPack via window.${key}`);
      const hashpackObj = (window as any)[key];
      // Check if it has a provider property
      if (hashpackObj?.provider) {
        return hashpackObj.provider;
      }
      // Check if it's a provider itself
      if (typeof hashpackObj?.request === 'function') {
        return hashpackObj;
      }
      return hashpackObj;
    }
  }
  
  // Check providers array
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    console.log(`🔍 Checking ${window.ethereum.providers.length} providers for HashPack...`);
    
    // Log ALL providers with detailed information (log each property separately for visibility)
    window.ethereum.providers.forEach((p: any, idx: number) => {
      console.log(`   Provider ${idx}:`);
      console.log(`      isMetaMask: ${p.isMetaMask}`);
      console.log(`      isPhantom: ${(p as any).isPhantom}`);
      console.log(`      isCoinbase: ${(p as any).isCoinbaseWallet}`);
      console.log(`      isHashPack: ${p.isHashPack}`);
      console.log(`      __hashpack: ${(p as any).__hashpack}`);
      console.log(`      constructor.name: ${p.constructor?.name}`);
      const allKeys = Object.keys(p).slice(0, 20);
      console.log(`      First 20 keys:`, allKeys);
      
      // Check for HashPack-specific properties
      const hashpackKeys = Object.keys(p).filter(k => k.toLowerCase().includes('hashpack'));
      if (hashpackKeys.length > 0) {
        console.log(`      ⚠️ Found HashPack-related keys:`, hashpackKeys);
      }
      
      // Log some key properties that might help identify the provider
      if (allKeys.length > 0) {
        console.log(`      Sample property values:`, {
          selectedAddress: (p as any).selectedAddress,
          chainId: (p as any).chainId,
          networkVersion: (p as any).networkVersion,
        });
      }
      
      // Check if provider has Hedera-specific methods
      if (typeof (p as any).request === 'function') {
        // Try to detect if it's HashPack by checking for Hedera chain support
        console.log(`      Has request method: true`);
      }
    });
    
    // First, look for explicit HashPack identifiers
    const hashpack = window.ethereum.providers.find((p: any) => {
      if (p.isHashPack) return true;
      if ((p as any).__hashpack) return true;
      if (p.constructor?.name === 'HashPackProvider') return true;
      if ((p as any).isHashPackWallet) return true;
      
      // Check if any property name contains "hashpack"
      const hasHashPackProperty = Object.keys(p).some(k => k.toLowerCase().includes('hashpack'));
      if (hasHashPackProperty) return true;
      
      return false;
    });
    if (hashpack) {
      console.log('✅ Found HashPack in providers array (explicit identifier)');
      return hashpack;
    }
    
    // HashPack might set isMetaMask=true for compatibility, so we need a different approach
    // Check if any provider has HashPack-related properties, even if it also has isMetaMask
    const potentialHashPack = window.ethereum.providers.find((p: any) => {
      // Check for HashPack-specific properties
      const keys = Object.keys(p);
      const hasHashPackKey = keys.some(k => k.toLowerCase().includes('hashpack'));
      if (hasHashPackKey) return true;
      
      // Check constructor name
      if (p.constructor?.name && p.constructor.name.toLowerCase().includes('hashpack')) return true;
      
      // Check for HashPack-specific methods or properties
      if ((p as any).__hashpack) return true;
      if (p.isHashPack) return true;
      if ((p as any).isHashPackWallet) return true;
      
      return false;
    });
    
    if (potentialHashPack) {
      console.log('✅ Found HashPack in providers array (has HashPack properties)');
      return potentialHashPack;
    }
    
    // If HashPack isn't found with flags, look for a provider that's NOT MetaMask/Phantom
    // This is a heuristic - HashPack might be in the array without clear identifiers
    const nonMetaMaskProviders = window.ethereum.providers.filter((p: any) => 
      !p.isMetaMask && !(p as any).isPhantom && !(p as any).isCoinbaseWallet
    );
    if (nonMetaMaskProviders.length > 0) {
      console.log(`⚠️ Found ${nonMetaMaskProviders.length} non-MetaMask provider(s) - using first one (might be HashPack)`);
      console.log(`   Constructor: ${nonMetaMaskProviders[0].constructor?.name}`);
      console.log(`   isMetaMask: ${nonMetaMaskProviders[0].isMetaMask}`);
      console.log(`   isPhantom: ${(nonMetaMaskProviders[0] as any).isPhantom}`);
      console.log(`   isCoinbase: ${(nonMetaMaskProviders[0] as any).isCoinbaseWallet}`);
      console.log(`   First 20 keys:`, Object.keys(nonMetaMaskProviders[0]).slice(0, 20));
      console.log('   ✅ Using this provider as potential HashPack');
      return nonMetaMaskProviders[0];
    } else {
      console.log('   ⚠️ All providers are MetaMask/Phantom/Coinbase - HashPack not found in array');
      console.log('   💡 HashPack might be setting isMetaMask=true for compatibility');
      console.log('   💡 Checking if any provider supports Hedera chain...');
      
      // Last resort: if there's only one provider and it's not explicitly MetaMask, it might be HashPack
      // This is risky but might work if HashPack is masquerading as MetaMask
      if (window.ethereum.providers.length === 1) {
        console.log('   ⚠️ Only one provider found - might be HashPack masquerading as MetaMask');
        console.log('   💡 You may need to connect HashPack explicitly via the wallet connection button');
      }
    }
  }
  
  // Last resort: if window.ethereum exists and is NOT a known wallet, it might be HashPack
  if (window.ethereum && !window.ethereum.isMetaMask && !(window.ethereum as any).isPhantom && !(window.ethereum as any).isCoinbaseWallet && !window.ethereum.providers) {
    console.log('⚠️ window.ethereum is not a known wallet and has no providers array - might be HashPack');
    return window.ethereum;
  }
  
  console.log('❌ HashPack provider not found');
  return null;
}

// Helper to get the preferred EVM provider
// For Hedera: Prioritize HashPack > MetaMask
// For other chains: Prioritize MetaMask > others
export function getPreferredEVMProvider(chain?: string): any {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  const chainLower = chain?.toLowerCase() || '';
  const isHedera = chainLower.includes('hedera');

  // For Hedera, prioritize HashPack
  if (isHedera) {
    // Try to get HashPack provider specifically
    const hashpackProvider = getHashPackProvider();
    if (hashpackProvider) {
      console.log('✅ HashPack provider found - using it for Hedera');
      return hashpackProvider;
    }
    
    // If HashPack is detected but provider not found, try to find it in providers array
    if (isHashPackInstalled() && window.ethereum?.providers) {
      // Look more carefully in providers array
      const hashpack = window.ethereum.providers.find((p: any) => {
        // Check if it's NOT MetaMask/Phantom/Coinbase - might be HashPack
        return !p.isMetaMask && !(p as any).isPhantom && !(p as any).isCoinbaseWallet;
      });
      if (hashpack) {
        console.log('✅ Found potential HashPack provider (non-MetaMask provider)');
        return hashpack;
      }
    }
    
    console.warn('⚠️ HashPack not found in providers, but proceeding with available wallet for Hedera');
  }

  // Check if window.ethereum exists
  if (!window.ethereum) {
    if (isHedera) {
      throw new Error('No Hedera wallet detected. Please install HashPack wallet for the best Hedera experience.');
    }
    throw new Error('No EVM wallet detected. Please install MetaMask or another EVM-compatible wallet.');
  }

  // If window.ethereum.providers exists (multiple wallets), prioritize based on chain
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    if (isHedera) {
      // For Hedera, look for HashPack first, then MetaMask
      const hashpack = window.ethereum.providers.find((p: any) => p.isHashPack || (p as any).__hashpack);
      if (hashpack) {
        console.log('✅ Found HashPack provider, using it for Hedera');
        return hashpack;
      }
    }
    
    // Look for MetaMask
    const metaMask = window.ethereum.providers.find((p: any) => p.isMetaMask);
    if (metaMask) {
      console.log('✅ Found MetaMask provider, using it');
      return metaMask;
    }
    
    // If no preferred wallet, use the first provider
    console.log('⚠️ Preferred wallet not found, using first available provider');
    return window.ethereum.providers[0];
  }

  // Single provider - check if it's MetaMask, HashPack, or Phantom
  if ((window.ethereum as any).isHashPack) {
    console.log('✅ Using HashPack provider');
    return window.ethereum;
  }
  
  if (window.ethereum.isMetaMask) {
    console.log('✅ Using MetaMask provider');
    return window.ethereum;
  }

  // Check if it's Phantom (and warn user)
  if (window.ethereum.isPhantom) {
    console.warn('⚠️ Phantom wallet detected. MetaMask is recommended for EVM chains.');
    console.warn('   If you prefer MetaMask, please disable Phantom or install MetaMask.');
    return window.ethereum;
  }

  // Unknown provider, use it anyway
  console.log('⚠️ Using unknown provider');
  return window.ethereum;
}

export interface DeploymentConfig {
  chain: 'ethereum' | 'bsc' | 'base' | 'solana' | 'hedera';
  tokenData: {
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: string;
    metadataUri?: string;
  };
  curveData: {
    basePrice: string;
    slope: string;
    graduationThreshold: string;
    buyFeePercent: string;
    sellFeePercent: string;
  };
}

// Chain configurations for MetaMask
const CHAIN_CONFIGS = {
  ethereum: {
    chainId: '0xAA36A7', // 11155111 in hex
    chainName: 'Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  bsc: {
    chainId: '0x61', // 97 in hex
    chainName: 'BSC Testnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-testnet.publicnode.com'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  },
  base: {
    chainId: '0x14A34', // 84532 in hex
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://base-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia-explorer.base.org'],
  },
  hedera: {
    chainId: '0x128', // 296 in hex (Hedera Testnet)
    chainName: 'Hedera Testnet',
    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  },
  // Unichain - Uniswap Labs L2 (Native Uniswap v4 support)
  // Testnet: Chain ID 1301, Mainnet: Chain ID 130
  unichain: {
    chainId: '0x515', // 1301 in hex (Unichain Sepolia Testnet)
    chainName: 'Unichain Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.unichain.org'],
    blockExplorerUrls: ['https://sepolia.uniscan.xyz'],
  },
};

// Testnet Factory Addresses (must be deployed first)
const FACTORY_ADDRESSES: Record<string, string> = {
  ethereum: import.meta.env.VITE_ETH_FACTORY || import.meta.env.VITE_ETHEREUM_FACTORY || '',
  bsc: import.meta.env.VITE_BSC_FACTORY || '',
  base: import.meta.env.VITE_BASE_FACTORY || '',
  hedera: import.meta.env.VITE_HEDERA_FACTORY || '',
  unichain: import.meta.env.VITE_UNICHAIN_FACTORY || '', // Placeholder - deploy when Unichain launches
};

// Debug: Log factory addresses at build time (will show in console)
console.log('🏭 Factory Addresses Configuration:', {
  ethereum: FACTORY_ADDRESSES.ethereum || 'NOT SET',
  bsc: FACTORY_ADDRESSES.bsc || 'NOT SET',
  base: FACTORY_ADDRESSES.base || 'NOT SET',
  hedera: FACTORY_ADDRESSES.hedera || 'NOT SET',
  envVars: {
    VITE_ETH_FACTORY: import.meta.env.VITE_ETH_FACTORY || 'NOT SET',
    VITE_ETHEREUM_FACTORY: import.meta.env.VITE_ETHEREUM_FACTORY || 'NOT SET',
    VITE_BSC_FACTORY: import.meta.env.VITE_BSC_FACTORY || 'NOT SET',
    VITE_BASE_FACTORY: import.meta.env.VITE_BASE_FACTORY || 'NOT SET',
    VITE_HEDERA_FACTORY: import.meta.env.VITE_HEDERA_FACTORY || 'NOT SET',
  }
});

// Token Factory ABI (createToken function)
const TOKEN_FACTORY_ABI = [
  'function createToken(string memory name, string memory symbol, uint256 initialSupply, string memory uri, uint256 basePrice, uint256 slope, uint256 graduationThreshold, uint256 buyFeePercent, uint256 sellFeePercent) external returns (address tokenAddress, address curveAddress)',
  'event TokenCreated(address indexed tokenAddress, address indexed creator, address indexed curveAddress, string name, string symbol)',
];

// Helper to check if an EVM wallet provider is available
function checkEVMWallet(): void {
  try {
    getPreferredEVMProvider();
  } catch (error: any) {
    throw new Error('No EVM wallet detected. Please install MetaMask, Phantom (EVM mode), or another EVM-compatible wallet to deploy tokens.');
  }
}

// Helper function to switch network
// Helper to check if user has a recommended wallet for Hedera
export function getHederaWalletRecommendation(): {
  hasRecommended: boolean;
  walletName: string;
  installUrl: string;
  instructions: string[];
} {
  const hasHashPack = isHashPackInstalled();
  
  return {
    hasRecommended: hasHashPack,
    walletName: 'HashPack',
    installUrl: 'https://www.hashpack.app/',
    instructions: [
      '1. Visit https://www.hashpack.app/',
      '2. Click "Get HashPack" and install the browser extension',
      '3. Create a new wallet or import an existing one',
      '4. Make sure you\'re on Hedera Testnet (switch in HashPack settings)',
      '5. Fund your wallet with testnet HBAR from https://portal.hedera.com',
      '6. Return here and connect your HashPack wallet',
    ],
  };
}

export async function switchNetwork(chain: 'ethereum' | 'bsc' | 'base' | 'hedera' | 'unichain'): Promise<void> {
  checkEVMWallet();
  const provider = getPreferredEVMProvider();
  const config = CHAIN_CONFIGS[chain];
  const chainIdHex = config.chainId;

  try {
    // Check if the chain is already connected
    const currentChainId = await provider.request({ method: 'eth_chainId' });
    
    if (currentChainId === chainIdHex) {
      console.log(`Already on ${chain} network`);
      return;
    }

    // Try to switch to the network
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      console.log(`Switched to ${chain} network`);
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902 || switchError.code === -32603) {
        console.log(`Adding ${chain} network...`);
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [config],
        });
        console.log(`Added and switched to ${chain} network`);
      } else {
        throw switchError;
      }
    }
  } catch (error: any) {
    console.error(`Failed to switch to ${chain} network:`, error);
    throw new Error(`Failed to switch to ${chain} network: ${error.message || 'Unknown error'}`);
  }
}

export async function deployTokenOnEVM(
  chain: 'ethereum' | 'bsc' | 'base' | 'hedera' | 'unichain',
  config: DeploymentConfig
): Promise<{ tokenAddress: string; curveAddress: string; txHash: string }> {
  console.log(`🚀 Starting deployment to ${chain}...`);
  
  checkEVMWallet();

  const factoryAddress = FACTORY_ADDRESSES[chain];
  
  // Enhanced logging to diagnose the issue
  console.log(`🔍 Factory Address Check for ${chain}:`, {
    factoryAddress: factoryAddress || 'EMPTY/UNDEFINED',
    envVar: chain === 'ethereum' ? import.meta.env.VITE_ETH_FACTORY || import.meta.env.VITE_ETHEREUM_FACTORY : import.meta.env[`VITE_${chain.toUpperCase()}_FACTORY`],
    allEnvVars: {
      VITE_ETH_FACTORY: import.meta.env.VITE_ETH_FACTORY || 'NOT SET',
      VITE_ETHEREUM_FACTORY: import.meta.env.VITE_ETHEREUM_FACTORY || 'NOT SET',
      VITE_BSC_FACTORY: import.meta.env.VITE_BSC_FACTORY || 'NOT SET',
      VITE_BASE_FACTORY: import.meta.env.VITE_BASE_FACTORY || 'NOT SET',
    }
  });
  
  if (!factoryAddress || factoryAddress === '') {
    const envVarName = chain === 'ethereum' ? 'VITE_ETH_FACTORY or VITE_ETHEREUM_FACTORY' : `VITE_${chain.toUpperCase()}_FACTORY`;
    const chainNames: Record<string, string> = {
      ethereum: 'Sepolia',
      bsc: 'BSC Testnet',
      base: 'Base Sepolia',
      hedera: 'Hedera Testnet',
      unichain: 'Unichain Sepolia'
    };
    const chainName = chainNames[chain] || chain;
    const errorMsg = `Factory contract address not configured for ${chainName} (${chain}).\n\nPlease add ${envVarName} to your GitHub Secrets:\n1. Go to your repository Settings → Secrets and variables → Actions\n2. Click "New repository secret"\n3. Name: ${envVarName}\n4. Value: (see factory addresses below)\n5. Click "Add secret"\n6. Push a new commit or manually trigger the GitHub Actions workflow\n\nFactory addresses:\n- Sepolia: 0x8eF1A74d477448630282EFC130ac9D17f495Bca4\n- BSC Testnet: 0xFF8c690B5b65905da20D8de87Cd6298c223a40B6\n- Base Sepolia: 0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58\n- Hedera Testnet: 0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D\n- Unichain Sepolia: 0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }
  
  console.log(`✅ Factory address found for ${chain}: ${factoryAddress}`);

  console.log(`📋 Factory address: ${factoryAddress}`);
  
  // Switch to the correct network first
  console.log(`🔄 Switching to ${chain} network...`);
  await switchNetwork(chain);
  
  // Give wallet a moment to switch networks
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`🔌 Connecting to provider...`);
  // Use preferred provider (MetaMask if available, otherwise first available)
  const ethereumProvider = getPreferredEVMProvider();
  
  // Warn if using Phantom
  if (ethereumProvider.isPhantom) {
    console.warn('⚠️ Using Phantom wallet for EVM. MetaMask is recommended for better compatibility.');
  }
  
  const provider = new BrowserProvider(ethereumProvider);
  
  // Verify factory contract exists BEFORE attempting to use it
  console.log(`🔍 Verifying factory contract exists at ${factoryAddress}...`);
  const code = await provider.getCode(factoryAddress);
  if (!code || code === '0x' || code === '0x0') {
    throw new Error(`❌ Factory contract not found at ${factoryAddress} on ${chain}.\n\nThis means the factory hasn't been deployed yet or the address is wrong.\n\nPlease deploy the TokenFactory contract first using:\n  npx hardhat run scripts/deploy.ts --network ${chain === 'ethereum' ? 'sepolia' : chain === 'bsc' ? 'bscTestnet' : 'baseSepolia'}\n\nThen update your frontend/.env file with the deployed address.`);
  }
  console.log(`✅ Factory contract verified (code length: ${code.length} bytes)`);
  
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  console.log(`✅ Connected with address: ${signerAddress}`);
  
  // Connect to factory contract
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, signer);
  
  // Try to call a view function to verify the contract is working
  try {
    const chainName = await factory.chainName();
    console.log(`✅ Factory contract is active on chain: ${chainName}`);
  } catch (err) {
    console.warn(`⚠️  Could not verify factory contract state, but code exists`);
  }
  console.log(`📋 Token data:`, config.tokenData);

  // Convert values to proper units
  // Contract expects initialSupply in base units (it multiplies by 10^18 internally)
  // So if user enters 1000000000, we pass 1000000000 and contract makes it 1000000000 * 10^18
  const initialSupply = BigInt(config.tokenData.initialSupply);
  
  // CRITICAL: basePrice and slope are entered in USD, but contract stores them in native token (ETH/BNB)
  // We need to convert USD to native token based on current prices
  // Approximate prices: ETH ~$3000, BNB ~$600, Base uses ETH pricing
  const getNativeTokenPrice = (chain: string): number => {
    const chainLower = chain.toLowerCase();
    if (chainLower.includes('bsc') || chainLower.includes('binance')) {
      return 600; // BNB price ~$600
    }
    // Ethereum, Base, and others use ETH pricing
    return 3000; // ETH price ~$3000
  };
  
  const nativeTokenPriceUSD = getNativeTokenPrice(chain);
  const basePriceUSD = parseFloat(config.curveData.basePrice);
  const slopeUSD = parseFloat(config.curveData.slope);
  
  // Convert USD to native token: nativeTokenAmount = usdAmount / nativeTokenPrice
  const basePriceInNativeToken = (basePriceUSD / nativeTokenPriceUSD).toFixed(18);
  const slopeInNativeToken = (slopeUSD / nativeTokenPriceUSD).toFixed(18);
  
  console.log(`💰 Price conversion for ${chain}:`);
  console.log(`   Native token price: $${nativeTokenPriceUSD}`);
  console.log(`   Base Price: $${basePriceUSD} → ${basePriceInNativeToken} ${chain.includes('bsc') ? 'BNB' : 'ETH'}`);
  console.log(`   Slope: $${slopeUSD} per token → ${slopeInNativeToken} ${chain.includes('bsc') ? 'BNB' : 'ETH'} per token`);
  
  const basePrice = ethers.parseEther(basePriceInNativeToken); // Convert native token to wei
  const slope = ethers.parseEther(slopeInNativeToken); // Convert native token to wei
  // graduationThreshold is in USD, scale by 1e18 (not parseEther which treats it as ETH)
  const graduationThreshold = ethers.parseUnits(config.curveData.graduationThreshold, 18);
  
  // CRITICAL: Convert fee percentages to basis points (like Uniswap)
  // User enters percentage (e.g., 1 = 1%), contract expects basis points (e.g., 100 = 1%)
  // Formula: basis points = percentage * 100
  // Example: 1% → 100 basis points, 0.5% → 50 basis points, 0% → 0 basis points
  const buyFeePercentInput = parseFloat(config.curveData.buyFeePercent || '0');
  const sellFeePercentInput = parseFloat(config.curveData.sellFeePercent || '0');
  
  // Validate fees are within acceptable range (0-10%)
  if (buyFeePercentInput < 0 || buyFeePercentInput > 10) {
    throw new Error(`Buy fee must be between 0% and 10%. Got: ${buyFeePercentInput}%`);
  }
  if (sellFeePercentInput < 0 || sellFeePercentInput > 10) {
    throw new Error(`Sell fee must be between 0% and 10%. Got: ${sellFeePercentInput}%`);
  }
  
  // Convert to basis points: percentage * 100 (e.g., 1% = 100, 0.5% = 50)
  // Use Math.floor to ensure we don't exceed contract limits due to rounding
  const buyFeePercent = BigInt(Math.floor(buyFeePercentInput * 100));
  const sellFeePercent = BigInt(Math.floor(sellFeePercentInput * 100));
  
  console.log(`💰 Fee conversion: Buy ${buyFeePercentInput}% → ${buyFeePercent.toString()} basis points, Sell ${sellFeePercentInput}% → ${sellFeePercent.toString()} basis points`);
  
  // Validate parameters before sending
  if (initialSupply === BigInt(0)) {
    throw new Error('Initial supply cannot be zero');
  }
  if (basePrice === BigInt(0)) {
    throw new Error('Base price cannot be zero');
  }

  console.log(`📦 Initial supply: ${initialSupply.toString()}`);
  console.log(`💰 Base price: ${basePrice.toString()} wei`);
  console.log(`📈 Slope: ${slope.toString()} wei`);
  console.log(`🎯 Graduation threshold: ${graduationThreshold.toString()}`);

  // Estimate gas first to catch errors early
  console.log(`⛽ Estimating gas...`);
  console.log(`📋 Parameters:`, {
    name: config.tokenData.name,
    symbol: config.tokenData.symbol,
    initialSupply: initialSupply.toString(),
    basePrice: basePrice.toString(),
    slope: slope.toString(),
    graduationThreshold: graduationThreshold.toString(),
    buyFeePercent: buyFeePercent.toString(),
    sellFeePercent: sellFeePercent.toString(),
  });
  
  let gasEstimate;
  try {
    // First, let's try calling the function directly with callStatic to see if it would revert
    console.log(`🧪 Testing function call with callStatic...`);
    let staticCallSuccess = false;
    try {
      await factory.createToken.staticCall(
        config.tokenData.name,
        config.tokenData.symbol,
        initialSupply,
        config.tokenData.metadataUri || '',
        basePrice,
        slope,
        graduationThreshold,
        buyFeePercent,
        sellFeePercent
      );
      console.log(`✅ Static call successful - function should work!`);
      staticCallSuccess = true;
    } catch (staticCallError: any) {
      console.error(`❌ Static call failed:`, staticCallError);
      throw new Error(`❌ Function call would revert: ${staticCallError.reason || staticCallError.message}\n\nThis usually means:\n1. Contract function signature doesn't match\n2. Parameters are invalid\n3. Contract state is invalid\n\nPlease check the contract code and parameters.`);
    }
    
    // If static call succeeded, try gas estimation
    // If gas estimation fails but static call succeeded, use a generous default
    if (staticCallSuccess) {
      try {
        const populatedTx = await factory.createToken.populateTransaction(
          config.tokenData.name,
          config.tokenData.symbol,
          initialSupply,
          config.tokenData.metadataUri || '',
          basePrice,
          slope,
          graduationThreshold,
          buyFeePercent,
          sellFeePercent
        );
        
        // Try to estimate gas with a high gas limit override
        try {
          gasEstimate = await provider.estimateGas(populatedTx);
          console.log(`✅ Gas estimate: ${gasEstimate.toString()} gas units`);
        } catch (gasEstError: any) {
          // If gas estimation fails but static call succeeded, use a generous default
          // This handles cases where RPC nodes have issues with complex contract deployments
          console.warn(`⚠️  Gas estimation failed, but static call succeeded. Using default gas limit.`);
          console.warn(`   Gas estimation error:`, gasEstError.message);
          // Use a more generous gas limit for deploying token + bonding curve
          // CrossChainToken deployment ~600k-800k (larger contract with LayerZero integration)
          // BondingCurve deployment ~400k-500k
          // Token transfers ~200k
          // setBondingCurve call ~100k
          // transferOwnership call ~50k
          // authorizeUpdater call ~100k
          // Overhead and safety margin ~1M
          // Total: ~2.5M-2.7M, use 5M for safety with cross-chain tokens
          gasEstimate = BigInt(5_000_000); // Increased to 5M for cross-chain tokens
          console.log(`📦 Using default gas limit: ${gasEstimate.toString()} gas units`);
        }
      } catch (populateError: any) {
        console.warn(`⚠️  Could not populate transaction, using default gas limit`);
        gasEstimate = BigInt(5_000_000); // Increased to 5M for safety
      }
    }
  } catch (estimateError: any) {
    console.error(`❌ Gas estimation failed:`, estimateError);
    console.error(`❌ Error code:`, estimateError.code);
    console.error(`❌ Error data:`, estimateError.data);
    console.error(`❌ Error reason:`, estimateError.reason);
    console.error(`❌ Full error object:`, JSON.stringify(estimateError, null, 2));
    
    // Try to decode the revert reason
    let errorMessage = 'Transaction will revert';
    let decodedReason = '';
    
    if (estimateError.data) {
      try {
        // Try to decode as a custom error
        const reason = factory.interface.parseError(estimateError.data);
        if (reason) {
          errorMessage = `Transaction will revert: ${reason.name}`;
          decodedReason = reason.name;
          console.error(`Decoded error:`, reason);
        }
      } catch (parseError) {
        // Try to decode as a string revert
        try {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + estimateError.data.slice(10));
          errorMessage = `Transaction reverted: ${decoded[0]}`;
          decodedReason = decoded[0];
        } catch {
          // Try to decode as hex-encoded ASCII (common in Hedera)
          try {
            // Remove 0x prefix and decode hex to ASCII
            const hexData = estimateError.data.startsWith('0x') ? estimateError.data.slice(2) : estimateError.data;
            // Check if it's valid hex and looks like ASCII
            if (/^[0-9a-fA-F]+$/.test(hexData)) {
              let asciiString = '';
              for (let i = 0; i < hexData.length; i += 2) {
                const hexByte = hexData.substr(i, 2);
                const charCode = parseInt(hexByte, 16);
                if (charCode >= 32 && charCode <= 126) { // Printable ASCII range
                  asciiString += String.fromCharCode(charCode);
                } else {
                  break; // Not ASCII, stop decoding
                }
              }
              if (asciiString.length > 0) {
                decodedReason = asciiString;
                // Map common Hedera errors to user-friendly messages
                if (asciiString === 'INSUFFICIENT_PAYER_BALANCE') {
                  errorMessage = `Insufficient HBAR balance`;
                } else {
                  errorMessage = `Transaction reverted: ${asciiString}`;
                }
                console.error(`Decoded hex-encoded ASCII error:`, asciiString);
              }
            }
          } catch (hexError) {
            // If it's a standard error, try to extract the selector
            const errorSelector = estimateError.data.slice(0, 10);
            console.error(`Error selector: ${errorSelector}`);
            
            // Common error selectors
            const errorMap: Record<string, string> = {
              '0x08c379a0': 'Error(string)',
              '0x4e487b71': 'Panic(uint256)',
            };
            
            if (errorMap[errorSelector]) {
              errorMessage = `Transaction reverted with ${errorMap[errorSelector]}`;
            }
          }
        }
      }
    }
    
    // Handle "missing revert data" - usually means function doesn't exist or wrong ABI
    if (estimateError.message?.includes('missing revert data') || estimateError.data === null) {
      throw new Error(`❌ Cannot call createToken function on factory contract.\n\nPossible causes:\n1. Factory contract ABI doesn't match (wrong function signature)\n2. Factory contract doesn't have createToken function\n3. Contract address is wrong\n\nFactory address: ${factoryAddress}\nChain: ${chain}\n\nPlease verify:\n1. The factory was deployed correctly\n2. The ABI matches your contract\n3. The address in .env is correct for ${chain}`);
    }
    
    // Provide detailed error message with chain-specific guidance
    const nativeToken = chain === 'bsc' ? 'BNB' : chain === 'hedera' ? 'HBAR' : 'ETH';
    let detailedMessage = `❌ ${errorMessage}\n\nFactory: ${factoryAddress}\nChain: ${chain}\n\n`;
    
    // Add chain-specific guidance
    if (decodedReason === 'INSUFFICIENT_PAYER_BALANCE' || errorMessage.includes('Insufficient')) {
      if (chain === 'hedera') {
        detailedMessage += `⚠️ Insufficient HBAR balance!\n\nYou need HBAR (not ETH) to deploy on Hedera Testnet.\n\nTo get testnet HBAR:\n1. Visit https://portal.hedera.com/\n2. Connect your wallet\n3. Request testnet HBAR\n4. Make sure you have at least 10-20 HBAR for deployment\n\n`;
      } else {
        detailedMessage += `⚠️ Insufficient ${nativeToken} balance!\n\nYou need ${nativeToken} to pay for gas fees.\n\n`;
      }
    }
    
    detailedMessage += `Please check:\n1. Factory contract exists and is deployed\n2. Parameters are valid (initialSupply: ${initialSupply}, basePrice: ${ethers.formatEther(basePrice)} ${nativeToken})\n3. You have sufficient testnet ${nativeToken} (${chain === 'hedera' ? 'HBAR' : nativeToken})\n4. Function signature matches the contract`;
    
    throw new Error(detailedMessage);
  }

  // Deploy token - THIS SHOULD TRIGGER METAMASK POPUP
  console.log(`📝 Calling createToken function - MetaMask should pop up now...`);
  if (gasEstimate) {
    console.log(`⛽ Using gas limit: ${gasEstimate.toString()}`);
  }
  
  // Get current gas price to ensure transaction can be mined
  // Set minimum gas prices per chain (in Gwei)
  const MIN_GAS_PRICES: Record<string, bigint> = {
    ethereum: ethers.parseUnits('20', 'gwei'), // Sepolia: 20 Gwei
    bsc: ethers.parseUnits('3', 'gwei'), // BSC Testnet: 3 Gwei
    base: ethers.parseUnits('1', 'gwei'), // Base Sepolia: 1 Gwei
    unichain: ethers.parseUnits('0.001', 'gwei'), // Unichain Sepolia: Very low (0.001 Gwei) - testnet
    hedera: ethers.parseUnits('1', 'gwei'), // Hedera Testnet: 1 Gwei
  };
  
  let feeData;
  try {
    feeData = await provider.getFeeData();
    const currentGasPrice = feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'unknown';
    console.log(`💰 Current gas price: ${currentGasPrice} Gwei`);
  } catch (feeError) {
    console.warn(`⚠️  Could not get fee data, using minimum defaults`);
  }
  
  try {
    // Build transaction options
    const txOptions: any = {
      gasLimit: gasEstimate, // Use our gas estimate (or default)
    };
    
    // Set gas price with minimum fallback
    const minGasPrice = MIN_GAS_PRICES[chain] || ethers.parseUnits('3', 'gwei');
    
    if (feeData?.gasPrice) {
      // Use the higher of current gas price or minimum
      txOptions.gasPrice = feeData.gasPrice > minGasPrice ? feeData.gasPrice : minGasPrice;
      console.log(`⛽ Using gas price: ${ethers.formatUnits(txOptions.gasPrice, 'gwei')} Gwei`);
    } else if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
      // For EIP-1559 transactions, ensure maxFeePerGas is at least minimum
      const minMaxFee = feeData.maxFeePerGas > minGasPrice ? feeData.maxFeePerGas : minGasPrice;
      txOptions.maxFeePerGas = minMaxFee;
      txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      console.log(`⛽ Using maxFeePerGas: ${ethers.formatUnits(txOptions.maxFeePerGas, 'gwei')} Gwei`);
    } else {
      // Fallback to minimum gas price
      txOptions.gasPrice = minGasPrice;
      console.log(`⛽ Using minimum gas price: ${ethers.formatUnits(txOptions.gasPrice, 'gwei')} Gwei`);
    }
    
    console.log(`📋 Transaction options:`, {
      gasLimit: txOptions.gasLimit.toString(),
      gasPrice: txOptions.gasPrice ? ethers.formatUnits(txOptions.gasPrice, 'gwei') + ' Gwei' : undefined,
      maxFeePerGas: txOptions.maxFeePerGas ? ethers.formatUnits(txOptions.maxFeePerGas, 'gwei') + ' Gwei' : undefined,
    });
    
    // Log transaction details before sending
    console.log(`📋 Transaction details:`);
    console.log(`   To: ${factoryAddress}`);
    console.log(`   From: ${signerAddress}`);
    if (gasEstimate) {
      console.log(`   Gas Limit: ${gasEstimate.toString()}`);
    }
    console.log(`   Gas Price: ${txOptions.gasPrice ? ethers.formatUnits(txOptions.gasPrice, 'gwei') : 'auto'} Gwei`);
    
    // Build the function call manually to verify encoding
    const functionData = factory.interface.encodeFunctionData('createToken', [
      config.tokenData.name,
      config.tokenData.symbol,
      initialSupply,
      config.tokenData.metadataUri || '',
      basePrice,
      slope,
      graduationThreshold,
      buyFeePercent,
      sellFeePercent,
    ]);
    console.log(`📋 Function data length: ${functionData.length} bytes`);
    console.log(`📋 Function selector: ${functionData.slice(0, 10)}`);
    
    // Use the gas estimate we got (or default if estimation failed)
    // For Unichain, use a lower gas limit since it's optimized for Uniswap v4
    // Increase gas limit by 10% to account for variations (reduced buffer since we're using generous defaults)
    // Cap at 8M to prevent excessive gas usage (lower for Unichain)
    let adjustedGasLimit: bigint | undefined;
    if (gasEstimate) {
      const bufferGasLimit = (gasEstimate * BigInt(110)) / BigInt(100);
      // Unichain is optimized, so use lower max gas limit
      const maxGasLimit = chain === 'unichain' ? BigInt(4_000_000) : BigInt(8_000_000);
      adjustedGasLimit = bufferGasLimit > maxGasLimit ? maxGasLimit : bufferGasLimit;
      txOptions.gasLimit = adjustedGasLimit;
      console.log(`⛽ Adjusted gas limit: ${adjustedGasLimit.toString()} (10% buffer added, max ${maxGasLimit.toString()})`);
    }
    
    const createTx = await factory.createToken(
      config.tokenData.name,
      config.tokenData.symbol,
      initialSupply,
      config.tokenData.metadataUri || '',
      basePrice,
      slope,
      graduationThreshold,
      buyFeePercent,
      sellFeePercent,
      txOptions
    );
    console.log(`✅ Transaction sent! Hash: ${createTx.hash}`);
    console.log(`📋 Transaction data: ${createTx.data.substring(0, 100)}...`);
    console.log(`⏳ Waiting for confirmation...`);
    
    let receipt;
    try {
      receipt = await createTx.wait();
      console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
      if (adjustedGasLimit) {
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()} / ${adjustedGasLimit.toString()}`);
      }
    } catch (waitError: any) {
      console.error(`❌ Transaction failed while waiting for confirmation:`, waitError);
      
      // Try to get the revert reason from the transaction receipt
      try {
        const txReceipt = await provider.getTransactionReceipt(createTx.hash);
        if (txReceipt && txReceipt.status === 0) {
          // Transaction was mined but reverted
          console.error(`❌ Transaction reverted in block ${txReceipt.blockNumber}`);
          if (adjustedGasLimit) {
            console.error(`⛽ Gas used: ${txReceipt.gasUsed.toString()} / ${txReceipt.gasUsed === adjustedGasLimit ? 'LIMIT HIT!' : adjustedGasLimit.toString()}`);
            
            // Check if we hit the gas limit (within 98% of limit indicates out of gas)
            const gasUsed = BigInt(txReceipt.gasUsed.toString());
            const gasLimitThreshold = adjustedGasLimit * BigInt(98) / BigInt(100);
            if (gasUsed >= gasLimitThreshold) {
              throw new Error(`Transaction reverted due to insufficient gas. Gas used: ${gasUsed.toString()}, Limit: ${adjustedGasLimit.toString()}. The contract deployment requires more gas. Please try again with a higher gas limit or contact support.`);
            }
          }
          
          // Try to decode the revert reason using call simulation
          try {
            const callResult = await provider.call({
              to: factoryAddress,
              data: functionData,
              from: signerAddress,
            });
            console.error(`❌ Call result: ${callResult}`);
            
            // Try to decode as a revert reason
            if (callResult && callResult !== '0x') {
              // Check if it's a standard revert with reason
              if (callResult.length > 138) {
                try {
                  const reason = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + callResult.slice(138));
                  throw new Error(`Transaction reverted: ${reason[0]}`);
                } catch {
                  // Not a string revert, try other formats
                }
              }
            }
          } catch (callError: any) {
            console.error(`❌ Could not decode revert reason:`, callError.message);
          }
        }
      } catch (receiptError) {
        console.error(`❌ Could not fetch receipt:`, receiptError);
      }
      
      throw new Error(`Transaction failed: ${waitError.reason || waitError.message || 'Unknown error'}`);
    }
    
    // Get token and curve addresses from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === 'TokenCreated';
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error('TokenCreated event not found in transaction receipt');
    }

    const parsed = factory.interface.parseLog(event);
    const tokenAddress = parsed?.args.tokenAddress;
    const curveAddress = parsed?.args.curveAddress;
    
    console.log(`✅ Token deployed at: ${tokenAddress}`);
    console.log(`✅ Bonding curve deployed at: ${curveAddress}`);

    return {
      tokenAddress,
      curveAddress,
      txHash: receipt.hash,
    };
  } catch (error: any) {
    console.error(`❌ Transaction failed:`, error);
    console.error(`❌ Error code:`, error.code);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Error data:`, error.data);
    console.error(`❌ Full error:`, JSON.stringify(error, null, 2));
    
    // Handle user rejection
    if (error.code === 'ACTION_REJECTED' || error.code === 4001 || error.message?.includes('user rejected')) {
      throw new Error('Transaction rejected by user');
    }
    
    // Handle insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for gas fees. Please add testnet tokens to your wallet.');
    }
    
    // Try to decode revert reason
    let errorMessage = 'Transaction failed';
    if (error.data) {
      try {
        // Try to decode the error data
        const reason = factory.interface.parseError(error.data);
        if (reason) {
          errorMessage = `Transaction reverted: ${reason.name}`;
        }
      } catch (decodeError) {
        // If we can't decode, try to get more info from the error
        if (error.data && typeof error.data === 'string') {
          if (error.data.startsWith('0x')) {
            errorMessage = `Transaction reverted with error code: ${error.data.substring(0, 10)}...`;
          } else {
            errorMessage = `Transaction failed: ${error.data}`;
          }
        }
      }
    }
    
    // Check for common revert reasons
    if (error.message?.includes('execution reverted')) {
      const nativeToken = chain === 'bsc' ? 'BNB' : chain === 'hedera' ? 'HBAR' : 'ETH';
      errorMessage = `Transaction reverted. This usually means:\n1. Factory contract may not be deployed at ${factoryAddress}\n2. Invalid parameters\n3. Insufficient gas or ${nativeToken} balance\n\nCheck the factory address in your .env file (VITE_${chain.toUpperCase()}_FACTORY)`;
      
      // Add specific guidance for Hedera
      if (chain === 'hedera' && (error.message.includes('INSUFFICIENT') || error.data?.includes('494e53554646494349454e545f50415945525f42414c414e4345'))) {
        errorMessage += `\n\n⚠️ Hedera requires HBAR (not ETH)!\nVisit https://portal.hedera.com/ to get testnet HBAR.`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

export function getTestnetInfo(chain: string) {
  const testnets: Record<string, { name: string; explorer: string; rpc: string }> = {
    ethereum: {
      name: 'Sepolia',
      explorer: 'https://sepolia.etherscan.io',
      rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    sepolia: {
      name: 'Sepolia',
      explorer: 'https://sepolia.etherscan.io',
      rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    bsc: {
      name: 'BSC Testnet',
      explorer: 'https://testnet.bscscan.com',
      rpc: 'https://bsc-testnet.publicnode.com',
    },
    'bsc-testnet': {
      name: 'BSC Testnet',
      explorer: 'https://testnet.bscscan.com',
      rpc: 'https://bsc-testnet.publicnode.com',
    },
    'bsctestnet': {
      name: 'BSC Testnet',
      explorer: 'https://testnet.bscscan.com',
      rpc: 'https://bsc-testnet.publicnode.com',
    },
    base: {
      name: 'Base Sepolia',
      explorer: 'https://sepolia-explorer.base.org',
      rpc: 'https://base-sepolia-rpc.publicnode.com',
    },
    'base-sepolia': {
      name: 'Base Sepolia',
      explorer: 'https://sepolia-explorer.base.org',
      rpc: 'https://base-sepolia-rpc.publicnode.com',
    },
    'basesepolia': {
      name: 'Base Sepolia',
      explorer: 'https://sepolia-explorer.base.org',
      rpc: 'https://base-sepolia-rpc.publicnode.com',
    },
    solana: {
      name: 'Solana Devnet',
      explorer: 'https://explorer.solana.com/?cluster=devnet',
      rpc: 'https://api.devnet.solana.com',
    },
    hedera: {
      name: 'Hedera Testnet',
      explorer: 'https://hashscan.io/testnet',
      rpc: 'https://testnet.hashio.io/api',
    },
    'hedera-testnet': {
      name: 'Hedera Testnet',
      explorer: 'https://hashscan.io/testnet',
      rpc: 'https://testnet.hashio.io/api',
    },
  };

  if (!chain) {
    return testnets.ethereum;
  }

  // Normalize chain name: lowercase and handle variations
  const normalizedChain = chain.toLowerCase().trim();
  
  // Direct match first
  if (testnets[normalizedChain]) {
    return testnets[normalizedChain];
  }

  // Handle chain name variations with pattern matching
  if (normalizedChain.includes('hedera')) {
    return testnets.hedera;
  }
  
  if (normalizedChain.includes('base') && (normalizedChain.includes('sepolia') || normalizedChain.includes('testnet'))) {
    return testnets['base-sepolia'];
  }
  
  if (normalizedChain.includes('bsc') || normalizedChain.includes('binance')) {
    if (normalizedChain.includes('testnet') || normalizedChain.includes('test')) {
      return testnets['bsc-testnet'];
    }
    return testnets.bsc;
  }
  
  if (normalizedChain.includes('sepolia') && !normalizedChain.includes('base')) {
    return testnets.sepolia;
  }
  
  if (normalizedChain.includes('ethereum') || normalizedChain.includes('eth')) {
    return testnets.ethereum;
  }

  // Default fallback
  return testnets.ethereum;
}

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

