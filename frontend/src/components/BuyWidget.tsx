import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getTestnetInfo, getPreferredEVMProvider, switchNetwork } from '../services/blockchain';
import { API_BASE } from '../config/api';
import { trackTokenTransaction, trackButtonClick } from './GoogleAnalytics';

interface BuyWidgetProps {
  tokenId: string;
  chain: string;
  curveAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice: number;
  onSuccess?: () => void;
}

export default function BuyWidget({
  tokenId,
  chain,
  curveAddress,
  tokenAddress,
  tokenSymbol,
  currentPrice,
  onSuccess,
}: BuyWidgetProps) {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [realCurrentPrice, setRealCurrentPrice] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    basePrice: string;
    slope: string;
    localSupply: string;
    globalSupply: string | null;
    useGlobalSupply: boolean;
  } | null>(null);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [priceEstimate, setPriceEstimate] = useState<number | null>(null);
  const [tokensEstimate, setTokensEstimate] = useState<number | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Get RPC URL for a specific chain
  const getRpcUrlForChain = (chainName: string): string => {
    const chainLower = chainName.toLowerCase().trim();
    
    console.log(`🔍 Getting RPC URL for chain: "${chainName}" (normalized: "${chainLower}")`);
    
    // Handle Base Sepolia testnet (most specific first - check before "sepolia" alone)
    if (chainLower === 'base-sepolia' || (chainLower.includes('base') && chainLower.includes('sepolia'))) {
      console.log(`   → Using Base Sepolia RPC`);
      return 'https://base-sepolia-rpc.publicnode.com';
    }
    
    // Handle BSC Testnet (check before "bsc" alone)
    if (chainLower === 'bsc-testnet' || (chainLower.includes('bsc') && chainLower.includes('testnet'))) {
      console.log(`   → Using BSC Testnet RPC`);
      return 'https://bsc-testnet.publicnode.com';
    }
    
    // Handle Ethereum/Sepolia testnet (check after base-sepolia to avoid false matches)
    if (chainLower === 'sepolia' || chainLower.includes('sepolia')) {
      console.log(`   → Using Sepolia RPC`);
      return 'https://ethereum-sepolia-rpc.publicnode.com';
    }
    
    // Handle base chain names (might be stored without testnet suffix)
    if (chainLower === 'base') {
      console.log(`   → Using Base Sepolia RPC (defaulting to testnet)`);
      return 'https://base-sepolia-rpc.publicnode.com';
    }
    
    if (chainLower === 'bsc' || chainLower === 'binance') {
      console.log(`   → Using BSC Testnet RPC (defaulting to testnet)`);
      return 'https://bsc-testnet.publicnode.com';
    }
    
    if (chainLower === 'ethereum' || chainLower === 'eth') {
      console.log(`   → Using Sepolia RPC (defaulting to testnet)`);
      return 'https://ethereum-sepolia-rpc.publicnode.com';
    }
    
    // Default to Base Sepolia (most common testnet)
    console.log(`   → Using Base Sepolia RPC (default fallback)`);
    return 'https://base-sepolia-rpc.publicnode.com';
  };

  // Fetch real current price and debug info from contract
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (!curveAddress || curveAddress === '0x0000000000000000000000000000000000000000' || !ethers.isAddress(curveAddress)) {
        return;
      }

      try {
        const rpcUrl = getRpcUrlForChain(chain);
        const ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
        const bondingCurveABI = [
          'function getCurrentPrice() external view returns (uint256)',
          'function basePrice() external view returns (uint256)',
          'function slope() external view returns (uint256)',
          'function totalSupplySold() external view returns (uint256)',
          'function useGlobalSupply() external view returns (bool)',
          'function globalSupplyTracker() external view returns (address)',
          'function getSupplyForPricing() external view returns (uint256)',
        ];
        const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, ethersProvider);
        
        // Get all values in parallel
        const [currentPriceWei, basePriceWei, slopeWei, localSupplyWei, useGlobalSupply, globalSupplyTrackerAddr, supplyForPricingWei] = await Promise.all([
          curveContract.getCurrentPrice(),
          curveContract.basePrice(),
          curveContract.slope(),
          curveContract.totalSupplySold(),
          curveContract.useGlobalSupply(),
          curveContract.globalSupplyTracker(),
          curveContract.getSupplyForPricing().catch(() => null),
        ]);
        
        const currentPriceEth = parseFloat(ethers.formatEther(currentPriceWei));
        const basePriceEth = parseFloat(ethers.formatEther(basePriceWei));
        const slopeEth = parseFloat(ethers.formatEther(slopeWei));
        const localSupplyTokens = parseFloat(ethers.formatEther(localSupplyWei));
        const supplyForPricingTokens = supplyForPricingWei ? parseFloat(ethers.formatEther(supplyForPricingWei)) : null;
        
        // Convert to USD (ETH price ~$3000)
        const currentPriceUSD = currentPriceEth * 3000;
        setRealCurrentPrice(currentPriceUSD);
        
        // Calculate expected price to verify
        const expectedPrice = basePriceEth + (slopeEth * (supplyForPricingTokens ?? localSupplyTokens));
        const expectedPriceUSD = expectedPrice * 3000;
        
        // Set debug info
        setDebugInfo({
          basePrice: basePriceEth.toFixed(8),
          slope: slopeEth.toFixed(8),
          localSupply: localSupplyTokens.toFixed(2),
          globalSupply: supplyForPricingTokens !== null && supplyForPricingTokens !== localSupplyTokens 
            ? supplyForPricingTokens.toFixed(2) 
            : null,
          useGlobalSupply: useGlobalSupply,
        });
        
        console.log(`💰 Real current price from contract: ${currentPriceEth} ETH ($${currentPriceUSD.toFixed(6)} per token)`);
        console.log(`📊 Debug Info:`);
        console.log(`   Base Price: ${basePriceEth} ETH ($${(basePriceEth * 3000).toFixed(6)})`);
        console.log(`   Slope: ${slopeEth} ETH per token ($${(slopeEth * 3000).toFixed(6)} per token)`);
        console.log(`   Local Supply: ${localSupplyTokens.toFixed(2)} tokens`);
        if (supplyForPricingTokens !== null && supplyForPricingTokens !== localSupplyTokens) {
          console.log(`   Global Supply: ${supplyForPricingTokens.toFixed(2)} tokens (⚠️ Using global supply!)`);
        }
        console.log(`   Expected Price: ${expectedPrice} ETH ($${expectedPriceUSD.toFixed(6)})`);
        console.log(`   Actual Price: ${currentPriceEth} ETH ($${currentPriceUSD.toFixed(6)})`);
        
        // Warn if there's a significant discrepancy
        if (Math.abs(expectedPrice - currentPriceEth) > 0.0001) {
          console.warn(`⚠️ Price mismatch! Expected: ${expectedPrice} ETH, Actual: ${currentPriceEth} ETH`);
        }
      } catch (error: any) {
        console.warn(`⚠️ Could not fetch real current price from contract:`, error.message);
        // Don't set realCurrentPrice on error, will use fallback
      }
    };

    fetchCurrentPrice();
    // Refresh price every 10 seconds
    const interval = setInterval(fetchCurrentPrice, 10000);
    return () => clearInterval(interval);
  }, [curveAddress, chain]);

  // Validate addresses and check contract deployment
  useEffect(() => {
    const validate = async () => {
      if (!curveAddress || curveAddress === '0x0000000000000000000000000000000000000000' || !ethers.isAddress(curveAddress)) {
        console.log(`🔍 Validation: Invalid curveAddress: ${curveAddress}`);
        setIsValidAddress(false);
        return;
      }

      try {
        // Use RPC provider for the specific chain (not the connected wallet chain)
        // This ensures we check the contract on the correct chain
        const rpcUrl = getRpcUrlForChain(chain);
        console.log(`🔍 Validating contract on chain: ${chain}, RPC: ${rpcUrl}, Address: ${curveAddress}`);
        
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const code = await rpcProvider.getCode(curveAddress);
        const isValid = !!(code && code !== '0x' && code !== '0x0');
        
        console.log(`🔍 Contract validation result: ${isValid ? '✅ Valid' : '❌ Invalid'} (code length: ${code?.length || 0})`);
        
        setIsValidAddress(isValid);
      } catch (error: any) {
        console.error(`❌ Error validating contract:`, error);
        console.error(`   Chain: ${chain}, Address: ${curveAddress}`);
        console.error(`   Error: ${error.message}`);
        setIsValidAddress(false);
      }
    };

    validate();
  }, [curveAddress, chain]);

  // Calculate price estimate when amount changes
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0 || !isValidAddress) {
        setPriceEstimate(null);
        setTokensEstimate(null);
        return;
      }

      try {
        // Use RPC provider for the specific chain (not the connected wallet chain)
        // This ensures we get accurate price estimates for the correct chain
        const rpcUrl = getRpcUrlForChain(chain);
        const ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
        
        const bondingCurveABI = [
          'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
          'function getCurrentPrice() external view returns (uint256)',
        ];

        const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, ethersProvider);

        // Always get current price first for validation
        const currentPriceWei = await curveContract.getCurrentPrice();
        const currentPriceEth = parseFloat(ethers.formatEther(currentPriceWei));
        const tokenAmount = ethers.parseUnits(amount, 18);
        
        // Note: We don't validate price per token here because bonding curve prices increase naturally
        // as tokens are bought. The contract itself enforces maximum limits (100 ETH/BNB per transaction).
        // Only check for truly astronomical prices that indicate bugs (>100 ETH/BNB).
        
        // Calculate expected price for warnings (but don't block)
        const expectedPriceEth = currentPriceEth * parseFloat(amount);
        const expectedPriceUSD = expectedPriceEth * 3000;
        
        // Warn if price is high but don't block (contract will reject if truly too high)
        if (expectedPriceUSD > 1000) {
          console.warn(`⚠️ High transaction cost: ${expectedPriceEth} ${chainSymbol} (~$${expectedPriceUSD.toFixed(2)})`);
          console.warn(`   Contract maximum: 100 ${chainSymbol} per transaction`);
        }
        
        // Only block truly astronomical prices (>100 ETH/BNB) - contract limit
        const maxReasonableWei = ethers.parseEther('100'); // Contract's maximum limit

        if (tab === 'buy') {
          // Calculate ETH/BNB needed for token amount
          try {
            const priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
            
            // CRITICAL: Check BigInt value BEFORE conversion (catches old contract bugs)
            if (priceFromContract > maxReasonableWei) {
              console.warn(`⚠️ Contract price too high (${priceFromContract.toString()} wei), using fallback`);
              const safeEstimate = expectedPriceEth * 1.1; // Add 10% buffer
              setPriceEstimate(safeEstimate);
              setTokensEstimate(parseFloat(amount));
              return;
            }
            
            const priceEth = parseFloat(ethers.formatEther(priceFromContract));
            
            // Only reject if price is truly astronomical (>100 ETH/BNB) - indicates a bug
            if (priceEth > 100) {
              console.warn(`⚠️ Contract price too high (${priceEth} ${chainSymbol}), rejecting estimate`);
              console.warn(`   Contract maximum: 100 ${chainSymbol} per transaction`);
              setPriceEstimate(null);
              setTokensEstimate(null);
              return;
            }
            
            // Additional validation: compare against expected price
            if (expectedPriceEth > 0 && priceEth > expectedPriceEth * 10) {
              console.warn(`⚠️ Contract price much higher than expected (${priceEth} vs ${expectedPriceEth} ${chainSymbol}), using safe fallback`);
              const safeEstimate = expectedPriceEth * 1.1; // Add 10% buffer
              // Only reject if truly astronomical (>100 ETH/BNB)
              if (safeEstimate > 100) {
                console.warn(`⚠️ Fallback estimate too high: ${safeEstimate} ${chainSymbol}`);
                setPriceEstimate(null);
                setTokensEstimate(null);
                return;
              }
              setPriceEstimate(safeEstimate);
              setTokensEstimate(parseFloat(amount));
            } else {
              const priceWithFee = (priceFromContract * BigInt(110)) / BigInt(100); // 10% buffer
              const priceWithFeeEth = Number(ethers.formatEther(priceWithFee));
              // Only reject if truly astronomical (>100 ETH/BNB)
              if (priceWithFeeEth > 100) {
                console.warn(`⚠️ Price with fee too high: ${priceWithFeeEth} ${chainSymbol}`);
                setPriceEstimate(null);
                setTokensEstimate(null);
                return;
              }
              setPriceEstimate(priceWithFeeEth);
              setTokensEstimate(parseFloat(amount));
            }
          } catch {
            // Fallback to current price, but validate it's reasonable
            const safeEstimate = expectedPriceEth * 1.1; // Add 10% buffer
            // Only reject if truly astronomical (>100 ETH/BNB)
            if (safeEstimate > 100) {
              console.warn(`⚠️ Fallback estimate too high: ${safeEstimate} ${chainSymbol}`);
              setPriceEstimate(null);
              setTokensEstimate(null);
            } else {
              setPriceEstimate(safeEstimate);
              setTokensEstimate(parseFloat(amount));
            }
          }
        } else {
          // Calculate ETH/BNB received for token amount
          try {
            const priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
            
            // CRITICAL: Check BigInt value BEFORE conversion
            if (priceFromContract > maxReasonableWei) {
              console.warn(`⚠️ Contract price too high, using fallback`);
              setPriceEstimate(expectedPriceEth);
              setTokensEstimate(parseFloat(amount));
              return;
            }
            
            const priceEth = parseFloat(ethers.formatEther(priceFromContract));
            
            // Only use fallback if price is truly astronomical (>100 ETH/BNB) or way off
            // Allow prices up to contract limit (100 ETH/BNB)
            if (priceEth > 100 || (expectedPriceEth > 0.0001 && priceEth > expectedPriceEth * 1000)) {
              console.warn(`⚠️ Contract price seems incorrect, using safe fallback`);
              setPriceEstimate(expectedPriceEth);
              setTokensEstimate(parseFloat(amount));
            } else {
              setPriceEstimate(priceEth);
              setTokensEstimate(parseFloat(amount));
            }
          } catch {
            setPriceEstimate(expectedPriceEth);
            setTokensEstimate(parseFloat(amount));
          }
        }
      } catch (error) {
        console.error('Error calculating estimate:', error);
        setPriceEstimate(null);
        setTokensEstimate(null);
      }
    };

    const timeoutId = setTimeout(calculateEstimate, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [amount, tab, curveAddress, isValidAddress, chain]);

  // Get chain-specific currency symbol (define before handleBuy)
  const getChainSymbol = (chainName: string): string => {
    if (!chainName) return 'ETH'; // Default fallback
    
    const chainLower = chainName.toLowerCase().trim();
    
    // Handle BSC/Binance Smart Chain (most specific first)
    if (chainLower === 'bsc' || 
        chainLower === 'bsc-testnet' || 
        chainLower === 'binance' ||
        chainLower === 'binance smart chain' ||
        chainLower.includes('bsc') ||
        chainLower.includes('binance')) {
      return 'BNB';
    }
    
    // Handle Ethereum/Sepolia
    if (chainLower === 'ethereum' || 
        chainLower === 'eth' ||
        chainLower === 'sepolia' ||
        chainLower.includes('ethereum') ||
        chainLower.includes('sepolia')) {
      return 'ETH';
    }
    
    // Handle Base (uses ETH as native currency)
    if (chainLower === 'base' || 
        chainLower === 'base-sepolia' ||
        chainLower.includes('base')) {
      return 'ETH';
    }
    
    // Handle Solana
    if (chainLower === 'solana' || 
        chainLower === 'sol' ||
        chainLower.includes('solana')) {
      return 'SOL';
    }
    
    // Default fallback
    console.warn(`Unknown chain name: ${chainName}, defaulting to ETH`);
    return 'ETH';
  };

  const handleBuy = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isValidAddress) {
      toast.error('Bonding curve contract is not deployed. Please deploy the token first.');
      return;
    }

    // Get chain symbol for this transaction (outside try block so it's available in catch)
    const chainSymbol = getChainSymbol(chain);
    
    try {
      setLoading(true);
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Check current network first
      const ethereumProvider = getPreferredEVMProvider();
      const currentChainIdHex = await ethereumProvider.request({ method: 'eth_chainId' }) as string;
      
      // Map chain name to chain ID (handle testnet variants)
      const chainLower = chain.toLowerCase();
      let expectedChainIdHex: string;
      let switchChainName: 'ethereum' | 'bsc' | 'base';
      
      if (chainLower.includes('bsc') || chainLower === 'bsc-testnet') {
        expectedChainIdHex = '0x61'; // BSC Testnet
        switchChainName = 'bsc';
      } else if (chainLower.includes('ethereum') || chainLower === 'sepolia' || chainLower === 'eth') {
        expectedChainIdHex = '0xAA36A7'; // Sepolia
        switchChainName = 'ethereum';
      } else if (chainLower.includes('base') || chainLower === 'base-sepolia') {
        expectedChainIdHex = '0x14A34'; // Base Sepolia
        switchChainName = 'base';
      } else {
        // Default to Base Sepolia
        expectedChainIdHex = '0x14A34';
        switchChainName = 'base';
      }
      
      // Normalize chain IDs (convert to lowercase and compare as integers)
      const currentChainId = parseInt(currentChainIdHex.toLowerCase(), 16);
      const expectedChainId = parseInt(expectedChainIdHex.toLowerCase(), 16);
      
      console.log(`🔍 Current chain ID: ${currentChainIdHex} (${currentChainId}), Expected: ${expectedChainIdHex} (${expectedChainId})`);
      
      // Only switch if we're on a different network
      if (currentChainId !== expectedChainId) {
        console.log(`🔄 Switching to ${switchChainName} network before buy...`);
        await switchNetwork(switchChainName);
        
        // Wait a moment for network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verify we're on the correct network after switch
        const newChainIdHex = await ethereumProvider.request({ method: 'eth_chainId' }) as string;
        const newChainId = parseInt(newChainIdHex.toLowerCase(), 16);
        
        if (newChainId !== expectedChainId) {
          throw new Error(`Please switch to ${chain} network in MetaMask and try again. Current: ${newChainIdHex}, Expected: ${expectedChainIdHex}`);
        }
        
        console.log(`✅ Successfully switched to ${chain} network (chainId: ${newChainIdHex})`);
      } else {
        console.log(`✅ Already on ${chain} network (chainId: ${currentChainIdHex})`);
      }

      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      
      const bondingCurveABI = [
        'function buy(uint256 tokenAmount) external payable',
        'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
        'function getCurrentPrice() external view returns (uint256)',
        'function isGraduated() external view returns (bool)',
        'function buyFeePercent() external view returns (uint256)',
        'function sellFeePercent() external view returns (uint256)',
      ];

      const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, signer);
      
      // Verify contract is on the correct chain
      const code = await provider.getCode(curveAddress);
      if (!code || code === '0x') {
        throw new Error(`Bonding curve contract not found at ${curveAddress} on ${chain}. Please deploy the token first.`);
      }
      
      // Check if graduated
      try {
        const graduated = await curveContract.isGraduated();
        if (graduated) {
          throw new Error('Token has graduated to DEX. Please use a DEX to buy.');
        }
      } catch (err: any) {
        if (err.message?.includes('graduated')) throw err;
      }
      
      const tokenAmount = ethers.parseUnits(amount, 18);
      console.log(`📊 Buying ${amount} tokens (${tokenAmount.toString()} wei)`);
      
      // Get price estimate with detailed logging and validation
      let priceEstimateWei: bigint;
      let buyFeePercent: bigint = BigInt(0); // Declare outside try block so it's accessible for fee calculation
      let currentPriceWei: bigint; // Declare outside try block so it's accessible for final validation
      
      try {
        // First get buy fee percent from contract (needed for accurate total cost calculation)
        try {
          buyFeePercent = await curveContract.buyFeePercent();
          console.log(`💰 Buy fee percent: ${buyFeePercent.toString()} (${Number(buyFeePercent) / 100}%)`);
        } catch (feeErr) {
          console.warn('⚠️ Could not fetch buy fee percent, assuming 0%');
          buyFeePercent = BigInt(0);
        }
        
        // First get current price to validate
        currentPriceWei = await curveContract.getCurrentPrice();
        const currentPriceEth = parseFloat(ethers.formatEther(currentPriceWei));
        console.log(`💰 Current price per token: ${currentPriceWei.toString()} wei (${currentPriceEth} ETH)`);
        
        // CRITICAL: Validate current price is reasonable BEFORE using it
        // For testnet: Maximum reasonable price per token should be very low (e.g., $0.10 max)
        // At ETH price ~$3000, that's about 0.000033 ETH per token max for testnet
        // For mainnet, we allow higher prices but still need reasonable limits
        // isTestnet is already declared at function level
        
        // Note: We don't block purchases based on price per token because:
        // 1. Bonding curve prices increase naturally as tokens are bought (this is expected behavior)
        // 2. The contract itself enforces maximum limits (100 ETH/BNB per transaction, 1 ETH per token)
        // 3. Blocking legitimate price increases would prevent users from buying popular tokens
        
        // Only warn about high prices but don't block (contract will reject if truly too high)
        const estimatedTotalPrice = currentPriceEth * parseFloat(amount);
        const estimatedTotalUSD = estimatedTotalPrice * 3000;
        
        if (estimatedTotalUSD > 100) {
          console.warn(`⚠️ High transaction cost: ${estimatedTotalPrice.toFixed(6)} ${chainSymbol} (~$${estimatedTotalUSD.toFixed(2)}) for ${amount} tokens`);
          console.warn(`   Contract maximum: 100 ${chainSymbol} per transaction`);
        }
        
        // Warn if price per token is very high (but don't block)
        if (currentPriceEth > 0.1) {
          const estimatedUSD = currentPriceEth * 3000;
          console.warn(`⚠️ High price per token: ${currentPriceEth} ${chainSymbol} (~$${estimatedUSD.toFixed(2)})`);
          console.warn(`   Contract maximum: 1 ${chainSymbol} per token`);
        }

        // Try to get price for amount
        try {
          const priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
          
          // First check: Validate the raw BigInt value before converting to ETH/BNB
          // Maximum reasonable price: 100 ETH/BNB = 100 * 10^18 wei
          const maxReasonableWei = ethers.parseEther('100');
          
          // CRITICAL: Check if price is astronomically high BEFORE any conversion
          // This catches the bug in old BondingCurve contracts
          if (priceFromContract > maxReasonableWei) {
            console.warn(`⚠️ Price from contract is too high (raw wei): ${priceFromContract.toString()}`);
            console.warn(`   Maximum reasonable: ${maxReasonableWei.toString()} wei (100 ${chainSymbol})`);
            console.warn(`   This indicates the contract has a calculation bug (old version).`);
            console.warn(`   Using fallback calculation based on current price.`);
            throw new Error('Contract price too high (BigInt check) - using fallback');
          }
          
          // Additional safety: Check if price is unreasonably large even before parsing
          // If price > 1e30 wei, it's definitely wrong (that's 1e12 ETH!)
          const absoluteMaxWei = ethers.parseEther('1000000'); // 1 million ETH/BNB absolute max
          if (priceFromContract > absoluteMaxWei) {
            console.error(`❌ Contract returned astronomically high price: ${priceFromContract.toString()} wei`);
            console.error(`   This is definitely a bug in the contract. Using fallback.`);
            throw new Error('Contract price astronomically high - using fallback');
          }
          
          // Convert to number for validation (but we already checked BigInt above)
          const priceEth = parseFloat(ethers.formatEther(priceFromContract));
          console.log(`💰 Price estimate from contract: ${priceFromContract.toString()} wei (${priceEth} ${chainSymbol})`);
          
          // Additional validation: Check if conversion resulted in invalid number
          if (isNaN(priceEth) || !isFinite(priceEth)) {
            console.warn(`⚠️ Price from contract is invalid (NaN or Infinity). Using fallback.`);
            throw new Error('Invalid price from contract - using fallback');
          }
          
          // TRUST THE CONTRACT: The contract's getPriceForAmount() is the source of truth
          // The contract itself enforces maximum limits:
          // - Maximum 1 ETH/BNB per token
          // - Maximum 100 ETH/BNB per transaction
          // We only check for truly astronomical prices (>100 ETH/BNB) that indicate bugs
          
          const estimatedPriceUSD = priceEth * 3000; // Rough ETH price estimate
          
          // Only reject if price is astronomically high (>100 ETH/BNB) - indicates a bug
          // The contract already enforces this limit, but we check here to give better error messages
          if (priceEth > 100) {
            console.error(`❌ Price from contract is astronomically high: ${priceEth} ${chainSymbol} (~$${estimatedPriceUSD.toFixed(2)}).`);
            console.error(`   Contract maximum: 100 ${chainSymbol} per transaction`);
            console.error(`   This likely indicates a bug in the contract or misconfigured bonding curve.`);
            throw new Error(
              `Price is astronomically high: ${priceEth.toFixed(6)} ${chainSymbol} (~$${estimatedPriceUSD.toFixed(2)}). ` +
              `Contract maximum is 100 ${chainSymbol} per transaction. ` +
              `This likely indicates a contract issue or misconfigured bonding curve parameters. Please contact support.`
            );
          }
          
          // Warn if price is high but still within contract limits
          if (estimatedPriceUSD > 1000) {
            console.warn(`⚠️ High transaction cost: ${priceEth} ${chainSymbol} (~$${estimatedPriceUSD.toFixed(2)})`);
            console.warn(`   Contract maximum: 100 ${chainSymbol} per transaction`);
          }
          
          // All validations passed - trust and use contract price
          priceEstimateWei = priceFromContract;
          console.log(`✅ Using contract price: ${priceEth} ${chainSymbol}`);
        } catch (priceErr: any) {
          // Check if the error is due to the 100 ETH maximum limit
          const errorMessage = priceErr.message || priceErr.reason || '';
          const errorData = priceErr.data || priceErr.revert?.args?.[0] || '';
          const isMaxPriceExceeded = errorMessage.includes('100 ETH') || 
                                     errorMessage.includes('Total price exceeds maximum') ||
                                     errorData.includes('100 ETH') ||
                                     errorData.includes('Total price exceeds maximum');
          
          if (isMaxPriceExceeded) {
            // Calculate maximum amount user can buy based on 100 ETH limit
            // Use current price as baseline (conservative estimate)
            // Estimate: maxAmount = maxPrice / currentPrice (conservative, actual will be slightly less due to curve)
            // For safety, use 90 ETH to account for curve effect
            const safeMaxPriceWei = ethers.parseEther('90'); // 90 ETH/BNB to be safe
            const estimatedMaxAmountWei = (safeMaxPriceWei * ethers.parseEther('1')) / currentPriceWei;
            const estimatedMaxAmount = parseFloat(ethers.formatEther(estimatedMaxAmountWei));
            
            console.error(`❌ Purchase amount exceeds contract's 100 ETH maximum limit`);
            console.error(`   Requested: ${amount} tokens`);
            console.error(`   Estimated maximum: ~${Math.floor(estimatedMaxAmount)} tokens (at current price)`);
            
            throw new Error(
              `Purchase amount too large: The contract has a maximum limit of 100 ${chainSymbol} per transaction.\n\n` +
              `You're trying to buy ${amount} tokens, which would exceed this limit.\n\n` +
              `Please try a smaller amount (suggested maximum: ~${Math.floor(estimatedMaxAmount)} tokens at current price).\n\n` +
              `The price increases with the bonding curve, so the maximum may be even lower.`
            );
          }
          
          // Fallback: use improved approximation that accounts for bonding curve
          // Only use fallback if the contract call actually failed (not just validation)
          const isValidationError = priceErr.message?.includes('exceeds maximum') || 
                                   priceErr.message?.includes('too high') ||
                                   priceErr.message?.includes('Price exceeds');
          
          if (isValidationError) {
            // If it's a validation error (price too high), don't use fallback - throw the error
            // This prevents sending transactions with insufficient funds
            console.error(`❌ Cannot proceed: ${priceErr.message}`);
            throw priceErr;
          }
          
          console.warn('⚠️ Contract price call failed, using fallback calculation');
          console.warn(`   Reason: ${priceErr.message || 'Contract price call failed'}`);
          console.warn('   WARNING: Fallback is an approximation and may not match contract exactly.');
          console.warn('   The transaction may fail if the estimate is too low.');
          
          // Improved fallback: For bonding curves, price increases with supply
          // The contract uses: price = basePrice + slope * (supply + amount/2) for average price
          // Our fallback: Use currentPrice * amount, but add a generous buffer (100%) to account for curve
          // This is a conservative estimate that's more likely to succeed than fail
          try {
            // Linear approximation: currentPrice * amount
            const linearPriceWei = (currentPriceWei * tokenAmount) / ethers.parseEther('1');
            
            // Check if even the linear price would exceed 100 ETH limit
            const maxPriceWei = ethers.parseEther('100');
            if (linearPriceWei > maxPriceWei) {
              // Calculate maximum amount user can buy
              const safeMaxPriceWei = ethers.parseEther('90'); // 90 ETH/BNB to be safe
              const estimatedMaxAmountWei = (safeMaxPriceWei * ethers.parseEther('1')) / currentPriceWei;
              const estimatedMaxAmount = parseFloat(ethers.formatEther(estimatedMaxAmountWei));
              
              throw new Error(
                `Purchase amount would exceed contract's 100 ${chainSymbol} maximum limit.\n\n` +
                `Please try a smaller amount (suggested maximum: ~${Math.floor(estimatedMaxAmount)} tokens at current price).`
              );
            }
            
            // Add 100% buffer to account for bonding curve (price increases with supply)
            // This is more conservative - the actual price could be significantly higher
            priceEstimateWei = (linearPriceWei * BigInt(200)) / BigInt(100);
            
            // Check if the buffered price exceeds 100 ETH limit
            if (priceEstimateWei > maxPriceWei) {
              // Calculate maximum amount user can buy (accounting for 100% buffer)
              const safeMaxPriceWei = ethers.parseEther('90'); // 90 ETH/BNB to account for buffer
              const estimatedMaxAmountWei = (safeMaxPriceWei * ethers.parseEther('1')) / currentPriceWei;
              // Account for the 100% buffer in the calculation
              const estimatedMaxAmount = parseFloat(ethers.formatEther(estimatedMaxAmountWei)) * 0.5; // 1/2 = 0.5
              
              throw new Error(
                `Purchase amount would exceed contract's 100 ${chainSymbol} maximum limit (even with fallback calculation).\n\n` +
                `Please try a smaller amount (suggested maximum: ~${Math.floor(estimatedMaxAmount)} tokens at current price).`
              );
            }
            
            const fallbackPriceEth = parseFloat(ethers.formatEther(priceEstimateWei));
            console.log(`💰 Fallback price estimate (with 100% curve buffer): ${priceEstimateWei.toString()} wei (${fallbackPriceEth} ${chainSymbol})`);
            
            // Validate fallback is reasonable
            if (isNaN(fallbackPriceEth) || !isFinite(fallbackPriceEth) || fallbackPriceEth <= 0) {
              throw new Error(`Invalid fallback price calculation: ${fallbackPriceEth}`);
            }
            
            // Calculate maximum reasonable fallback price (respect 100 ETH contract limit)
            const maxFallbackPrice = 90; // 90 ETH/BNB to stay under 100 ETH limit
            if (fallbackPriceEth > maxFallbackPrice) {
              // Calculate maximum amount user can buy
              const estimatedMaxAmountWei = (ethers.parseEther('90') * ethers.parseEther('1')) / currentPriceWei;
              const estimatedMaxAmount = parseFloat(ethers.formatEther(estimatedMaxAmountWei)) * 0.5; // Account for buffer
              
              throw new Error(
                `Fallback price too high: ${fallbackPriceEth.toFixed(6)} ${chainSymbol} for ${amount} tokens exceeds the 100 ${chainSymbol} contract limit.\n\n` +
                `Current price per token: ${currentPriceEth.toFixed(6)} ${chainSymbol}.\n\n` +
                `Please try a much smaller amount (suggested maximum: ~${Math.floor(estimatedMaxAmount)} tokens) or contact support.`
              );
            }
            
            console.log(`✅ Using fallback price: ${fallbackPriceEth} ${chainSymbol}`);
            console.warn(`⚠️ WARNING: This is an approximation. The transaction may still fail if the actual price is higher.`);
          } catch (fallbackErr: any) {
            console.error('❌ Fallback calculation failed:', fallbackErr);
            throw new Error(fallbackErr.message || `Failed to calculate price. Please try a much smaller amount (e.g., 100 tokens) or contact support.`);
          }
        }
      } catch (err: any) {
        console.error('⚠️ Error getting price estimate:', err);
        throw new Error(`Failed to get price estimate: ${err.message}. Please try again or contact support.`);
      }
      
      // Final validation: price should be valid (not NaN/Infinity) and within contract limits
      const finalPriceEth = parseFloat(ethers.formatEther(priceEstimateWei));
      const finalPriceUSD = finalPriceEth * 3000; // Rough ETH price estimate
      
      // Only validate that price is a valid number and within contract's 100 ETH/BNB limit
      if (priceEstimateWei <= 0 || isNaN(finalPriceEth) || !isFinite(finalPriceEth)) {
        throw new Error(
          `Invalid price estimate: ${finalPriceEth.toFixed(6)} ${chainSymbol} (~$${finalPriceUSD.toFixed(2)}). ` +
          `Please try again or contact support.`
        );
      }
      
      // Warn if price is very high but don't block (contract will reject if >100 ETH/BNB)
      if (finalPriceEth > 100) {
        throw new Error(
          `Price estimate exceeds contract maximum: ${finalPriceEth.toFixed(6)} ${chainSymbol} (~$${finalPriceUSD.toFixed(2)}). ` +
          `Contract maximum is 100 ${chainSymbol} per transaction. Please try a smaller amount.`
        );
      }
      
      // Warn if price is high but still acceptable
      if (finalPriceUSD > 1000) {
        console.warn(`⚠️ High transaction cost: ${finalPriceEth.toFixed(6)} ${chainSymbol} (~$${finalPriceUSD.toFixed(2)})`);
        console.warn(`   Contract maximum: 100 ${chainSymbol} per transaction`);
      }
      
      // Calculate total cost: price + fee (matching contract logic EXACTLY)
      // Contract logic (BondingCurve.sol line 263-264):
      //   uint256 fee = (price * buyFeePercent) / 10000;
      //   uint256 totalCost = price + fee;
      //   require(msg.value >= totalCost, "Insufficient payment");
      // 
      // CRITICAL: The contract will revert if msg.value < totalCost, so we must calculate this EXACTLY
      // buyFeePercent is in basis points (e.g., 100 = 1%, 50 = 0.5%, 0 = 0%)
      // Formula: fee = (price * buyFeePercent) / 10000
      // This matches Uniswap's fee calculation approach for precision
      
      // Calculate fee using exact same formula as contract (integer division for precision)
      // This ensures no rounding errors that could cause "Insufficient payment" errors
      const feeWei = (priceEstimateWei * buyFeePercent) / BigInt(10000);
      let totalCostWei = priceEstimateWei + feeWei;
      
      // Convert to human-readable format for logging
      const priceEth = parseFloat(ethers.formatEther(priceEstimateWei));
      const feeEth = parseFloat(ethers.formatEther(feeWei));
      const feePercentDisplay = Number(buyFeePercent) / 100; // Convert basis points to percentage
      let totalCostEth = parseFloat(ethers.formatEther(totalCostWei));
      
      // Detailed logging for fee transparency (like Uniswap does)
      console.log(`💰 Fee Calculation (matching contract exactly):`);
      console.log(`   Price (before fee): ${priceEstimateWei.toString()} wei = ${priceEth.toFixed(8)} ${chainSymbol}`);
      console.log(`   Fee rate: ${buyFeePercent.toString()} basis points = ${feePercentDisplay}%`);
      console.log(`   Fee amount: ${feeWei.toString()} wei = ${feeEth.toFixed(8)} ${chainSymbol}`);
      console.log(`   Total cost: ${totalCostWei.toString()} wei = ${totalCostEth.toFixed(8)} ${chainSymbol}`);
      
      // Validation: Ensure fee calculation is reasonable
      if (feeWei < 0 || feeWei > priceEstimateWei) {
        throw new Error(`Invalid fee calculation: fee (${feeEth}) cannot be negative or exceed price (${priceEth})`);
      }
      
      // Verify fee percentage matches expected rate (with small tolerance for rounding)
      const expectedFeeWei = (priceEstimateWei * buyFeePercent) / BigInt(10000);
      if (feeWei !== expectedFeeWei) {
        console.warn(`⚠️ Fee calculation mismatch: got ${feeWei.toString()}, expected ${expectedFeeWei.toString()}`);
      }
      
      // Add a small buffer (2%) to account for any rounding differences or price changes between estimate and execution
      // The contract will refund any excess, but we need to ensure msg.value >= totalCost
      // This buffer helps prevent transaction reverts due to minor price fluctuations
      const bufferPercent = BigInt(102); // 2% buffer
      totalCostWei = (totalCostWei * bufferPercent) / BigInt(100);
      totalCostEth = parseFloat(ethers.formatEther(totalCostWei));
      console.log(`💰 Total cost with 2% buffer: ${totalCostEth.toFixed(6)} ${chainSymbol}`);
      
      // Final validation before sending - must be valid and within contract limits
      const totalCostUSD = totalCostEth * 3000; // Rough ETH price estimate
      
      // Only validate that total cost is a valid number and within contract's 100 ETH/BNB limit
      if (isNaN(totalCostEth) || !isFinite(totalCostEth) || totalCostWei <= 0) {
        throw new Error(
          `Invalid total cost calculation: ${totalCostEth.toFixed(6)} ${chainSymbol}. ` +
          `Please try again or contact support.`
        );
      }
      
      // Only reject if total cost exceeds contract's 100 ETH/BNB limit
      if (totalCostEth > 100) {
        // Calculate maximum amount user can buy based on contract limit
        const safeMaxPriceWei = ethers.parseEther('90'); // 90 ETH/BNB to be safe (contract allows 100)
        const estimatedMaxAmountWei = (safeMaxPriceWei * ethers.parseEther('1')) / currentPriceWei;
        const estimatedMaxAmount = parseFloat(ethers.formatEther(estimatedMaxAmountWei));
        
        throw new Error(
          `Total cost exceeds contract maximum: ${totalCostEth.toFixed(6)} ${chainSymbol} (~$${totalCostUSD.toFixed(2)}) ` +
          `exceeds contract limit of 100 ${chainSymbol} per transaction.\n\n` +
          `Please try a smaller amount (suggested maximum: ~${Math.floor(estimatedMaxAmount)} tokens at current price). ` +
          `The price increases with the bonding curve, so the maximum may be even lower.`
        );
      }
      
      // Warn if total cost is high but still acceptable
      if (totalCostUSD > 1000) {
        console.warn(`⚠️ High total transaction cost: ${totalCostEth.toFixed(6)} ${chainSymbol} (~$${totalCostUSD.toFixed(2)})`);
        console.warn(`   Contract maximum: 100 ${chainSymbol} per transaction`);
      }
      
      console.log(`🚀 Sending buy transaction with value: ${totalCostWei.toString()} wei (${totalCostEth.toFixed(6)} ${chainSymbol})`);
      
      const tx = await curveContract.buy(tokenAmount, {
        value: totalCostWei,
        gasLimit: 500000,
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'buy-tx' });
      
      const receipt = await tx.wait();
      
      // Calculate price per token from the transaction (use priceEstimateWei, not totalCostWei which includes fees)
      const pricePerToken = parseFloat(ethers.formatEther(priceEstimateWei)) / parseFloat(amount);
      
      // Record transaction in backend for chart display
      try {
        await axios.post(`${API_BASE}/transactions`, {
          tokenId,
          chain: chain.toLowerCase(),
          txHash: receipt.hash,
          type: 'buy',
          fromAddress: address,
          toAddress: curveAddress,
          amount: amount,
          price: pricePerToken,
          status: 'confirmed',
        });
        console.log('✅ Transaction recorded for chart');
      } catch (recordError) {
        console.warn('⚠️ Failed to record transaction (non-critical):', recordError);
        // Don't fail the buy if recording fails
      }
      
      toast.success(`Successfully bought ${amount} ${tokenSymbol}!`, { id: 'buy-tx' });
      
      // Track successful purchase
      trackTokenTransaction({
        type: 'buy',
        tokenId,
        tokenSymbol,
        chain: chain.toLowerCase(),
        amount: amount,
        value: finalPriceEth.toFixed(6),
      });
      
      setAmount('');
      onSuccess?.();
      
      const testnetInfo = getTestnetInfo(chain as any);
      if (testnetInfo) {
        setTimeout(() => {
          window.open(`${testnetInfo.explorer}/tx/${receipt.hash}`, '_blank');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Buy error:', error);
      
      if (error.code === 4001) {
        toast.error('Transaction rejected by user', { id: 'buy-tx' });
      } else if (error.message?.includes('insufficient') || error.code === 'INSUFFICIENT_FUNDS' || error.info?.error?.message?.includes('insufficient')) {
        const faucetLinks = {
          ethereum: 'https://sepoliafaucet.com',
          bsc: 'https://testnet.bnbchain.org/faucet-smart',
          base: 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet',
        };
        const faucetLink = faucetLinks[chain as keyof typeof faucetLinks] ? ` Get testnet tokens: ${faucetLinks[chain as keyof typeof faucetLinks]}` : '';
        toast.error(`Insufficient funds. You need more ${chainSymbol} to complete this transaction.${faucetLink}`, { 
          id: 'buy-tx',
          duration: 6000 
        });
      } else if (error.message?.includes('graduated')) {
        toast.error('Token has graduated to DEX. Please use a DEX to buy.', { id: 'buy-tx' });
      } else if (error.message?.includes('100 ETH') || error.message?.includes('100 BNB') || error.message?.includes('maximum limit')) {
        // Show the error message with line breaks for better readability
        const errorMsg = error.message.replace(/\n\n/g, '\n');
        toast.error(errorMsg, { id: 'buy-tx', duration: 10000 });
      } else {
        toast.error(error.message || 'Failed to buy tokens', { id: 'buy-tx' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isValidAddress) {
      toast.error('Bonding curve contract is not deployed. Please deploy the token first.');
      return;
    }

    try {
      setLoading(true);
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(getPreferredEVMProvider());
      const signer = await provider.getSigner();
      
      const tokenABI = [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
      ];

      const bondingCurveABI = [
        'function sell(uint256 tokenAmount) external',
        'function isGraduated() external view returns (bool)',
      ];

      // Check if contracts are deployed
      const ethersProvider = new ethers.BrowserProvider(getPreferredEVMProvider());
      const curveCode = await ethersProvider.getCode(curveAddress);
      if (!curveCode || curveCode === '0x') {
        throw new Error('Bonding curve contract is not deployed.');
      }

      const tokenCode = await ethersProvider.getCode(tokenAddress);
      if (!tokenCode || tokenCode === '0x') {
        throw new Error('Token contract is not deployed.');
      }

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, signer);

      // Check if graduated
      try {
        const graduated = await curveContract.isGraduated();
        if (graduated) {
          throw new Error('Token has graduated to DEX. Please use a DEX to sell.');
        }
      } catch (err: any) {
        if (err.message?.includes('graduated')) throw err;
      }
      
      const tokenAmount = ethers.parseUnits(amount, 18);
      
      // Check balance
      const balance = await tokenContract.balanceOf(address);
      if (balance < tokenAmount) {
        throw new Error('Insufficient token balance');
      }
      
      // Check and approve if needed
      const allowance = await tokenContract.allowance(address, curveAddress);
      if (allowance < tokenAmount) {
        toast.loading('Approving tokens...', { id: 'approve' });
        const approveTx = await tokenContract.approve(curveAddress, ethers.MaxUint256);
        await approveTx.wait();
        toast.success('Tokens approved', { id: 'approve' });
      }
      
      toast.loading('Selling tokens...', { id: 'sell-tx' });
      const tx = await curveContract.sell(tokenAmount, {
        gasLimit: 500000,
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'sell-tx' });
      
      const receipt = await tx.wait();
      
      // Get price per token from contract for sell transaction
      let pricePerToken = currentPrice;
      try {
        const currentPriceWei = await curveContract.getCurrentPrice();
        pricePerToken = parseFloat(ethers.formatEther(currentPriceWei));
      } catch (err) {
        console.warn('Could not get current price for sell transaction, using prop value');
      }
      
      // Record transaction in backend for chart display
      try {
        await axios.post(`${API_BASE}/transactions`, {
          tokenId,
          chain: chain.toLowerCase(),
          txHash: receipt.hash,
          type: 'sell',
          fromAddress: address,
          toAddress: curveAddress,
          amount: amount,
          price: pricePerToken,
          status: 'confirmed',
        });
        console.log('✅ Transaction recorded for chart');
      } catch (recordError) {
        console.warn('⚠️ Failed to record transaction (non-critical):', recordError);
        // Don't fail the sell if recording fails
      }
      
      toast.success(`Successfully sold ${amount} ${tokenSymbol}!`, { id: 'sell-tx' });
      
      // Track successful sale
      trackTokenTransaction({
        type: 'sell',
        tokenId,
        tokenSymbol,
        chain: chain.toLowerCase(),
        amount: amount,
        value: (pricePerToken * parseFloat(amount)).toFixed(6),
      });
      
      setAmount('');
      onSuccess?.();
      
      const testnetInfo = getTestnetInfo(chain as any);
      if (testnetInfo) {
        setTimeout(() => {
          window.open(`${testnetInfo.explorer}/tx/${receipt.hash}`, '_blank');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Sell error:', error);
      
      if (error.code === 4001) {
        toast.error('Transaction rejected by user', { id: 'sell-tx' });
      } else if (error.message?.includes('Insufficient')) {
        toast.error('Insufficient balance', { id: 'sell-tx' });
      } else {
        toast.error(error.message || 'Failed to sell tokens', { id: 'sell-tx' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get chain-specific currency symbol for display
  const chainSymbol = getChainSymbol(chain);
  
  // Debug: Log chain info to help diagnose currency display issues
  useEffect(() => {
    if (chain) {
      console.log(`🔍 BuyWidget chain info: chain="${chain}", symbol="${chainSymbol}"`);
    }
  }, [chain, chainSymbol]);

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Trade {tokenSymbol}</h2>
            <p className="text-sm text-gray-400">Buy and sell on bonding curve</p>
          </div>
        </div>
        {!isValidAddress && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Not Deployed</span>
          </div>
        )}
      </div>

      {/* Current Price Display */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Price</p>
            <p className="text-3xl font-bold text-white">
              ${realCurrentPrice !== null ? realCurrentPrice.toFixed(6) : currentPrice.toFixed(6)}
            </p>
            {realCurrentPrice !== null && realCurrentPrice !== currentPrice && (
              <p className="text-xs text-yellow-400 mt-1">
                (Displayed: ${currentPrice.toFixed(6)} may be outdated)
              </p>
            )}
            {debugInfo && (
              <div className="mt-3 pt-3 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 mb-2">📊 Bonding Curve Parameters:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Base Price:</span>
                    <span className="text-white ml-1">${(parseFloat(debugInfo.basePrice) * 3000).toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Slope:</span>
                    <span className="text-white ml-1">${(parseFloat(debugInfo.slope) * 3000).toFixed(6)}/token</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Local Supply:</span>
                    <span className="text-white ml-1">{debugInfo.localSupply} tokens</span>
                  </div>
                  {debugInfo.globalSupply && (
                    <div>
                      <span className="text-yellow-400">Global Supply:</span>
                      <span className="text-yellow-400 ml-1">{debugInfo.globalSupply} tokens ⚠️</span>
                    </div>
                  )}
                </div>
                {debugInfo.useGlobalSupply && debugInfo.globalSupply && (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Using global supply (cross-chain sync enabled). Price includes tokens from all chains.
                  </p>
                )}
                {debugInfo && realCurrentPrice && (
                  <p className="text-xs text-gray-500 mt-2">
                    Price = ${(parseFloat(debugInfo.basePrice) * 3000).toFixed(6)} + (${(parseFloat(debugInfo.slope) * 3000).toFixed(6)} × {(debugInfo.globalSupply || debugInfo.localSupply)})
                    {' = '}${realCurrentPrice.toFixed(6)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Chain</p>
            <p className="text-lg font-semibold text-primary-400 capitalize">{chain}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-900/50 rounded-lg p-1">
        <button
          onClick={() => {
            setTab('buy');
            setAmount('');
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
            tab === 'buy'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          data-sell-tab
          onClick={() => {
            setTab('sell');
            setAmount('');
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
            tab === 'sell'
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/50'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {tab === 'buy' ? `Amount to Buy (${tokenSymbol})` : `Amount to Sell (${tokenSymbol})`}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.1"
              min="0"
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {amount && parseFloat(amount) > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  onClick={() => setAmount('')}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Estimate Display */}
        {amount && parseFloat(amount) > 0 && priceEstimate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {tab === 'buy' ? 'Est. Cost' : 'Est. Receive'}
                </span>
                <span className="text-lg font-bold text-white">
                  {priceEstimate.toFixed(6)} {chainSymbol}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {tab === 'buy' ? 'You Will Receive' : 'You Will Sell'}
                </span>
                <span className="text-lg font-semibold text-primary-400">
                  {tokensEstimate?.toFixed(4)} {tokenSymbol}
                </span>
              </div>
              {tab === 'buy' && (
                <div className="pt-2 border-t border-gray-700/50">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Rate</span>
                    <span>1 {tokenSymbol} = ${(priceEstimate / (tokensEstimate || 1)).toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Wallet Connection Warning */}
        {!isConnected && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-300 mb-1">Wallet Not Connected</p>
              <p className="text-sm text-yellow-200/80">Please connect your wallet to trade</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            trackButtonClick({
              buttonName: tab === 'buy' ? 'buy_tokens' : 'sell_tokens',
              location: 'buy_widget',
              additionalData: {
                tokenId,
                tokenSymbol,
                chain: chain.toLowerCase(),
                amount,
                tab,
              },
            });
            if (tab === 'buy') {
              handleBuy();
            } else {
              handleSell();
            }
          }}
          disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0 || !isValidAddress}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            tab === 'buy'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 text-white shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/70'
              : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-700 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/70'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {tab === 'buy' ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Buy {tokenSymbol}
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5" />
                  Sell {tokenSymbol}
                </>
              )}
            </>
          )}
        </button>

        {!isValidAddress && (
          <p className="text-center text-sm text-yellow-400">
            Contract not deployed. Deploy token first to enable trading.
          </p>
        )}
      </div>
    </div>
  );
}

