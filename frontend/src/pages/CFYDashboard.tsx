import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Coins, TrendingUp, Lock, Gift, Wallet, ArrowRight,
  Zap, PieChart, Activity, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

export default function CFYDashboard() {
  const { publicKey, connect, connected } = useWallet();
  const [cfyBalance, setCfyBalance] = useState<string>('0');
  const [vestingData, setVestingData] = useState<any>(null);
  const [stakingData, setStakingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadDashboardData = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      
      // Load vesting data
      try {
        const vestingResponse = await axios.get(
          `${API_BASE}/cfy/vesting?address=${publicKey.toString()}`
        );
        setVestingData(vestingResponse.data);
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error loading vesting:', error);
        }
      }

      // Load staking data
      try {
        const stakingResponse = await axios.get(
          `${API_BASE}/cfy/staking/positions?address=${publicKey.toString()}`
        );
        setStakingData(stakingResponse.data);
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error loading staking:', error);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string) => {
    const n = BigInt(num);
    if (n >= BigInt(1e9)) return (Number(n) / 1e9).toFixed(2) + 'B';
    if (n >= BigInt(1e6)) return (Number(n) / 1e6).toFixed(2) + 'M';
    if (n >= BigInt(1e3)) return (Number(n) / 1e3).toFixed(2) + 'K';
    return n.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!connected || !publicKey) {
    return (
      <>
        <SEO
          title="CFY Dashboard - Manage Your CFY Tokens | Crossify.io"
          description="Manage your CFY tokens, view vesting schedule, stake tokens, and track rewards."
          keywords="CFY dashboard, CFY tokens, token management"
          url="https://crossify.io/cfy"
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
          <QuantumBackground />
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8">Connect your Solana wallet to view your CFY dashboard</p>
            <button
              onClick={() => connect().catch(console.error)}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </>
    );
  }

  const totalStaked = stakingData?.reduce((sum: bigint, pos: any) => 
    sum + BigInt(pos.staked_amount || '0'), BigInt(0)
  ) || BigInt(0);

  const totalRewards = stakingData?.reduce((sum: bigint, pos: any) => 
    sum + BigInt(pos.total_rewards_earned || '0'), BigInt(0)
  ) || BigInt(0);

  return (
    <>
      <SEO
        title="CFY Dashboard - Manage Your CFY Tokens | Crossify.io"
        description="Manage your CFY tokens, view vesting schedule, stake tokens, and track rewards."
        keywords="CFY dashboard, CFY tokens, token management, vesting, staking"
        url="https://crossify.io/cfy"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 blur-2xl opacity-50 rounded-full" />
                <div className="relative p-4 bg-gradient-to-br from-primary-500/20 to-purple-600/20 backdrop-blur-sm rounded-full border border-primary-500/50">
                  <Coins className="w-12 h-12 text-primary-400" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CFY Dashboard
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Manage your CFY tokens, vesting, and staking</p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">CFY Balance</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(cfyBalance)} CFY</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400 text-sm">Vesting</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {vestingData ? formatNumber(vestingData.schedule?.total_amount || '0') : '0'} CFY
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Staked</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(totalStaked.toString())} CFY</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Rewards</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(totalRewards.toString())} CFY</p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Vesting</h3>
                  <p className="text-gray-400 text-sm">Track your token releases</p>
                </div>
              </div>
              {vestingData ? (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Allocated</span>
                    <span className="text-white font-semibold">
                      {formatNumber(vestingData.schedule?.total_amount || '0')} CFY
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Available</span>
                    <span className="text-green-400 font-semibold">
                      {formatNumber(vestingData.releasable?.totalReleasable || '0')} CFY
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">No vesting schedule found</p>
              )}
              <Link
                to="/cfy/vesting"
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                View Vesting
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Staking</h3>
                  <p className="text-gray-400 text-sm">Earn up to 50% APY</p>
                </div>
              </div>
              {stakingData && stakingData.length > 0 ? (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Positions</span>
                    <span className="text-white font-semibold">
                      {stakingData.filter((p: any) => p.is_active).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Rewards</span>
                    <span className="text-yellow-400 font-semibold">
                      {formatNumber(totalRewards.toString())} CFY
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">No active staking positions</p>
              )}
              <Link
                to="/cfy/staking"
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                View Staking
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <PieChart className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tokenomics</h3>
                  <p className="text-gray-400 text-sm">Platform-powered value</p>
                </div>
              </div>
              <div className="space-y-2 mb-4 text-sm text-gray-300">
                <p>• 50% fees → Buyback</p>
                <p>• 30% fees → Liquidity</p>
                <p>• 10% fees → Burns</p>
              </div>
              <Link
                to="/tokenomics"
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Recent Activity */}
          {(vestingData?.releaseHistory?.length > 0 || stakingData?.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-3">
                {vestingData?.releaseHistory?.slice(0, 5).map((release: any) => (
                  <div
                    key={release.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-semibold">
                          {release.release_type === 'tge' ? 'TGE Release' : 'Monthly Release'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {new Date(release.release_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold">
                      +{formatNumber(release.release_amount)} CFY
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

