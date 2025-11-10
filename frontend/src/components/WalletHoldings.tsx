import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE } from '../config/api';
import toast from 'react-hot-toast';

interface WalletHoldingsProps {
  tokenId: string;
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice: number;
  curveAddress: string; // Kept for future use, but currently unused
  onSell?: () => void;
}

interface Transaction {
  type: 'buy' | 'sell';
  amount: string;
  price: number;
  createdAt: string;
}

export default function WalletHoldings({
  tokenId,
  chain,
  tokenAddress,
  tokenSymbol,
  currentPrice,
  curveAddress: _curveAddress, // Prefix with underscore to indicate intentionally unused
  onSell,
}: WalletHoldingsProps) {
  const { isConnected, address } = useAccount();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Get RPC URL for the chain
  const getRpcUrl = (chainName: string): string => {
    const chainLower = chainName.toLowerCase().trim();
    
    if (chainLower === 'base-sepolia' || (chainLower.includes('base') && chainLower.includes('sepolia'))) {
      return 'https://sepolia.base.org';
    }
    if (chainLower === 'bsc-testnet' || (chainLower.includes('bsc') && chainLower.includes('testnet'))) {
      return 'https://data-seed-prebsc-1-s1.binance.org:8545';
    }
    if (chainLower === 'sepolia' || chainLower.includes('sepolia')) {
      return 'https://rpc.sepolia.org';
    }
    if (chainLower === 'base') {
      return 'https://sepolia.base.org';
    }
    if (chainLower === 'bsc' || chainLower === 'binance') {
      return 'https://data-seed-prebsc-1-s1.binance.org:8545';
    }
    if (chainLower === 'ethereum' || chainLower === 'eth') {
      return 'https://rpc.sepolia.org';
    }
    return 'https://sepolia.base.org';
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !address || !tokenAddress) {
        setBalance('0');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const rpcUrl = getRpcUrl(chain);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        const tokenABI = ['function balanceOf(address account) external view returns (uint256)'];
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
        
        const balanceWei = await tokenContract.balanceOf(address);
        const balanceFormatted = ethers.formatUnits(balanceWei, 18);
        setBalance(balanceFormatted);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [isConnected, address, tokenAddress, chain]);

  // Fetch user transactions for this token
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isConnected || !address || !tokenId) {
        setTransactions([]);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/transactions`, {
          params: {
            tokenId,
            chain: chain.toLowerCase(),
          },
        });

        // Filter transactions for this user's address
        // For buys: fromAddress = user (sending native token)
        // For sells: fromAddress = user (sending tokens)
        // So we only need to check fromAddress
        const userTxs = (response.data.transactions || []).filter(
          (tx: any) => tx.fromAddress?.toLowerCase() === address?.toLowerCase()
        ) as Transaction[];

        setTransactions(userTxs);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      }
    };

    fetchTransactions();
    // Refresh transactions every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address, tokenId, chain]);

  // Calculate average cost and profit/loss
  const holdings = useMemo(() => {
    // If no transactions, return zeros
    if (transactions.length === 0) {
      return {
        averageCost: 0,
        totalCost: 0,
        currentValue: 0,
        profit: 0,
        profitPercent: 0,
      };
    }

    let totalTokens = 0;
    let totalCostBasis = 0;

    // Calculate cost basis from buy transactions
    for (const tx of transactions) {
      if (tx.type === 'buy') {
        const amount = parseFloat(tx.amount);
        totalTokens += amount;
        totalCostBasis += amount * tx.price;
      } else if (tx.type === 'sell') {
        // For sells, reduce tokens using FIFO
        const amount = parseFloat(tx.amount);
        if (totalTokens > 0) {
          const ratio = Math.min(amount / totalTokens, 1);
          totalTokens = Math.max(0, totalTokens - amount);
          totalCostBasis = totalCostBasis * (1 - ratio);
        }
      }
    }

    // Calculate average cost per token
    const avgCost = totalTokens > 0 ? totalCostBasis / totalTokens : 0;
    const currentValue = parseFloat(balance) * currentPrice;
    const costBasis = parseFloat(balance) * avgCost;
    const profit = currentValue - costBasis;
    const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

    return {
      averageCost: avgCost,
      totalCost: costBasis,
      currentValue,
      profit,
      profitPercent,
    };
  }, [transactions, balance, currentPrice]);

  // Handle quick sell
  const handleQuickSell = () => {
    if (parseFloat(balance) === 0) {
      toast.error('No tokens to sell');
      return;
    }
    // Trigger sell in parent component
    if (onSell) {
      onSell();
    }
  };

  // Don't show if wallet is not connected
  if (!isConnected || !address) {
    return null;
  }

  // Show if user has balance OR has transactions (even if balance is 0 now)
  const hasBalance = parseFloat(balance) > 0;
  const hasTransactions = transactions.length > 0;
  
  if (!hasBalance && !hasTransactions) {
    return null;
  }

  const { averageCost, totalCost, currentValue, profit, profitPercent } = holdings;
  const hasProfit = profit >= 0;
  const ProfitIcon = hasProfit ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Your Holdings</h3>
            <p className="text-sm text-gray-400">On {chain}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Balance */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance</span>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <span className="text-xl font-bold text-white">
              {parseFloat(balance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{' '}
              {tokenSymbol}
            </span>
          )}
        </div>

        {/* Current Value */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Current Value</span>
          <span className="text-lg font-semibold text-white">
            ${currentValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Average Cost (if we have transactions) */}
        {transactions.length > 0 && averageCost > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg. Cost</span>
              <span className="text-sm text-gray-300">
                ${averageCost.toLocaleString(undefined, {
                  minimumFractionDigits: 6,
                  maximumFractionDigits: 6,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Cost Basis</span>
              <span className="text-sm text-gray-300">
                ${totalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Profit/Loss */}
            <div className="pt-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Profit/Loss</span>
                <div className="flex items-center gap-2">
                  <ProfitIcon
                    className={`w-5 h-5 ${
                      hasProfit ? 'text-green-400' : 'text-red-400'
                    }`}
                  />
                  <span
                    className={`text-lg font-bold ${
                      hasProfit ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {hasProfit ? '+' : ''}
                    ${profit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <span
                  className={`text-sm font-semibold ${
                    hasProfit ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {hasProfit ? '+' : ''}
                  {profitPercent.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  %
                </span>
              </div>
            </div>
          </>
        )}

        {/* Quick Sell Button */}
        {parseFloat(balance) > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuickSell}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Sell {tokenSymbol}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

