import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

interface GraduationProgressProps {
  tokenId: string;
  chain: string;
  graduationThreshold: number;
  currentMarketCap?: number;
  isGraduated?: boolean;
}

export default function GraduationProgress({
  tokenId,
  chain,
  graduationThreshold,
  currentMarketCap: initialMarketCap,
  isGraduated: initialIsGraduated,
}: GraduationProgressProps) {
  // Fetch real-time graduation status
  const { data: graduationStatus, isLoading } = useQuery({
    queryKey: ['graduation-status', tokenId, chain],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/${tokenId}/graduation-status`, {
          params: { chain },
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching graduation status:', error);
        return null;
      }
    },
    enabled: !!tokenId && !!chain && graduationThreshold > 0,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Use fetched data or fallback to props
  const isGraduated = graduationStatus?.isGraduated ?? initialIsGraduated ?? false;
  const currentMarketCap = graduationStatus?.currentMarketCap ?? initialMarketCap ?? 0;
  const progressPercent = graduationStatus?.progressPercent ?? 
    (graduationThreshold > 0 ? Math.min(100, (currentMarketCap / graduationThreshold) * 100) : 0);

  // Don't show if threshold is 0 (disabled) or already graduated
  if (graduationThreshold === 0 || isGraduated) {
    return null;
  }

  const remaining = Math.max(0, graduationThreshold - currentMarketCap);
  const isNearThreshold = progressPercent >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Target className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">DEX Graduation Progress</h3>
          <p className="text-sm text-gray-400">
            {isNearThreshold ? '🎉 Almost there! Token will graduate to DEX soon!' : 'Token will automatically migrate to DEX when threshold is reached'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isNearThreshold
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {progressPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Current Market Cap</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${currentMarketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Graduation Threshold</span>
            </div>
            <p className="text-lg font-bold text-white">
              ${graduationThreshold.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Remaining */}
        {remaining > 0 && (
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Remaining to graduation</span>
              <span className="text-sm font-semibold text-purple-400">
                ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* Near Threshold Warning */}
        {isNearThreshold && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-yellow-400 font-semibold">
                🎉 Token is {progressPercent.toFixed(1)}% to graduation! Next buy may trigger DEX migration!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

