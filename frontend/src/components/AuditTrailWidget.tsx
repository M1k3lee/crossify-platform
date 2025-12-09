import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  AlertCircle,
  Zap
} from 'lucide-react';
import { API_BASE } from '../config/api';

interface AuditLog {
  type: 'PRICE_SYNC' | 'BONDING_CURVE_TX';
  version?: string;
  tokenAddress?: string;
  chain?: string;
  sourceChain?: string;
  targetChains?: string[];
  transactionType?: 'BUY' | 'SELL';
  amount?: string;
  price?: string;
  newSupply?: string;
  oldGlobalSupply?: string;
  newGlobalSupply?: string;
  txHash?: string;
  layerZeroTxHash?: string;
  supraTxHash?: string;
  ccipTxHash?: string;
  userAddress?: string;
  timestamp?: string;
  hcsTimestamp?: string;
  hcsMessageId?: number;
  hcsTopicId?: string;
  hashscanUrl?: string;
  verified?: boolean;
  poweredBy?: string;
}

interface AuditTrailWidgetProps {
  tokenId: string;
  chain?: string;
}

export default function AuditTrailWidget({ tokenId, chain }: AuditTrailWidgetProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(7); // Show 7 messages initially
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', tokenId, chain],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (chain) params.chain = chain;
      
      const response = await axios.get(`${API_BASE}/tokens/${tokenId}/audit-logs`, { params });
      return response.data;
    },
    enabled: !!tokenId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const toggleLog = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const formatAmount = (amount?: string) => {
    if (!amount) return 'N/A';
    try {
      const num = parseFloat(amount);
      if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
      return num.toFixed(2);
    } catch {
      return amount;
    }
  };

  const auditLogs: AuditLog[] = data?.auditLogs || [];
  const hcsConfigured = data?.hcsConfigured !== false;
  const topicId = data?.topicId;

  if (!hcsConfigured) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Audit Trail</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-400 font-medium">Hedera HCS Not Configured</p>
            <p className="text-xs text-gray-400 mt-1">
              To enable immutable audit logging, configure HEDERA_HCS_TOPIC_ID in your backend environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Immutable Audit Trail</h2>
            <p className="text-xs text-gray-400 mt-1">
              Powered by Hedera Consensus Service (HCS)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {topicId && (
            <a
              href={`https://hashscan.io/testnet/topic/${topicId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Topic <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
            title="Refresh audit logs"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && auditLogs.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading audit logs...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-400 font-medium">Error Loading Audit Logs</p>
            <p className="text-xs text-gray-400 mt-1">
              {error instanceof Error ? error.message : 'Failed to fetch audit logs'}
            </p>
          </div>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <FileText className="w-6 h-6 text-gray-500" />
          <span className="ml-2 text-gray-400">No audit logs yet</span>
        </div>
      ) : (
        <div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            {auditLogs.slice(0, visibleCount).map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-600 transition"
            >
              <button
                onClick={() => toggleLog(index)}
                className="w-full p-4 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  {log.type === 'PRICE_SYNC' ? (
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      log.transactionType === 'BUY' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {log.transactionType === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {log.type === 'PRICE_SYNC' 
                          ? 'Cross-Chain Price Sync' 
                          : `${log.transactionType} Transaction`}
                      </p>
                      {log.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp || log.hcsTimestamp)}
                      </span>
                      {log.chain && (
                        <span className="text-xs px-2 py-0.5 bg-gray-600 rounded text-gray-300">
                          {log.chain}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {log.hashscanUrl && (
                    <a
                      href={log.hashscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 hover:bg-gray-600 rounded transition"
                      title="View on HashScan"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                  <span className="text-xs text-gray-500">
                    {expandedLogs.has(index) ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {expandedLogs.has(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 border-t border-gray-600/50"
                >
                  <div className="pt-4 space-y-3">
                    {log.type === 'PRICE_SYNC' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Source Chain</p>
                            <p className="text-sm text-white font-medium">{log.sourceChain || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Target Chains</p>
                            <p className="text-sm text-white font-medium">
                              {log.targetChains?.join(', ') || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Old Global Supply</p>
                            <p className="text-sm text-white font-medium">{formatAmount(log.oldGlobalSupply)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">New Global Supply</p>
                            <p className="text-sm text-white font-medium">{formatAmount(log.newGlobalSupply)}</p>
                          </div>
                        </div>
                        {log.supraTxHash && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-purple-400" />
                              Supra TX Hash
                            </p>
                            <p className="text-sm text-purple-400 font-mono break-all">{log.supraTxHash}</p>
                          </div>
                        )}
                        {log.layerZeroTxHash && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">LayerZero TX Hash</p>
                            <p className="text-sm text-blue-400 font-mono break-all">{log.layerZeroTxHash}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Amount</p>
                            <p className="text-sm text-white font-medium">{formatAmount(log.amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Price</p>
                            <p className="text-sm text-white font-medium">
                              {log.price ? `$${parseFloat(log.price).toFixed(6)}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">New Supply</p>
                          <p className="text-sm text-white font-medium">{formatAmount(log.newSupply)}</p>
                        </div>
                        {log.userAddress && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">User Address</p>
                            <p className="text-sm text-blue-400 font-mono break-all">{log.userAddress}</p>
                          </div>
                        )}
                        {log.txHash && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
                            <p className="text-sm text-blue-400 font-mono break-all">{log.txHash}</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {log.hcsMessageId && (
                      <div className="pt-3 border-t border-gray-600/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">HCS Message ID</p>
                            <p className="text-sm text-white font-mono">#{log.hcsMessageId}</p>
                          </div>
                          {log.hcsTopicId && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Topic ID</p>
                              <p className="text-sm text-white font-mono">{log.hcsTopicId}</p>
                            </div>
                          )}
                        </div>
                        {log.poweredBy && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            {log.poweredBy}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
            ))}
          </div>
          
          {auditLogs.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 7, auditLogs.length))}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-sm text-white font-medium transition flex items-center gap-2"
              >
                Load More ({auditLogs.length - visibleCount} remaining)
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-400 text-center">
            Showing {auditLogs.length} of {data?.total || auditLogs.length} audit logs
          </p>
        </div>
      )}
    </div>
  );
}

