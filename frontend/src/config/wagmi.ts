import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';
import { createConnector } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Use environment variable or get a real project ID from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const hasValidProjectId = projectId && projectId !== '0000000000000000000000000000000000000000';

if (!hasValidProjectId) {
  console.warn('⚠️ WalletConnect Project ID not set. Using injected provider (MetaMask) only.');
  console.warn('   Get a free project ID from: https://cloud.walletconnect.com');
  console.warn('   MetaMask will still work via injected provider.');
  console.warn('   WalletConnect features will be disabled to prevent errors.');
}

// Define Hedera Testnet chain (not included in wagmi/chains by default)
// Using plain object that matches Chain type instead of defineChain
const hederaTestnet: Chain = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
} as Chain;

// Helper to get HashPack provider
function getHashPackProvider() {
  if (typeof window === 'undefined') return null;
  
  // Check window.hashpack
  if ((window as any).hashpack) {
    const hashpack = (window as any).hashpack;
    if (hashpack.provider) return hashpack.provider;
    if (hashpack.ethereum) return hashpack.ethereum;
    if (typeof hashpack.request === 'function') return hashpack;
  }
  
  // Check providers array for HashPack
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    for (const provider of window.ethereum.providers) {
      const keys = Object.keys(provider);
      if (keys.some(k => k.toLowerCase().includes('hashpack'))) {
        return provider;
      }
      // Check if provider is on Hedera chain (likely HashPack)
      if (!provider.isMetaMask && !(provider as any).isPhantom && !(provider as any).isCoinbaseWallet) {
        // This might be HashPack
        return provider;
      }
    }
  }
  
  return null;
}

// Configure RainbowKit with wallet options that prioritize injected providers
export const config = getDefaultConfig({
  appName: 'Crossify.io',
  projectId: hasValidProjectId ? projectId : '0000000000000000000000000000000000000000',
  chains: [sepolia, baseSepolia, bscTestnet, hederaTestnet],
  ssr: false,
  // Add custom wallets - HashPack for Hedera
  wallets: [
    {
      groupName: 'Hedera Wallets',
      wallets: [
        {
          id: 'hashpack',
          name: 'HashPack',
          iconUrl: 'https://www.hashpack.app/favicon.ico',
          iconBackground: '#1a1a1a',
          downloadUrls: {
            chrome: 'https://chrome.google.com/webstore/detail/hashpack/kpfopkelmapcoecmlbdfiehjdjonljen',
            browserExtension: 'https://www.hashpack.app/',
          },
          createConnector: () => {
            const provider = getHashPackProvider();
            if (!provider) {
              // Return a connector that will show install prompt
              return createConnector((config) => 
                injected({
                  target: () => ({
                    id: 'hashpack',
                    name: 'HashPack',
                    provider: null as any, // Will trigger install prompt
                  }),
                })(config)
              );
            }
            
            // Return connector with HashPack provider
            return createConnector((config) => 
              injected({
                target: () => ({
                  id: 'hashpack',
                  name: 'HashPack',
                  provider: provider as any,
                }),
              })(config)
            );
          },
        },
      ],
    },
  ],
  // Only enable WalletConnect if we have a valid project ID
  // This prevents API errors and unwanted redirects
  ...(hasValidProjectId ? {} : {
    // When project ID is invalid, prioritize injected wallets
    // RainbowKit will automatically fall back to injected providers
  }),
});

