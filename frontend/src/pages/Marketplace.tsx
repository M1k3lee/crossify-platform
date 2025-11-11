import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Network, Globe, Layers, Sparkles, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

// Helper to construct image URL from filename or CID
const getImageUrl = (imageId: string | null | undefined): string | null => {
  if (!imageId) return null;
  if (imageId.startsWith('http')) return imageId;
  if (imageId.startsWith('mock_')) return null; // Mock CIDs don't work
  // It's a filename, construct API URL
  return `${API_BASE.replace('/api', '')}/upload/file/${imageId}`;
};

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    chains: [] as string[],
    status: [] as string[],
    crossChain: false,
    verified: false,
  });

  const { data: marketplace, isLoading } = useQuery({
    queryKey: ['marketplace', filters],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/tokens/marketplace`);
      return response.data;
    },
  });

  const tokens = marketplace?.tokens || [];
  
  // Debug logging
  if (tokens.length === 0 && !isLoading) {
    console.log('⚠️ Marketplace: No tokens found. Response:', marketplace);
  }

  const filteredTokens = tokens.filter((token: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !token.name?.toLowerCase().includes(query) &&
        !token.symbol?.toLowerCase().includes(query) &&
        !token.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Chain filter
    if (filters.chains.length > 0) {
      const tokenChains = token.deployments?.map((d: any) => d.chain) || [];
      if (!filters.chains.some((chain) => tokenChains.includes(chain))) {
        return false;
      }
    }

    // Cross-chain filter
    if (filters.crossChain && !token.crossChainEnabled) {
      return false;
    }

    // Verified filter
    if (filters.verified && !token.verified) {
      return false;
    }

    return true;
  });

  const CHAIN_COLORS: Record<string, string> = {
    ethereum: '#627EEA',
    bsc: '#F3BA2F',
    solana: '#9945FF',
    base: '#0052FF',
  };

  return (
    <>
      <SEO
        title="Token Marketplace - Discover and Trade Tokens | Crossify.io"
        description="Browse and discover tokens launched on Crossify. Find the latest memecoins and tokens across Ethereum, BSC, Base, and Solana. Buy, sell, and trade tokens with cross-chain price synchronization."
        keywords="token marketplace, memecoin marketplace, buy tokens, trade tokens, token discovery, crypto tokens, defi tokens, ethereum tokens, solana tokens, BSC tokens, base tokens, token trading, cross-chain tokens"
        url="https://crossify.io/marketplace"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                Cross-Chain Token Marketplace
              </h1>
              <p className="text-gray-400">Discover tokens deployed across multiple chains with synchronized pricing</p>
            </div>
          </div>
        </motion.div>

        {/* Cross-Chain Highlight Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-primary-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-primary-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <Network className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Cross-Chain Price Synchronization</h3>
                <p className="text-sm text-gray-300">
                  Tokens with <span className="text-primary-400 font-semibold">cross-chain sync enabled</span> maintain 
                  consistent pricing across all chains. Buy on any chain, price updates everywhere instantly via LayerZero.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                  <span className="text-green-400 text-sm font-semibold">Powered by LayerZero</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tokens by name, symbol, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-700 rounded-xl text-white transition flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Chain Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Chains</label>
                <div className="flex flex-wrap gap-2">
                  {['ethereum', 'bsc', 'base', 'solana'].map((chain) => (
                    <label
                      key={chain}
                      className={`flex items-center px-3 py-1.5 rounded cursor-pointer transition ${
                        filters.chains.includes(chain)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.chains.includes(chain)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              chains: [...prev.chains, chain]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              chains: prev.chains.filter(c => c !== chain)
                            }));
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-sm capitalize">{chain}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cross-Chain Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Features</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={filters.crossChain}
                      onChange={(e) => setFilters(prev => ({ ...prev, crossChain: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-300">Cross-Chain Sync Only</span>
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">Verified Tokens Only</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ chains: [], status: [], crossChain: false, verified: false })}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-semibold">{filteredTokens.length}</span> token{filteredTokens.length !== 1 ? 's' : ''}
            {filters.crossChain && ' with cross-chain sync'}
            {filters.verified && ' (verified only)'}
          </p>
        </div>

        {/* Tokens Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-gray-400">Loading tokens...</p>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No tokens found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTokens.map((token: any, idx: number) => {
              const deployments = token.deployments || [];
              const totalMarketCap = deployments.reduce((sum: number, d: any) => sum + (d.marketCap || 0), 0);
              const crossChainEnabled = token.crossChainEnabled;

              return (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/20"
                >
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    {token.verified && (
                      <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400 font-semibold">Verified</span>
                        </div>
                      </div>
                    )}
                    {crossChainEnabled && (
                      <div className="px-2 py-1 bg-primary-500/20 border border-primary-500/50 rounded-full">
                        <div className="flex items-center gap-1">
                          <Network className="w-3 h-3 text-primary-400" />
                          <span className="text-xs text-primary-400 font-semibold">Cross-Chain</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to={`/token/${token.id}`}>
                    <div className="flex items-start gap-4 mb-4">
                      {(() => {
                        // Construct logo URL - check logoUrl first, then logoIpfs
                        const logoUrl = token.logoUrl || getImageUrl(token.logoIpfs);
                        return logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={token.name}
                            className="w-16 h-16 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                            {token.symbol?.charAt(0) || 'T'}
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-white truncate">{token.name}</h3>
                          {token.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" title="Verified Token" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{token.symbol}</p>
                      </div>
                    </div>

                    {token.description && (
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{token.description}</p>
                    )}

                    {/* Deployed Chains */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Deployed on:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {deployments.map((dep: any) => (
                          <div
                            key={dep.chain}
                            className="px-2 py-1 rounded text-xs font-medium capitalize"
                            style={{
                              backgroundColor: `${CHAIN_COLORS[dep.chain] || '#666'}20`,
                              color: CHAIN_COLORS[dep.chain] || '#fff',
                              border: `1px solid ${CHAIN_COLORS[dep.chain] || '#666'}50`,
                            }}
                          >
                            {dep.chain}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Market Cap</p>
                        <p className="text-lg font-semibold text-white">
                          ${(totalMarketCap / 1e6).toFixed(2)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Chains</p>
                        <p className="text-lg font-semibold text-white">{deployments.length}</p>
                      </div>
                    </div>

                    {/* Cross-Chain Info */}
                    {crossChainEnabled && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-2 text-xs text-primary-400">
                          <Sparkles className="w-3 h-3" />
                          <span>Price sync enabled across all chains</span>
                        </div>
                      </div>
                    )}
                  </Link>

                  {/* Quick Buy Button */}
                  <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                    <Link
                      to={`/token/${token.id}`}
                      className="flex-1 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition text-sm font-medium text-center"
                    >
                      View Details
                    </Link>
                    {deployments.some((dep: any) => !dep.isGraduated && dep.curveAddress) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/token/${token.id}`);
                        }}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                      >
                        <Zap className="w-4 h-4" />
                        Buy Now
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
