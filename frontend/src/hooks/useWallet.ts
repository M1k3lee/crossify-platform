import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export function useMultiChainWallet() {
  const { address: evmAddress, isConnected: isEVMConnected, connector } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const solanaWallet = useWallet();

  const isConnected = useMemo(() => {
    return isEVMConnected || solanaWallet.connected;
  }, [isEVMConnected, solanaWallet.connected]);

  const getAddressForChain = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum':
      case 'bsc':
      case 'base':
        return evmAddress;
      case 'solana':
        return solanaWallet.publicKey?.toString();
      default:
        return null;
    }
  };

  const isChainSupported = (chain: string) => {
    switch (chain.toLowerCase()) {
      case 'ethereum':
        return chainId === 11155111; // Sepolia
      case 'bsc':
        return chainId === 97; // BSC Testnet
      case 'base':
        return chainId === 84532; // Base Sepolia
      case 'solana':
        return solanaWallet.connected;
      default:
        return false;
    }
  };

  return {
    evmAddress,
    solanaAddress: solanaWallet.publicKey?.toString(),
    isConnected,
    isEVMConnected,
    isSolanaConnected: solanaWallet.connected,
    walletClient,
    connector,
    getAddressForChain,
    isChainSupported,
    connectSolana: solanaWallet.connect,
    disconnectSolana: solanaWallet.disconnect,
  };
}








