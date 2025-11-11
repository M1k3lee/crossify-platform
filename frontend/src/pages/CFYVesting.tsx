import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import {
  Lock, CheckCircle, Clock,
  Gift, AlertCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

interface VestingSchedule {
  id: number;
  beneficiary_address: string;
  total_amount: string;
  tge_amount: string;
  vesting_amount: string;
  tge_released: boolean;
  tge_released_at: string | null;
  vesting_start_date: string;
  vesting_duration_months: number;
  monthly_release_amount: string;
  total_released: string;
  last_release_date: string | null;
}

interface Releasable {
  tgeReleasable: string;
  monthlyReleasable: string;
  totalReleasable: string;
  nextReleaseDate: string | null;
}

export default function CFYVesting() {
  const { publicKey, connect, connected } = useWallet();
  const [schedule, setSchedule] = useState<VestingSchedule | null>(null);
  const [releasable, setReleasable] = useState<Releasable | null>(null);
  const [releaseHistory, setReleaseHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      loadVestingData();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadVestingData = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/cfy/vesting?address=${publicKey.toString()}`
      );
      setSchedule(response.data.schedule);
      setReleasable(response.data.releasable);
      setReleaseHistory(response.data.releaseHistory || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading vesting:', error);
        toast.error('Failed to load vesting information');
      }
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

  const handleReleaseTGE = async () => {
    if (!publicKey || !schedule) return;

    try {
      setReleasing(true);
      await axios.post(`${API_BASE}/cfy/vesting/release-tge`, {
        address: publicKey.toString(),
      });
      toast.success('TGE tokens released!');
      await loadVestingData();
    } catch (error: any) {
      console.error('Error releasing TGE:', error);
      toast.error(error.response?.data?.error || 'Failed to release TGE tokens');
    } finally {
      setReleasing(false);
    }
  };

  const handleReleaseMonthly = async () => {
    if (!publicKey || !schedule) return;

    try {
      setReleasing(true);
      const response = await axios.post(`${API_BASE}/cfy/vesting/release-monthly`, {
        address: publicKey.toString(),
      });
      toast.success(`Released ${formatNumber(response.data.amount)} CFY!`);
      await loadVestingData();
    } catch (error: any) {
      console.error('Error releasing monthly:', error);
      toast.error(error.response?.data?.error || 'Failed to release monthly tokens');
    } finally {
      setReleasing(false);
    }
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
          title="CFY Vesting - Track Your Token Release | Crossify.io"
          description="View and manage your CFY token vesting schedule. Track your releases and claim your tokens."
          keywords="CFY vesting, token vesting, CFY token release, vesting schedule"
          url="https://crossify.io/cfy/vesting"
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
          <QuantumBackground />
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
            <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8">Connect your Solana wallet to view your vesting schedule</p>
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

  if (!schedule) {
    return (
      <>
        <SEO
          title="CFY Vesting - Track Your Token Release | Crossify.io"
          description="View and manage your CFY token vesting schedule."
          keywords="CFY vesting, token vesting"
          url="https://crossify.io/cfy/vesting"
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
          <QuantumBackground />
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">No Vesting Schedule Found</h1>
            <p className="text-gray-400 mb-8">
              You don't have a vesting schedule yet. Vesting schedules are created after the presale ends.
            </p>
          </div>
        </div>
      </>
    );
  }

  const totalAmount = BigInt(schedule.total_amount);
  const totalReleased = BigInt(schedule.total_released);
  const remaining = totalAmount - totalReleased;
  const progress = Number((totalReleased * BigInt(100)) / totalAmount);

  return (
    <>
      <SEO
        title="CFY Vesting - Track Your Token Release | Crossify.io"
        description="View and manage your CFY token vesting schedule. Track your releases and claim your tokens."
        keywords="CFY vesting, token vesting, CFY token release, vesting schedule"
        url="https://crossify.io/cfy/vesting"
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-50 rounded-full" />
                <div className="relative p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-full border border-blue-500/50">
                  <Lock className="w-12 h-12 text-blue-400" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CFY Token Vesting
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Track and claim your vested CFY tokens</p>
          </motion.div>

          {/* Vesting Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Total Allocated</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(schedule.total_amount)} CFY</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Total Released</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(schedule.total_released)} CFY</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Remaining</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(remaining.toString())} CFY</p>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Vesting Progress</span>
              <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Release Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Available Releases</h2>

              {releasable && (
                <div className="space-y-4">
                  {/* TGE Release */}
                  {BigInt(releasable.tgeReleasable) > BigInt(0) && (
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-yellow-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">TGE Release (20%)</h3>
                          <p className="text-gray-400 text-sm">Initial release at token launch</p>
                        </div>
                        <span className="text-yellow-400 font-bold text-xl">
                          {formatNumber(releasable.tgeReleasable)} CFY
                        </span>
                      </div>
                      <button
                        onClick={handleReleaseTGE}
                        disabled={releasing}
                        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {releasing ? 'Releasing...' : 'Release TGE Tokens'}
                      </button>
                    </div>
                  )}

                  {/* Monthly Release */}
                  {BigInt(releasable.monthlyReleasable) > BigInt(0) && (
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">Monthly Release</h3>
                          <p className="text-gray-400 text-sm">
                            {releasable.nextReleaseDate
                              ? `Next release: ${new Date(releasable.nextReleaseDate).toLocaleDateString()}`
                              : 'Available now'}
                          </p>
                        </div>
                        <span className="text-blue-400 font-bold text-xl">
                          {formatNumber(releasable.monthlyReleasable)} CFY
                        </span>
                      </div>
                      <button
                        onClick={handleReleaseMonthly}
                        disabled={releasing}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {releasing ? 'Releasing...' : 'Release Monthly Tokens'}
                      </button>
                    </div>
                  )}

                  {BigInt(releasable.totalReleasable) === BigInt(0) && (
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 text-center">
                      <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400">No tokens available for release at this time</p>
                      {releasable.nextReleaseDate && (
                        <p className="text-gray-500 text-sm mt-2">
                          Next release: {new Date(releasable.nextReleaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Schedule Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Vesting Schedule</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">TGE Release</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">{formatNumber(schedule.tge_amount)} CFY</span>
                    <p className="text-xs text-gray-500">20% at launch</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Vesting Period</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">{schedule.vesting_duration_months} months</span>
                    <p className="text-xs text-gray-500">80% linear release</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Monthly Release</span>
                  <div className="text-right">
                    <span className="text-white font-semibold">{formatNumber(schedule.monthly_release_amount)} CFY</span>
                    <p className="text-xs text-gray-500">Per month</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400">Vesting Started</span>
                  <span className="text-white font-semibold">
                    {new Date(schedule.vesting_start_date).toLocaleDateString()}
                  </span>
                </div>

                {schedule.tge_released_at && (
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <span className="text-green-400">TGE Released</span>
                    <span className="text-green-400 font-semibold">
                      {new Date(schedule.tge_released_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Release History */}
              {releaseHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Release History</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {releaseHistory.map((release) => (
                      <div
                        key={release.id}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                      >
                        <div>
                          <span className="text-white text-sm">
                            {release.release_type === 'tge' ? 'TGE Release' : 'Monthly Release'}
                          </span>
                          <p className="text-xs text-gray-500">
                            {new Date(release.release_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-green-400 font-semibold">
                          +{formatNumber(release.release_amount)} CFY
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

