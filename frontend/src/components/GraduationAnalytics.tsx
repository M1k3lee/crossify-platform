import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, Clock, Target, BarChart3, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

interface GraduationStats {
  totalTokens: number;
  graduatedTokens: number;
  graduationRate: number;
  averageTimeToGraduation: number;
  medianTimeToGraduation: number;
  fastestGraduation: number;
  slowestGraduation: number;
}

interface PostGraduationPerformance {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  graduatedAt: string;
  daysSinceGraduation: number;
  dexName: string;
  poolAddress: string;
  currentPrice?: number;
  priceChange?: number;
  volume24h?: number;
}

interface GraduationTimeline {
  date: string;
  count: number;
  tokens: Array<{ id: string; name: string; symbol: string }>;
}

interface GraduationRateByThreshold {
  thresholdRange: string;
  totalTokens: number;
  graduatedTokens: number;
  successRate: number;
}

export default function GraduationAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['graduation-analytics'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/analytics/graduation`);
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const stats: GraduationStats = data?.stats || {
    totalTokens: 0,
    graduatedTokens: 0,
    graduationRate: 0,
    averageTimeToGraduation: 0,
    medianTimeToGraduation: 0,
    fastestGraduation: 0,
    slowestGraduation: 0,
  };

  const performance: PostGraduationPerformance[] = data?.performance || [];
  const timeline: GraduationTimeline[] = data?.timeline || [];
  const rateByThreshold: GraduationRateByThreshold[] = data?.rateByThreshold || [];

  const formatTime = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-gray-400">Graduation Rate</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.graduationRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.graduatedTokens} of {stats.totalTokens} tokens
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-gray-400">Avg. Time</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatTime(stats.averageTimeToGraduation)}</p>
          <p className="text-xs text-gray-400 mt-1">To graduation</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-6 border border-yellow-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-medium text-gray-400">Fastest</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatTime(stats.fastestGraduation)}</p>
          <p className="text-xs text-gray-400 mt-1">Record time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border border-blue-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-400">Median Time</h3>
          </div>
          <p className="text-3xl font-bold text-white">{formatTime(stats.medianTimeToGraduation)}</p>
          <p className="text-xs text-gray-400 mt-1">To graduation</p>
        </motion.div>
      </div>

      {/* Graduation Timeline */}
      {timeline.length > 0 && (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Graduation Timeline (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {timeline.map((item, index) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div>
                  <p className="text-white font-semibold">{item.date}</p>
                  <p className="text-xs text-gray-400">
                    {item.tokens.map(t => t.symbol).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-400">{item.count}</p>
                  <p className="text-xs text-gray-400">tokens</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Success Rate by Threshold */}
      {rateByThreshold.length > 0 && (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Success Rate by Threshold Range
          </h3>
          <div className="space-y-3">
            {rateByThreshold.map((item, index) => (
              <motion.div
                key={item.thresholdRange}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{item.thresholdRange}</span>
                  <span className="text-lg font-bold text-green-400">{item.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.successRate}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {item.graduatedTokens} graduated out of {item.totalTokens} tokens
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Post-Graduation Performance */}
      {performance.length > 0 && (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Post-Graduation Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Token</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">DEX</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Days Since</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Price</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((item, index) => (
                  <motion.tr
                    key={item.tokenId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-semibold">{item.tokenName}</p>
                        <p className="text-xs text-gray-400">{item.tokenSymbol}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-purple-400 capitalize">{item.dexName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-white">{item.daysSinceGraduation} days</span>
                    </td>
                    <td className="py-3 px-4">
                      {item.currentPrice ? (
                        <span className="text-sm text-green-400">${item.currentPrice.toFixed(6)}</span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.totalTokens === 0 && (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 text-center">
          <p className="text-gray-400">No graduation data available yet</p>
        </div>
      )}
    </div>
  );
}

