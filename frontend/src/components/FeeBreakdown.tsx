import { useState, useEffect } from 'react';
import { AlertCircle, Info, Zap, DollarSign } from 'lucide-react';
import { ethers } from 'ethers';

interface FeeBreakdownProps {
  chains: string[];
  buyFeePercent: string;
  sellFeePercent: string;
  basePrice: string;
  initialSupply: string;
  crossChainEnabled?: boolean;
  onGasEstimate?: (estimates: Record<string, string>) => void;
}

export default function FeeBreakdown({
  chains,
  buyFeePercent,
  sellFeePercent,
  basePrice,
  initialSupply,
  crossChainEnabled = false,
  onGasEstimate,
}: FeeBreakdownProps) {
  const [gasEstimates, setGasEstimates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Platform fee calculation
  // Platform fee is a small fixed amount (0.1 ETH) or 2% of a reasonable initial purchase
  // For bonding curves, we use a fixed fee to avoid charging based on total theoretical supply
  const calculatePlatformFee = () => {
    if (!basePrice || !initialSupply) return '0';
    try {
      const basePriceNum = parseFloat(basePrice);
      const supplyNum = parseFloat(initialSupply);
      
      if (isNaN(basePriceNum) || isNaN(supplyNum) || basePriceNum <= 0 || supplyNum <= 0) {
        return '0';
      }
      
      // Fixed platform fee: Competitive pricing strategy
      // For testnet: FREE (0 ETH) - encourage testing
      // For mainnet: 0.01 ETH (~$30-35) - competitive with pump.fun alternatives
      // This is much more reasonable than 2% of total theoretical supply
      const isTestnet = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('testnet') ||
                       import.meta.env.MODE === 'development';
      const fixedFee = isTestnet ? 0 : 0.01; // FREE for testnet, 0.01 ETH for mainnet
      
      // Alternative: 2% of initial purchase value (if someone buys 1% of supply)
      // const initialPurchasePercent = 0.01; // 1% of supply
      // const initialPurchaseAmount = supplyNum * initialPurchasePercent;
      // const initialPurchaseValue = basePriceNum * initialPurchaseAmount;
      // const percentageFee = initialPurchaseValue * 0.02;
      // const platformFee = Math.min(fixedFee, percentageFee);
      
      return fixedFee.toFixed(6);
    } catch {
      return '0';
    }
  };

  const platformFee = calculatePlatformFee();

  // Estimate gas for each selected chain
  useEffect(() => {
    const estimateGas = async () => {
      if (chains.length === 0) {
        setGasEstimates({});
        return;
      }
      
      setLoading(true);
      const estimates: Record<string, string> = {};

      try {
        for (const chain of chains) {
          if (chain === 'solana') {
            // Solana estimation (simplified)
            estimates[chain] = '~0.01 SOL';
          } else if (window.ethereum) {
            try {
              // Get current gas price for this chain
              const provider = new ethers.BrowserProvider(window.ethereum);
              const feeData = await provider.getFeeData();
              
              if (feeData.gasPrice) {
                // Estimate ~500k-800k gas for deployment (typical for token + bonding curve + factory)
                // Using conservative estimate
                const estimatedGas = BigInt(700000);
                const gasCost = feeData.gasPrice * estimatedGas;
                const formatted = ethers.formatEther(gasCost);
                const value = parseFloat(formatted);
                
                // Format based on chain
                if (chain === 'ethereum' || chain === 'base') {
                  estimates[chain] = `~${value.toFixed(6)} ETH`;
                } else {
                  estimates[chain] = `~${value.toFixed(6)} BNB`;
                }
              } else {
                estimates[chain] = chain === 'bsc' ? '~0.001 BNB' : '~0.001 ETH';
              }
            } catch (e) {
              // Fallback estimate
              estimates[chain] = chain === 'bsc' ? '~0.001 BNB' : '~0.001 ETH';
            }
          } else {
            // Fallback if no wallet
            estimates[chain] = chain === 'bsc' ? '~0.001 BNB' : '~0.001 ETH';
          }
        }
        
        setGasEstimates(estimates);
        if (onGasEstimate) {
          onGasEstimate(estimates);
        }
      } catch (error) {
        console.error('Gas estimation error:', error);
        // Set fallback estimates
        chains.forEach(chain => {
          if (chain !== 'solana') {
            estimates[chain] = chain === 'bsc' ? '~0.001 BNB' : '~0.001 ETH';
          } else {
            estimates[chain] = '~0.01 SOL';
          }
        });
        setGasEstimates(estimates);
      } finally {
        setLoading(false);
      }
    };

    estimateGas();
  }, [chains, onGasEstimate]);

  const totalGasCost = Object.entries(gasEstimates).reduce((sum, [chain, cost]) => {
    // Skip Solana for now (different currency)
    if (chain === 'solana') return sum;
    
    const match = cost.match(/[\d.]+/);
    if (match) {
      const value = parseFloat(match[0]);
      // Convert BNB to ETH equivalent for display (rough estimate)
      if (chain === 'bsc') {
        return sum + (value * 0.3); // Rough BNB to ETH conversion
      }
      return sum + value;
    }
    return sum;
  }, 0);

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-white">Fee Breakdown</h3>
      </div>

      <div className="space-y-4">
        {/* Platform Fees */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Platform Fee (One-time)</span>
            <span className="text-sm font-semibold text-primary-400">
              {platformFee} ETH
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {parseFloat(platformFee) === 0 
              ? 'FREE on testnet (no platform fee)' 
              : 'Fixed platform fee (0.01 ETH per token deployment)'}
          </p>
        </div>

        {/* Trading Fees */}
        {(buyFeePercent !== '0' || sellFeePercent !== '0' || crossChainEnabled) && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Trading Fees (per transaction)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {buyFeePercent !== '0' && (
                <div>
                  <span className="text-xs text-gray-500">Buy Fee:</span>
                  <span className="text-xs font-medium text-gray-300 ml-2">
                    {buyFeePercent}%
                  </span>
                </div>
              )}
              {sellFeePercent !== '0' && (
                <div>
                  <span className="text-xs text-gray-500">Sell Fee:</span>
                  <span className="text-xs font-medium text-gray-300 ml-2">
                    {sellFeePercent}%
                  </span>
                </div>
              )}
              {crossChainEnabled && chains.length > 1 && (
                <div className="col-span-2 mt-2 pt-2 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Cross-Chain Sync Fee:</span>
                    <span className="text-xs font-medium text-primary-400">
                      0.5% (on DEX trades)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Automatically collected on DEX trades to cover LayerZero messaging costs
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Gas Fees */}
        <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-lg p-4 border border-primary-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-200">Network Gas Fees (per chain)</span>
            {loading && (
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          
              {chains.length === 0 ? (
                <p className="text-xs text-gray-500">Select chains to see gas estimates</p>
              ) : (
                <div className="space-y-2">
                  {chains.map((chain) => (
                    <div key={chain} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 capitalize">{chain}</span>
                      <span className="font-medium text-gray-200">
                        {gasEstimates[chain] || (loading ? 'Estimating...' : (chain === 'bsc' ? '~0.001 BNB' : chain === 'solana' ? '~0.01 SOL' : '~0.001 ETH'))}
                      </span>
                    </div>
                  ))}
                  {chains.length > 1 && chains.filter(c => c !== 'solana').length > 1 && (
                    <div className="pt-2 mt-2 border-t border-gray-700/50 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-200">Total Gas Cost (EVM chains)</span>
                      <span className="text-sm font-semibold text-primary-400">
                        ~{totalGasCost.toFixed(6)} ETH equivalent
                      </span>
                    </div>
                  )}
                </div>
              )}
        </div>

        {/* Total Estimated Cost */}
        <div className="bg-gradient-to-r from-primary-600/30 to-blue-600/30 rounded-lg p-4 border-2 border-primary-500/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Total Estimated Cost</span>
            <span className="text-lg font-bold text-primary-300">
              ~{(parseFloat(platformFee || '0') + totalGasCost).toFixed(6)} ETH
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Platform fee + gas costs for {chains.length} chain{chains.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Gas fees are estimates and may vary based on network congestion. 
            Platform fees are paid once during token creation.
          </p>
        </div>
      </div>
    </div>
  );
}

