import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo, useEffect } from 'react';
import { config } from './config/wagmi';
import Layout from './components/Layout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Builder from './pages/Builder';
import Dashboard from './pages/Dashboard';
import TokenDetail from './pages/TokenDetail';
import Airdrop from './pages/Airdrop';
import Presale from './pages/Presale';
import CFYVesting from './pages/CFYVesting';
import CFYStaking from './pages/CFYStaking';
import CFYDashboard from './pages/CFYDashboard';
import Contact from './pages/Contact';
import Docs from './pages/Docs';
import Whitepaper from './pages/Whitepaper';
import CreatorDashboard from './pages/CreatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Tokenomics from './pages/Tokenomics';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FAQ from './pages/FAQ';
import GoogleAnalytics from './components/GoogleAnalytics';
import ErrorBoundary from './components/ErrorBoundary';
import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 404 (not found) or 401 (unauthorized)
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        // Retry 429 (rate limit) errors with exponential backoff
        if (error?.response?.status === 429) {
          // Retry up to 3 times with exponential backoff
          return failureCount < 3;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: any) => {
        // For 429 errors, use exponential backoff: 1s, 2s, 4s
        if (error?.response?.status === 429) {
          return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
        }
        // For other errors, use shorter delay: 500ms, 1s
        return Math.min(500 * Math.pow(2, attemptIndex), 2000);
      },
      staleTime: 30000, // Consider data stale after 30 seconds
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
    },
  },
});

// Component to clean up URLs and prevent index.html in paths
function URLCleanup() {
  const location = useLocation();

  useEffect(() => {
    // Clean up any index.html in the URL path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/index.html') || currentPath.includes('/index.htm')) {
      const cleanPath = currentPath.replace(/\/index\.html?$/i, '') || '/';
      if (cleanPath !== currentPath) {
        window.history.replaceState(null, '', cleanPath + window.location.search + window.location.hash);
      }
    }
  }, [location]);

  return null;
}

function App() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Use root basename for custom domain (crossify.io)
  // BASE_URL is set to '/' in build, so we use that
  const basename = useMemo(() => {
    return import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider 
          modalSize="compact"
          initialChain={sepolia}
          showRecentTransactions={true}
        >
          <ConnectionProvider endpoint="https://api.devnet.solana.com">
            <WalletProvider wallets={wallets} autoConnect={false}>
              <WalletModalProvider>
                <Router basename={basename}>
                  <URLCleanup />
                  <GoogleAnalytics />
                  <Routes>
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/marketplace" element={<Layout><Marketplace /></Layout>} />
                    <Route path="/builder" element={<Layout><Builder /></Layout>} />
                    <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                    <Route path="/airdrop" element={<Layout><Airdrop /></Layout>} />
                    <Route path="/presale" element={<Layout><Presale /></Layout>} />
                    <Route path="/cfy" element={<Layout><CFYDashboard /></Layout>} />
                    <Route path="/cfy/vesting" element={<Layout><CFYVesting /></Layout>} />
                    <Route path="/cfy/staking" element={<Layout><CFYStaking /></Layout>} />
                    <Route path="/contact" element={<Layout><Contact /></Layout>} />
                    <Route path="/docs" element={<Layout><Docs /></Layout>} />
                    <Route path="/whitepaper" element={<Layout><Whitepaper /></Layout>} />
                    <Route path="/tokenomics" element={<Layout><Tokenomics /></Layout>} />
                    <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
                    <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
                    <Route path="/faq" element={<Layout><FAQ /></Layout>} />
                    <Route path="/creator/:id" element={<Layout><CreatorDashboard /></Layout>} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/token/:id" element={<Layout><ErrorBoundary><TokenDetail /></ErrorBoundary></Layout>} />
                  </Routes>
                  <Toaster position="top-right" />
                </Router>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;

