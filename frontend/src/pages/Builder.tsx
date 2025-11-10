import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Upload, Check, Zap, Sparkles, AlertCircle } from 'lucide-react';
import AdvancedSettings from '../components/AdvancedSettings';
import AdvancedTokenSettingsComponent, { AdvancedTokenSettings } from '../components/AdvancedTokenSettings';
import InitialDistributionSettingsComponent, { InitialDistributionSettings } from '../components/InitialDistributionSettings';
import FeeBreakdown from '../components/FeeBreakdown';
import CrossChainToggle from '../components/CrossChainToggle';
import { useAccount } from 'wagmi';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import QuantumBackground from '../components/QuantumBackground';
import { motion } from 'framer-motion';
import { deployTokenOnEVM, getTestnetInfo } from '../services/blockchain';
import SEO, { generateHowToSchema } from '../components/SEO';
import { API_BASE } from '../config/api';
import { trackTokenCreation, trackButtonClick } from '../components/GoogleAnalytics';
import BannerUpload from '../components/BannerUpload';
import ColorPicker from '../components/ColorPicker';

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  logoFile?: File;
  description: string;
  twitterUrl: string;
  discordUrl: string;
  telegramUrl: string;
  websiteUrl: string;
  githubUrl: string;
  mediumUrl: string;
  redditUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  basePrice: string;
  slope: string;
  graduationThreshold: string;
  buyFeePercent: string;
  sellFeePercent: string;
  chains: string[];
  bannerImageIpfs?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
}

