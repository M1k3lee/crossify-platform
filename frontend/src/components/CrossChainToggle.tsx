import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Globe, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface CrossChainToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedChains: string[];
}

export default function CrossChainToggle({ enabled, onToggle, selectedChains }: CrossChainToggleProps) {
  const [showInfo, setShowInfo] = useState(false);
  const isMultiChain = selectedChains.length > 1;
  const canEnableCrossChain = isMultiChain;

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-primary-500/20' : 'bg-gray-700/50'}`}>
              <Globe className={`w-6 h-6 ${enabled ? 'text-primary-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Cross-Chain Price Sync</h3>
              <p className="text-sm text-gray-400">
                {enabled 
                  ? 'Prices will sync across all selected chains automatically'
                  : 'Token will operate independently on each chain'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (canEnableCrossChain) {
                onToggle(!enabled);
              }
            }}
            disabled={!canEnableCrossChain}
            className={`relative w-16 h-8 rounded-full transition-colors ${
              enabled && canEnableCrossChain
                ? 'bg-primary-500'
                : canEnableCrossChain
                ? 'bg-gray-600'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            <motion.div
              className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
              animate={{ x: enabled && canEnableCrossChain ? 32 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* Status Messages */}
        {!isMultiChain && (
          <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-200 font-medium">
                Cross-chain sync requires multiple chains
              </p>
              <p className="text-xs text-yellow-300/80 mt-1">
                Select 2+ chains to enable automatic price synchronization across networks.
              </p>
            </div>
          </div>
        )}

        {enabled && isMultiChain && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-200 font-medium">
                Cross-chain sync enabled
              </p>
              <p className="text-xs text-green-300/80 mt-1">
                Your token will automatically sync prices across {selectedChains.length} chains. 
                A small 0.5% fee on DEX trades covers cross-chain messaging costs.
              </p>
            </div>
          </div>
        )}

        {/* Info Button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition"
        >
          <Info className="w-4 h-4" />
          <span>Learn more about cross-chain sync</span>
        </button>
      </div>

      {/* Expanded Info */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-6 bg-gray-800/30 rounded-xl border border-gray-700/50 space-y-4"
        >
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-400" />
            How Cross-Chain Sync Works
          </h4>
          
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-400 font-semibold text-xs">1</span>
              </div>
              <div>
                <p className="font-medium text-white">Automatic Price Sync</p>
                <p className="text-gray-400">
                  When someone buys your token on any chain, the price automatically updates on all other chains within 1-2 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-400 font-semibold text-xs">2</span>
              </div>
              <div>
                <p className="font-medium text-white">DEX Trade Detection</p>
                <p className="text-gray-400">
                  Works automatically with Uniswap, PancakeSwap, and other DEXs. No additional setup required.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-400 font-semibold text-xs">3</span>
              </div>
              <div>
                <p className="font-medium text-white">Low Cost</p>
                <p className="text-gray-400">
                  Only 0.5% fee on DEX trades covers all cross-chain messaging costs. Users pay the fee, not you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-400 font-semibold text-xs">4</span>
              </div>
              <div>
                <p className="font-medium text-white">Single Chain Option</p>
                <p className="text-gray-400">
                  If you only deploy on one chain, cross-chain features are automatically disabled. 
                  You can always add more chains later.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">Note:</strong> Cross-chain sync requires LayerZero infrastructure. 
              For single-chain deployments, standard tokens are used (no extra fees or setup required).
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}




