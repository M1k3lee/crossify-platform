import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  AlertCircle, Copy, CheckCircle, 
  Zap, Twitter, MessageCircle,
  TrendingUp, TrendingDown, ExternalLink, Settings,
  Github, BookOpen, MessageSquare, Youtube, Linkedin, Loader2,
  Share2, Users, Activity, Clock, Edit2, X, Save, Upload, Image as ImageIcon
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import AddLiquidityModal from '../components/AddLiquidityModal';
import BuyWidget from '../components/BuyWidget';
import WalletHoldings from '../components/WalletHoldings';
import TokenChart from '../components/TokenChart';
import MarketDepthChart from '../components/MarketDepthChart';
import GraduationProgress from '../components/GraduationProgress';
import GraduationCelebration from '../components/GraduationCelebration';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { API_BASE } from '../config/api';
import { deployTokenOnEVM, getTestnetInfo } from '../services/blockchain';
import BannerUpload from '../components/BannerUpload';
import ColorPicker from '../components/ColorPicker';

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
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [liquidityModal, setLiquidityModal] = useState<{
    chain: string;
    curveAddress: string;
    tokenAddress: string;
  } | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const previousGraduationStatus = useRef<boolean>(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    logoIpfs: '',
    bannerImageIpfs: '',
    description: '',
    twitterUrl: '',
    discordUrl: '',
    telegramUrl: '',
    websiteUrl: '',
    githubUrl: '',
    mediumUrl: '',
    redditUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    primaryColor: '#3B82F6',
    accentColor: '#8B5CF6',
    backgroundColor: '',
  });
  
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

  // Compute selectedChain early for queries (will be recomputed later)
  const selectedChainForQueries = useMemo(() => {
    if (!status?.deployments?.length) return null;
    const deployments = status.deployments || [];
    const selectedChainFromUrl = searchParams.get('chain');
    
    // Try to find deployment matching URL chain
    if (selectedChainFromUrl) {
      const normalizedUrlChain = selectedChainFromUrl.toLowerCase().trim();
      const found = deployments.find((dep: any) => {
        const depChain = (dep.chain || '').toLowerCase().trim();
        return depChain === normalizedUrlChain || 
               depChain.includes(normalizedUrlChain) || 
               normalizedUrlChain.includes(depChain);
      });
      if (found) {
        const chain = found.chain?.toLowerCase() || 'ethereum';
        if (chain.includes('base-sepolia') || chain === 'base-sepolia') return 'base-sepolia';
        if (chain.includes('bsc-testnet') || chain === 'bsc-testnet') return 'bsc-testnet';
        if (chain.includes('sepolia') && !chain.includes('base')) return 'sepolia';
        if (chain.includes('base')) return 'base';
        if (chain.includes('bsc') || chain.includes('binance')) return 'bsc';
        if (chain.includes('ethereum') || chain === 'eth') return 'ethereum';
        return chain;
      }
    }
    
    // Use first valid deployment
    const firstValid = deployments.find((dep: any) => 
      dep.curveAddress && dep.tokenAddress && (dep.status === 'deployed' || !dep.status)
    );
    if (firstValid?.chain) {
      const chain = firstValid.chain.toLowerCase();
      if (chain.includes('base-sepolia') || chain === 'base-sepolia') return 'base-sepolia';
      if (chain.includes('bsc-testnet') || chain === 'bsc-testnet') return 'bsc-testnet';
      if (chain.includes('sepolia') && !chain.includes('base')) return 'sepolia';
      if (chain.includes('base')) return 'base';
      if (chain.includes('bsc') || chain.includes('binance')) return 'bsc';
      if (chain.includes('ethereum') || chain === 'eth') return 'ethereum';
      return chain;
    }
    
    return deployments[0]?.chain?.toLowerCase() || 'ethereum';
  }, [status?.deployments, searchParams]);

  // Fetch recent transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['token-transactions', id, selectedChainForQueries],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/transactions`, {
          params: {
            tokenId: id,
            chain: selectedChainForQueries,
            limit: 10,
          },
        });
        return response.data;
      } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return { transactions: [], count: 0 };
      }
    },
    enabled: !!id && !!selectedChainForQueries,
    refetchInterval: 15000,
  });

  // Fetch related tokens
  const { data: relatedTokensData } = useQuery({
    queryKey: ['related-tokens', id],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/${id}/related`, {
          params: { limit: 6 },
        });
        return response.data;
      } catch (error: any) {
        console.error('Error fetching related tokens:', error);
        return { relatedTokens: [] };
      }
    },
    enabled: !!id,
  });

  // Fetch token analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['token-analytics', id, '7d'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE}/tokens/${id}/analytics`, {
          params: { period: '7d' },
        });
        return response.data;
      } catch (error: any) {
        console.error('Error fetching token analytics:', error);
        return null;
      }
    },
    enabled: !!id,
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
  
  // Helper function to construct image URL from filename or CID
  const getImageUrl = useMemo(() => {
    return (imageId: string | null | undefined): string | null => {
      if (!imageId) return null;
      // If it's already a full URL (Cloudinary or other), return it
      if (imageId.startsWith('http')) return imageId;
      // If it's a mock CID (old format), skip it
      if (imageId.startsWith('mock_')) return null;
      // It's a filename, construct API URL
      // API_BASE already includes /api, so we can use it directly
      // Route is: /api/upload/file/:filename
      return `${API_BASE}/upload/file/${imageId}`;
    };
  }, []);

  // Get banner URL from multiple sources
  const bannerUrl = useMemo(() => {
    try {
      // Debug logging
      console.log('🔍 Constructing banner URL:', {
        metadataBannerUrl: metadata?.bannerUrl,
        metadataBannerImageIpfs: metadata?.bannerImageIpfs,
        customizationBannerImageIpfs: customization?.bannerImageIpfs,
        tokenBannerImageIpfs: token?.bannerImageIpfs,
      });
      
      // Priority: metadata bannerUrl (if full URL) > metadata bannerImageIpfs > customization bannerImageIpfs > token bannerImageIpfs
      if (metadata?.bannerUrl && metadata.bannerUrl.startsWith('http')) {
        // Full URL from metadata
        console.log('✅ Using metadata bannerUrl:', metadata.bannerUrl);
        return metadata.bannerUrl;
      }
      if (metadata?.bannerImageIpfs) {
        // Filename from metadata - construct URL
        const url = getImageUrl(metadata.bannerImageIpfs);
        console.log('✅ Using metadata bannerImageIpfs:', metadata.bannerImageIpfs, '→', url);
        return url;
      }
      if (customization?.bannerImageIpfs) {
        // Filename from customization - construct URL
        const url = getImageUrl(customization.bannerImageIpfs);
        console.log('✅ Using customization bannerImageIpfs:', customization.bannerImageIpfs, '→', url);
        return url;
      }
      // Check token directly (status endpoint returns bannerImageIpfs in camelCase)
      if (token?.bannerImageIpfs) {
        const url = getImageUrl(token.bannerImageIpfs);
        console.log('✅ Using token bannerImageIpfs:', token.bannerImageIpfs, '→', url);
        return url;
      }
      console.log('⚠️ No banner image found');
      return null;
    } catch (e) {
      console.error('Error constructing banner URL:', e);
      return null;
    }
  }, [metadata?.bannerUrl, metadata?.bannerImageIpfs, customization?.bannerImageIpfs, token?.bannerImageIpfs, getImageUrl]);

  // Get logo URL from multiple sources
  const logoUrl = useMemo(() => {
    try {
      // Priority: metadata logoUrl (if full URL) > metadata logoIpfs > token logo_ipfs
      if (metadata?.logoUrl && metadata.logoUrl.startsWith('http')) {
        // Full URL from metadata
        return metadata.logoUrl;
      }
      if (metadata?.logoIpfs) {
        // Filename from metadata - construct URL
        return getImageUrl(metadata.logoIpfs);
      }
      // Check token directly (status endpoint returns logoIpfs in camelCase)
      if (token?.logoIpfs) {
        return getImageUrl(token.logoIpfs);
      }
      return null;
    } catch (e) {
      console.error('Error constructing logo URL:', e);
      return null;
    }
  }, [metadata?.logoUrl, metadata?.logoIpfs, token, getImageUrl]);
  
  // Check if current user is the token creator (after token is loaded)
  const isCreator = useMemo(() => {
    if (!isConnected || !address || !token?.creatorAddress) return false;
    return token.creatorAddress.toLowerCase() === address.toLowerCase();
  }, [isConnected, address, token?.creatorAddress]);
  
  // Initialize edit form when entering edit mode
  const handleStartEdit = () => {
    if (!token) return;
    setEditForm({
      logoIpfs: token?.logoIpfs || '',
      bannerImageIpfs: token?.bannerImageIpfs || customization?.bannerImageIpfs || '',
      description: token?.description || metadata?.description || '',
      twitterUrl: token?.twitterUrl || metadata?.twitterUrl || '',
      discordUrl: token?.discordUrl || metadata?.discordUrl || '',
      telegramUrl: token?.telegramUrl || metadata?.telegramUrl || '',
      websiteUrl: token?.websiteUrl || metadata?.websiteUrl || '',
      githubUrl: token?.githubUrl || metadata?.githubUrl || '',
      mediumUrl: token?.mediumUrl || metadata?.mediumUrl || '',
      redditUrl: token?.redditUrl || metadata?.redditUrl || '',
      youtubeUrl: token?.youtubeUrl || metadata?.youtubeUrl || '',
      linkedinUrl: token?.linkedinUrl || metadata?.linkedinUrl || '',
      primaryColor: customization?.primaryColor || metadata?.primaryColor || primaryColor,
      accentColor: customization?.accentColor || metadata?.accentColor || accentColor,
      backgroundColor: customization?.backgroundColor || metadata?.backgroundColor || '',
    });
    setIsEditing(true);
  };
  
  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to edit token');
      return;
    }
    
    setEditLoading(true);
    try {
      await axios.patch(
        `${API_BASE}/tokens/${id}`,
        editForm,
        {
          headers: {
            'x-creator-address': address,
          },
        }
      );
      
      toast.success('Token metadata updated successfully!');
      setIsEditing(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['token-status', id] });
      queryClient.invalidateQueries({ queryKey: ['token-metadata', id] });
      
      // Reload page after a short delay to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating token:', error);
      toast.error(error.response?.data?.error || 'Failed to update token metadata');
    } finally {
      setEditLoading(false);
    }
  };
  
  // Upload logo helper
  const uploadLogo = async (file: File): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_BASE}/upload/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.filename || response.data.cid;
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast.error('Failed to upload logo');
      return undefined;
    }
  };
  
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
        <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden border border-gray-700/50">
          {bannerUrl ? (
            <>
              <img
                src={bannerUrl}
                alt={`${tokenName} banner`}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log('✅ Banner image loaded successfully:', bannerUrl);
                }}
                onError={(e) => {
                  console.error('❌ Banner image failed to load:', bannerUrl, e);
                  // Hide image and show gradient fallback
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.classList.add('bg-gradient-to-br');
                    parent.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-br"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}40 0%, ${accentColor}40 100%)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          )}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-4xl font-bold text-white drop-shadow-lg">{tokenName}</h1>
                  {token?.verified && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-blue-300" />
                      <span className="text-xs text-blue-300 font-medium">Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-xl text-gray-200 drop-shadow-lg">{tokenSymbol}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Edit Button - Only show if user is creator */}
              {isCreator && !isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 bg-primary-500/20 hover:bg-primary-500/30 backdrop-blur-sm rounded-lg transition-colors border border-primary-500/50"
                  title="Edit token metadata"
                >
                  <Edit2 className="w-5 h-5 text-primary-300" />
                </button>
              )}
              {/* Share Button */}
              <button
                onClick={async () => {
                  const url = window.location.href;
                  try {
                    if (navigator.share) {
                      await navigator.share({
                        title: `${tokenName} (${tokenSymbol})`,
                        text: `Check out ${tokenName} on Crossify!`,
                        url: url,
                      });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied to clipboard!');
                    }
                  } catch (error) {
                    // User cancelled or error occurred
                    if ((error as Error).name !== 'AbortError') {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied to clipboard!');
                    }
                  }
                }}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
                title="Share token"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Token Header Card - Simplified when banner is present */}
        <div className="bg-gradient-to-r from-gray-800/90 to-gray-800/70 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-gray-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6 flex-1">
              {/* Logo - Always show, but smaller/positioned when banner exists */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={tokenName}
                  className={`${bannerUrl ? 'w-16 h-16' : 'w-20 h-20'} rounded-full border-2 border-gray-600 shadow-lg`}
                  onError={(e) => {
                    console.error('Error loading logo:', logoUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div 
                  className={`${bannerUrl ? 'w-16 h-16' : 'w-20 h-20'} rounded-full flex items-center justify-center ${bannerUrl ? 'text-2xl' : 'text-3xl'} font-bold border-2 border-gray-600 shadow-lg`}
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` 
                  }}
                >
                  {tokenSymbol?.charAt(0) || 'T'}
                </div>
              )}
              {!bannerUrl && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{tokenName}</h1>
                  <p className="text-xl text-gray-400">{tokenSymbol}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Total Market Cap</p>
              <p 
                className="text-4xl font-bold mb-2"
                style={{ color: primaryColor }}
              >
                ${(totalMarketCap / 1e6).toFixed(2)}M
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {token?.verified && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                )}
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
          </div>

          {/* Creator Actions */}
          {isCreator && !isEditing && (
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

          {/* Edit Form */}
          {isEditing && isCreator && (
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Token Metadata</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {editLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={editLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Banner Upload */}
                <BannerUpload
                  value={editForm.bannerImageIpfs}
                  onChange={(value) => setEditForm({ ...editForm, bannerImageIpfs: value || '' })}
                  label="Banner Image"
                />

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Logo</label>
                  <div className="flex items-center gap-4">
                    {editForm.logoIpfs ? (
                      <div className="relative">
                        <img
                          src={getImageUrl(editForm.logoIpfs) || ''}
                          alt="Logo"
                          className="w-20 h-20 rounded-full border-2 border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => setEditForm({ ...editForm, logoIpfs: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-gray-600 border-dashed flex items-center justify-center bg-gray-700/50">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {editForm.logoIpfs ? 'Change Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const filename = await uploadLogo(file);
                            if (filename) {
                              setEditForm({ ...editForm, logoIpfs: filename });
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe your token..."
                  />
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Social Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Twitter URL</label>
                      <input
                        type="url"
                        value={editForm.twitterUrl}
                        onChange={(e) => setEditForm({ ...editForm, twitterUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Discord URL</label>
                      <input
                        type="url"
                        value={editForm.discordUrl}
                        onChange={(e) => setEditForm({ ...editForm, discordUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://discord.gg/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Telegram URL</label>
                      <input
                        type="url"
                        value={editForm.telegramUrl}
                        onChange={(e) => setEditForm({ ...editForm, telegramUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://t.me/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Website URL</label>
                      <input
                        type="url"
                        value={editForm.websiteUrl}
                        onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">GitHub URL</label>
                      <input
                        type="url"
                        value={editForm.githubUrl}
                        onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Medium URL</label>
                      <input
                        type="url"
                        value={editForm.mediumUrl}
                        onChange={(e) => setEditForm({ ...editForm, mediumUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://medium.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Reddit URL</label>
                      <input
                        type="url"
                        value={editForm.redditUrl}
                        onChange={(e) => setEditForm({ ...editForm, redditUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://reddit.com/r/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">YouTube URL</label>
                      <input
                        type="url"
                        value={editForm.youtubeUrl}
                        onChange={(e) => setEditForm({ ...editForm, youtubeUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={editForm.linkedinUrl}
                        onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Colors</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={editForm.primaryColor}
                      onChange={(color) => setEditForm({ ...editForm, primaryColor: color })}
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={editForm.accentColor}
                      onChange={(color) => setEditForm({ ...editForm, accentColor: color })}
                    />
                    <ColorPicker
                      label="Background Color (Optional)"
                      value={editForm.backgroundColor}
                      onChange={(color) => setEditForm({ ...editForm, backgroundColor: color })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description - Hide when editing */}
          {!isEditing && token?.description && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">About</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{token.description}</p>
            </div>
          )}

          {/* Social Links - More Prominent - Hide when editing */}
          {!isEditing && (metadata?.twitterUrl || metadata?.discordUrl || metadata?.telegramUrl || metadata?.websiteUrl || 
            metadata?.githubUrl || metadata?.mediumUrl || metadata?.redditUrl || metadata?.youtubeUrl || metadata?.linkedinUrl) && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Connect & Follow</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {metadata.twitterUrl && (
                  <a
                    href={metadata.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition group"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-blue-300">Twitter</span>
                  </a>
                )}
                {metadata.discordUrl && (
                  <a
                    href={metadata.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition group"
                    title="Discord"
                  >
                    <MessageCircle className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-indigo-300">Discord</span>
                  </a>
                )}
                {metadata.telegramUrl && (
                  <a
                    href={metadata.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition group"
                    title="Telegram"
                  >
                    <MessageCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-cyan-300">Telegram</span>
                  </a>
                )}
                {metadata.websiteUrl && (
                  <a
                    href={metadata.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/30 rounded-lg transition group"
                    title="Website"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-gray-300">Website</span>
                  </a>
                )}
                {metadata.githubUrl && (
                  <a
                    href={metadata.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/30 rounded-lg transition group"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4 text-gray-300 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-gray-300">GitHub</span>
                  </a>
                )}
                {metadata.mediumUrl && (
                  <a
                    href={metadata.mediumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition group"
                    title="Medium"
                  >
                    <BookOpen className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-green-300">Medium</span>
                  </a>
                )}
                {metadata.redditUrl && (
                  <a
                    href={metadata.redditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition group"
                    title="Reddit"
                  >
                    <MessageSquare className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-orange-300">Reddit</span>
                  </a>
                )}
                {metadata.youtubeUrl && (
                  <a
                    href={metadata.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition group"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-red-300">YouTube</span>
                  </a>
                )}
                {metadata.linkedinUrl && (
                  <a
                    href={metadata.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg transition group"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-blue-300">LinkedIn</span>
                  </a>
                )}
              </div>
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

        {/* Graduation Progress Bar */}
        {selectedDeployment && 
         !selectedDeployment.isGraduated && 
         token?.graduationThreshold && 
         token.graduationThreshold > 0 && (
          <div className="mb-6">
            <GraduationProgress
              tokenId={id || ''}
              chain={selectedChain}
              graduationThreshold={token.graduationThreshold}
              currentMarketCap={selectedDeployment.marketCap}
              isGraduated={selectedDeployment.isGraduated}
            />
          </div>
        )}

        {/* DEX Pool Info (if graduated) */}
        {selectedDeployment?.isGraduated && selectedDeployment.dexPoolAddress && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">🎉 Token Graduated to DEX!</h3>
                  <p className="text-sm text-gray-400">
                    This token has successfully migrated to {selectedDeployment.dexName || 'DEX'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">DEX Pool Address</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDeployment.dexPoolAddress);
                        toast.success('Pool address copied!');
                      }}
                      className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition"
                    >
                      <code className="font-mono">
                        {selectedDeployment.dexPoolAddress.slice(0, 8)}...{selectedDeployment.dexPoolAddress.slice(-6)}
                      </code>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedDeployment.dexName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">DEX</span>
                      <span className="text-sm font-semibold text-white capitalize">{selectedDeployment.dexName}</span>
                    </div>
                  )}
                  {selectedDeployment.graduatedAt && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-400">Graduated</span>
                      <span className="text-sm text-gray-300">
                        {new Date(selectedDeployment.graduatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                {selectedDeployment.dexName?.toLowerCase().includes('raydium') && (
                  <a
                    href={`https://raydium.io/liquidity/?ammId=${selectedDeployment.dexPoolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center flex items-center justify-center gap-2"
                  >
                    <span>Trade on Raydium</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trading Section - Buy Widget + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Buy Widget - Prominent */}
          {selectedDeployment && selectedDeployment.curveAddress && selectedDeployment.tokenAddress && !selectedDeployment.isGraduated && !allGraduated ? (
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
          ) : deployments && deployments.length > 0 && !allGraduated && !selectedDeployment?.isGraduated ? (
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
              <p className="text-yellow-400 text-xs mb-3">
                Available chains: {deployments.map((d: any) => 
                  d && d.curveAddress && d.tokenAddress ? d.chain : null
                ).filter(Boolean).join(', ') || 'none'}
              </p>
              {!selectedDeployment?.curveAddress || !selectedDeployment?.tokenAddress ? (
                <button
                  onClick={async () => {
                    if (!isConnected || !address) {
                      toast.error('Please connect your wallet first');
                      return;
                    }
                    if (!token) {
                      toast.error('Token data not loaded');
                      return;
                    }
                    if (!selectedDeployment) {
                      toast.error('No deployment selected');
                      return;
                    }

                    const chain = selectedDeployment.chain.toLowerCase();
                    const evmChain = chain.includes('sepolia') && !chain.includes('base') ? 'ethereum' :
                                    chain.includes('base') ? 'base' :
                                    chain.includes('bsc') ? 'bsc' : null;

                    if (!evmChain) {
                      toast.error('Solana deployment is not yet supported');
                      return;
                    }

                    try {
                      setDeploying(selectedDeployment.chain);
                      toast.loading(`Deploying to ${selectedDeployment.chain}...`, { id: 'deploy-token' });

                      // Get token data
                      // Try to get logo IPFS from multiple sources
                      let logoIpfs = '';
                      if (metadata?.logoUrl) {
                        logoIpfs = metadata.logoUrl.replace('https://ipfs.io/ipfs/', '').replace('ipfs://', '');
                      } else if ((token as any).logoIpfs) {
                        logoIpfs = (token as any).logoIpfs;
                      } else if ((token as any).logo_ipfs) {
                        logoIpfs = (token as any).logo_ipfs;
                      }
                      
                      const tokenData = {
                        name: token.name,
                        symbol: token.symbol,
                        decimals: token.decimals || 18,
                        initialSupply: token.initialSupply || token.initial_supply || '1000000000',
                        metadataUri: logoIpfs,
                      };

                      const curveData = {
                        basePrice: ((token as any).basePrice || (token as any).base_price || 0.001).toString(),
                        slope: ((token as any).slope || 0.000001).toString(),
                        graduationThreshold: '0',
                        buyFeePercent: ((token as any).buyFeePercent || (token as any).buy_fee_percent || 0).toString(),
                        sellFeePercent: ((token as any).sellFeePercent || (token as any).sell_fee_percent || 0).toString(),
                      };

                      // Deploy to blockchain
                      const result = await deployTokenOnEVM(evmChain as 'ethereum' | 'bsc' | 'base', {
                        chain: evmChain as any,
                        tokenData,
                        curveData,
                      });

                      // Save deployment to backend
                      await axios.post(`${API_BASE}/tokens/${id}/deploy`, {
                        chains: [evmChain],
                        deployments: [{
                          chain: selectedDeployment.chain,
                          tokenAddress: result.tokenAddress,
                          curveAddress: result.curveAddress,
                          status: 'deployed',
                          txHash: result.txHash,
                        }],
                      });

                      toast.success(`✅ Deployed to ${selectedDeployment.chain}!`, { id: 'deploy-token' });
                      
                      // Refresh token data
                      queryClient.invalidateQueries({ queryKey: ['token-status', id] });
                      
                      // Reload page after a short delay
                      setTimeout(() => {
                        window.location.reload();
                      }, 2000);
                    } catch (error: any) {
                      console.error('Deployment error:', error);
                      toast.error(error.message || `Failed to deploy to ${selectedDeployment.chain}`, { 
                        id: 'deploy-token',
                        duration: 10000 
                      });
                    } finally {
                      setDeploying(null);
                    }
                  }}
                  disabled={deploying !== null || !isConnected || !token}
                  className="w-full mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {deploying === selectedDeployment?.chain ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Deploy to {selectedDeployment?.chain || selectedChain}
                    </>
                  )}
                </button>
              ) : null}
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

        {/* Token Description Section */}
        {metadata?.description && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">About {tokenName}</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{metadata.description}</p>
          </div>
        )}

        {/* Contract Addresses Section - Show all deployed chains */}
        {deployments && deployments.some((d: any) => d.tokenAddress || d.curveAddress) && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Contract Addresses</h2>
            <div className="space-y-4">
              {deployments.map((dep: any) => {
                if (!dep || (!dep.tokenAddress && !dep.curveAddress)) return null;
                const chainName = dep.chain?.toLowerCase() || '';
                const normalizedChainName = chainName.includes('base-sepolia') ? 'base-sepolia' :
                                          chainName.includes('bsc-testnet') ? 'bsc-testnet' :
                                          chainName.includes('sepolia') && !chainName.includes('base') ? 'sepolia' :
                                          chainName.includes('base') ? 'base' :
                                          chainName.includes('bsc') ? 'bsc' :
                                          chainName.includes('ethereum') ? 'ethereum' : chainName;
                const chainDisplayName = CHAIN_NAMES[normalizedChainName] || CHAIN_NAMES[chainName] || dep.chain;
                const chainColor = CHAIN_COLORS[normalizedChainName] || CHAIN_COLORS[chainName] || '#FFFFFF';
                const explorer = getTestnetInfo(normalizedChainName as any)?.explorer;

                return (
                  <div key={dep.chain} className="border border-gray-700/50 rounded-lg p-4 bg-gray-700/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: chainColor }}
                      />
                      <h3 className="text-sm font-semibold text-white">{chainDisplayName}</h3>
                    </div>
                    <div className="space-y-2">
                      {dep.tokenAddress && (
                        <div className="flex items-center justify-between p-2.5 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Copy className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-400">Token</p>
                              <p className="text-xs font-mono text-white truncate">{dep.tokenAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {explorer && (
                              <a
                                href={`${explorer}/address/${dep.tokenAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-gray-600 rounded transition"
                                title="View on explorer"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </a>
                            )}
                            <button
                              onClick={() => copyToClipboard(dep.tokenAddress, 'Token contract')}
                              className="p-1.5 hover:bg-gray-600 rounded transition"
                            >
                              {copiedAddress === dep.tokenAddress ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      {dep.curveAddress && (
                        <div className="flex items-center justify-between p-2.5 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Zap className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-400">Bonding Curve</p>
                              <p className="text-xs font-mono text-white truncate">{dep.curveAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {explorer && (
                              <a
                                href={`${explorer}/address/${dep.curveAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-gray-600 rounded transition"
                                title="View on explorer"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </a>
                            )}
                            <button
                              onClick={() => copyToClipboard(dep.curveAddress, 'Curve contract')}
                              className="p-1.5 hover:bg-gray-600 rounded transition"
                            >
                              {copiedAddress === dep.curveAddress ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {transactionsData?.transactions && transactionsData.transactions.length > 0 && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Transactions
              </h2>
            </div>
            <div className="space-y-2">
              {transactionsData.transactions.slice(0, 5).map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {tx.type === 'buy' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                      <p className="text-xs text-gray-400">
                        {tx.amount ? `${parseFloat(tx.amount).toLocaleString()} ${tokenSymbol}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {tx.price ? `$${parseFloat(tx.price).toFixed(6)}` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {tx.txHash && getTestnetInfo(selectedChain as any)?.explorer && (
                    <a
                      href={`${getTestnetInfo(selectedChain as any)?.explorer}/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-1 hover:bg-gray-600 rounded transition"
                      title="View on explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token Details & Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Token Parameters */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Token Parameters</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Initial Supply</p>
                <p className="text-lg font-semibold text-white">
                  {token?.initialSupply || token?.initial_supply ? 
                    `${(parseFloat(token.initialSupply || token.initial_supply) / 1e9).toFixed(2)}B` : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Decimals</p>
                <p className="text-lg font-semibold text-white">{token?.decimals || 18}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Base Price</p>
                <p className="text-lg font-semibold text-white">
                  ${((token as any)?.basePrice || (token as any)?.base_price || 0).toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Slope</p>
                <p className="text-lg font-semibold text-white">
                  {((token as any)?.slope || 0).toFixed(8)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Buy Fee</p>
                <p className="text-lg font-semibold text-white">
                  {((token as any)?.buyFeePercent || (token as any)?.buy_fee_percent || 0) / 100}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Sell Fee</p>
                <p className="text-lg font-semibold text-white">
                  {((token as any)?.sellFeePercent || (token as any)?.sell_fee_percent || 0) / 100}%
                </p>
              </div>
            </div>
            {(token as any)?.crossChainEnabled && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Cross-chain price sync enabled</span>
                </div>
              </div>
            )}
          </div>

          {/* Token Statistics */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Total Transactions</span>
                </div>
                <span className="text-lg font-semibold text-white">{transactionsData?.count || 0}</span>
              </div>
              {analyticsData?.statistics && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Buy/Sell Ratio</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                      {analyticsData.statistics.buySellRatio}:1
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">Volume (7d)</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                      ${(analyticsData.statistics.totalVolume / 1e3).toFixed(1)}K
                    </span>
                  </div>
                  {analyticsData.statistics.priceChange !== 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {analyticsData.statistics.priceChange >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm text-gray-400">Price Change (7d)</span>
                      </div>
                      <span className={`text-lg font-semibold ${
                        analyticsData.statistics.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {analyticsData.statistics.priceChange >= 0 ? '+' : ''}
                        {analyticsData.statistics.priceChange.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Created</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-white">
                    {token?.createdAt ? new Date(token.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                  <p className="text-xs text-gray-500">
                    {token?.createdAt ? `${Math.floor((Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Active Chains</span>
                </div>
                <span className="text-lg font-semibold text-white">
                  {deployments?.filter((d: any) => d.tokenAddress && d.curveAddress).length || 0}
                </span>
              </div>
              {selectedDeployment?.holderCount !== undefined && selectedDeployment.holderCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Holders ({selectedChain})</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {selectedDeployment.holderCount.toLocaleString()}
                  </span>
                </div>
              )}
              {token?.creatorAddress && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">Creator</span>
                  <button
                    onClick={() => copyToClipboard(token.creatorAddress, 'Creator address')}
                    className="flex items-center gap-2 text-sm font-mono text-white hover:text-primary-400 transition"
                  >
                    {token.creatorAddress.slice(0, 6)}...{token.creatorAddress.slice(-4)}
                    {copiedAddress === token.creatorAddress ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Tokens */}
        {relatedTokensData?.relatedTokens && relatedTokensData.relatedTokens.length > 0 && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Related Tokens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTokensData.relatedTokens.map((relatedToken: any) => (
                <Link
                  key={relatedToken.id}
                  to={`/token/${relatedToken.id}`}
                  className="bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {(() => {
                      // Construct logo URL for related token - check logoUrl first, then logoIpfs
                      const relatedLogoUrl = relatedToken.logoUrl || getImageUrl(relatedToken.logoIpfs);
                      return relatedLogoUrl ? (
                        <img
                          src={relatedLogoUrl}
                          alt={relatedToken.name}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {relatedToken.symbol?.charAt(0) || 'T'}
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">{relatedToken.name}</h3>
                        {relatedToken.verified && (
                          <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{relatedToken.symbol}</p>
                    </div>
                  </div>
                  {relatedToken.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {relatedToken.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{relatedToken.deploymentCount || 0} chains</span>
                    {relatedToken.avgMarketCap > 0 && (
                      <span>${(relatedToken.avgMarketCap / 1e6).toFixed(2)}M</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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

      {/* Graduation Celebration Modal */}
      <GraduationCelebration
        isVisible={showCelebration}
        tokenName={tokenName}
        tokenSymbol={tokenSymbol}
        chain={selectedChain}
        dexPoolAddress={selectedDeployment?.dexPoolAddress}
        dexName={selectedDeployment?.dexName || 'DEX'}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
