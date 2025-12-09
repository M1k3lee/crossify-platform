import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Network,
  Shield,
  Activity
} from 'lucide-react';
import { API_BASE } from '../config/api';

interface CrossChainMessage {
  id: string;
  sourceChain: string;
  targetChains: string[];
  protocol: 'LAYERZERO' | 'SUPRA' | 'BOTH';
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  supraTxHash?: string;
  layerZeroTxHash?: string;
  timestamp: string;
  latency?: number;
  verified?: boolean;
  hashscanUrl?: string;
}

interface CrossChainVisualizationProps {
  tokenId: string;
  deployments: Array<{ chain: string; token_address: string }>;
}

export default function CrossChainVisualization({ 
  tokenId, 
  deployments 
}: CrossChainVisualizationProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // Fetch cross-chain messages from audit logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cross-chain-messages', tokenId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/${tokenId}/audit-logs`, { 
        params: { limit: 20 } 
      });
      
      // Extract PRICE_SYNC messages and format as cross-chain messages
      const priceSyncLogs = (response.data.auditLogs || [])
        .filter((log: any) => log.type === 'PRICE_SYNC')
        .map((log: any, index: number) => ({
          id: `msg-${log.hcsMessageId || index}`,
          sourceChain: log.sourceChain || 'unknown',
          targetChains: log.targetChains || [],
          protocol: log.supraTxHash ? 'SUPRA' : (log.layerZeroTxHash ? 'LAYERZERO' : 'BOTH'),
          status: log.verified ? 'confirmed' : 'pending',
          txHash: log.txHash,
          supraTxHash: log.supraTxHash,
          layerZeroTxHash: log.layerZeroTxHash,
          timestamp: log.timestamp || log.hcsTimestamp || new Date().toISOString(),
          verified: log.verified,
          hashscanUrl: log.hashscanUrl,
        }));
      
      return { messages: priceSyncLogs };
    },
    enabled: !!tokenId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const messages: CrossChainMessage[] = data?.messages || [];
  const chains = deployments.map(d => d.chain);

  const getChainColor = (chain: string) => {
    const colors: Record<string, string> = {
      'base-sepolia': 'bg-blue-500',
      'sepolia': 'bg-gray-500',
      'hedera-testnet': 'bg-purple-500',
      'bsc-testnet': 'bg-yellow-500',
      'solana': 'bg-green-500',
      'unichain-sepolia': 'bg-cyan-500',
    };
    return colors[chain.toLowerCase()] || 'bg-gray-600';
  };

  const getChainName = (chain: string) => {
    return chain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    const explorers: Record<string, string> = {
      'base-sepolia': `https://sepolia.basescan.org/tx/${txHash}`,
      'sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
      'bsc-testnet': `https://testnet.bscscan.com/tx/${txHash}`,
    };
    return explorers[chain.toLowerCase()] || null;
  };

  if (chains.length < 2) {
    return null; // Don't show if token isn't on multiple chains
  }

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Cross-Chain Price Sync
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full font-medium">
                Powered by Supra
              </span>
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Real-time price synchronization across all chains
            </p>
          </div>
        </div>
        
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Chain Network Visualization */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/30">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {chains.map((chain, index) => (
            <motion.div
              key={chain}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className={`w-10 h-10 rounded-full ${getChainColor(chain)} flex items-center justify-center text-white text-xs font-semibold`}>
                {getChainName(chain).charAt(0)}
              </div>
              <span className="text-sm text-gray-300 font-medium">{getChainName(chain)}</span>
              {index < chains.length - 1 && (
                <ArrowRight className="w-4 h-4 text-purple-400 mx-2" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Messages */}
      {isLoading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading cross-chain messages...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">Error loading cross-chain messages</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <Network className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No cross-chain sync events yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Sync events will appear here when prices update across chains
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.slice(0, 5).map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-900/50 rounded-lg border border-gray-700/30 overflow-hidden"
            >
              <button
                onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    message.status === 'confirmed' ? 'bg-green-500/20' :
                    message.status === 'failed' ? 'bg-red-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    {message.status === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : message.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">
                        {message.sourceChain} → {message.targetChains.length} chains
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        message.protocol === 'SUPRA' 
                          ? 'bg-purple-500/20 text-purple-300'
                          : message.protocol === 'LAYERZERO'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {message.protocol}
                      </span>
                      {message.verified && (
                        <div title="Verified on Hedera HCS">
                          <Shield className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.latency && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {message.latency}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="text-xs text-gray-500 ml-4">
                  {selectedMessage === message.id ? '▼' : '▶'}
                </span>
              </button>

              {selectedMessage === message.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 border-t border-gray-700/30"
                >
                  <div className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Source Chain</p>
                        <p className="text-sm text-white font-medium">{getChainName(message.sourceChain)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Target Chains</p>
                        <div className="flex flex-wrap gap-1">
                          {message.targetChains.map(chain => (
                            <span
                              key={chain}
                              className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300"
                            >
                              {getChainName(chain)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">Protocol:</p>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        message.protocol === 'SUPRA' 
                          ? 'bg-purple-500/20 text-purple-300'
                          : message.protocol === 'LAYERZERO'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {message.protocol}
                        {message.protocol === 'SUPRA' && (
                          <span className="ml-1 text-purple-400">⚡</span>
                        )}
                      </span>
                    </div>

                    {message.supraTxHash && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Supra Transaction Hash
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-purple-400 font-mono break-all">
                            {message.supraTxHash}
                          </p>
                          <a
                            href={getExplorerUrl(message.sourceChain, message.supraTxHash) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-700 rounded transition"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        </div>
                      </div>
                    )}

                    {message.layerZeroTxHash && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">LayerZero Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-blue-400 font-mono break-all">
                            {message.layerZeroTxHash}
                          </p>
                          <a
                            href={getExplorerUrl(message.sourceChain, message.layerZeroTxHash) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-gray-700 rounded transition"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        </div>
                      </div>
                    )}

                    {message.hashscanUrl && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Hedera HCS Verification</p>
                        <a
                          href={message.hashscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
                        >
                          View on HashScan <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {messages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700/30 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              {messages.filter(m => m.status === 'confirmed').length} confirmed
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              {messages.filter(m => m.status === 'pending').length} pending
            </span>
            {messages.filter(m => m.protocol === 'SUPRA').length > 0 && (
              <span className="flex items-center gap-1 text-purple-400">
                <Zap className="w-4 h-4" />
                {messages.filter(m => m.protocol === 'SUPRA').length} via Supra
              </span>
            )}
          </div>
          <span className="text-purple-400 font-medium">Powered by Supra HyperNova ⚡</span>
        </div>
      )}
    </div>
  );
}

