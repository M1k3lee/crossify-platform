import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import {
  Coins, Lock, Unlock, RefreshCw, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

interface StakingPool {
  id: number;
  pool_name: string;
  pool_type: string;
  apy_percentage: number;
  lock_period_days: number | null;
  min_stake_amount: string;
  max_stake_amount: string | null;
  total_staked: string;
  total_rewards_distributed: string;
  is_active: boolean;
}

interface StakingPosition {
  id: number;
  pool_id: number;
  staker_address: string;
  staked_amount: string;
  staked_at: string;
  lock_until: string | null;
  total_rewards_earned: string;
  rewards_claimed: string;
  last_reward_calculation: string;
  is_active: boolean;
  currentRewards?: string;
  pool?: StakingPool;
}

export default function CFYStaking() {
  const { publicKey, connect, connected } = useWallet();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [selectedPool, setSelectedPool] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');

  useEffect(() => {
    loadPools();
    if (connected && publicKey) {
      loadPositions();
    }
  }, [connected, publicKey]);

  const loadPools = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cfy/staking/pools`);
      setPools(response.data);
    } catch (error: any) {
      console.error('Error loading pools:', error);
      toast.error('Failed to load staking pools');
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    if (!publicKey) return;

    try {
      const response = await axios.get(
        `${API_BASE}/cfy/staking/positions?address=${publicKey.toString()}`
      );
      setPositions(response.data);
    } catch (error: any) {
      console.error('Error loading positions:', error);
    }
  };

  const formatNumber = (num: string) => {
    const n = BigInt(num);
    if (n >= BigInt(1e9)) return (Number(n) / 1e9).toFixed(2) + 'B';
    if (n >= BigInt(1e6)) return (Number(n) / 1e6).toFixed(2) + 'M';
    if (n >= BigInt(1e3)) return (Number(n) / 1e3).toFixed(2) + 'K';
    return n.toString();
  };

  const handleStake = async (poolId: number) => {
    if (!publicKey || !stakeAmount) {
      toast.error('Please enter an amount');
      return;
    }

    try {
      setStaking(true);
      await axios.post(`${API_BASE}/cfy/staking/stake`, {
        pool_id: poolId,
        address: publicKey.toString(),
        amount: stakeAmount,
      });
      toast.success('Tokens staked successfully!');
      setStakeAmount('');
      setSelectedPool(null);
      await loadPositions();
    } catch (error: any) {
      console.error('Error staking:', error);
      toast.error(error.response?.data?.error || 'Failed to stake tokens');
    } finally {
      setStaking(false);
    }
  };

  const handleUnstake = async (positionId: number) => {
    if (!publicKey) return;

    try {
      setStaking(true);
      await axios.post(`${API_BASE}/cfy/staking/unstake`, {
        position_id: positionId,
      });
      toast.success('Tokens unstaked successfully!');
      await loadPositions();
    } catch (error: any) {
      console.error('Error unstaking:', error);
      toast.error(error.response?.data?.error || 'Failed to unstake tokens');
    } finally {
      setStaking(false);
    }
  };

  const handleClaimRewards = async (positionId: number) => {
    if (!publicKey) return;

    try {
      setStaking(true);
      const response = await axios.post(`${API_BASE}/cfy/staking/claim-rewards`, {
        position_id: positionId,
      });
      toast.success(`Claimed ${formatNumber(response.data.amount)} CFY rewards!`);
      await loadPositions();
    } catch (error: any) {
      console.error('Error claiming rewards:', error);
      toast.error(error.response?.data?.error || 'Failed to claim rewards');
    } finally {
      setStaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="CFY Staking - Earn Rewards | Crossify.io"
        description="Stake your CFY tokens to earn up to 50% APY. Multiple staking pools available with flexible and locked options."
        keywords="CFY staking, stake CFY, CFY rewards, staking pools, APY"
        url="https://crossify.io/cfy/staking"
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
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 blur-2xl opacity-50 rounded-full" />
                <div className="relative p-4 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-full border border-green-500/50">
                  <Coins className="w-12 h-12 text-green-400" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                CFY Staking
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Earn up to 50% APY by staking your CFY tokens</p>
          </motion.div>

          {!connected || !publicKey ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50 text-center"
            >
              <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-8">Connect your Solana wallet to start staking CFY tokens</p>
              <button
                onClick={() => connect().catch(console.error)}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
              >
                Connect Wallet
              </button>
            </motion.div>
          ) : (
            <>
              {/* Staking Pools */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-white mb-6">Staking Pools</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pools.map((pool) => (
                    <div
                      key={pool.id}
                      className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/50 transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">{pool.pool_name}</h3>
                        {pool.lock_period_days ? (
                          <Lock className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <Unlock className="w-5 h-5 text-green-400" />
                        )}
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">APY</span>
                          <span className="text-green-400 font-bold text-2xl">
                            {pool.apy_percentage}%
                          </span>
                        </div>

                        {pool.lock_period_days && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Lock Period</span>
                            <span className="text-white font-semibold">
                              {pool.lock_period_days} days
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Min Stake</span>
                          <span className="text-white font-semibold">
                            {formatNumber(pool.min_stake_amount)} CFY
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Total Staked</span>
                          <span className="text-white font-semibold">
                            {formatNumber(pool.total_staked)} CFY
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedPool(pool.id)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition"
                      >
                        Stake Now
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Stake Modal */}
              {selectedPool && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                  onClick={() => setSelectedPool(null)}
                >
                  <div
                    className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-2xl font-bold text-white mb-4">Stake CFY Tokens</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount (CFY)
                      </label>
                      <input
                        type="text"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedPool(null)}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStake(selectedPool)}
                        disabled={staking || !stakeAmount}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {staking ? 'Staking...' : 'Stake'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* User Positions */}
              {positions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-6">Your Staking Positions</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">
                            {position.pool?.pool_name || 'Unknown Pool'}
                          </h3>
                          {position.is_active ? (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                              Unstaked
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Staked</span>
                            <span className="text-white font-semibold">
                              {formatNumber(position.staked_amount)} CFY
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">APY</span>
                            <span className="text-green-400 font-semibold">
                              {position.pool?.apy_percentage || 0}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Total Rewards</span>
                            <span className="text-yellow-400 font-semibold">
                              {formatNumber(position.total_rewards_earned)} CFY
                            </span>
                          </div>

                          {position.currentRewards && BigInt(position.currentRewards) > BigInt(0) && (
                            <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                              <span className="text-yellow-400">Available to Claim</span>
                              <span className="text-yellow-400 font-bold">
                                {formatNumber(position.currentRewards)} CFY
                              </span>
                            </div>
                          )}

                          {position.lock_until && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Locked Until</span>
                              <span className="text-white text-sm">
                                {new Date(position.lock_until).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {position.is_active && (
                            <>
                              {position.currentRewards && BigInt(position.currentRewards) > BigInt(0) && (
                                <button
                                  onClick={() => handleClaimRewards(position.id)}
                                  disabled={staking}
                                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                                >
                                  Claim Rewards
                                </button>
                              )}
                              {(!position.lock_until || new Date(position.lock_until) <= new Date()) && (
                                <button
                                  onClick={() => handleUnstake(position.id)}
                                  disabled={staking}
                                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                                >
                                  Unstake
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {positions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50 text-center"
                >
                  <Coins className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">No Active Positions</h2>
                  <p className="text-gray-400 mb-8">Start staking to earn rewards on your CFY tokens</p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

