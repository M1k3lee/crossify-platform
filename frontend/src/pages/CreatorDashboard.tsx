import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
  Shield, Pause, Globe, Network, Copy, CheckCircle,
  RefreshCw, Coins, Activity, Plus, Flame, Settings, X, Edit2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import toast from 'react-hot-toast';
import { mintTokens, burnTokens, pauseToken, updateBondingCurveFees } from '../services/tokenManagement';

import { API_BASE } from '../config/api';

interface TokenCapabilities {
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  transferTaxEnabled: boolean;
  governanceEnabled: boolean;
  vestingEnabled: boolean;
}

export default function CreatorDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Fee editing state
  const [editingFees, setEditingFees] = useState(false);
  const [buyFee, setBuyFee] = useState('0');
  const [sellFee, setSellFee] = useState('0');

  const { data: token, isLoading } = useQuery({
    queryKey: ['creator-token', id],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 10000, // Refetch every 10 seconds to get updated deployments
  });

  const { data: status } = useQuery({
    queryKey: ['token-status', id],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/${id}/status`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  // Get deployments from token data (it's already included in the token response)
  const deployments = token?.deployments || [];
  
  // Debug: Log deployments to help diagnose issues
  useEffect(() => {
    if (token && id) {
      console.log(`📊 Token ${id} deployments:`, deployments);
      console.log(`📊 Token ${id} has ${deployments.length} deployment(s)`);
      deployments.forEach((dep: any) => {
        console.log(`  - ${dep.chain}: status=${dep.status}, tokenAddress=${dep.tokenAddress || 'N/A'}, curveAddress=${dep.curveAddress || 'N/A'}`);
      });
    }
  }, [token, deployments, id]);

  const isOwner = token?.creatorAddress?.toLowerCase() === address?.toLowerCase();
  const capabilities: TokenCapabilities = token?.advancedSettings || {
    mintable: false,
    burnable: false,
    pausable: false,
    transferTaxEnabled: false,
    governanceEnabled: false,
    vestingEnabled: false,
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleMint = async (chain: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!mintAmount || !mintTo) {
      toast.error('Please enter amount and recipient address');
      return;
    }

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(mintTo)) {
      toast.error('Invalid recipient address');
      return;
    }

    // Get token address for this chain
    const deployment = deployments?.find((d: any) => d.chain === chain && d.tokenAddress && d.status === 'deployed');
    if (!deployment?.tokenAddress) {
      console.log('Available deployments:', deployments);
      toast.error(`Token not deployed on ${chain} yet. Please wait for deployment to complete. Status: ${deployments?.find((d: any) => d.chain === chain)?.status || 'unknown'}`);
      return;
    }

    setActionLoading('mint');
    try {
      // Call blockchain directly with platform fee
      const result = await mintTokens({
        tokenAddress: deployment.tokenAddress,
        to: mintTo,
        amount: mintAmount,
        chain: chain as 'ethereum' | 'bsc' | 'base',
        platformFeePercent: 0.1, // 0.1% platform fee
      });

      // Also notify backend
      try {
        await axios.post(
          `${API_BASE}/tokens/${id}/mint`,
          {
            chain,
            amount: mintAmount,
            recipient: mintTo,
            txHash: result.txHash,
            platformFeeAmount: result.platformFeeAmount,
          },
          {
            headers: {
              'x-creator-address': address,
            },
          }
        );
      } catch (backendError) {
        console.warn('Backend notification failed:', backendError);
      }
      
      toast.success(
        `Mint transaction successful! ${result.platformFeeAmount ? `Platform fee: ${result.platformFeeAmount} tokens` : ''}`,
        { duration: 5000 }
      );
      setMintAmount('');
      setMintTo('');
    } catch (error: any) {
      console.error('Mint error:', error);
      toast.error(error.message || 'Failed to mint tokens. Make sure the token contract supports minting.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBurn = async (chain: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!burnAmount) {
      toast.error('Please enter amount to burn');
      return;
    }

    const amount = parseFloat(burnAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Get token address for this chain
    const deployment = deployments?.find((d: any) => d.chain === chain && d.tokenAddress && d.status === 'deployed');
    if (!deployment?.tokenAddress) {
      toast.error(`Token not deployed on ${chain} yet. Please wait for deployment to complete.`);
      return;
    }

    setActionLoading('burn');
    try {
      // Call blockchain directly
      const result = await burnTokens({
        tokenAddress: deployment.tokenAddress,
        amount: burnAmount,
        chain: chain as 'ethereum' | 'bsc' | 'base',
      });

      // Notify backend
      try {
        await axios.post(
          `${API_BASE}/tokens/${id}/burn`,
          {
            chain,
            amount: burnAmount,
            txHash: result.txHash,
          },
          {
            headers: {
              'x-creator-address': address,
            },
          }
        );
      } catch (backendError) {
        console.warn('Backend notification failed:', backendError);
      }
      
      toast.success('Burn transaction successful!');
      setBurnAmount('');
    } catch (error: any) {
      console.error('Burn error:', error);
      toast.error(error.message || 'Failed to burn tokens. Make sure you have enough balance.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (chain: string, paused: boolean) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Get token address for this chain
    const deployment = deployments?.find((d: any) => d.chain === chain && d.tokenAddress && d.status === 'deployed');
    if (!deployment?.tokenAddress) {
      toast.error(`Token not deployed on ${chain} yet. Please wait for deployment to complete.`);
      return;
    }

    setActionLoading(paused ? 'unpause' : 'pause');
    try {
      // Call blockchain directly
      const result = await pauseToken({
        tokenAddress: deployment.tokenAddress,
        paused: !paused, // Toggle state
        chain: chain as 'ethereum' | 'bsc' | 'base',
      });

      // Notify backend
      try {
        await axios.post(
          `${API_BASE}/tokens/${id}/pause`,
          {
            chain,
            paused: !paused,
            txHash: result.txHash,
          },
          {
            headers: {
              'x-creator-address': address,
            },
          }
        );
      } catch (backendError) {
        console.warn('Backend notification failed:', backendError);
      }
      
      toast.success(`Token ${!paused ? 'paused' : 'unpaused'} successfully!`);
    } catch (error: any) {
      console.error('Pause error:', error);
      toast.error(error.message || 'Failed to pause/unpause token');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncPrice = async () => {
    if (!id || !address) return;
    setActionLoading('sync');
    try {
      await axios.post(
        `${API_BASE}/tokens/${id}/sync-price`,
        {},
        {
          headers: {
            'x-creator-address': address,
          },
        }
      );
      toast.success('Price sync initiated across all chains!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to sync price');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFees = async (chain: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    const buyFeeNum = parseFloat(buyFee);
    const sellFeeNum = parseFloat(sellFee);

    if (isNaN(buyFeeNum) || buyFeeNum < 0 || buyFeeNum > 10) {
      toast.error('Buy fee must be between 0 and 10%');
      return;
    }

    if (isNaN(sellFeeNum) || sellFeeNum < 0 || sellFeeNum > 10) {
      toast.error('Sell fee must be between 0 and 10%');
      return;
    }

    // Get deployment for this chain
    const deployment = deployments?.find((d: any) => d.chain === chain && d.curveAddress && d.status === 'deployed');
    if (!deployment?.curveAddress) {
      toast.error(`Bonding curve not found on ${chain}. Token may not be deployed yet or deployment is still in progress.`);
      return;
    }

    setActionLoading('update-fees');
    try {
      // Call blockchain directly
      const result = await updateBondingCurveFees({
        bondingCurveAddress: deployment.curveAddress,
        buyFeePercent: buyFeeNum,
        sellFeePercent: sellFeeNum,
        chain: chain as 'ethereum' | 'bsc' | 'base',
      });

      // Notify backend
      try {
        await axios.post(
          `${API_BASE}/tokens/${id}/update-fees`,
          {
            chain,
            buyFeePercent: buyFeeNum,
            sellFeePercent: sellFeeNum,
            txHash: result.txHash,
          },
          {
            headers: {
              'x-creator-address': address,
            },
          }
        );
      } catch (backendError) {
        console.warn('Backend notification failed:', backendError);
      }
      
      toast.success('Fees updated successfully on-chain!');
      setEditingFees(false);
    } catch (error: any) {
      console.error('Update fees error:', error);
      toast.error(error.message || 'Failed to update fees. Make sure you own the bonding curve.');
    } finally {
      setActionLoading(null);
    }
  };

  // Update fees when token data loads
  useEffect(() => {
    if (token) {
      setBuyFee(token.buyFeePercent?.toString() || '0');
      setSellFee(token.sellFeePercent?.toString() || '0');
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Token not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      <QuantumBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.name} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                  {token.symbol?.charAt(0) || 'T'}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white">{token.name}</h1>
                <p className="text-gray-400">{token.symbol}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/token/${id}`)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
            >
              View Public Page
            </button>
          </div>

          {/* Owner Status */}
          {isOwner ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">You are the token creator</p>
                <p className="text-green-300/80 text-sm">You have access to advanced management features</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">View-only mode</p>
                <p className="text-yellow-300/80 text-sm">
                  Connect with the creator wallet ({token.creatorAddress?.slice(0, 6)}...{token.creatorAddress?.slice(-4)}) 
                  to access management features
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Supply',
              value: token.initialSupply ? `${(parseFloat(token.initialSupply) / 1e6).toFixed(2)}M` : 'N/A',
              icon: Coins,
              color: 'from-primary-500 to-blue-600',
            },
            {
              label: 'Chains Deployed',
              value: deployments?.length || 0,
              icon: Network,
              color: 'from-purple-500 to-pink-600',
            },
            {
              label: 'Cross-Chain Enabled',
              value: token.crossChainEnabled ? 'Yes' : 'No',
              icon: Globe,
              color: token.crossChainEnabled ? 'from-green-500 to-emerald-600' : 'from-gray-500 to-gray-600',
            },
            {
              label: 'Status',
              value: status?.overallStatus || 'Active',
              icon: Activity,
              color: 'from-blue-500 to-cyan-600',
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-400 text-sm mb-2">{stat.label}</h3>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Token Management Actions - Only for Owner */}
        {isOwner && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Mint Tokens */}
            {capabilities.mintable ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Mint Tokens</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Create new tokens and add to supply</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Amount to mint"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Recipient address"
                    value={mintTo}
                    onChange={(e) => setMintTo(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  {deployments && deployments.length > 0 && deployments.some((d: any) => d.tokenAddress && d.status === 'deployed') ? (
                    deployments
                      .filter((dep: any) => dep.tokenAddress && dep.status === 'deployed')
                      .map((dep: any) => (
                        <button
                          key={dep.chain}
                          onClick={() => handleMint(dep.chain)}
                          disabled={actionLoading === 'mint'}
                          className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-lg transition"
                        >
                          {actionLoading === 'mint' ? 'Minting...' : `Mint on ${dep.chain}`}
                        </button>
                      ))
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <p className="text-sm text-yellow-400">
                        {deployments && deployments.length > 0 
                          ? 'Token deployment in progress or not completed. Please wait for deployment to finish.' 
                          : 'Token must be deployed on a chain first'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 opacity-50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-500">Mint Tokens</h3>
                </div>
                <p className="text-gray-500 text-sm">Not enabled for this token</p>
              </motion.div>
            )}

            {/* Burn Tokens */}
            {capabilities.burnable ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Burn Tokens</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Permanently remove tokens from supply</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Amount to burn"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  {deployments && deployments.length > 0 && deployments.some((d: any) => d.tokenAddress && d.status === 'deployed') ? (
                    deployments
                      .filter((dep: any) => dep.tokenAddress && dep.status === 'deployed')
                      .map((dep: any) => (
                        <button
                          key={dep.chain}
                          onClick={() => handleBurn(dep.chain)}
                          disabled={actionLoading === 'burn'}
                          className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 text-white rounded-lg transition"
                        >
                          {actionLoading === 'burn' ? 'Burning...' : `Burn on ${dep.chain}`}
                        </button>
                      ))
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <p className="text-sm text-yellow-400">
                        {deployments && deployments.length > 0 
                          ? 'Token deployment in progress or not completed. Please wait for deployment to finish.' 
                          : 'Token must be deployed on a chain first'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 opacity-50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-500">Burn Tokens</h3>
                </div>
                <p className="text-gray-500 text-sm">Not enabled for this token</p>
              </motion.div>
            )}

            {/* Pause/Unpause */}
            {capabilities.pausable ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Pause className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Pause Token</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Temporarily halt all token transfers</p>
                {deployments && deployments.length > 0 && deployments.some((d: any) => d.tokenAddress && d.status === 'deployed') ? (
                  deployments
                    .filter((dep: any) => dep.tokenAddress && dep.status === 'deployed')
                    .map((dep: any) => (
                      <button
                        key={dep.chain}
                        onClick={() => handlePause(dep.chain, dep.paused || false)}
                        disabled={actionLoading === 'pause' || actionLoading === 'unpause'}
                        className={`w-full px-4 py-2 rounded-lg transition mb-2 ${
                          dep.paused
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                        } disabled:opacity-50 text-white`}
                      >
                        {actionLoading === 'pause' || actionLoading === 'unpause'
                          ? 'Processing...'
                          : dep.paused
                          ? `Unpause on ${dep.chain}`
                          : `Pause on ${dep.chain}`}
                      </button>
                    ))
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <p className="text-sm text-yellow-400">
                      {deployments && deployments.length > 0 
                        ? 'Token deployment in progress or not completed. Please wait for deployment to finish.' 
                        : 'Token must be deployed on a chain first'}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 opacity-50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Pause className="w-5 h-5 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-500">Pause Token</h3>
                </div>
                <p className="text-gray-500 text-sm">Not enabled for this token</p>
              </motion.div>
            )}

            {/* Update Trading Fees - Always available */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Trading Fees</h3>
                </div>
                {!editingFees && (
                  <button
                    onClick={() => setEditingFees(true)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {editingFees ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Buy Fee (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={buyFee}
                      onChange={(e) => setBuyFee(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current: {token.buyFeePercent || 0}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Sell Fee (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={sellFee}
                      onChange={(e) => setSellFee(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Current: {token.sellFeePercent || 0}%</p>
                  </div>
                  <div className="flex gap-2">
                    {deployments?.map((dep: any) => (
                      <button
                        key={dep.chain}
                        onClick={() => handleUpdateFees(dep.chain)}
                        disabled={actionLoading === 'update-fees'}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white rounded-lg transition"
                      >
                        {actionLoading === 'update-fees' ? 'Updating...' : `Update ${dep.chain}`}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setEditingFees(false);
                        setBuyFee(token?.buyFeePercent?.toString() || '0');
                        setSellFee(token?.sellFeePercent?.toString() || '0');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Buy Fee:</span>
                    <span className="text-white font-semibold">{token.buyFeePercent || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sell Fee:</span>
                    <span className="text-white font-semibold">{token.sellFeePercent || 0}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click edit to update fees on deployed chains</p>
                </div>
              )}
            </motion.div>

            {/* Cross-Chain Price Sync */}
            {token.crossChainEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Sync Prices</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Manually trigger price synchronization across all chains</p>
                <button
                  onClick={handleSyncPrice}
                  disabled={actionLoading === 'sync'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-lg transition"
                >
                  {actionLoading === 'sync' ? 'Syncing...' : 'Sync All Chains'}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Chain Deployments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Deployments Across Chains</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {deployments?.map((dep: any) => (
              <div
                key={dep.chain}
                className="bg-gray-700/50 rounded-xl p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white capitalize">{dep.chain}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dep.status === 'deployed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {dep.status}
                  </span>
                </div>
                {dep.tokenAddress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Token:</span>
                      <button
                        onClick={() => copyToClipboard(dep.tokenAddress, 'Token address')}
                        className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
                      >
                        <span className="font-mono text-xs">{dep.tokenAddress.slice(0, 6)}...{dep.tokenAddress.slice(-4)}</span>
                        {copiedAddress === dep.tokenAddress ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {dep.marketCap && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Market Cap:</span>
                        <span className="text-white font-semibold">${(dep.marketCap / 1e6).toFixed(2)}M</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

