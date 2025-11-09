import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-S0JFRRRPVX', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
}

// Helper function to track events
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
}

// Helper function to track token creation
export function trackTokenCreation(data: {
  tokenName?: string;
  tokenSymbol?: string;
  chains?: string[];
  crossChainEnabled?: boolean;
}) {
  trackEvent('token_creation', {
    event_category: 'Token',
    event_label: data.tokenSymbol || 'Unknown',
    chains: data.chains?.join(',') || 'none',
    cross_chain: data.crossChainEnabled ? 'yes' : 'no',
    token_name: data.tokenName,
  });
}

// Helper function to track wallet connection
export function trackWalletConnection(data: {
  walletType: 'metamask' | 'phantom' | 'walletconnect' | 'coinbase' | 'other';
  chain?: string;
}) {
  trackEvent('wallet_connection', {
    event_category: 'Wallet',
    event_label: data.walletType,
    chain: data.chain || 'unknown',
  });
}

// Helper function to track token purchase/sale
export function trackTokenTransaction(data: {
  type: 'buy' | 'sell';
  tokenId: string;
  tokenSymbol?: string;
  chain: string;
  amount?: string;
  value?: string;
}) {
  trackEvent('token_transaction', {
    event_category: 'Transaction',
    event_label: data.type,
    token_id: data.tokenId,
    token_symbol: data.tokenSymbol,
    chain: data.chain,
    amount: data.amount,
    value: data.value,
  });
}

// Helper function to track button clicks
export function trackButtonClick(data: {
  buttonName: string;
  location: string;
  additionalData?: Record<string, any>;
}) {
  trackEvent('button_click', {
    event_category: 'UI',
    event_label: data.buttonName,
    location: data.location,
    ...data.additionalData,
  });
}