export default function Builder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const { isConnected, address } = useAccount();
  const solanaWallet = useSolanaWallet();
  
  const [formData, setFormData] = useState<TokenData>({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '1000000000',
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
    basePrice: '0.0001',
    slope: '0.00001',
    graduationThreshold: '0', // Disabled - no graduation
    buyFeePercent: '0',
    sellFeePercent: '0',
    chains: [],
    primaryColor: '#3B82F6',
    accentColor: '#8B5CF6',
  });

  const [advancedSettings, setAdvancedSettings] = useState<AdvancedTokenSettings>({
    mintable: false,
    burnable: false,
    pausable: false,
    blacklistEnabled: false,
    whitelistEnabled: false,
    transferRestrictions: false,
    transferTaxEnabled: false,
    governanceEnabled: false,
    vestingEnabled: false,
    multiSigEnabled: false,
    timelockEnabled: false,
  });

  const [distributionSettings, setDistributionSettings] = useState<InitialDistributionSettings>({
    enabled: false,
    recipients: [],
    airdropEnabled: false,
    teamAllocation: '',
    teamVesting: false,
    publicSale: '',
    liquidityPool: '',
  });

  // Cross-chain sync option (only enabled if 2+ chains selected)
  const [crossChainEnabled, setCrossChainEnabled] = useState(false);
  
  // Auto-disable cross-chain when only one chain is selected
  useEffect(() => {
    if (formData.chains.length <= 1) {
      setCrossChainEnabled(false);
    }
  }, [formData.chains]);

  const builderHowToSteps = [
    {
      name: 'Connect Your Wallet',
      text: 'Connect MetaMask for Ethereum/BSC/Base or Phantom for Solana to begin creating your token.',
    },
    {
      name: 'Enter Token Details',
      text: 'Provide your token name, symbol, description, and upload a logo. Add social media links for better visibility.',
    },
    {
      name: 'Set Token Economics',
      text: 'Configure initial supply, base price, bonding curve slope, and fees. Choose buy/sell fee percentages.',
    },
    {
      name: 'Select Blockchains',
      text: 'Choose which blockchains to deploy on: Ethereum, BSC, Base, and/or Solana. Enable cross-chain sync for price synchronization.',
    },
    {
      name: 'Configure Advanced Settings',
      text: 'Set mintable, burnable, pausable options, and configure initial token distribution if needed.',
    },
    {
      name: 'Review and Deploy',
      text: 'Review all settings, check the fee breakdown, and deploy your token. It will be created on all selected chains simultaneously.',
    },
  ];

  // Validate symbol format
  const validateSymbol = (symbol: string): boolean => {
    return /^[A-Z0-9]+$/.test(symbol);
  };

  const handleInputChange = (field: keyof TokenData, value: any) => {
    // Normalize initialSupply input: remove commas, spaces, and trim
    if (field === 'initialSupply' && typeof value === 'string') {
      // Remove commas, spaces, and trim whitespace
      value = value.replace(/[,\s]/g, '').trim();
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('logoFile', file);
      toast.success('Logo selected');
    }
  };

  const uploadLogo = async (file: File): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_BASE}/upload/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.cid;
    } catch (error) {
      console.error('Logo upload failed:', error);
      return undefined;
    }
  };


  const handleSubmit = async () => {
    // Normalize initialSupply first (remove commas, spaces, trim)
    const normalizedSupply = formData.initialSupply.replace(/[,\s]/g, '').trim();
    
    // Validate required fields
    if (!formData.name || !formData.symbol || !normalizedSupply) {
      toast.error('Please fill in all required fields (Name, Symbol, Initial Supply)');
      return;
    }

    if (formData.chains.length === 0) {
      toast.error('Please select at least one chain to deploy on');
      return;
    }

    // Auto-disable cross-chain if only one chain selected
    // actualCrossChainEnabled will be calculated in handleSubmit

    // Validate initialSupply - normalize and validate
    if (!normalizedSupply || normalizedSupply === '') {
      toast.error('Initial Supply is required. Please enter a positive number (e.g., 1000000000)');
      return;
    }
    if (!/^\d+$/.test(normalizedSupply)) {
      toast.error('Initial Supply must be a valid positive whole number. Please enter only digits (e.g., 1000000000). Commas and spaces are automatically removed.');
      return;
    }
    if (parseInt(normalizedSupply, 10) <= 0) {
      toast.error('Initial Supply must be greater than 0');
      return;
    }
    // Update formData with normalized value if it changed
    if (normalizedSupply !== formData.initialSupply) {
      setFormData(prev => ({ ...prev, initialSupply: normalizedSupply }));
    }

    // Validate symbol format
    if (!validateSymbol(formData.symbol.trim().toUpperCase())) {
      toast.error('Symbol must contain only uppercase letters and numbers (A-Z, 0-9)');
      return;
    }

    // Validate numeric fields
    if (isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) <= 0) {
      toast.error('Base Price must be a positive number');
      return;
    }
    if (isNaN(parseFloat(formData.slope)) || parseFloat(formData.slope) < 0) {
      toast.error('Slope must be a non-negative number');
      return;
    }
    // Graduation threshold removed - not needed for non-marketplace model

    setLoading(true);
    try {
      // Check wallet connection based on selected chains
      const evmChains = formData.chains.filter(c => c !== 'solana');
      const needsEVM = evmChains.length > 0;
      const needsSolana = formData.chains.includes('solana');

      // Only check wallets for chains that are actually selected
      if (needsEVM && !isConnected) {
        toast.error(
          `Please connect your wallet to deploy on ${evmChains.join(', ')}. Use the Connect Wallet button in the top right. MetaMask is recommended, but Phantom (EVM mode) and other wallets also work.`,
          { duration: 7000 }
        );
        setLoading(false);
        return;
      }

      // Only check Solana wallet if Solana is actually selected
      if (needsSolana && !solanaWallet.publicKey) {
        toast.error(
          'Please connect your Phantom wallet to deploy on Solana. Use the Connect Phantom Wallet button in the chain selection section.',
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      // Upload logo if provided
      let logoIpfs: string | undefined;
      if (formData.logoFile) {
        try {
          logoIpfs = await uploadLogo(formData.logoFile);
        } catch (error) {
          console.warn('Logo upload failed, continuing without logo:', error);
        }
      }

      // Create token record in backend
      // Helper function to clean URLs - convert empty strings to undefined
      const cleanUrl = (url: string | undefined): string | undefined => {
        if (!url) return undefined;
        const cleaned = url.trim();
        return cleaned !== '' ? cleaned : undefined;
      };

      // Helper to clean description
      const cleanDescription = (desc: string | undefined): string | undefined => {
        if (!desc) return undefined;
        const cleaned = desc.trim();
        return cleaned !== '' ? cleaned : undefined;
      };

      // Build tokenData object, only including fields that have values
      // Use the already normalized supply from validation above
      const tokenData: any = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        decimals: formData.decimals,
        initialSupply: normalizedSupply,
        basePrice: formData.basePrice,
        slope: formData.slope,
        graduationThreshold: '0', // Graduation disabled
        buyFeePercent: formData.buyFeePercent || '0',
        sellFeePercent: formData.sellFeePercent || '0',
      };

      // Only add optional fields if they have values
      if (logoIpfs) tokenData.logoIpfs = logoIpfs;
      const cleanedDesc = cleanDescription(formData.description);
      if (cleanedDesc) tokenData.description = cleanedDesc;
      
      const cleanedTwitter = cleanUrl(formData.twitterUrl);
      if (cleanedTwitter) tokenData.twitterUrl = cleanedTwitter;
      
      const cleanedDiscord = cleanUrl(formData.discordUrl);
      if (cleanedDiscord) tokenData.discordUrl = cleanedDiscord;
      
      const cleanedTelegram = cleanUrl(formData.telegramUrl);
      if (cleanedTelegram) tokenData.telegramUrl = cleanedTelegram;
      
      const cleanedWebsite = cleanUrl(formData.websiteUrl);
      if (cleanedWebsite) tokenData.websiteUrl = cleanedWebsite;

      const cleanedGithub = cleanUrl(formData.githubUrl);
      if (cleanedGithub) tokenData.githubUrl = cleanedGithub;

      const cleanedMedium = cleanUrl(formData.mediumUrl);
      if (cleanedMedium) tokenData.mediumUrl = cleanedMedium;

      const cleanedReddit = cleanUrl(formData.redditUrl);
      if (cleanedReddit) tokenData.redditUrl = cleanedReddit;

      const cleanedYoutube = cleanUrl(formData.youtubeUrl);
      if (cleanedYoutube) tokenData.youtubeUrl = cleanedYoutube;

      const cleanedLinkedin = cleanUrl(formData.linkedinUrl);
      if (cleanedLinkedin) tokenData.linkedinUrl = cleanedLinkedin;

      // Add customization fields
      if (formData.bannerImageIpfs) tokenData.bannerImageIpfs = formData.bannerImageIpfs;
      if (formData.primaryColor) tokenData.primaryColor = formData.primaryColor;
      if (formData.accentColor) tokenData.accentColor = formData.accentColor;
      if (formData.backgroundColor) tokenData.backgroundColor = formData.backgroundColor;

      console.log('Creating token with data:', JSON.stringify(tokenData, null, 2));

      // Auto-disable cross-chain if only one chain selected
      const actualCrossChainEnabled = formData.chains.length > 1 ? crossChainEnabled : false;

      const tokenDataWithAdvanced = {
        ...tokenData,
        advancedSettings,
        distributionSettings,
        crossChainEnabled: actualCrossChainEnabled,
      };

      let tokenResponse;
      try {
        console.log('📝 Creating token in backend...', { 
          name: tokenData.name, 
          symbol: tokenData.symbol,
          address: address || 'no address'
        });
        
        tokenResponse = await axios.post(
          `${API_BASE}/tokens/create`,
          tokenDataWithAdvanced,
          {
            headers: {
              'x-creator-address': address || '',
            },
          }
        );
        
        console.log('✅ Token created successfully:', tokenResponse.data);
      } catch (error: any) {
        console.error('❌ Token creation API error:', error);
        
        // Log full error details for debugging
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
          
          // Log validation errors if present
          if (error.response.data?.details) {
            console.error('Validation errors:', error.response.data.details);
            const errorMessages = error.response.data.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
            toast.error(`Token creation failed: ${errorMessages}`, { duration: 10000 });
          } else if (error.response.data?.message) {
            toast.error(`Token creation failed: ${error.response.data.message}`, { duration: 10000 });
          } else {
            toast.error(`Token creation failed: ${error.response.status} ${error.response.statusText}`, { duration: 10000 });
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          toast.error('Token creation failed: No response from server. Please check your connection.', { duration: 10000 });
        } else {
          console.error('Error setting up request:', error.message);
          toast.error(`Token creation failed: ${error.message}`, { duration: 10000 });
        }
        
        setLoading(false);
        setDeploying(false);
        throw error;
      }
      
      if (!tokenResponse || !tokenResponse.data || !tokenResponse.data.tokenId) {
        console.error('❌ Invalid token response:', tokenResponse);
        toast.error('Token creation failed: Invalid response from server', { duration: 10000 });
        setLoading(false);
        setDeploying(false);
        return;
      }
      
      const tokenId = tokenResponse.data.tokenId;
      console.log('✅ Token ID received:', tokenId);
      
      // Track token creation
      trackTokenCreation({
        tokenName: formData.name,
        tokenSymbol: formData.symbol,
        chains: formData.chains,
        crossChainEnabled: actualCrossChainEnabled,
      });
      
      toast.success('Token created! Starting blockchain deployment...');

      // Deploy to blockchains with real transactions
      setDeploying(true);
      const deployments = [];

      for (const chain of formData.chains) {
        try {
          toast.loading(`Deploying to ${chain}...`, { id: `deploy-${chain}` });
          
          if (chain === 'solana') {
            // Solana deployment (placeholder for now)
            if (!solanaWallet.publicKey) {
              throw new Error('Solana wallet not connected');
            }

            const mockAddress = `${Math.random().toString(36).substring(2, 44)}`;
            deployments.push({
              chain,
              tokenAddress: mockAddress,
              curveAddress: `${Math.random().toString(36).substring(2, 44)}`,
              status: 'pending',
              message: 'Solana deployment requires Anchor program setup',
            });
            toast.dismiss(`deploy-${chain}`);
          } else {
            // EVM deployment - THIS WILL TRIGGER METAMASK
            if (!isConnected || !address) {
              throw new Error('EVM wallet not connected');
            }

            try {
              console.log(`🚀 Attempting to deploy to ${chain}...`);
              
              // Check which wallet is being used and warn if Phantom
              if (typeof window !== 'undefined' && window.ethereum) {
                const provider = window.ethereum.providers?.find((p: any) => p.isMetaMask) || 
                                 (window.ethereum.isMetaMask ? window.ethereum : null);
                if (!provider && window.ethereum.isPhantom) {
                  toast.loading('Using Phantom wallet. For best results, consider using MetaMask for EVM chains.', { id: 'wallet-warning', duration: 5000 });
                }
              }
              
              // This will trigger wallet popup (MetaMask preferred, or Phantom if MetaMask not available)
              const result = await deployTokenOnEVM(
                chain as 'ethereum' | 'bsc' | 'base',
                {
                  chain: chain as any,
                  tokenData: {
                    name: formData.name,
                    symbol: formData.symbol,
                    decimals: formData.decimals,
                    initialSupply: normalizedSupply,
                    metadataUri: logoIpfs,
                  },
                  curveData: {
                    basePrice: formData.basePrice,
                    slope: formData.slope,
                    graduationThreshold: '0', // Graduation disabled
                    buyFeePercent: formData.buyFeePercent,
                    sellFeePercent: formData.sellFeePercent,
                  },
                }
              );

              deployments.push({
                chain,
                tokenAddress: result.tokenAddress,
                curveAddress: result.curveAddress,
                status: 'deployed',
                txHash: result.txHash,
              });

              const testnetInfo = getTestnetInfo(chain);
              toast.success(
                `✅ Deployed to ${chain}! View on ${testnetInfo.explorer}/tx/${result.txHash}`,
                { id: `deploy-${chain}`, duration: 8000 }
              );
            } catch (deployError: any) {
              console.error(`❌ Deployment error for ${chain}:`, deployError);
              
              if (deployError.message?.includes('Factory contract not deployed')) {
                toast.error(
                  `Factory not deployed on ${chain}. Please deploy factory contracts first.`,
                  { id: `deploy-${chain}`, duration: 10000 }
                );
                deployments.push({
                  chain,
                  error: deployError.message,
                  status: 'failed',
                });
              } else if (deployError.message?.includes('rejected')) {
                toast.error(`Transaction rejected for ${chain}`, { id: `deploy-${chain}` });
                deployments.push({
                  chain,
                  error: 'Transaction rejected by user',
                  status: 'failed',
                });
              } else {
                throw deployError;
              }
            }
          }
        } catch (error: any) {
          console.error(`Error deploying to ${chain}:`, error);
          toast.error(`Failed to deploy to ${chain}: ${error.message}`, { id: `deploy-${chain}` });
          deployments.push({
            chain,
            error: error.message || 'Unknown error',
            status: 'failed',
          });
        }
      }

      // Save deployments to backend
      try {
        console.log('💾 Saving deployments to backend...', { tokenId, deployments });
        console.log('📋 Deployment data:', JSON.stringify({ tokenId, chains: formData.chains, deployments }, null, 2));
        
        const deployResponse = await axios.post(`${API_BASE}/tokens/${tokenId}/deploy`, {
          chains: formData.chains,
          deployments,
        });
        
        console.log('✅ Deployments saved successfully:', deployResponse.data);
        
        // Verify token exists after saving deployments
        try {
          const verifyResponse = await axios.get(`${API_BASE}/tokens/${tokenId}/status`);
          console.log('✅ Token verified in database:', verifyResponse.data);
        } catch (verifyError: any) {
          console.error('⚠️ Warning: Could not verify token after deployment save:', verifyError);
          if (verifyError.response?.status === 404) {
            console.error('❌ CRITICAL: Token not found in database after deployment save!');
            toast.error('Token deployed but not found in database. Token ID: ' + tokenId, { duration: 15000 });
          }
        }
      } catch (error: any) {
        console.error('❌ Error saving deployments:', error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
          
          if (error.response.status === 404) {
            console.error('❌ CRITICAL: Token not found when saving deployments!');
            console.error('Token ID:', tokenId);
            console.error('This means the token creation failed but the error was not caught properly.');
            toast.error(`Token not found in database. Token ID: ${tokenId}. Please check backend logs.`, { duration: 15000 });
          } else {
            toast.error(`Failed to save deployments: ${error.response.data?.error || error.response.statusText}`, { duration: 10000 });
          }
        } else {
          toast.error('Failed to save deployments: ' + (error.message || 'Unknown error'), { duration: 10000 });
        }
        // Don't fail the whole process if deployment save fails - deployments are on-chain
        // But log the error so we can investigate
      }

      toast.success('Deployment complete!', { duration: 3000 });
      console.log(`🚀 Navigating to token detail page: /token/${tokenId}`);
      navigate(`/token/${tokenId}`);
    } catch (error: any) {
      console.error('Token creation error:', error);
      
      setLoading(false);
      setDeploying(false);
      
      let errorMessage = 'Failed to create token';
      const errorDetails = error.response?.data?.details;
      
      // Better error message formatting
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } 
      
      if (errorDetails) {
        if (Array.isArray(errorDetails)) {
          const formattedErrors = errorDetails.map((d: any) => {
            if (typeof d === 'string') return d;
            const field = d.path || (Array.isArray(d.path) ? d.path.join('.') : 'field');
            const msg = d.message || 'invalid';
            return `${field}: ${msg}`;
          });
          errorMessage = `Validation error:\n${formattedErrors.join('\n')}`;
        } else if (typeof errorDetails === 'string') {
          errorMessage = errorDetails;
        }
      } else if (error.response?.data?.message) {
        // Check for formatted message from backend
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show detailed error in toast
      toast.error(errorMessage, { 
        duration: 8000,
        style: {
          maxWidth: '500px',
          whiteSpace: 'pre-line',
        }
      });
    } finally {
      setLoading(false);
      setDeploying(false);
    }
  };

  const steps = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Metadata' },
    { id: 3, name: 'Tokenomics' },
    { id: 4, name: 'Chains' },
  ];

  return (
    <>
      <SEO
        title="Launch Token - Create Your Token on Multiple Blockchains | Crossify.io"
        description="Create and deploy your token on Ethereum, BSC, Base, and Solana with one click. Step-by-step token creation tool with advanced settings, bonding curves, and cross-chain synchronization."
        keywords="launch token, create token, deploy token, token builder, token creator, memecoin creator, create memecoin, token launch tool, multi-chain token, cross-chain token, ethereum token, solana token, BSC token, base token, token deployment, defi token"
        url="https://crossify.io/builder"
        schema={generateHowToSchema(builderHowToSteps)}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-6xl mx-auto p-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                Token Builder
              </h1>
              <p className="text-gray-400">Create and deploy your token across multiple chains</p>
            </div>
          </div>
        </motion.div>

        {/* Wallet Connection Warning */}
        {formData.chains.some(c => c !== 'solana') && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium">Wallet Connection Required</p>
              <p className="text-yellow-300/70 text-sm">
                You've selected EVM chains ({formData.chains.filter(c => c !== 'solana').join(', ')}). 
                Connect your wallet using the button in the top right corner. 
                <span className="block mt-1 text-yellow-400/80">
                  Most users prefer MetaMask, but Phantom (EVM mode) and other wallets also work.
                </span>
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Solana Wallet Warning - Only show if Solana is selected and not connected */}
        {formData.chains.includes('solana') && !solanaWallet.publicKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-purple-500/10 border border-purple-500/50 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-purple-400 font-medium">Solana Wallet Required</p>
              <p className="text-purple-300/70 text-sm">
                You've selected Solana. Connect your Phantom wallet using the button below.
                <span className="block mt-1 text-purple-400/80">
                  If you already use Phantom for EVM, you can use the same wallet for Solana.
                </span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((stepItem, idx) => (
              <div key={stepItem.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= stepItem.id
                        ? 'bg-gradient-to-br from-primary-500 to-blue-600 text-white shadow-lg shadow-primary-500/50'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {step > stepItem.id ? <Check className="w-5 h-5" /> : stepItem.id}
                  </div>
                  <span className={`ml-3 text-sm font-medium ${
                    step >= stepItem.id ? 'text-white' : 'text-gray-400'
                  }`}>
                    {stepItem.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    step > stepItem.id ? 'bg-gradient-to-r from-primary-500 to-blue-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl"
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Basic Token Information</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Token Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="My Awesome Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Token Symbol *</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => {
                    // Only allow uppercase letters and numbers
                    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    handleInputChange('symbol', cleaned);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="MAT"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.symbol && !validateSymbol(formData.symbol) ? (
                    <span className="text-red-400">Symbol must contain only uppercase letters and numbers</span>
                  ) : (
                    'Uppercase letters and numbers only (A-Z, 0-9)'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Decimals</label>
                  <input
                    type="number"
                    value={formData.decimals}
                    onChange={(e) => handleInputChange('decimals', parseInt(e.target.value) || 18)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    min="0"
                    max="18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Initial Supply *</label>
                  <input
                    type="text"
                    value={formData.initialSupply}
                    onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1000000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a positive whole number. Commas and spaces are automatically removed (e.g., "1,000,000" becomes "1000000").
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Metadata */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Token Metadata</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Logo (Optional)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </label>
                  {formData.logoFile && (
                    <span className="text-sm text-gray-400">{formData.logoFile.name}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white h-32 resize-none"
                  placeholder="Describe your token..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Twitter URL</label>
                  <input
                    type="url"
                    value={formData.twitterUrl}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Additional Social Links */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Additional Social Links (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">GitHub URL</label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Medium URL</label>
                    <input
                      type="url"
                      value={formData.mediumUrl}
                      onChange={(e) => handleInputChange('mediumUrl', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="https://medium.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Reddit URL</label>
                    <input
                      type="url"
                      value={formData.redditUrl}
                      onChange={(e) => handleInputChange('redditUrl', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="https://reddit.com/r/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">YouTube URL</label>
                    <input
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Customization Section */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Customize Your Token Page (Optional)</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Make your token page stand out with custom branding and styling.
                </p>

                {/* Banner Upload */}
                <div className="mb-6">
                  <BannerUpload
                    value={formData.bannerImageIpfs}
                    onChange={(cid: string | null) => handleInputChange('bannerImageIpfs', cid || '')}
                  />
                </div>

                {/* Color Theme */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <ColorPicker
                    label="Primary Color"
                    value={formData.primaryColor || '#3B82F6'}
                    onChange={(color: string) => handleInputChange('primaryColor', color)}
                    defaultValue="#3B82F6"
                  />
                  <ColorPicker
                    label="Accent Color"
                    value={formData.accentColor || '#8B5CF6'}
                    onChange={(color: string) => handleInputChange('accentColor', color)}
                    defaultValue="#8B5CF6"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> Your logo and banner will be prominently displayed on your token page. 
                    Choose colors that match your brand for a professional look!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tokenomics */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Tokenomics & Curve Settings</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Base Price (ETH/BNB/SOL)</label>
                  <input
                    type="text"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="0.0001"
                  />
                  {formData.basePrice && (isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) <= 0) && (
                    <p className="text-xs text-red-400 mt-1">Must be a positive number</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Slope</label>
                  <input
                    type="text"
                    value={formData.slope}
                    onChange={(e) => handleInputChange('slope', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    placeholder="0.00001"
                  />
                  {formData.slope && (isNaN(parseFloat(formData.slope)) || parseFloat(formData.slope) < 0) && (
                    <p className="text-xs text-red-400 mt-1">Must be a non-negative number</p>
                  )}
                </div>
              </div>


              <AdvancedSettings
                title="Trading Fees (Advanced)"
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Buy Fee %</label>
                    <input
                      type="text"
                      value={formData.buyFeePercent}
                      onChange={(e) => handleInputChange('buyFeePercent', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Sell Fee %</label>
                    <input
                      type="text"
                      value={formData.sellFeePercent}
                      onChange={(e) => handleInputChange('sellFeePercent', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </AdvancedSettings>

              {/* Advanced Token Features */}
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-4">Advanced Token Features</h3>
                <AdvancedTokenSettingsComponent
                  settings={advancedSettings}
                  onChange={setAdvancedSettings}
                />
              </div>

              {/* Initial Distribution Settings */}
              <div className="mt-6">
                <InitialDistributionSettingsComponent
                  settings={distributionSettings}
                  onChange={setDistributionSettings}
                  totalSupply={formData.initialSupply}
                />
              </div>
            </div>
          )}

          {/* Step 4: Chains */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Select Chains</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['ethereum', 'bsc', 'base', 'solana'].map((chain) => (
                  <button
                    key={chain}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newChains = formData.chains.includes(chain)
                        ? formData.chains.filter(c => c !== chain)
                        : [...formData.chains, chain];
                      handleInputChange('chains', newChains);
                      
                      // Track chain selection
                      trackButtonClick({
                        buttonName: `select_chain_${chain}`,
                        location: 'builder_step_4',
                        additionalData: {
                          action: formData.chains.includes(chain) ? 'deselect' : 'select',
                          chains: newChains.join(','),
                        },
                      });
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      formData.chains.includes(chain)
                        ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/50'
                        : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{chain === 'ethereum' ? '⟠' : chain === 'bsc' ? '◉' : chain === 'solana' ? '◎' : '⬡'}</div>
                      <div className="text-sm font-medium text-white capitalize">{chain}</div>
                      {formData.chains.includes(chain) && (
                        <Check className="w-5 h-5 mx-auto mt-2 text-primary-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Wallet Connection Status */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-medium mb-3 text-gray-300">Wallet Connection Status</h3>
                <div className="space-y-3">
                  {/* EVM Chains */}
                  {['ethereum', 'bsc', 'base'].some(c => formData.chains.includes(c)) && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">EVM Wallet</span>
                        <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                          {isConnected ? '✓ Connected' : '✗ Not Connected'}
                        </span>
                      </div>
                      {!isConnected && (
                        <div className="mt-2">
                          <p className="text-xs text-yellow-400 mb-2">
                            ⚠️ Connect your wallet using the button in the top right corner
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            Supports: MetaMask (recommended), Phantom (EVM mode), WalletConnect, Coinbase Wallet, and more
                          </p>
                          {typeof window !== 'undefined' && window.ethereum?.isPhantom && (
                            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-300">
                              <p className="font-medium mb-1">ℹ️ Phantom Detected:</p>
                              <p>If Phantom keeps popping up, you can:</p>
                              <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                                <li>Install MetaMask (recommended) - it will be used automatically</li>
                                <li>Or disable Phantom's EVM support in Phantom settings</li>
                                <li>Or use Phantom for EVM (works, but MetaMask is more compatible)</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {isConnected && (
                        <p className="text-xs text-gray-500 mt-1">
                          ✓ Ready to deploy on {formData.chains.filter(c => c !== 'solana').join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Solana Chain - Only show if Solana is selected */}
                  {formData.chains.includes('solana') && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Solana Wallet</span>
                        <span className={`text-sm font-medium ${solanaWallet.publicKey ? 'text-green-400' : 'text-red-400'}`}>
                          {solanaWallet.publicKey ? '✓ Connected' : '✗ Not Connected'}
                        </span>
                      </div>
                      {!solanaWallet.publicKey && (
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              solanaWallet.connect().catch((err) => {
                                console.error('Failed to connect Solana wallet:', err);
                                toast.error('Failed to connect Solana wallet. Make sure Phantom is installed.');
                              });
                            }}
                            className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                          >
                            Connect Phantom Wallet
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            Phantom is recommended for Solana. You can also use the same Phantom wallet for EVM chains.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Info Message */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {formData.chains.some(c => c !== 'solana') && formData.chains.includes('solana')
                        ? '💡 Tip: You can use Phantom for both EVM chains (via WalletConnect) and Solana. Or use MetaMask for EVM and Phantom for Solana.'
                        : formData.chains.some(c => c !== 'solana')
                        ? '💡 Tip: Most users prefer MetaMask for EVM chains, but Phantom (EVM mode) and other wallets also work via the Connect Wallet button.'
                        : '💡 Use Phantom wallet for Solana deployment'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cross-Chain Toggle */}
              <CrossChainToggle
                enabled={crossChainEnabled}
                onToggle={setCrossChainEnabled}
                selectedChains={formData.chains}
              />

              {/* Fee Breakdown */}
              <FeeBreakdown
                chains={formData.chains}
                buyFeePercent={formData.buyFeePercent}
                sellFeePercent={formData.sellFeePercent}
                basePrice={formData.basePrice}
                initialSupply={formData.initialSupply}
                crossChainEnabled={formData.chains.length > 1 ? crossChainEnabled : false}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackButtonClick({
                  buttonName: 'builder_previous_step',
                  location: `builder_step_${step}`,
                  additionalData: { fromStep: step, toStep: step - 1 },
                });
                setStep(Math.max(1, step - 1));
              }}
              disabled={step === 1}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  trackButtonClick({
                    buttonName: 'builder_next_step',
                    location: `builder_step_${step}`,
                    additionalData: { fromStep: step, toStep: step + 1 },
                  });
                  setStep(Math.min(4, step + 1));
                }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-lg transition flex items-center gap-2"
              >
                Next
                <Zap className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  trackButtonClick({
                    buttonName: 'deploy_token',
                    location: 'builder_step_4',
                    additionalData: {
                      chains: formData.chains.join(','),
                      tokenSymbol: formData.symbol,
                      crossChainEnabled: crossChainEnabled && formData.chains.length > 1,
                    },
                  });
                  handleSubmit();
                }}
                disabled={loading || deploying || !formData.name || !formData.symbol || !formData.initialSupply || formData.chains.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {loading || deploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {deploying ? 'Deploying...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    Deploy Token
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}

