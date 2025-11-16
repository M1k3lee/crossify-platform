import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

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

// Configure RainbowKit with wallet options that prioritize injected providers
export const config = getDefaultConfig({
  appName: 'Crossify.io',
  projectId: hasValidProjectId ? projectId : '0000000000000000000000000000000000000000',
  chains: [sepolia, baseSepolia, bscTestnet, hederaTestnet],
  ssr: false,
  // Only enable WalletConnect if we have a valid project ID
  // This prevents API errors and unwanted redirects
  ...(hasValidProjectId ? {} : {
    // When project ID is invalid, prioritize injected wallets
    // RainbowKit will automatically fall back to injected providers
  }),
});

