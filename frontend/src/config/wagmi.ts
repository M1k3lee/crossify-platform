import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, baseSepolia, bscTestnet } from 'wagmi/chains';

// Use environment variable or get a real project ID from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId || projectId === '0000000000000000000000000000000000000000') {
  console.warn('⚠️ WalletConnect Project ID not set. Using injected provider (MetaMask) only.');
  console.warn('   Get a free project ID from: https://cloud.walletconnect.com');
  console.warn('   MetaMask will still work via injected provider.');
}

// Use a minimal config that prioritizes MetaMask injected provider
export const config = getDefaultConfig({
  appName: 'Crossify.io',
  projectId: projectId || '0000000000000000000000000000000000000000',
  chains: [sepolia, baseSepolia, bscTestnet],
  ssr: false,
  // Prioritize MetaMask injected provider
  appInfo: {
    appName: 'Crossify.io',
  },
});

