import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles, Rocket, Coins, Zap, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import axios from 'axios';
import { useAccount } from 'wagmi';

import { API_BASE } from '../config/api';

export default function Dashboard() {
  const { address } = useAccount();
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/marketplace`);
        return response.data.tokens || [];
      } catch {
        return [];
      }
    },
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
              {tokens.slice(0, 5).map((token: any, idx: number) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-gray-700/50 hover:bg-gray-700 rounded-xl p-4 border border-gray-600 hover:border-primary-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Link to={`/token/${token.id}`} className="flex items-center gap-4 flex-1">
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
                        <h3 className="text-lg font-semibold text-white">{token.name}</h3>
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
                        >
                          <Zap className="w-5 h-5 text-primary-400" />
                        </Link>
                        {token.creatorAddress?.toLowerCase() === address?.toLowerCase() && (
                          <Link
                            to={`/creator/${token.id}`}
                            className="p-2 hover:bg-gray-600 rounded-lg transition"
                            title="Manage Token"
                          >
                            <Settings className="w-5 h-5 text-blue-400" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
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
