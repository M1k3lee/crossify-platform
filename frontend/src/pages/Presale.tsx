import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Clock, Zap, TrendingUp, Users, Lock, Gift, ArrowRight, 
  Copy, Check, Wallet, ExternalLink, Share2, DollarSign,
  Activity, Award, PieChart, AlertCircle, RefreshCw, Shield, Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

interface PresaleConfig {
  id: string;
  token_symbol: string;
  token_name: string;
  solana_address: string;
  presale_price: number;
  total_tokens_for_presale: string;
  min_purchase_sol: number;
  max_purchase_sol?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  liquidity_percentage: number;
  dev_percentage: number;
  marketing_percentage: number;
  affiliate_reward_percentage: number;
  total_raised_sol: number;
  total_contributors: number;
  stats?: {
    total_transactions: number;
    total_raised: number;
    unique_buyers: number;
  };
}

interface Allocation {
  total_sol_contributed: number;
  total_tokens_allocated: string;
  transaction_count: number;
  transactions?: Transaction[];
}

interface Transaction {
  id: number;
  solana_tx_hash: string;
  buyer_address: string;
  sol_amount: number;
  token_amount: string;
  status: string;
  created_at: string;
}

export default function Presale() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [presale, setPresale] = useState<PresaleConfig | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [userReferralCode, setUserReferralCode] = useState('');

  // Get presale ID from URL or use default
  const presaleId = new URLSearchParams(window.location.search).get('id') || 'default';

  useEffect(() => {
    loadPresale();
    if (connected && publicKey) {
      loadUserAllocation();
    }
  }, [presaleId, connected, publicKey]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (presale?.status === 'active') {
        loadPresale();
        if (connected && publicKey) {
          loadUserAllocation();
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [presale?.status, connected, publicKey]);

  const loadPresale = async () => {
    try {
      const response = await axios.get(`${API_BASE}/presale?id=${presaleId}`);
      setPresale(response.data);
    } catch (error: any) {
      console.error('Error loading presale:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load presale information');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserAllocation = async () => {
    if (!publicKey) return;

    try {
      const response = await axios.get(
        `${API_BASE}/presale/${presaleId}/allocations?address=${publicKey.toString()}`
      );
      setAllocation(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading allocation:', error);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/presale?id=${presaleId}&ref=${userReferralCode}`;
    copyToClipboard(link);
  };

  const formatSOL = (amount: number) => {
    return amount.toFixed(4);
  };

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem(`presale_${presaleId}_ref`, ref);
    } else {
      const savedRef = localStorage.getItem(`presale_${presaleId}_ref`);
      if (savedRef) {
        setReferralCode(savedRef);
      }
    }
  }, [presaleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading presale...</p>
        </div>
      </div>
    );
  }

  if (!presale) {
    return (
      <>
        <SEO
          title="Presale - Early Access | Crossify.io"
          description="Join our token presale for early access and exclusive pricing."
          keywords="token presale, early access, crypto presale"
          url="https://crossify.io/presale"
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
          <QuantumBackground />
          <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">Presale Not Found</h1>
            <p className="text-gray-400 mb-8">The presale you're looking for doesn't exist or hasn't been set up yet.</p>
          </div>
        </div>
      </>
    );
  }

  const isActive = presale.status === 'active';
  const progress = presale.total_raised_sol > 0 
    ? (presale.total_raised_sol / (parseFloat(presale.total_tokens_for_presale) * presale.presale_price)) * 100 
    : 0;

  return (
    <>
      <SEO
        title={`${presale.token_name} Presale - Early Access | Crossify.io`}
        description={`Join the ${presale.token_name} presale for early access. Get exclusive pricing and bonuses.`}
        keywords={`${presale.token_symbol} presale, token presale, early access, crypto presale`}
        url={`https://crossify.io/presale?id=${presaleId}`}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 blur-2xl opacity-50 rounded-full" />
                <div className="relative p-4 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-full border border-yellow-500/50">
                  <Zap className="w-12 h-12 text-yellow-400" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                {presale.token_name} Presale
              </span>
            </h1>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                isActive 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                  : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
              }`}>
                {isActive ? '🟢 Live Now' : presale.status.charAt(0).toUpperCase() + presale.status.slice(1)}
              </div>
              {presale.start_date && (
                <div className="px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-full text-gray-300 text-sm">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {new Date(presale.start_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Total Raised</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatSOL(presale.total_raised_sol)} SOL</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Contributors</span>
              </div>
              <p className="text-2xl font-bold text-white">{presale.total_contributors}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Price</span>
              </div>
              <p className="text-2xl font-bold text-white">{presale.presale_price} SOL</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-orange-400" />
                <span className="text-gray-400 text-sm">Progress</span>
              </div>
              <p className="text-2xl font-bold text-white">{Math.min(progress, 100).toFixed(1)}%</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Main Presale Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30"
            >
              <h2 className="text-2xl font-bold text-white mb-6">How to Participate</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Connect Your Wallet</h3>
                    <p className="text-gray-400 text-sm">
                      Connect your Phantom or Solana wallet to participate
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Send SOL</h3>
                    <p className="text-gray-400 text-sm">
                      Send SOL to the presale address below. Minimum: {presale.min_purchase_sol} SOL
                      {presale.max_purchase_sol && `, Maximum: ${presale.max_purchase_sol} SOL`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Track Your Allocation</h3>
                    <p className="text-gray-400 text-sm">
                      Your tokens will be allocated automatically. View your allocation below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Connection */}
              {!connected ? (
                <button
                  onClick={() => setVisible(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </button>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Connected</span>
                    <button
                      onClick={() => disconnect()}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Disconnect
                    </button>
                  </div>
                  <p className="text-white font-mono text-sm break-all">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                </div>
              )}

              {/* Presale Address */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Send SOL to this address:
                </label>
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                  <code className="flex-1 text-sm text-white font-mono break-all">
                    {presale.solana_address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(presale.solana_address)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <a
                    href={`https://solscan.io/account/${presale.solana_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-800 rounded-lg transition"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
                {referralCode && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      💡 Using referral code: <strong>{referralCode}</strong>
                    </p>
                    <p className="text-xs text-blue-300/70 mt-1">
                      Include this in your transaction memo: <code className="bg-gray-900/50 px-2 py-1 rounded">REF: {referralCode}</code>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* User Allocation Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Your Allocation</h2>
              
              {connected && publicKey ? (
                allocation ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Total Contributed</span>
                        <span className="text-2xl font-bold text-white">
                          {formatSOL(allocation.total_sol_contributed)} SOL
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Tokens Allocated</span>
                        <span className="text-2xl font-bold text-green-400">
                          {formatNumber(allocation.total_tokens_allocated)} {presale.token_symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Transactions</span>
                        <span className="text-white font-semibold">
                          {allocation.transaction_count}
                        </span>
                      </div>
                    </div>

                    {allocation.transactions && allocation.transactions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Recent Transactions</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {allocation.transactions.slice(0, 5).map((tx) => (
                            <div
                              key={tx.id}
                              className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white text-sm font-mono">
                                  {tx.solana_tx_hash.slice(0, 8)}...{tx.solana_tx_hash.slice(-8)}
                                </span>
                                <span className="text-green-400 text-sm font-semibold">
                                  +{formatSOL(tx.sol_amount)} SOL
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-xs">
                                  {new Date(tx.created_at).toLocaleString()}
                                </span>
                                <a
                                  href={`https://solscan.io/tx/${tx.solana_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs"
                                >
                                  View <ExternalLink className="w-3 h-3 inline" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No contributions yet</p>
                    <p className="text-sm text-gray-500">
                      Send SOL to the presale address to get started
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Connect your wallet to view your allocation</p>
                  <button
                    onClick={() => setVisible(true)}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Vesting & Value Proposition - Prominent Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Vesting Protection & Value Growth</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Vesting Schedule */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Vesting Schedule</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div>
                      <span className="text-white font-semibold">Token Launch (TGE)</span>
                      <p className="text-xs text-gray-400">Immediate release</p>
                    </div>
                    <span className="text-yellow-400 font-bold text-xl">20%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div>
                      <span className="text-white font-semibold">Linear Vesting</span>
                      <p className="text-xs text-gray-400">Monthly release</p>
                    </div>
                    <span className="text-blue-400 font-bold text-xl">80%</span>
                  </div>
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <strong className="text-white">18 Months</strong> - Tokens release gradually to protect long-term value and prevent large dumps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Powered by Platform Fees</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-green-400" />
                      <span className="text-white font-semibold">Automatic Buyback</span>
                    </div>
                    <p className="text-sm text-gray-300">50% of platform fees automatically buy back CFY tokens, driving price higher constantly.</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-semibold">Liquidity Growth</span>
                    </div>
                    <p className="text-sm text-gray-300">30% of fees add liquidity, ensuring deep markets and price stability.</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-semibold">Staking Rewards</span>
                    </div>
                    <p className="text-sm text-gray-300">Stake your CFY tokens (even during vesting) to earn up to 50% APY while waiting.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Message */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Why Vesting Protects Your Investment</h4>
                  <p className="text-gray-300 mb-3">
                    Vesting prevents large holders from dumping tokens immediately after launch, which would crash the price. 
                    Instead, tokens release gradually over 18 months, giving the platform time to:
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Build platform revenue through fees
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Drive token value higher through automatic buybacks
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Establish deep liquidity and price stability
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Create a strong, engaged community
                    </li>
                  </ul>
                  <p className="text-yellow-300 font-semibold mt-4">
                    💡 By the time your tokens fully vest, platform fees will have significantly increased the token value!
                  </p>
                  <div className="mt-6 flex gap-4">
                    <Link
                      to="/cfy/vesting"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                    >
                      View Vesting Schedule
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/cfy/staking"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm"
                    >
                      Start Staking
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tokenomics & Affiliate Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Tokenomics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Fund Allocation</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Liquidity Pool</span>
                  <span className="text-white font-semibold">{presale.liquidity_percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Development</span>
                  <span className="text-white font-semibold">{presale.dev_percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Marketing</span>
                  <span className="text-white font-semibold">{presale.marketing_percentage}%</span>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    Funds raised will be allocated according to the tokenomics above. 
                    {presale.liquidity_percentage}% will be used to add liquidity when the token launches on mainnet.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Affiliate System */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">Affiliate Program</h2>
              </div>
              
              <p className="text-gray-400 mb-4 text-sm">
                Earn {presale.affiliate_reward_percentage}% of every purchase made through your referral link.
              </p>

              {connected && publicKey ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter your referral code"
                    value={userReferralCode}
                    onChange={(e) => setUserReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy Referral Link
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm mb-4">Connect wallet to get your referral code</p>
                  <button
                    onClick={() => setVisible(true)}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
