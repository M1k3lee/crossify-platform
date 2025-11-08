import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles, Rocket, Coins, Zap, Settings, Pin, Archive, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import axios from 'axios';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useState } from 'react';

import { API_BASE } from '../config/api';

export default function Dashboard() {
  const { address } = useAccount();
  const { data: tokens, isLoading, refetch } = useQuery({
    queryKey: ['my-tokens', address],
    queryFn: async () => {
      if (!address) return [];
      try {
        const response = await axios.get(`${API_BASE}/tokens/my-tokens`, {
          params: { address },
        });
        return response.data.tokens || [];
      } catch (error) {
        console.error('Error fetching user tokens:', error);
        return [];
      }
    },
    enabled: !!address,
  });

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

  const totalTokens = tokens?.length || 0;
  const activeLaunches = tokens?.filter((t: any) => 
    t.deployments?.some((d: any) => !d.isGraduated)
  ).length || 0;
  const totalVolume = tokens?.reduce((sum: number, t: any) => {
    const deployments = t.deployments || [];
    return sum + deployments.reduce((depSum: number, d: any) => depSum + (d.marketCap || 0), 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      <QuantumBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-400">Overview of your token launches and analytics</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              label: 'Total Tokens',
              value: totalTokens,
              icon: Coins,
              gradient: 'from-primary-500 to-blue-600',
              change: '+12%',
            },
            {
              label: 'Active Launches',
              value: activeLaunches,
              icon: Rocket,
              gradient: 'from-yellow-500 to-orange-600',
              change: '+5',
            },
            {
              label: 'Total Volume',
              value: `$${(totalVolume / 1e6).toFixed(2)}M`,
              icon: TrendingUp,
              gradient: 'from-green-500 to-emerald-600',
              change: '+24.5%',
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/20"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-green-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-gray-400 text-sm mb-2">{stat.label}</h3>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Your Tokens Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Tokens</h2>
            <Link
              to="/builder"
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Launch New Token
            </Link>
          </div>

          {tokens && tokens.length > 0 ? (
            <div className="space-y-4">
              {tokens.map((token: any, idx: number) => (
                <TokenCard
                  key={token.id}
                  token={token}
                  address={address}
                  onUpdate={refetch}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gray-700/50 rounded-full mb-4">
                <Coins className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-gray-400 mb-4">No tokens yet. Launch your first token!</p>
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Rocket className="w-5 h-5" />
                Launch Token
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Token Card Component with Management Actions
function TokenCard({ token, address, onUpdate, index }: { token: any; address: string | undefined; onUpdate: () => void; index: number }) {
  const [isManaging, setIsManaging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (field: 'archived' | 'pinned' | 'deleted', value: boolean) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsUpdating(true);
      await axios.patch(
        `${API_BASE}/tokens/${token.id}/status`,
        { [field]: value },
        {
          headers: {
            'x-creator-address': address,
          },
        }
      );
      
      toast.success(field === 'pinned' 
        ? (value ? 'Token pinned' : 'Token unpinned')
        : field === 'archived'
        ? (value ? 'Token archived' : 'Token unarchived')
        : 'Token deleted'
      );
      onUpdate();
    } catch (error: any) {
      console.error('Error updating token status:', error);
      toast.error(error.response?.data?.error || 'Failed to update token status');
    } finally {
      setIsUpdating(false);
      setIsManaging(false);
    }
  };

  const isOwner = token.creatorAddress?.toLowerCase() === address?.toLowerCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group bg-gray-700/50 hover:bg-gray-700 rounded-xl p-4 border transition-all ${
        token.pinned ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-600 hover:border-primary-500/50'
      } ${token.archived ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between">
        <Link to={`/token/${token.id}`} className="flex items-center gap-4 flex-1">
          {token.pinned && (
            <Pin className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
          )}
          {token.logoUrl ? (
            <img
              src={token.logoUrl}
              alt={token.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-xl font-bold">
              {token.symbol?.charAt(0) || 'T'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{token.name}</h3>
              {token.archived && (
                <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded">Archived</span>
              )}
            </div>
            <p className="text-sm text-gray-400">{token.symbol}</p>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">Market Cap</p>
            <p className="text-lg font-semibold text-white">
              ${((token.deployments?.[0]?.marketCap || 0) / 1e6).toFixed(2)}M
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/token/${token.id}`}
              className="p-2 hover:bg-gray-600 rounded-lg transition"
              title="View Token"
            >
              <Zap className="w-5 h-5 text-primary-400" />
            </Link>
            {isOwner && (
              <>
                <Link
                  to={`/creator/${token.id}`}
                  className="p-2 hover:bg-gray-600 rounded-lg transition"
                  title="Manage Token"
                >
                  <Settings className="w-5 h-5 text-blue-400" />
                </Link>
                {!isManaging ? (
                  <button
                    onClick={() => setIsManaging(true)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition"
                    title="More Options"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-600">
                    <button
                      onClick={() => handleStatusUpdate('pinned', !token.pinned)}
                      disabled={isUpdating}
                      className="p-2 hover:bg-gray-700 rounded transition disabled:opacity-50"
                      title={token.pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`w-4 h-4 ${token.pinned ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('archived', !token.archived)}
                      disabled={isUpdating}
                      className="p-2 hover:bg-gray-700 rounded transition disabled:opacity-50"
                      title={token.archived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className={`w-4 h-4 ${token.archived ? 'text-orange-400' : 'text-gray-400'}`} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this token? This action cannot be undone.')) {
                          handleStatusUpdate('deleted', true);
                        }
                      }}
                      disabled={isUpdating}
                      className="p-2 hover:bg-gray-700 rounded transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    <button
                      onClick={() => setIsManaging(false)}
                      className="p-2 hover:bg-gray-700 rounded transition"
                      title="Close"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
