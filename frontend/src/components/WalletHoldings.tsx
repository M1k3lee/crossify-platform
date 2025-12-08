import { useState, useEffect, useMemo } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers, BrowserProvider } from 'ethers';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Loader2, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE } from '../config/api';
import { getPreferredEVMProvider } from '../services/blockchain';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Deployment {
  chain: string;
  tokenAddress: string;
  curveAddress?: string;
  status?: string;
}

interface WalletHoldingsProps {
  tokenId: string;
  deployments: Deployment[];
  tokenSymbol: string;
  currentPrice: number;
  onSell?: () => void;
}

interface ChainBalance {
  chain: string;
  balance: string;
  sellableValue: number | null;
  loading: boolean;
  error: string | null;
}

interface Transaction {
  type: 'buy' | 'sell';
  amount: string;
  price: number;
  createdAt: string;
}

export default function WalletHoldings({
  tokenId,
  deployments,
  tokenSymbol,
  currentPrice,
  onSell,
}: WalletHoldingsProps) {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [chainBalances, setChainBalances] = useState<Record<string, ChainBalance>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get RPC URL for the chain
  const getRpcUrl = (chainName: string): string => {
    const chainLower = chainName.toLowerCase().trim();
    
    // Handle Unichain Sepolia testnet (most specific first)
    if (chainLower === 'unichain-sepolia' || (chainLower.includes('unichain') && chainLower.includes('sepolia'))) {
      return 'https://sepolia.unichain.org';
    }
    if (chainLower === 'base-sepolia' || (chainLower.includes('base') && chainLower.includes('sepolia'))) {
      return 'https://base-sepolia-rpc.publicnode.com';
    }
    if (chainLower === 'bsc-testnet' || (chainLower.includes('bsc') && chainLower.includes('testnet'))) {
      return 'https://bsc-testnet.publicnode.com';
    }
    if (chainLower === 'hedera-testnet' || chainLower.includes('hedera')) {
      return 'https://testnet.hashio.io/api';
    }
    if (chainLower === 'sepolia' || (chainLower.includes('sepolia') && !chainLower.includes('base') && !chainLower.includes('unichain'))) {
      return 'https://ethereum-sepolia-rpc.publicnode.com';
    }
    if (chainLower === 'base') {
      return 'https://base-sepolia-rpc.publicnode.com';
    }
    if (chainLower === 'bsc' || chainLower === 'binance') {
      return 'https://bsc-testnet.publicnode.com';
    }
    if (chainLower === 'ethereum' || chainLower === 'eth') {
      return 'https://ethereum-sepolia-rpc.publicnode.com';
    }
    if (chainLower.includes('unichain')) {
      return 'https://sepolia.unichain.org';
    }
    return 'https://base-sepolia-rpc.publicnode.com';
  };

  // Chain name mapping for display
  const getChainDisplayName = (chain: string): string => {
    const chainLower = chain.toLowerCase();
    if (chainLower.includes('base-sepolia')) return 'Base Sepolia';
    if (chainLower.includes('bsc-testnet')) return 'BSC Testnet';
    if (chainLower.includes('unichain-sepolia')) return 'Unichain Sepolia';
    if (chainLower.includes('hedera-testnet')) return 'Hedera Testnet';
    if (chainLower.includes('sepolia') && !chainLower.includes('base') && !chainLower.includes('unichain')) return 'Sepolia';
    if (chainLower.includes('base')) return 'Base';
    if (chainLower.includes('bsc') || chainLower.includes('binance')) return 'BSC';
    if (chainLower.includes('hedera')) return 'Hedera';
    if (chainLower.includes('unichain')) return 'Unichain';
    return chain;
  };

  // Chain colors for UI
  const getChainColor = (chain: string): string => {
    const chainLower = chain.toLowerCase();
    if (chainLower.includes('base')) return '#0052FF';
    if (chainLower.includes('bsc') || chainLower.includes('binance')) return '#F3BA2F';
    if (chainLower.includes('unichain')) return '#FF007A';
    if (chainLower.includes('hedera')) return '#008CFF';
    if (chainLower.includes('sepolia') && !chainLower.includes('base') && !chainLower.includes('unichain')) return '#627EEA';
    return '#8B5CF6';
  };

  // Fetch balance for a single chain
  const fetchChainBalance = async (deployment: Deployment): Promise<ChainBalance> => {
    if (!deployment.tokenAddress || !deployment.chain) {
      return {
        chain: deployment.chain,
        balance: '0',
        sellableValue: null,
        loading: false,
        error: 'No token address',
      };
    }

    try {
      const rpcUrl = getRpcUrl(deployment.chain);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      const tokenABI = ['function balanceOf(address account) external view returns (uint256)'];
      const tokenContract = new ethers.Contract(deployment.tokenAddress, tokenABI, provider);
      
      const balanceWei = await tokenContract.balanceOf(address);
      const balanceFormatted = ethers.formatUnits(balanceWei, 18);
      
      let sellableValue: number | null = null;
      
      // Calculate sellable value if curve address exists
      if (deployment.curveAddress && parseFloat(balanceFormatted) > 0) {
        try {
          const bondingCurveABI = [
            'function getPriceForAmountLocal(uint256 tokenAmount) external view returns (uint256)',
            'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
          ];
          const curveContract = new ethers.Contract(deployment.curveAddress, bondingCurveABI, provider);
          
          const tokenAmountWei = balanceWei;
          let sellPriceWei: bigint | null = null;
          
          try {
            sellPriceWei = await curveContract.getPriceForAmountLocal(tokenAmountWei);
          } catch (err) {
            try {
              sellPriceWei = await curveContract.getPriceForAmount(tokenAmountWei);
            } catch (fallbackErr) {
              console.warn('Could not get sell price from bonding curve:', fallbackErr);
              sellPriceWei = null;
            }
          }
          
          if (sellPriceWei !== null) {
            const sellPriceEth = parseFloat(ethers.formatEther(sellPriceWei));
            sellableValue = sellPriceEth * 3000; // Convert to USD
          }
        } catch (curveErr) {
          console.warn('Error calculating sellable value:', curveErr);
        }
      }
      
      return {
        chain: deployment.chain,
        balance: balanceFormatted,
        sellableValue,
        loading: false,
        error: null,
      };
    } catch (error: any) {
      console.error(`Error fetching balance for ${deployment.chain}:`, error);
      return {
        chain: deployment.chain,
        balance: '0',
        sellableValue: null,
        loading: false,
        error: error.message || 'Failed to fetch',
      };
    }
  };

  // Fetch balances for all chains in parallel
  useEffect(() => {
    const fetchAllBalances = async () => {
      if (!isConnected || !address || !deployments || deployments.length === 0) {
        setChainBalances({});
        return;
      }

      // Filter out Solana (not EVM compatible)
      const evmDeployments = deployments.filter(
        (dep) => dep.chain && !dep.chain.toLowerCase().includes('solana')
      );

      // Initialize loading state for all chains
      const initialBalances: Record<string, ChainBalance> = {};
      evmDeployments.forEach((dep) => {
        initialBalances[dep.chain] = {
          chain: dep.chain,
          balance: '0',
          sellableValue: null,
          loading: true,
          error: null,
        };
      });
      setChainBalances(initialBalances);

      // Fetch all balances in parallel
      const balancePromises = evmDeployments.map((dep) => fetchChainBalance(dep));
      const balances = await Promise.all(balancePromises);

      // Update state with results
      const balancesMap: Record<string, ChainBalance> = {};
      balances.forEach((balance) => {
        balancesMap[balance.chain] = balance;
      });
      setChainBalances(balancesMap);
      setIsInitialLoading(false);
    };

    setIsInitialLoading(true);
    fetchAllBalances();
    // Refresh balances every 5 seconds
    const interval = setInterval(fetchAllBalances, 5000);
    return () => clearInterval(interval);
  }, [isConnected, address, deployments, tokenId]);

  // Fetch user transactions across all chains
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isConnected || !address || !tokenId) {
        setTransactions([]);
        return;
      }

      try {
        // Fetch transactions for all chains
        const chainPromises = deployments.map((dep) =>
          axios.get(`${API_BASE}/transactions`, {
            params: {
              tokenId,
              chain: dep.chain.toLowerCase(),
            },
          })
        );

        const responses = await Promise.all(chainPromises);
        const allTransactions: Transaction[] = [];

        responses.forEach((response) => {
          const userTxs = (response.data.transactions || []).filter(
            (tx: any) => tx.fromAddress?.toLowerCase() === address?.toLowerCase()
          ) as Transaction[];
          allTransactions.push(...userTxs);
        });

        // Sort by creation date (newest first)
        allTransactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address, tokenId, deployments]);

  // Calculate totals across all chains
  const totals = useMemo(() => {
    let totalBalance = 0;
    let totalValue = 0;
    let hasAnyBalance = false;

    Object.values(chainBalances).forEach((chainBalance) => {
      const balance = parseFloat(chainBalance.balance);
      totalBalance += balance;
      
      if (chainBalance.sellableValue !== null) {
        totalValue += chainBalance.sellableValue;
      } else {
        totalValue += balance * currentPrice;
      }
      
      if (balance > 0) {
        hasAnyBalance = true;
      }
    });

    return { totalBalance, totalValue, hasAnyBalance };
  }, [chainBalances, currentPrice]);

  // Calculate average cost and profit/loss from transactions
  const holdings = useMemo(() => {
    if (transactions.length === 0) {
      return {
        averageCost: 0,
        totalCost: 0,
        profit: 0,
        profitPercent: 0,
      };
    }

    let totalTokens = 0;
    let totalCostBasis = 0;

    for (const tx of transactions) {
      if (tx.type === 'buy') {
        const amount = parseFloat(tx.amount);
        totalTokens += amount;
        totalCostBasis += amount * tx.price;
      } else if (tx.type === 'sell') {
        const amount = parseFloat(tx.amount);
        if (totalTokens > 0) {
          const ratio = Math.min(amount / totalTokens, 1);
          totalTokens = Math.max(0, totalTokens - amount);
          totalCostBasis = totalCostBasis * (1 - ratio);
        }
      }
    }

    const avgCost = totalTokens > 0 ? totalCostBasis / totalTokens : 0;
    const costBasis = totals.totalBalance * avgCost;
    const profit = totals.totalValue - costBasis;
    const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

    return {
      averageCost: avgCost,
      totalCost: costBasis,
      profit,
      profitPercent,
    };
  }, [transactions, totals]);

  // Handle quick sell - switch to selected chain and open sell tab
  const handleQuickSell = (chain?: string) => {
    if (chain) {
      // Switch to the specific chain
      const newParams = new URLSearchParams(searchParams);
      newParams.set('chain', chain);
      navigate(`?${newParams.toString()}`, { replace: true });
      
      // Scroll and open sell tab
      setTimeout(() => {
        const buyWidget = document.querySelector('[data-buy-widget]');
        if (buyWidget) {
          buyWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const sellButton = document.querySelector('[data-sell-tab]') as HTMLButtonElement;
            if (sellButton) {
              sellButton.click();
            }
          }, 500);
        }
      }, 100);
    }
    
    if (onSell) {
      onSell();
    }
  };

  // Don't show if wallet is not connected
  if (!isConnected || !address) {
    return null;
  }

  // Check if we have any balances or transactions
  const hasAnyData = totals.hasAnyBalance || transactions.length > 0;
  const chainsWithBalance = Object.values(chainBalances).filter(
    (cb) => parseFloat(cb.balance) > 0
  );
  
  // Check if we're still loading balances
  const isLoadingAnyChain = Object.values(chainBalances).some((cb) => cb.loading);
  const hasAnyChainData = Object.keys(chainBalances).length > 0;

  // Don't hide while loading or if we have deployments to check
  if (!isInitialLoading && !hasAnyData && !isLoadingAnyChain && !hasAnyChainData) {
    return null;
  }

  const { averageCost, totalCost, profit, profitPercent } = holdings;
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
            <p className="text-sm text-gray-400">Across all chains</p>
          </div>
        </div>
        {(Object.keys(chainBalances).length > 0 || isLoadingAnyChain) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white transition flex items-center gap-1 text-sm"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All
              </>
            )}
          </button>
        )}
      </div>

      {/* Total Balance - Always Visible */}
      <div className="space-y-4">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Balance</span>
            <Globe className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            {(isInitialLoading || isLoadingAnyChain) && Object.keys(chainBalances).length === 0 ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                <span className="text-lg text-gray-400">Loading balances...</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-white">
                {totals.totalBalance.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{' '}
                {tokenSymbol}
              </span>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Value</span>
              <span className="text-lg font-semibold text-white">
                ${totals.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Chain Breakdown - Expandable */}
        {expanded && Object.keys(chainBalances).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-2">Breakdown by Chain</p>
            {Object.values(chainBalances)
              .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)) // Sort by balance, highest first
              .map((chainBalance) => {
                const chainColor = getChainColor(chainBalance.chain);
                const displayName = getChainDisplayName(chainBalance.chain);
                const balance = parseFloat(chainBalance.balance);
                const value = chainBalance.sellableValue !== null 
                  ? chainBalance.sellableValue 
                  : balance * currentPrice;
                const hasBalance = balance > 0;

                return (
                  <div
                    key={chainBalance.chain}
                    className={`bg-gray-900/30 rounded-lg p-3 border transition ${
                      hasBalance 
                        ? 'border-gray-700/30 hover:border-gray-600/50' 
                        : 'border-gray-800/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chainColor }}
                        />
                        <span className="text-sm font-medium text-white">{displayName}</span>
                        {chainBalance.loading && (
                          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        )}
                        {chainBalance.error && (
                          <span className="text-xs text-red-400">Error</span>
                        )}
                      </div>
                      <div className="text-right">
                        {chainBalance.loading ? (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading...
                          </div>
                        ) : (
                          <>
                            <div className={`text-sm font-semibold ${hasBalance ? 'text-white' : 'text-gray-500'}`}>
                              {balance.toLocaleString(undefined, {
                                maximumFractionDigits: 4,
                              })}{' '}
                              {tokenSymbol}
                            </div>
                            <div className="text-xs text-gray-400">
                              ${value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {hasBalance && !chainBalance.loading && (
                      <button
                        onClick={() => handleQuickSell(chainBalance.chain)}
                        className="mt-2 w-full text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition flex items-center justify-center gap-1"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        Trade on {displayName}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Profit/Loss Section */}
        {transactions.length > 0 && averageCost > 0 && (
          <div className="pt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Avg. Cost</span>
              <span className="text-sm text-gray-300">
                ${averageCost.toLocaleString(undefined, {
                  minimumFractionDigits: 6,
                  maximumFractionDigits: 6,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Cost Basis</span>
              <span className="text-sm text-gray-300">
                ${totalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-end mt-1">
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
        )}

        {/* Quick Sell Button */}
        {totals.hasAnyBalance && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickSell()}
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
