import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { trackWalletConnection } from '../components/GoogleAnalytics';

/**
 * Hook to track wallet connections
 * Tracks when EVM or Solana wallets are connected
 */
export function useWalletTracking() {
  const { isConnected, address, connector } = useAccount();
  const solanaWallet = useWallet();
  
  useEffect(() => {
    if (isConnected && address && connector) {
      // Determine wallet type
      const walletType = connector?.id === 'io.metamask' ? 'metamask' :
                        connector?.id === 'walletConnect' ? 'walletconnect' :
                        connector?.id === 'coinbaseWalletSDK' ? 'coinbase' :
                        connector?.id === 'phantom' ? 'phantom' :
                        'other';
      
      // Track EVM wallet connection
      trackWalletConnection({
        walletType: walletType as 'metamask' | 'phantom' | 'walletconnect' | 'coinbase' | 'other',
        chain: 'evm',
      });
    }
  }, [isConnected, address, connector]);
  
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey) {
      // Track Solana wallet connection
      trackWalletConnection({
        walletType: 'phantom', // Most common Solana wallet
        chain: 'solana',
      });
    }
  }, [solanaWallet.connected, solanaWallet.publicKey]);
}

