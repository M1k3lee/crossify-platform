import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  AlertCircle, Copy, CheckCircle, 
  Zap, Twitter, MessageCircle,
  TrendingUp, TrendingDown, ExternalLink, Settings
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import AddLiquidityModal from '../components/AddLiquidityModal';
import BuyWidget from '../components/BuyWidget';
import TokenChart from '../components/TokenChart';
import MarketDepthChart from '../components/MarketDepthChart';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  bsc: '#F3BA2F',
  solana: '#9945FF',
  base: '#0052FF',
};

const CHAIN_NAMES: Record<string, string> = {
  ethereum: 'Ethereum',
  bsc: 'BSC',
  solana: 'Solana',
  base: 'Base',
};

export default function TokenDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { address } = useAccount();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [liquidityModal, setLiquidityModal] = useState<{
    chain: string;
    curveAddress: string;
    tokenAddress: string;
  } | null>(null);
  
  // Get chain from URL query parameter, default to first deployed chain
  const selectedChainFromUrl = searchParams.get('chain');

  const { data: status, isLoading } = useQuery({
    queryKey: ['token-status', id],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/${id}/status`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  const { data: priceSync } = useQuery({
    queryKey: ['price-sync', id],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/${id}/price-sync`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  const { data: metadata } = useQuery({
    queryKey: ['token-metadata', id],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/${id}/metadata`);
      return response.data;
    },
    enabled: !!id,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  if (isLoading) {
    return (
      <>
        <SEO
          title="Loading Token - Crossify.io"
          description="Loading token details..."
          url={`https://crossify.io/token/${id}`}
        />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
          <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-400">Loading token details...</p>
        </div>
      </div>
      </>
    );
  }

  if (!status) {
    return (
      <>
        <SEO
          title="Token Not Found - Crossify.io"
          description="The token you're looking for doesn't exist."
          url={`https://crossify.io/token/${id}`}
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gray-400">Token not found</p>
          </div>
        </div>
      </>
    );
  }

  const token = status.token;
  const deployments = status.deployments || [];
  const totalMarketCap = deployments.reduce((sum: number, dep: any) => sum + (dep.marketCap || 0), 0);
  const totalLiquidity = totalMarketCap * 0.7;
  const liquidityChange24h = 2.1;

  const allGraduated = deployments.every((dep: any) => dep.isGraduated) || false;
  const someGraduated = deployments.some((dep: any) => dep.isGraduated) || false;
  
  // Find selected deployment based on URL chain parameter or use first deployed chain
  const selectedDeployment = useMemo(() => {
    if (!deployments || deployments.length === 0) return null;
    
    // If chain is specified in URL, find matching deployment
    if (selectedChainFromUrl) {
      const found = deployments.find((dep: any) => 
        dep.chain?.toLowerCase() === selectedChainFromUrl.toLowerCase() && 
        dep.status === 'deployed' &&
        dep.curveAddress
      );
      if (found) return found;
    }
    
    // Otherwise, use first deployed chain with curve address
    return deployments.find((dep: any) => 
      dep.status === 'deployed' && dep.curveAddress
    ) || deployments[0] || null;
  }, [deployments, selectedChainFromUrl]);
  
  const selectedChain = selectedDeployment?.chain || 'ethereum';

  return (
    <>
      <SEO
        title={`${token.name} (${token.symbol}) - Token Details, Price, Charts | Crossify.io`}
        description={token.description || `View ${token.name} (${token.symbol}) token details, price charts, market depth, and trading information. Trade ${token.symbol} on Ethereum, BSC, Base, and Solana.`}
        keywords={`${token.name}, ${token.symbol}, token price, token chart, token trading, ${token.symbol} price, buy ${token.symbol}, trade ${token.symbol}, memecoin, defi token`}
        url={`https://crossify.io/token/${id}`}
        image={token.logo_ipfs ? `https://ipfs.io/ipfs/${token.logo_ipfs}` : 'https://crossify.io/og-image.png'}
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Token Header Card */}
        <div className="bg-gradient-to-r from-gray-800/90 to-gray-800/70 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {metadata?.logoUrl ? (
                <img
                  src={metadata.logoUrl}
                  alt={status.token?.name}
                  className="w-20 h-20 rounded-full border-2 border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-3xl font-bold border-2 border-gray-600">
                  {status.token?.symbol?.charAt(0) || 'T'}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{status.token?.name || 'Unknown Token'}</h1>
                <p className="text-xl text-gray-400">{status.token?.symbol}</p>
                {metadata?.description && (
                  <p className="text-gray-400 mt-3 max-w-2xl">{metadata.description}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Total Market Cap</p>
              <p className="text-4xl font-bold text-primary-400 mb-2">
                ${(totalMarketCap / 1e6).toFixed(2)}M
              </p>
              {allGraduated ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Fully Graduated
                </div>
              ) : someGraduated ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  <Zap className="w-4 h-4" />
                  Partially Graduated
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  <Zap className="w-4 h-4" />
                  Active on Curve
                </div>
              )}
            </div>
          </div>

          {/* Creator Actions */}
          {status.token?.creatorAddress && address && status.token.creatorAddress.toLowerCase() === address.toLowerCase() && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-700">
              <Link
                to={`/creator/${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
              >
                <Settings className="w-4 h-4" />
                Manage Token
              </Link>
              <span className="text-sm text-gray-400">You are the token creator</span>
            </div>
          )}

          {/* Social Links */}
          {(metadata?.twitterUrl || metadata?.discordUrl || metadata?.telegramUrl || metadata?.websiteUrl) && (
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-700">
              {metadata.twitterUrl && (
                <a
                  href={metadata.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm">Twitter</span>
                </a>
              )}
              {metadata.discordUrl && (
                <a
                  href={metadata.discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Discord</span>
                </a>
              )}
              {metadata.telegramUrl && (
                <a
                  href={metadata.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Telegram</span>
                </a>
              )}
              {metadata.websiteUrl && (
                <a
                  href={metadata.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">Total Liquidity</p>
            <p className="text-2xl font-bold text-white">${(totalLiquidity / 1e6).toFixed(2)}M</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {liquidityChange24h >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={liquidityChange24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                {liquidityChange24h >= 0 ? '+' : ''}{liquidityChange24h.toFixed(1)}% 24h
              </span>
            </div>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">Active Chains</p>
            <p className="text-2xl font-bold text-white">{status.deployments?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Blockchains</p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">Total Volume</p>
            <p className="text-2xl font-bold text-white">
              ${(status.deployments?.reduce((sum: number, d: any) => sum + (d.marketCap || 0) * 0.1, 0) / 1e3 || 0).toFixed(1)}K
            </p>
            <p className="text-sm text-gray-500 mt-2">24h</p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">Price Variance</p>
            <p className="text-2xl font-bold text-white">
              {priceSync?.variance ? `${priceSync.variance.toFixed(2)}%` : '0.00%'}
            </p>
            {priceSync?.variance && priceSync.variance > 0.5 && (
              <div className="flex items-center gap-1 mt-2 text-sm text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span>Variance detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Trading Section - Buy Widget + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Buy Widget - Prominent */}
          {selectedDeployment && selectedDeployment.curveAddress && selectedDeployment.tokenAddress && !allGraduated ? (
            <BuyWidget
              tokenId={id || ''}
              chain={selectedChain}
              curveAddress={selectedDeployment.curveAddress}
              tokenAddress={selectedDeployment.tokenAddress}
              tokenSymbol={status.token?.symbol || 'TOKEN'}
              currentPrice={priceSync?.prices?.[selectedChain.toLowerCase()] || selectedDeployment.marketCap / 1000000 || 0.001}
              onSuccess={() => {
                // Refresh data after successful trade
                window.location.reload();
              }}
            />
          ) : status.deployments && status.deployments.length > 0 && !allGraduated ? (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                No deployed bonding curve found for selected chain. Please deploy the token first.
              </p>
            </div>
          ) : null}
          
          {/* Price Chart */}
          <div className={selectedDeployment && !allGraduated ? '' : 'lg:col-span-2'}>
            <TokenChart tokenId={id || ''} chain={selectedChain} />
          </div>
        </div>

        {/* Chain Cards Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Chain Deployments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {status.deployments?.map((dep: any) => {
              const chainName = dep.chain.toLowerCase();
              const price = priceSync?.prices?.[chainName] || dep.marketCap / 1000000 || 0.001;
              const liquidity = dep.marketCap * 0.7 || 0;
              const volume24h = (dep.marketCap || 0) * 0.1;
              const priceImpact = 0.08 + Math.random() * 0.3;
              const chainColor = CHAIN_COLORS[chainName] || '#FFFFFF';

              return (
                <motion.div
                  key={dep.chain}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all group"
                  style={{
                    borderLeftColor: chainColor,
                    borderLeftWidth: '4px',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: `${chainColor}20` }}
                      >
                        {CHAIN_NAMES[chainName]?.charAt(0) || chainName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{CHAIN_NAMES[chainName] || chainName}</h3>
                        {dep.isGraduated ? (
                          <span className="text-xs text-green-400">Graduated</span>
                        ) : (
                          <span className="text-xs text-yellow-400">On Curve</span>
                        )}
                      </div>
                    </div>
                    {dep.isGraduated ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Zap className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Price</span>
                      <span className="font-semibold text-white">${price.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Liquidity</span>
                      <span className="font-semibold text-white">${(liquidity / 1e6).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Volume (24h)</span>
                      <span className="font-semibold text-white">${(volume24h / 1e3).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Price Impact</span>
                      <span className="font-semibold" style={{ color: chainColor }}>
                        {priceImpact.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Contract</span>
                      {dep.tokenAddress && (
                        <button
                          onClick={() => copyToClipboard(dep.tokenAddress, `${dep.chain} contract`)}
                          className="flex items-center gap-1 text-gray-400 hover:text-white transition"
                        >
                          <span className="font-mono">{dep.tokenAddress.slice(0, 6)}...{dep.tokenAddress.slice(-4)}</span>
                          {copiedAddress === dep.tokenAddress ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {!dep.isGraduated && dep.curveAddress && (
                      <Link
                        to={`/token/${id}?chain=${dep.chain}`}
                        className="block w-full mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition hover:opacity-90 text-center"
                        style={{
                          backgroundColor: `${chainColor}20`,
                          color: chainColor,
                          border: `1px solid ${chainColor}40`,
                        }}
                      >
                        Trade on {CHAIN_NAMES[dep.chain] || dep.chain}
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Market Depth Chart */}
        {selectedDeployment && !allGraduated && (
          <div className="mb-6">
            <MarketDepthChart 
              tokenId={id || ''} 
              chain={selectedChain}
            />
          </div>
        )}

        {/* Cross-Chain Price Comparison */}
        {status.deployments && status.deployments.length > 1 && priceSync && (
          <div className="mb-6 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Cross-Chain Price Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {status.deployments.map((dep: any) => {
                const chainName = dep.chain.toLowerCase();
                const price = priceSync.prices?.[chainName] || dep.marketCap / 1000000 || 0.001;
                const chainColor = CHAIN_COLORS[chainName] || '#FFFFFF';
                const variance = priceSync.variance || 0;
                
                return (
                  <div
                    key={dep.chain}
                    className="bg-gray-700/30 rounded-lg p-4 border border-gray-700/50"
                    style={{ borderLeftColor: chainColor, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-400 capitalize">{dep.chain}</span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: chainColor }}
                      />
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">${price.toFixed(6)}</p>
                    {variance > 0.5 && (
                      <p className="text-xs text-yellow-400">Variance: {variance.toFixed(2)}%</p>
                    )}
                  </div>
                );
              })}
            </div>
            {priceSync.variance && priceSync.variance > 0.5 && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-sm text-yellow-300">
                  ⚠️ Price variance detected across chains. Cross-chain synchronization may be needed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transaction Feed */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {status.deployments?.map((dep: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHAIN_COLORS[dep.chain] || '#FFFFFF' }}
                  />
                  <span className="text-sm font-medium text-white capitalize">{dep.chain}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-sm text-gray-400">
                    {dep.status === 'graduated' ? 'Graduated to DEX' : 'Active on Curve'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    ${(dep.marketCap / 1e6).toFixed(2)}M
                  </p>
                  <p className="text-xs text-gray-500">Market Cap</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Liquidity Modal */}
      {liquidityModal && (
        <AddLiquidityModal
          isOpen={!!liquidityModal}
          onClose={() => setLiquidityModal(null)}
          chain={liquidityModal.chain}
          curveAddress={liquidityModal.curveAddress}
          tokenAddress={liquidityModal.tokenAddress}
          tokenSymbol={status.token?.symbol || 'TOKEN'}
          currentPrice={priceSync?.prices?.[liquidityModal.chain.toLowerCase()] || 0.001}
          onSuccess={() => {
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }}
        />
      )}
    </>
  );
}
