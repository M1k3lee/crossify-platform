import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  AlertCircle, Copy, CheckCircle, 
  Zap, Twitter, MessageCircle,
  TrendingUp, TrendingDown, ExternalLink, Settings,
  Github, BookOpen, MessageSquare, Youtube, Linkedin
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import AddLiquidityModal from '../components/AddLiquidityModal';
import BuyWidget from '../components/BuyWidget';
import WalletHoldings from '../components/WalletHoldings';
import TokenChart from '../components/TokenChart';
import MarketDepthChart from '../components/MarketDepthChart';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  sepolia: '#627EEA',
  bsc: '#F3BA2F',
  'bsc-testnet': '#F3BA2F',
  solana: '#9945FF',
  base: '#0052FF',
  'base-sepolia': '#0052FF',
};

const CHAIN_NAMES: Record<string, string> = {
  ethereum: 'Ethereum',
  sepolia: 'Sepolia',
  bsc: 'BSC',
  'bsc-testnet': 'BSC Testnet',
  solana: 'Solana',
  base: 'Base',
  'base-sepolia': 'Base Sepolia',
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

  const { data: status, isLoading, error: statusError } = useQuery({
    queryKey: ['token-status', id],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/${id}/status`);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching token status:', error);
        if (error.response?.status === 404) {
          console.error(`Token ${id} not found in database`);
        }
        throw error;
      }
    },
    enabled: !!id,
    refetchInterval: 10000,
    retry: false, // Don't retry on 404 errors
  });

  const { data: priceSync } = useQuery({
    queryKey: ['price-sync', id],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/${id}/price-sync`);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching price sync:', error);
        // Return default values if price sync fails
        return { prices: {}, variance: 0 };
      }
    },
    enabled: !!id && !!status, // Only fetch if token exists
    refetchInterval: 10000,
    retry: false,
  });

  const { data: metadata } = useQuery({
    queryKey: ['token-metadata', id],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/${id}/metadata`);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching metadata:', error);
        // Return default metadata if fetch fails
        return {
          logoUrl: null,
          bannerUrl: null,
          description: null,
          twitterUrl: null,
          discordUrl: null,
          telegramUrl: null,
          websiteUrl: null,
          githubUrl: null,
          mediumUrl: null,
          redditUrl: null,
          youtubeUrl: null,
          linkedinUrl: null,
          primaryColor: '#3B82F6',
          accentColor: '#8B5CF6',
          backgroundColor: null,
        };
      }
    },
    enabled: !!id && !!status, // Only fetch if token exists
    retry: false,
  });

  // Safely extract data with defaults - MUST be called before any conditional returns
  const token = status?.token || null;
  const deployments = (status?.deployments || []).filter((d: any) => d && typeof d === 'object');
  
  // Calculate values safely - ALL HOOKS MUST BE CALLED UNCONDITIONALLY
  const totalMarketCap = useMemo(() => {
    if (!deployments || deployments.length === 0) return 0;
    try {
      return deployments.reduce((sum: number, dep: any) => {
        const marketCap = typeof dep?.marketCap === 'number' ? dep.marketCap : parseFloat(dep?.marketCap || '0') || 0;
        return sum + marketCap;
      }, 0);
    } catch (e) {
      console.error('Error calculating total market cap:', e);
      return 0;
    }
  }, [deployments]);
  
  const totalLiquidity = useMemo(() => totalMarketCap * 0.7, [totalMarketCap]);
  const liquidityChange24h = 2.1;

  const allGraduated = useMemo(() => {
    if (!deployments || deployments.length === 0) return false;
    try {
      return deployments.every((dep: any) => dep?.isGraduated === true);
    } catch (e) {
      console.error('Error checking graduated status:', e);
      return false;
    }
  }, [deployments]);
  
  const someGraduated = useMemo(() => {
    if (!deployments || deployments.length === 0) return false;
    try {
      return deployments.some((dep: any) => dep?.isGraduated === true);
    } catch (e) {
      console.error('Error checking graduated status:', e);
      return false;
    }
  }, [deployments]);

  // Extract customization data with safe fallbacks
  const customization = useMemo(() => {
    try {
      return token?.customization || {};
    } catch (e) {
      console.error('Error extracting customization:', e);
      return {};
    }
  }, [token?.customization]);
  
  const primaryColor = useMemo(() => {
    try {
      return customization?.primaryColor || metadata?.primaryColor || '#3B82F6';
    } catch (e) {
      console.error('Error getting primary color:', e);
      return '#3B82F6';
    }
  }, [customization?.primaryColor, metadata?.primaryColor]);
  
  const accentColor = useMemo(() => {
    try {
      return customization?.accentColor || metadata?.accentColor || '#8B5CF6';
    } catch (e) {
      console.error('Error getting accent color:', e);
      return '#8B5CF6';
    }
  }, [customization?.accentColor, metadata?.accentColor]);
  
  const bannerImageIpfs = useMemo(() => {
    try {
      const customBanner = customization?.bannerImageIpfs;
      const metaBanner = metadata?.bannerUrl?.replace('https://ipfs.io/ipfs/', '');
      return customBanner || metaBanner || null;
    } catch (e) {
      console.error('Error getting banner IPFS:', e);
      return null;
    }
  }, [customization?.bannerImageIpfs, metadata?.bannerUrl]);
  
  const bannerUrl = useMemo(() => {
    try {
      return bannerImageIpfs ? `https://ipfs.io/ipfs/${bannerImageIpfs}` : null;
    } catch (e) {
      console.error('Error constructing banner URL:', e);
      return null;
    }
  }, [bannerImageIpfs]);
  
  // Find selected deployment based on URL chain parameter or use first deployed chain
  const selectedDeployment = useMemo(() => {
    if (!deployments || deployments.length === 0) return null;
    
    console.log('🔍 Finding selected deployment:', { 
      deploymentsCount: deployments.length,
      selectedChainFromUrl,
      deployments: deployments.map((d: any) => ({
        chain: d.chain,
        status: d.status,
        hasCurveAddress: !!d.curveAddress,
        hasTokenAddress: !!d.tokenAddress
      }))
    });
    
    // If chain is specified in URL, find matching deployment
    if (selectedChainFromUrl) {
      // Try exact match first
      let found = deployments.find((dep: any) => {
        const depChain = dep.chain?.toLowerCase().trim();
        const urlChain = selectedChainFromUrl.toLowerCase().trim();
        return depChain === urlChain && dep.curveAddress && dep.tokenAddress;
      });
      
      // If not found, try partial match (e.g., "base" matches "base-sepolia")
      if (!found) {
        found = deployments.find((dep: any) => {
          const depChain = dep.chain?.toLowerCase().trim();
          const urlChain = selectedChainFromUrl.toLowerCase().trim();
          return (depChain.includes(urlChain) || urlChain.includes(depChain)) && 
                 dep.curveAddress && dep.tokenAddress;
        });
      }
      
      if (found) {
        console.log('✅ Found deployment for URL chain:', found.chain);
        return found;
      }
    }
    
    // Otherwise, use first deployment with both curve and token addresses
    const firstValid = deployments.find((dep: any) => 
      dep.curveAddress && dep.tokenAddress && (dep.status === 'deployed' || !dep.status)
    );
    
    if (firstValid) {
      console.log('✅ Using first valid deployment:', firstValid.chain);
      return firstValid;
    }
    
    // Fallback to any deployment with addresses
    const anyWithAddresses = deployments.find((dep: any) => 
      dep.curveAddress && dep.tokenAddress
    );
    
    if (anyWithAddresses) {
      console.log('✅ Using deployment with addresses:', anyWithAddresses.chain);
      return anyWithAddresses;
    }
    
    // Last resort: return first deployment
    console.log('⚠️ Using first deployment (may not have addresses):', deployments[0]?.chain);
    return deployments[0] || null;
  }, [deployments, selectedChainFromUrl]);
  
  // Normalize chain name for components (map testnet names to mainnet names)
  const selectedChain = useMemo(() => {
    if (!selectedDeployment?.chain) return 'ethereum';
    const chain = selectedDeployment.chain.toLowerCase();
    // Map testnet chain names to component-friendly names
    if (chain.includes('base-sepolia') || chain === 'base-sepolia') return 'base-sepolia';
    if (chain.includes('bsc-testnet') || chain === 'bsc-testnet') return 'bsc-testnet';
    if (chain.includes('sepolia') && !chain.includes('base')) return 'sepolia';
    if (chain.includes('base')) return 'base';
    if (chain.includes('bsc') || chain.includes('binance')) return 'bsc';
    if (chain.includes('ethereum') || chain === 'eth') return 'ethereum';
    return chain;
  }, [selectedDeployment?.chain]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Now we can do conditional returns AFTER all hooks are called
  if (isLoading) {
    return (
      <>
        <SEO
          title="Loading Token - Crossify.io"
          description="Loading token details..."
          url={`https://crossify.io/token/${id}`}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-transparent">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-white">Loading token details...</p>
          </div>
        </div>
      </>
    );
  }

  // Safe token properties with fallbacks - MUST be defined before conditional returns
  // These need to be defined even if token is null to prevent undefined errors
  const tokenName = token?.name || status?.token?.name || 'Unknown Token';
  const tokenSymbol = token?.symbol || status?.token?.symbol || 'UNKNOWN';
  const tokenDescription = token?.description || status?.token?.description || `View ${tokenName} (${tokenSymbol}) token details, price charts, market depth, and trading information. Trade ${tokenSymbol} on Ethereum, BSC, Base, and Solana.`;
  const tokenLogoIpfs = token?.logoIpfs || status?.token?.logoIpfs || null;
  const tokenImage = tokenLogoIpfs ? `https://ipfs.io/ipfs/${tokenLogoIpfs}` : 'https://crossify.io/og-image.png';

  // Handle error states
  if (statusError || !status || !token) {
    const is404 = (statusError as any)?.response?.status === 404;
    const errorMessage = is404 
      ? `Token not found. The token with ID "${id}" does not exist in the database.`
      : `Error loading token: ${(statusError as any)?.message || 'Unknown error'}`;
    
    return (
      <>
        <SEO
          title="Token Not Found - Crossify.io"
          description="The token you're looking for doesn't exist."
          url={`https://crossify.io/token/${id}`}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-transparent">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="mb-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Token Not Found</h1>
            <p className="text-lg text-gray-300 mb-2">{errorMessage}</p>
            {is404 && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-sm text-yellow-300 mb-2">
                  This token may have been deployed on-chain but not saved to the database.
                </p>
                <p className="text-sm text-gray-400">
                  Token ID: <code className="text-yellow-400">{id}</code>
                </p>
              </div>
            )}
            <div className="mt-6">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Go to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Debug logging
  console.log('TokenDetail render:', { 
    id, 
    hasToken: !!token, 
    hasStatus: !!status, 
    deploymentsCount: deployments?.length || 0,
    isLoading,
    statusError: statusError ? 'Error: ' + (statusError as any)?.message : null,
    selectedDeployment: selectedDeployment?.chain,
    tokenName,
    tokenSymbol
  });

  // Ensure we have a valid deployment before rendering trading components
  if (!selectedDeployment) {
    console.warn('⚠️ No valid deployment found, showing token info only');
  }

  return (
    <>
      <SEO
        title={`${tokenName} (${tokenSymbol}) - Token Details, Price, Charts | Crossify.io`}
        description={tokenDescription}
        keywords={`${tokenName}, ${tokenSymbol}, token price, token chart, token trading, ${tokenSymbol} price, buy ${tokenSymbol}, trade ${tokenSymbol}, memecoin, defi token`}
        url={`https://crossify.io/token/${id}`}
        image={tokenImage}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-transparent">
        {/* Banner */}
        {bannerUrl && (
          <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden border border-gray-700/50">
            <img
              src={bannerUrl}
              alt={`${tokenName} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-4xl font-bold text-white mb-2">{tokenName}</h1>
              <p className="text-xl text-gray-200">{tokenSymbol}</p>
            </div>
          </div>
        )}

        {/* Token Header Card */}
        <div className="bg-gradient-to-r from-gray-800/90 to-gray-800/70 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {metadata?.logoUrl ? (
                <img
                  src={metadata.logoUrl}
                  alt={tokenName}
                  className={`w-20 h-20 rounded-full border-2 ${bannerUrl ? 'border-gray-500/50' : 'border-gray-600'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-gray-600"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` 
                  }}
                >
                  {tokenSymbol?.charAt(0) || 'T'}
                </div>
              )}
              <div>
                {!bannerUrl && (
                  <>
                    <h1 className="text-4xl font-bold text-white mb-2">{tokenName}</h1>
                    <p className="text-xl text-gray-400">{tokenSymbol}</p>
                  </>
                )}
                {metadata?.description && (
                  <p className="text-gray-400 mt-3 max-w-2xl">{metadata.description}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Total Market Cap</p>
              <p 
                className="text-4xl font-bold mb-2"
                style={{ color: primaryColor }}
              >
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
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: `${primaryColor}40` }}
                >
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
                className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <Settings className="w-4 h-4" />
                Manage Token
              </Link>
              <span className="text-sm text-gray-400">You are the token creator</span>
            </div>
          )}

          {/* Social Links */}
          {(metadata?.twitterUrl || metadata?.discordUrl || metadata?.telegramUrl || metadata?.websiteUrl || 
            metadata?.githubUrl || metadata?.mediumUrl || metadata?.redditUrl || metadata?.youtubeUrl || metadata?.linkedinUrl) && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-700 flex-wrap">
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
              {metadata.githubUrl && (
                <a
                  href={metadata.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {metadata.mediumUrl && (
                <a
                  href={metadata.mediumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Medium</span>
                </a>
              )}
              {metadata.redditUrl && (
                <a
                  href={metadata.redditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Reddit</span>
                </a>
              )}
              {metadata.youtubeUrl && (
                <a
                  href={metadata.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <Youtube className="w-4 h-4" />
                  <span className="text-sm">YouTube</span>
                </a>
              )}
              {metadata.linkedinUrl && (
                <a
                  href={metadata.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm">LinkedIn</span>
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
            <p className="text-2xl font-bold text-white">{deployments?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Blockchains</p>
          </div>
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-2">Total Volume</p>
            <p className="text-2xl font-bold text-white">
              ${(deployments?.reduce((sum: number, d: any) => sum + ((d?.marketCap || 0) * 0.1), 0) / 1e3 || 0).toFixed(1)}K
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

        {/* Wallet Holdings Section - Show if wallet is connected */}
        {selectedDeployment && selectedDeployment.tokenAddress && (
          <div className="mb-6">
            <WalletHoldings
              tokenId={id || ''}
              chain={selectedChain}
              tokenAddress={selectedDeployment.tokenAddress}
              tokenSymbol={tokenSymbol}
              currentPrice={priceSync?.prices?.[selectedChain.toLowerCase()] || selectedDeployment.marketCap / 1000000 || 0.001}
              curveAddress={selectedDeployment.curveAddress || ''}
              onSell={() => {
                // Scroll to buy widget when sell is clicked
                setTimeout(() => {
                  const buyWidget = document.querySelector('[data-buy-widget]');
                  if (buyWidget) {
                    buyWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Switch to sell tab after a brief delay
                    setTimeout(() => {
                      const sellButton = document.querySelector('[data-sell-tab]') as HTMLButtonElement;
                      if (sellButton) {
                        sellButton.click();
                      }
                    }, 500);
                  }
                }, 100);
              }}
            />
          </div>
        )}

        {/* Trading Section - Buy Widget + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Buy Widget - Prominent */}
          {selectedDeployment && selectedDeployment.curveAddress && selectedDeployment.tokenAddress && !allGraduated ? (
            <div data-buy-widget>
              <BuyWidget
                tokenId={id || ''}
                chain={selectedChain}
                curveAddress={selectedDeployment.curveAddress}
                tokenAddress={selectedDeployment.tokenAddress}
                tokenSymbol={tokenSymbol}
                currentPrice={priceSync?.prices?.[selectedChain.toLowerCase()] || selectedDeployment.marketCap / 1000000 || 0.001}
                onSuccess={() => {
                  // Invalidate queries to refresh chart and other data
                  // The chart will automatically refetch due to refetchInterval
                  // Force a small delay to ensure transaction is recorded
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }}
              />
            </div>
          ) : deployments && deployments.length > 0 && !allGraduated ? (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-400 text-sm mb-2">
                ⚠️ Cannot buy on selected chain
              </p>
              <p className="text-yellow-300 text-xs mb-2">
                Selected chain: {selectedChain}
              </p>
              <p className="text-yellow-300 text-xs mb-2">
                Deployment: {selectedDeployment ? `${selectedDeployment.chain} (curve: ${selectedDeployment.curveAddress ? 'yes' : 'no'}, token: ${selectedDeployment.tokenAddress ? 'yes' : 'no'})` : 'none'}
              </p>
              <p className="text-yellow-400 text-xs">
                Available chains: {deployments.map((d: any) => 
                  d && d.curveAddress && d.tokenAddress ? d.chain : null
                ).filter(Boolean).join(', ') || 'none'}
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
            {deployments?.map((dep: any, idx: number) => {
              if (!dep || !dep.chain) return null;
              try {
                const chainName = dep.chain.toLowerCase();
                // Normalize chain name for lookup (handle testnet names)
                const normalizedChainName = chainName.includes('base-sepolia') ? 'base-sepolia' :
                                          chainName.includes('bsc-testnet') ? 'bsc-testnet' :
                                          chainName.includes('sepolia') && !chainName.includes('base') ? 'sepolia' :
                                          chainName.includes('base') ? 'base' :
                                          chainName.includes('bsc') ? 'bsc' :
                                          chainName.includes('ethereum') ? 'ethereum' : chainName;
                const price = priceSync?.prices?.[chainName] || (dep.marketCap ? dep.marketCap / 1000000 : 0.001);
                const liquidity = (dep.marketCap || 0) * 0.7;
                const volume24h = (dep.marketCap || 0) * 0.1;
                const priceImpact = 0.08 + (idx % 10) * 0.03; // Deterministic
                const chainColor = CHAIN_COLORS[normalizedChainName] || CHAIN_COLORS[chainName] || '#FFFFFF';
                const chainDisplayName = CHAIN_NAMES[normalizedChainName] || CHAIN_NAMES[chainName] || chainName;

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
                        {chainDisplayName?.charAt(0) || chainName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{chainDisplayName}</h3>
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
              } catch (error) {
                console.error('Error rendering deployment card:', error, dep);
                return null;
              }
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
        {deployments && deployments.length > 1 && priceSync && (
          <div className="mb-6 bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Cross-Chain Price Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {deployments.map((dep: any) => {
                if (!dep || !dep.chain) return null;
                try {
                  const chainName = dep.chain.toLowerCase();
                  const normalizedChainName = chainName.includes('base-sepolia') ? 'base-sepolia' :
                                            chainName.includes('bsc-testnet') ? 'bsc-testnet' :
                                            chainName.includes('sepolia') && !chainName.includes('base') ? 'sepolia' :
                                            chainName.includes('base') ? 'base' :
                                            chainName.includes('bsc') ? 'bsc' :
                                            chainName.includes('ethereum') ? 'ethereum' : chainName;
                  const price = priceSync.prices?.[chainName] || (dep.marketCap ? dep.marketCap / 1000000 : 0.001);
                  const chainColor = CHAIN_COLORS[normalizedChainName] || CHAIN_COLORS[chainName] || '#FFFFFF';
                  const chainDisplayName = CHAIN_NAMES[normalizedChainName] || CHAIN_NAMES[chainName] || chainName;
                  const variance = priceSync.variance || 0;
                  
                  return (
                  <div
                    key={dep.chain}
                    className="bg-gray-700/30 rounded-lg p-4 border border-gray-700/50"
                    style={{ borderLeftColor: chainColor, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-400">{chainDisplayName}</span>
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
                } catch (error) {
                  console.error('Error rendering price comparison:', error, dep);
                  return null;
                }
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
            {deployments?.map((dep: any, idx: number) => {
              if (!dep) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHAIN_COLORS[dep.chain?.toLowerCase()] || '#FFFFFF' }}
                    />
                    <span className="text-sm font-medium text-white capitalize">{dep.chain || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-sm text-gray-400">
                      {dep.status === 'graduated' ? 'Graduated to DEX' : 'Active on Curve'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      ${((dep.marketCap || 0) / 1e6).toFixed(2)}M
                    </p>
                    <p className="text-xs text-gray-500">Market Cap</p>
                  </div>
                </div>
              );
            })}
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
