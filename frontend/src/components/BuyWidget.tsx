import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getTestnetInfo, getPreferredEVMProvider, switchNetwork, getHederaWalletRecommendation, getHashPackProvider, checkHashPackExtensionInstalled } from '../services/blockchain';
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
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: walletClient } = useWalletClient();
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
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Allow overriding RPC URLs via VITE_*_RPC_URL env vars (e.g. VITE_BSC_TESTNET_RPC_URL)
  const getEnvRpcUrl = (keys: string[]): { url: string; source: string } | null => {
    const env = import.meta.env as Record<string, string | undefined>;
    for (const key of keys) {
      const value = env[key];
      if (typeof value === 'string' && value.trim()) {
        return { url: value.trim(), source: key };
      }
    }
    return null;
  };

  // Get RPC URL for a specific chain
  const getRpcUrlForChain = (chainName: string): string => {
    const chainLower = chainName.toLowerCase().trim();
    
    console.log(`🔍 Getting RPC URL for chain: "${chainName}" (normalized: "${chainLower}")`);
    
    // Handle Unichain Sepolia testnet (most specific first - check before "sepolia" alone)
    if (chainLower === 'unichain-sepolia' || (chainLower.includes('unichain') && chainLower.includes('sepolia'))) {
      const envOverride = getEnvRpcUrl(['VITE_UNICHAIN_SEPOLIA_RPC_URL', 'VITE_UNICHAIN_RPC_URL', 'VITE_UNICHAIN_TESTNET_RPC_URL']);
      if (envOverride) {
        console.log(`   → Using Unichain Sepolia RPC override from ${envOverride.source}`);
        return envOverride.url;
      }
      console.log(`   → Using Unichain Sepolia RPC`);
      return 'https://sepolia.unichain.org';
    }
    
    // Handle Base Sepolia testnet (most specific first - check before "sepolia" alone)
    if (chainLower === 'base-sepolia' || (chainLower.includes('base') && chainLower.includes('sepolia'))) {
      console.log(`   → Using Base Sepolia RPC`);
      return 'https://base-sepolia-rpc.publicnode.com';
    }
    
    // Handle BSC Testnet (check before "bsc" alone)
    if (chainLower === 'bsc-testnet' || (chainLower.includes('bsc') && chainLower.includes('testnet'))) {
      const envOverride = getEnvRpcUrl(['VITE_BSC_TESTNET_RPC_URL', 'VITE_BSC_RPC_URL']);
      if (envOverride) {
        console.log(`   → Using BSC Testnet RPC override from ${envOverride.source}`);
        return envOverride.url;
      }
      // Default to Thirdweb aggregator which is CORS-friendly for browser requests
      console.log(`   → Using BSC Testnet RPC (thirdweb)`);
      return 'https://bsc-testnet.rpc.thirdweb.com';
    }
    
    // Handle Ethereum/Sepolia testnet (check after base-sepolia and unichain-sepolia to avoid false matches)
    if (chainLower === 'sepolia' || (chainLower.includes('sepolia') && !chainLower.includes('base') && !chainLower.includes('unichain'))) {
      console.log(`   → Using Sepolia RPC`);
      return 'https://ethereum-sepolia-rpc.publicnode.com';
    }
    
    // Handle base chain names (might be stored without testnet suffix)
    if (chainLower === 'base') {
      console.log(`   → Using Base Sepolia RPC (defaulting to testnet)`);
      return 'https://base-sepolia-rpc.publicnode.com';
    }
    
    if (chainLower === 'bsc' || chainLower === 'binance') {
      const envOverride = getEnvRpcUrl(['VITE_BSC_RPC_URL']);
      if (envOverride) {
        console.log(`   → Using BSC RPC override from ${envOverride.source}`);
        return envOverride.url;
      }
      console.log(`   → Using BSC RPC (defaulting to BSC Testnet thirdweb endpoint)`);
      return 'https://bsc-testnet.rpc.thirdweb.com';
    }
    
    if (chainLower === 'ethereum' || chainLower === 'eth') {
      console.log(`   → Using Sepolia RPC (defaulting to testnet)`);
      return 'https://ethereum-sepolia-rpc.publicnode.com';
    }
    
    // Handle Hedera Testnet
    if (chainLower === 'hedera-testnet' || chainLower.includes('hedera')) {
      console.log(`   → Using Hedera Testnet RPC`);
      return 'https://testnet.hashio.io/api';
    }
    
    // Handle generic Unichain (fallback to testnet if mainnet not specified)
    if (chainLower === 'unichain') {
      const envOverride = getEnvRpcUrl(['VITE_UNICHAIN_RPC_URL', 'VITE_UNICHAIN_TESTNET_RPC_URL']);
      if (envOverride) {
        console.log(`   → Using Unichain RPC override from ${envOverride.source}`);
        return envOverride.url;
      }
      console.log(`   → Using Unichain Sepolia RPC (defaulting to testnet)`);
      return 'https://sepolia.unichain.org';
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
          'function getSupplyForPricing() external view returns (uint256)',
        ];
        const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, ethersProvider);
        
        // Get all values in parallel
        const [currentPriceWei, basePriceWei, slopeWei, localSupplyWei, useGlobalSupply, supplyForPricingWei] = await Promise.all([
          curveContract.getCurrentPrice(),
          curveContract.basePrice(),
          curveContract.slope(),
          curveContract.totalSupplySold(),
          curveContract.useGlobalSupply(),
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
    // Refresh price every 30 seconds (reduced from 10 to reduce excessive logging)
    const interval = setInterval(fetchCurrentPrice, 30000);
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

  // Fetch token balance when sell tab is active and wallet is connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (tab !== 'sell' || !isConnected || !address || !tokenAddress || !isValidAddress) {
        setTokenBalance('0');
        return;
      }

      try {
        setBalanceLoading(true);
        const rpcUrl = getRpcUrlForChain(chain);
        const ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
        
        const tokenABI = ['function balanceOf(address account) external view returns (uint256)'];
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, ethersProvider);
        
        const balanceWei = await tokenContract.balanceOf(address);
        const balanceFormatted = ethers.formatUnits(balanceWei, 18);
        setTokenBalance(balanceFormatted);
      } catch (error: any) {
        console.error('Error fetching token balance:', error);
        setTokenBalance('0');
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
    // Refresh balance every 5 seconds when on sell tab
    const interval = tab === 'sell' ? setInterval(fetchBalance, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [tab, isConnected, address, tokenAddress, chain, isValidAddress]);

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
        
        // Try to use getPriceForAmountLocal() first (new contracts)
        // Fallback to getPriceForAmount() for older contracts
        const bondingCurveABI = [
          'function getPriceForAmountLocal(uint256 tokenAmount) external view returns (uint256)',
          'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
          'function getCurrentPrice() external view returns (uint256)',
          'function buyFeePercent() external view returns (uint256)',
          'function sellFeePercent() external view returns (uint256)',
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
          // CRITICAL: Use getPriceForAmountLocal() which matches EXACTLY what buy() uses
          // This ensures the estimate matches the transaction price perfectly
          // Fallback to getPriceForAmount() for older contracts, then manual calculation
          let priceFromContract: bigint;
          try {
            priceFromContract = await curveContract.getPriceForAmountLocal(tokenAmount);
          } catch (err: any) {
            console.warn('⚠️ getPriceForAmountLocal() failed, trying fallbacks:', err.message);
            
            // Fallback 1: Try getPriceForAmount()
            try {
              priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
              console.log('✅ Using getPriceForAmount() as fallback');
            } catch (fallbackErr: any) {
              console.warn('⚠️ getPriceForAmount() also failed, trying manual calculation');
              
              // Fallback 2: Manual calculation using basePrice and slope
              try {
                const [basePriceWei, slopeWei, localSupplyWei] = await Promise.all([
                  curveContract.basePrice().catch(() => null),
                  curveContract.slope().catch(() => null),
                  curveContract.totalSupplySold().catch(() => null),
                ]);
                
                if (basePriceWei && slopeWei !== null && localSupplyWei !== null) {
                  // Manual calculation matching contract logic
                  const supplyInTokens = Number(localSupplyWei) / 1e18;
                  const amountInTokens = Number(tokenAmount) / 1e18;
                  const supplyForAvgPrice = supplyInTokens + (amountInTokens / 2);
                  
                  // Price per token = basePrice + (slope * supplyForAvgPrice)
                  const pricePerTokenWei = Number(basePriceWei) + (Number(slopeWei) * supplyForAvgPrice);
                  
                  // Total price = pricePerToken * amountInTokens
                  const totalPriceWei = BigInt(Math.floor(pricePerTokenWei * amountInTokens));
                  
                  console.log('📊 Using manual price calculation for estimate:', {
                    basePrice: ethers.formatEther(basePriceWei),
                    slope: ethers.formatEther(slopeWei),
                    supply: supplyInTokens,
                    amount: amountInTokens,
                    totalPrice: ethers.formatEther(totalPriceWei),
                  });
                  
                  priceFromContract = totalPriceWei;
                } else {
                  // If we can't get contract params, use currentPrice * amount as last resort
                  console.warn('⚠️ Could not get contract parameters, using currentPrice * amount as estimate');
                  priceFromContract = BigInt(Math.floor(currentPriceEth * parseFloat(amount) * 1e18));
                }
              } catch (manualErr: any) {
                // Last resort: use currentPrice * amount
                console.warn('⚠️ Manual calculation failed, using currentPrice * amount:', manualErr.message);
                priceFromContract = BigInt(Math.floor(currentPriceEth * parseFloat(amount) * 1e18));
              }
            }
          }
          
          try {
            
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
            
            // CRITICAL FIX: Use EXACT transaction calculation
            // getPriceForAmountLocal() matches what buy() uses, so price is accurate
            // Now calculate fee and total cost exactly as the transaction does
            let buyFeePercent: bigint = BigInt(0);
            try {
              buyFeePercent = await curveContract.buyFeePercent();
            } catch (feeErr) {
              console.warn('⚠️ Could not fetch buy fee percent, assuming 0%');
              buyFeePercent = BigInt(0);
            }
            
            // Calculate fee and total cost EXACTLY as buy() does:
            // fee = (price * buyFeePercent) / 10000
            // totalCost = price + fee
            const feeWei = (priceFromContract * buyFeePercent) / BigInt(10000);
            let totalCostWei = priceFromContract + feeWei;
            
            // Add 2% buffer (matching handleBuy logic) to account for rounding/price changes
            const bufferPercent = BigInt(102);
            totalCostWei = (totalCostWei * bufferPercent) / BigInt(100);
            
            const totalCostEth = Number(ethers.formatEther(totalCostWei));
            
            // Only reject if truly astronomical (>100 ETH/BNB)
            if (totalCostEth > 100) {
              console.warn(`⚠️ Total cost too high: ${totalCostEth} ${chainSymbol}`);
              setPriceEstimate(null);
              setTokensEstimate(null);
              return;
            }
            
            // Warn if price is much higher than expected (but still show it)
            if (expectedPriceEth > 0 && priceEth > expectedPriceEth * 2) {
              console.warn(`⚠️ Contract price higher than expected (${priceEth} vs ${expectedPriceEth} ${chainSymbol})`);
              console.warn(`   This might indicate high bonding curve parameters or accumulated supply.`);
            }
            
            // Set estimate - this now matches the transaction calculation EXACTLY
            setPriceEstimate(totalCostEth);
            setTokensEstimate(parseFloat(amount));
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
          // Use getPriceForAmountLocal() for consistency (sell also uses local supply)
          // Fallback to getPriceForAmount() for older contracts
          let priceFromContract: bigint;
          try {
            priceFromContract = await curveContract.getPriceForAmountLocal(tokenAmount);
          } catch (err: any) {
            // Fallback for older contracts that don't have getPriceForAmountLocal()
            if (err.message?.includes('getPriceForAmountLocal')) {
              console.warn('⚠️ Contract does not have getPriceForAmountLocal(), using getPriceForAmount() (may be less accurate)');
              priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
            } else {
              throw err;
            }
          }
          
          try {
            // CRITICAL: Check BigInt value BEFORE conversion
            if (priceFromContract > maxReasonableWei) {
              console.warn(`⚠️ Contract price too high, using fallback`);
              setPriceEstimate(expectedPriceEth);
              setTokensEstimate(parseFloat(amount));
              return;
            }
            
            const priceEth = parseFloat(ethers.formatEther(priceFromContract));
            
            // For sell, we need to subtract the sell fee
            // Get sell fee percent and calculate amount received
            let sellFeePercent: bigint = BigInt(0);
            try {
              sellFeePercent = await curveContract.sellFeePercent();
            } catch (feeErr) {
              console.warn('⚠️ Could not fetch sell fee percent, assuming 0%');
              sellFeePercent = BigInt(0);
            }
            
            // Calculate amount received EXACTLY as sell() does:
            // fee = (price * sellFeePercent) / 10000
            // amountReceived = price - fee
            const feeWei = (priceFromContract * sellFeePercent) / BigInt(10000);
            const amountReceivedWei = priceFromContract - feeWei;
            const amountReceivedEth = Number(ethers.formatEther(amountReceivedWei));
            
            // Only use fallback if price is truly astronomical (>100 ETH/BNB) or way off
            // Allow prices up to contract limit (100 ETH/BNB)
            if (priceEth > 100 || (expectedPriceEth > 0.0001 && priceEth > expectedPriceEth * 1000)) {
              console.warn(`⚠️ Contract price seems incorrect, using safe fallback`);
              setPriceEstimate(expectedPriceEth);
              setTokensEstimate(parseFloat(amount));
            } else {
              // Set estimate to amount received (after fee)
              setPriceEstimate(amountReceivedEth);
              setTokensEstimate(parseFloat(amount));
            }
          } catch {
            setPriceEstimate(expectedPriceEth);
            setTokensEstimate(parseFloat(amount));
          }
        }
      } catch (error: any) {
        console.error('Error calculating estimate:', error);
        console.error('Estimate error details:', {
          message: error?.message,
          code: error?.code,
          data: error?.data,
          reason: error?.reason
        });
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
    
    // Handle Hedera
    if (chainLower === 'hedera' || 
        chainLower === 'hedera-testnet' ||
        chainLower.includes('hedera')) {
      return 'HBAR';
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
      
      // For Hedera, check if user has recommended wallet (HashPack)
      const chainLower = chain.toLowerCase();
      const isWalletConnect = connector?.id === 'walletConnect' || connector?.id === 'walletConnectLegacy' || connector?.name?.toLowerCase().includes('walletconnect');
      
      if (chainLower.includes('hedera')) {
        // If connected via WalletConnect, allow the transaction (HashPack can connect via WalletConnect)
        if (isWalletConnect) {
          console.log('✅ Connected via WalletConnect - HashPack may be connected through WalletConnect');
          console.log('   Allowing transaction to proceed...');
        } else {
          const recommendation = getHederaWalletRecommendation();
          
          // Debug: Log detection details with full provider information
          const detectionDetails = {
            hasRecommended: recommendation.hasRecommended,
            windowHashpack: !!(window as any).hashpack,
            windowEthereum: !!window.ethereum,
            ethereumIsHashPack: !!(window.ethereum as any)?.isHashPack,
            ethereumIsMetaMask: window.ethereum?.isMetaMask,
            ethereumIsPhantom: !!(window.ethereum as any)?.isPhantom,
            providers: window.ethereum?.providers?.length || 0,
            providerDetails: window.ethereum?.providers?.map((p: any, idx: number) => ({
              index: idx,
              isMetaMask: p.isMetaMask,
              isHashPack: p.isHashPack,
              isPhantom: (p as any).isPhantom,
              isCoinbase: (p as any).isCoinbaseWallet,
              constructor: p.constructor?.name,
              keys: Object.keys(p).filter(k => k.includes('hash') || k.includes('Hash') || k.includes('pack') || k.includes('Pack')).slice(0, 5),
            })) || [],
          };
          console.log('🔍 HashPack detection check:', JSON.stringify(detectionDetails, null, 2));
          
          // Also log the raw providers array for debugging
          if (window.ethereum?.providers) {
            console.log('🔍 Raw providers array:', window.ethereum.providers);
            window.ethereum.providers.forEach((p: any, idx: number) => {
              console.log(`   Provider ${idx}:`, {
                isMetaMask: p.isMetaMask,
                isHashPack: p.isHashPack,
                isPhantom: (p as any).isPhantom,
                constructor: p.constructor?.name,
                allKeys: Object.keys(p).slice(0, 10), // First 10 keys
              });
            });
          }
          
          // Try to manually find HashPack in providers array
          if (!recommendation.hasRecommended && window.ethereum?.providers) {
            const hashpackProvider = getHashPackProvider();
            if (hashpackProvider) {
              console.log('✅ HashPack found manually in providers array!');
              // Update window.ethereum to use HashPack provider
              // This is a workaround - we'll use the HashPack provider directly
              console.log('   HashPack will be used for this transaction');
              // Don't show warning since we found it
            } else {
              // HashPack not found - show helpful message
              if (window.ethereum.isMetaMask) {
                console.warn('⚠️ MetaMask detected, but HashPack is recommended for Hedera');
                toast(
                  'HashPack is recommended for Hedera transactions.\n\n' +
                  'If you have HashPack installed, you may need to:\n' +
                  '1. Disable MetaMask temporarily, or\n' +
                  '2. Use HashPack directly by connecting it first\n\n' +
                  'Proceeding with MetaMask, but HashPack provides better Hedera support.',
                  { 
                    id: 'hedera-wallet-warning',
                    duration: 12000,
                    icon: '⚠️',
                  }
                );
              } else {
                console.warn('⚠️ HashPack not detected. Proceeding with current wallet...');
                toast(
                  'HashPack not detected. If you have HashPack installed, make sure it\'s enabled. Proceeding with current wallet...',
                  { 
                    id: 'hedera-wallet-warning',
                    duration: 8000,
                    icon: '⚠️',
                  }
                );
              }
            }
          } else if (!recommendation.hasRecommended) {
            // No providers array or HashPack not found
            if (window.ethereum) {
              const isMetaMask = window.ethereum.isMetaMask;
              if (isMetaMask) {
                console.warn('⚠️ MetaMask detected, but HashPack is recommended for Hedera');
                toast(
                  'HashPack is recommended for Hedera. MetaMask will work, but HashPack provides better support.\n\n' +
                  'Install HashPack: https://www.hashpack.app/',
                  { 
                    id: 'hedera-wallet-warning',
                    duration: 10000,
                    icon: '⚠️',
                  }
                );
              } else {
                console.warn('⚠️ HashPack not detected, but wallet exists. Proceeding...');
              }
            } else {
              // No wallet at all - show full error
              const errorMessage = 
                `HashPack wallet is recommended for Hedera transactions.\n\n` +
                `HashPack provides native Hedera support and better compatibility than MetaMask.\n\n` +
                `Installation:\n${recommendation.instructions.join('\n')}\n\n` +
                `Alternatively, you can use MetaMask with Hedera Wallet Snap, but HashPack is recommended for the best experience.`;
              
              toast.error(errorMessage, { 
                id: 'hedera-wallet',
                duration: 15000,
              });
              
              setLoading(false);
              throw new Error('HashPack wallet is recommended for Hedera. Please install HashPack or use MetaMask with Hedera Wallet Snap configured for testnet.');
            }
          } else {
            console.log('✅ HashPack detected - recommended wallet for Hedera');
          }
        }
      }

      // Check for window.ethereum - but allow WalletConnect connections even if it doesn't exist
      if (typeof window.ethereum === 'undefined' && !isWalletConnect) {
        if (chainLower.includes('hedera')) {
          throw new Error('No Hedera wallet detected. Please install HashPack wallet (recommended) or MetaMask with Hedera Wallet Snap.');
        }
        throw new Error('MetaMask is not installed');
      }

      // Check current network first
      // When connected via WalletConnect, use wagmi's walletClient instead of window.ethereum
      let ethereumProvider: any;
      if (isWalletConnect && walletClient) {
        console.log('✅ Using WalletConnect provider from wagmi');
        // Convert viem walletClient to EIP-1193 provider
        ethereumProvider = {
          request: async (args: { method: string; params?: any[] }) => {
            if (args.method === 'eth_chainId') {
              const chainId = await walletClient.getChainId();
              return `0x${chainId.toString(16)}`;
            }
            if (args.method === 'eth_requestAccounts') {
              return [address];
            }
            // For other methods, use walletClient
            return await walletClient.request(args as any);
          },
        };
      } else {
        ethereumProvider = getPreferredEVMProvider(chain);
      }
      
      const currentChainIdHex = await ethereumProvider.request({ method: 'eth_chainId' }) as string;
      
      // Map chain name to chain ID (handle testnet variants)
      // chainLower already declared above
      let expectedChainIdHex: string;
      let switchChainName: 'ethereum' | 'bsc' | 'base' | 'hedera' | 'unichain';
      
      if (chainLower.includes('bsc') || chainLower === 'bsc-testnet') {
        expectedChainIdHex = '0x61'; // BSC Testnet
        switchChainName = 'bsc';
      } else if (chainLower.includes('ethereum') || chainLower === 'sepolia' || chainLower === 'eth') {
        expectedChainIdHex = '0xAA36A7'; // Sepolia
        switchChainName = 'ethereum';
      } else if (chainLower.includes('base') || chainLower === 'base-sepolia') {
        expectedChainIdHex = '0x14A34'; // Base Sepolia
        switchChainName = 'base';
      } else if (chainLower.includes('hedera') || chainLower === 'hedera-testnet') {
        expectedChainIdHex = '0x128'; // Hedera Testnet (296)
        switchChainName = 'hedera';
      } else if (chainLower.includes('unichain')) {
        expectedChainIdHex = '0x515'; // Unichain Sepolia Testnet (1301)
        switchChainName = 'unichain';
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
      // Note: WalletConnect handles network switching differently, so we skip it for WalletConnect
      if (currentChainId !== expectedChainId) {
        if (isWalletConnect) {
          console.log(`⚠️ WalletConnect: Network mismatch detected (current: ${currentChainIdHex}, expected: ${expectedChainIdHex})`);
          console.log('   WalletConnect users should switch networks in their wallet app');
          toast.error(
            `Please switch to ${chain} network in your HashPack wallet. ` +
            `Current network: ${currentChainIdHex}, Required: ${expectedChainIdHex}`,
            { duration: 8000 }
          );
          setLoading(false);
          throw new Error(`Please switch to ${chain} network in your wallet. Current: ${currentChainIdHex}, Expected: ${expectedChainIdHex}`);
        } else {
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
        }
      } else {
        console.log(`✅ Already on ${chain} network (chainId: ${currentChainIdHex})`);
      }

      // Use wagmi walletClient when connected via WalletConnect, otherwise use BrowserProvider
      let provider: ethers.BrowserProvider;
      let signer: ethers.JsonRpcSigner;
      
      if (isWalletConnect && walletClient) {
        console.log('✅ Using WalletConnect walletClient for transaction');
        // For WalletConnect, we need to use the walletClient's account and chain
        // Create an EIP-1193 compatible provider from walletClient
        const wcProvider = {
          request: async (args: { method: string; params?: any[] }) => {
            try {
              // Map common methods to walletClient methods
              if (args.method === 'eth_sendTransaction') {
                const txHash = await walletClient.sendTransaction(args.params?.[0] as any);
                return txHash;
              }
              if (args.method === 'eth_signTransaction') {
                return await walletClient.signTransaction(args.params?.[0] as any);
              }
              if (args.method === 'personal_sign') {
                return await walletClient.signMessage({ message: args.params?.[0] as string });
              }
              // For other methods, try to use walletClient's request
              return await (walletClient as any).request(args);
            } catch (error: any) {
              console.error('WalletConnect provider request error:', error);
              throw error;
            }
          },
          on: () => {},
          removeListener: () => {},
        };
        provider = new ethers.BrowserProvider(wcProvider as any);
        signer = await provider.getSigner();
      } else {
        provider = new ethers.BrowserProvider(ethereumProvider);
        signer = await provider.getSigner();
      }
      
      const bondingCurveABI = [
        'function buy(uint256 tokenAmount) external payable',
        'function getPriceForAmountLocal(uint256 tokenAmount) external view returns (uint256)',
        'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
        'function getCurrentPrice() external view returns (uint256)',
        'function isGraduated() external view returns (bool)',
        'function buyFeePercent() external view returns (uint256)',
        'function sellFeePercent() external view returns (uint256)',
        'function basePrice() external view returns (uint256)',
        'function slope() external view returns (uint256)',
        'function totalSupplySold() external view returns (uint256)',
        'function useGlobalSupply() external view returns (bool)',
      ];

      const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, signer);
      
      // Verify contract is on the correct chain using RPC provider (not wallet provider)
      // This ensures we check the contract on the correct network even if wallet is on wrong network
      const rpcUrl = getRpcUrlForChain(chain);
      const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
      const code = await rpcProvider.getCode(curveAddress);
      if (!code || code === '0x' || code === '0x0') {
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
        // CRITICAL: Use getPriceForAmountLocal() which matches EXACTLY what buy() uses
        // This ensures our calculation matches the transaction price perfectly
        // Fallback to getPriceForAmount() for older contracts
        let priceFromContract: bigint;
        try {
          // First check if contract is graduated (this might cause issues)
          try {
            const isGraduated = await curveContract.isGraduated();
            if (isGraduated) {
              throw new Error('Token has graduated to DEX. Please use a DEX to buy.');
            }
          } catch (gradCheckErr: any) {
            if (gradCheckErr.message?.includes('graduated')) throw gradCheckErr;
          }
          
          // Diagnostic: Check contract state before calling price function
          let totalSupply: bigint | null = null;
          let basePriceValue: bigint | null = null;
          let slopeValue: bigint | null = null;
          let useGlobalSupply: boolean | null = null;
          
          try {
            [totalSupply, basePriceValue, slopeValue, useGlobalSupply] = await Promise.all([
              curveContract.totalSupplySold().catch(() => null),
              curveContract.basePrice().catch(() => null),
              curveContract.slope().catch(() => null),
              curveContract.useGlobalSupply().catch(() => null),
            ]);
            
            const amountInTokens = Number(tokenAmount) / 1e18;
            const supplyInTokens = totalSupply ? Number(totalSupply) / 1e18 : 0;
            const supplyForAvgPrice = supplyInTokens + (amountInTokens / 2);
            
            // Manual calculation to predict what the contract will do
            if (basePriceValue && slopeValue !== null && totalSupply !== null) {
              const slopeComponent = Number(slopeValue) * supplyForAvgPrice;
              const avgPricePerToken = Number(basePriceValue) + slopeComponent;
              const totalPrice = avgPricePerToken * amountInTokens;
              
              console.log('🔍 Contract state and predicted calculation:', {
                totalSupply: totalSupply.toString(),
                supplyInTokens,
                basePrice: basePriceValue.toString(),
                basePriceEth: ethers.formatEther(basePriceValue),
                slope: slopeValue.toString(),
                slopeEth: ethers.formatEther(slopeValue),
                useGlobalSupply,
                tokenAmount: tokenAmount.toString(),
                amountInTokens,
                supplyForAvgPrice,
                slopeComponent: slopeComponent.toString(),
                slopeComponentEth: ethers.formatEther(BigInt(Math.floor(slopeComponent))),
                avgPricePerToken: avgPricePerToken.toString(),
                avgPricePerTokenEth: ethers.formatEther(BigInt(Math.floor(avgPricePerToken))),
                totalPrice: totalPrice.toString(),
                totalPriceEth: ethers.formatEther(BigInt(Math.floor(totalPrice))),
              });
              
              // Check contract limits manually
              const maxPricePerToken = ethers.parseEther('1'); // 1 ETH
              const maxTotalPrice = ethers.parseEther('100'); // 100 ETH
              const maxSlopeComponent = BigInt(1e25);
              
              if (amountInTokens > 1e9) {
                console.error('❌ Amount too large:', amountInTokens, '> 1e9');
              }
              if (supplyForAvgPrice > 1e9) {
                console.error('❌ Supply too large:', supplyForAvgPrice, '> 1e9');
              }
              if (BigInt(Math.floor(slopeComponent)) > maxSlopeComponent) {
                console.error('❌ Slope component too large:', slopeComponent, '> 1e25');
              }
              if (BigInt(Math.floor(avgPricePerToken)) > maxPricePerToken) {
                console.error('❌ Price per token too high:', avgPricePerToken, '> 1 ETH');
              }
              if (BigInt(Math.floor(totalPrice)) > maxTotalPrice) {
                console.error('❌ Total price too high:', totalPrice, '> 100 ETH');
              }
            }
          } catch (diagErr: any) {
            console.warn('⚠️ Could not get contract diagnostics:', diagErr.message);
          }
          
          priceFromContract = await curveContract.getPriceForAmountLocal(tokenAmount);
        } catch (err: any) {
          console.error('Error calling getPriceForAmountLocal:', {
            message: err.message,
            code: err.code,
            data: err.data,
            reason: err.reason,
            error: err.error,
            transaction: err.transaction,
          });
          
          // Try to decode error if it's a contract revert
          let decodedReason = '';
          if (err.data || err.error?.data) {
            try {
              const errorData = err.data || err.error?.data;
              if (typeof errorData === 'string' && errorData.startsWith('0x') && errorData.length > 10) {
                // Try to decode as a revert reason (Error(string) selector is 0x08c379a0)
                // The actual string starts at offset 68 (0x44)
                const hexString = errorData.slice(2);
                // Skip selector (8 chars) and offset (64 chars) = 72 chars = 144 hex chars
                if (hexString.length > 144) {
                  const stringData = hexString.slice(144);
                  let decoded = '';
                  for (let i = 0; i < stringData.length; i += 2) {
                    const charCode = parseInt(stringData.substr(i, 2), 16);
                    if (charCode === 0) break;
                    if (charCode >= 32 && charCode <= 126) {
                      decoded += String.fromCharCode(charCode);
                    }
                  }
                  if (decoded.length > 0) {
                    decodedReason = decoded;
                    console.log(`📝 Decoded revert reason: ${decodedReason}`);
                  }
                }
              }
            } catch (decodeErr) {
              console.warn('Could not decode error data:', decodeErr);
            }
          }
          
          // Check for specific error messages
          if (decodedReason.includes('graduated') || err.message?.includes('graduated')) {
            throw new Error('Token has graduated to DEX. Please use a DEX to buy.');
          }
          if (decodedReason.includes('Amount too large') || err.message?.includes('Amount too large')) {
            throw new Error('Amount is too large. Please try a smaller amount.');
          }
          if (decodedReason.includes('exceeds maximum') || err.message?.includes('exceeds maximum')) {
            throw new Error('Price exceeds maximum limit. Please try a smaller amount.');
          }
          if (decodedReason.includes('Supply too large') || err.message?.includes('Supply too large')) {
            throw new Error('Supply is too large for price calculation. Please try a smaller amount.');
          }
          if (decodedReason.includes('Slope calculation error') || err.message?.includes('Slope calculation')) {
            throw new Error('Price calculation error. The token parameters may be invalid.');
          }
          
          // Fallback for older contracts that don't have getPriceForAmountLocal()
          // Also catch "missing revert data" errors which indicate a silent revert
          if (err.message?.includes('getPriceForAmountLocal') || 
              err.message?.includes('execution reverted') || 
              err.message?.includes('missing revert data') ||
              err.code === 'CALL_EXCEPTION') {
            console.warn('⚠️ getPriceForAmountLocal() failed, trying getPriceForAmount()');
            try {
              priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
              console.log('✅ Using getPriceForAmount() as fallback');
            } catch (fallbackErr: any) {
              console.warn('⚠️ getPriceForAmount() also failed, trying manual calculation');
              
              // Last resort: Calculate price manually using basePrice and slope
              // This matches the contract's calculation: price = basePrice + (slope * supply)
              try {
                console.log('📊 Attempting manual price calculation...');
                const [basePriceWei, slopeWei, localSupplyWei] = await Promise.all([
                  curveContract.basePrice().catch((e: any) => {
                    console.warn('⚠️ Failed to get basePrice:', e.message);
                    return null;
                  }),
                  curveContract.slope().catch((e: any) => {
                    console.warn('⚠️ Failed to get slope:', e.message);
                    return null;
                  }),
                  curveContract.totalSupplySold().catch((e: any) => {
                    console.warn('⚠️ Failed to get totalSupplySold:', e.message);
                    return null;
                  }),
                ]);
                
                console.log('📊 Manual calculation parameters:', {
                  basePriceWei: basePriceWei?.toString() || 'null',
                  slopeWei: slopeWei?.toString() || 'null',
                  localSupplyWei: localSupplyWei?.toString() || 'null',
                });
                
                if (basePriceWei && slopeWei !== null && localSupplyWei !== null) {
                  // Manual calculation matching contract logic
                  const supplyInTokens = Number(localSupplyWei) / 1e18;
                  const amountInTokens = Number(tokenAmount) / 1e18;
                  const supplyForAvgPrice = supplyInTokens + (amountInTokens / 2);
                  
                  // Price per token = basePrice + (slope * supplyForAvgPrice)
                  const pricePerTokenWei = Number(basePriceWei) + (Number(slopeWei) * supplyForAvgPrice);
                  
                  // Total price = pricePerToken * amountInTokens
                  const totalPriceWei = BigInt(Math.floor(pricePerTokenWei * amountInTokens));
                  
                  console.log('✅ Manual price calculation successful:', {
                    basePrice: ethers.formatEther(basePriceWei),
                    slope: ethers.formatEther(slopeWei),
                    supply: supplyInTokens,
                    amount: amountInTokens,
                    pricePerToken: ethers.formatEther(BigInt(Math.floor(pricePerTokenWei))),
                    totalPrice: ethers.formatEther(totalPriceWei),
                  });
                  
                  priceFromContract = totalPriceWei;
                } else {
                  const missingParams = [];
                  if (!basePriceWei) missingParams.push('basePrice');
                  if (slopeWei === null) missingParams.push('slope');
                  if (localSupplyWei === null) missingParams.push('totalSupplySold');
                  throw new Error(`Could not get contract parameters for manual calculation. Missing: ${missingParams.join(', ')}`);
                }
              } catch (manualErr: any) {
                console.error('❌ Manual calculation failed:', manualErr.message);
                // Even if manual calculation fails, try to proceed with a safe estimate
                // Use currentPrice * amount as absolute last resort
                if (currentPriceWei) {
                  const safeEstimate = (currentPriceWei * tokenAmount) / ethers.parseEther('1');
                  
                  // Add 50% buffer for bonding curve
                  const bufferedEstimate = safeEstimate * BigInt(150) / BigInt(100);
                  const bufferedEstimateEth = parseFloat(ethers.formatEther(bufferedEstimate));
                  
                  console.warn(`⚠️ Using emergency fallback price: ${bufferedEstimateEth} ETH (currentPrice * amount * 1.5)`);
                  
                  // Only use if reasonable (< 10 ETH)
                  if (bufferedEstimateEth < 10) {
                    priceFromContract = bufferedEstimate;
                  } else {
                    throw new Error(
                      `Failed to get price estimate: ${decodedReason || err.message || 'Contract call reverted'}. ` +
                      `Emergency fallback also too high (${bufferedEstimateEth} ETH). ` +
                      `This might indicate the token has graduated, the amount is too large, or there's an issue with the contract.`
                    );
                  }
                } else {
                  throw new Error(
                    `Failed to get price estimate: ${decodedReason || err.message || 'Contract call reverted'}. ` +
                    `Manual calculation also failed: ${manualErr.message}. ` +
                    `This might indicate the token has graduated, the amount is too large, or there's an issue with the contract.`
                  );
                }
              }
            }
          } else {
            throw err;
          }
        }
        
        try {
          
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
        
        // Try to decode hex-encoded ASCII error messages (common in Hedera)
        let errorMessage = err.message || 'Unknown error';
        const errorData = err.data || err.error?.data;
        
        if (errorData && typeof errorData === 'string' && errorData.startsWith('0x') && errorData.length > 2) {
          try {
            // Remove 0x prefix and decode hex to ASCII
            const hexString = errorData.slice(2);
            let decoded = '';
            for (let i = 0; i < hexString.length; i += 2) {
              const charCode = parseInt(hexString.substr(i, 2), 16);
              if (charCode >= 32 && charCode <= 126) { // Printable ASCII range
                decoded += String.fromCharCode(charCode);
              } else {
                break; // Stop at first non-printable character
              }
            }
            if (decoded.length > 0) {
              console.log(`📝 Decoded error message: ${decoded}`);
              
              // Handle specific Hedera errors
              if (decoded.includes('INSUFFICIENT_PAYER_BALANCE')) {
                // Get user's balance to show helpful error
                try {
                  const provider = new ethers.BrowserProvider(window.ethereum);
                  const signer = await provider.getSigner();
                  const address = await signer.getAddress();
                  const balance = await provider.getBalance(address);
                  const balanceFormatted = ethers.formatEther(balance);
                  
                  throw new Error(
                    `Insufficient HBAR balance. You have ${balanceFormatted} HBAR, but need more to complete this transaction.\n\n` +
                    `Get testnet HBAR from: https://portal.hedera.com\n\n` +
                    `The transaction requires HBAR to pay for gas fees and the token purchase.`
                  );
                } catch (balanceErr: any) {
                  // If we can't get balance, just show the decoded error
                  throw new Error(
                    `Insufficient HBAR balance. You need more HBAR to complete this transaction.\n\n` +
                    `Get testnet HBAR from: https://portal.hedera.com`
                  );
                }
              }
              
              // Use decoded message if it's more informative
              if (decoded.length > 10) {
                errorMessage = decoded;
              }
            }
          } catch (decodeErr) {
            // If decoding fails, continue with original error handling
            console.warn('Could not decode error message:', decodeErr);
          }
        }
        
        throw new Error(`Failed to get price estimate: ${errorMessage}. Please try again or contact support.`);
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
      // Use correct price for chain: BNB ~$600, ETH ~$3000, HBAR ~$0.10
      const nativeTokenPriceUSD = chainSymbol === 'BNB' ? 600 : chainSymbol === 'HBAR' ? 0.10 : 3000;
      const totalCostUSD = totalCostEth * nativeTokenPriceUSD;
      
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
      
      // CRITICAL: Validate transaction value is reasonable before sending
      // Check if price seems way too high (likely due to wrong basePrice/slope in contract)
      const estimatedCostUSD = totalCostEth * (chainSymbol === 'BNB' ? 600 : 3000);
      if (estimatedCostUSD > 1000) {
        console.warn(`⚠️ WARNING: Transaction cost is very high: ${totalCostEth.toFixed(6)} ${chainSymbol} (~$${estimatedCostUSD.toFixed(2)})`);
        console.warn(`   This might indicate the contract has incorrect basePrice/slope values.`);
        console.warn(`   The contract may have been deployed with USD values instead of native token values.`);
        
        // Show user-friendly warning
        const userConfirmed = window.confirm(
          `⚠️ High Transaction Cost Warning\n\n` +
          `You're about to send: ${totalCostEth.toFixed(6)} ${chainSymbol} (~$${estimatedCostUSD.toFixed(2)})\n\n` +
          `This seems unusually high for ${amount} tokens.\n\n` +
          `This might be because the token was deployed with incorrect price parameters.\n\n` +
          `Do you want to proceed anyway?`
        );
        
        if (!userConfirmed) {
          throw new Error('Transaction cancelled by user due to high cost warning');
        }
      }
      
      // Additional validation: Check if value exceeds reasonable limits
      // For BSC: 1 BNB max (~$600), For ETH: 0.1 ETH max (~$300) for testnet
      const maxReasonableValue = chainSymbol === 'BNB' ? 1 : 0.1;
      if (totalCostEth > maxReasonableValue) {
        throw new Error(
          `Transaction value too high: ${totalCostEth.toFixed(6)} ${chainSymbol} exceeds reasonable limit of ${maxReasonableValue} ${chainSymbol}.\n\n` +
          `This likely indicates the contract has incorrect basePrice/slope values.\n\n` +
          `Please contact the token creator or try a much smaller amount.`
        );
      }
      
      // Build transaction options
      const txOptions: any = {
        value: totalCostWei,
        gasLimit: 500000,
      };

      // Hedera requires explicit gas price (minimum 570000000000 tinybar = 0.00000057 HBAR)
      // For other chains, let ethers handle gas price automatically
      // Reuse chainLower from earlier in the function
      if (chainLower.includes('hedera')) {
        // Hedera minimum gas price is 570000000000 tinybar (0.00000057 HBAR per gas unit)
        // We'll let Hedera auto-determine, but ensure we have enough gas
        // Hedera uses a fixed fee model, so we don't need to set gasPrice explicitly
        // The provider will handle it
        console.log('⚡ Hedera transaction - using auto gas price');
      } else {
        // For other chains, try to get fee data
        try {
          const feeData = await provider.getFeeData();
          if (feeData?.gasPrice) {
            txOptions.gasPrice = feeData.gasPrice;
          } else if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
            txOptions.maxFeePerGas = feeData.maxFeePerGas;
            txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
          }
        } catch (feeError) {
          console.warn('⚠️ Could not get fee data, using defaults');
        }
      }

      console.log('📋 Transaction options:', {
        value: totalCostWei.toString(),
        gasLimit: txOptions.gasLimit,
        gasPrice: txOptions.gasPrice?.toString(),
        maxFeePerGas: txOptions.maxFeePerGas?.toString(),
      });

      // Debug: Check contract interface before calling
      console.log('🔍 Contract details:', {
        address: curveAddress,
        chain: chain,
        tokenAmount: tokenAmount.toString(),
        value: totalCostWei.toString(),
        hasBuyFunction: !!curveContract.buy,
      });

      // For Hedera, ensure we're using the correct provider
      // Try to encode the transaction manually to verify it works
      let encodedData: string;
      try {
        const iface = new ethers.Interface(bondingCurveABI);
        encodedData = iface.encodeFunctionData('buy', [tokenAmount]);
        console.log('✅ Function call encoded:', {
          dataLength: encodedData.length,
          dataPreview: encodedData.substring(0, 20) + '...',
        });
      } catch (encodeError) {
        console.error('❌ Failed to encode function call:', encodeError);
        throw new Error(`Failed to encode buy transaction: ${encodeError instanceof Error ? encodeError.message : 'Unknown error'}`);
      }

      // For Hedera, we need to use manual transaction construction
      // because MetaMask/Hedera RPC may strip data from contract method calls
      let tx: any;
      
      // Use viem directly for WalletConnect connections (more reliable)
      if (isWalletConnect && walletClient && chainLower.includes('hedera')) {
        console.log('⚡ Hedera transaction via WalletConnect - using viem walletClient directly');
        console.log('📋 Encoded data length:', encodedData.length);
        console.log('📋 Encoded data (first 100 chars):', encodedData.substring(0, 100));
        
        // Use viem's sendTransaction directly - this is more reliable for WalletConnect
        try {
          // Ensure we have the account from walletClient
          if (!walletClient.account) {
            throw new Error('Wallet account not available. Please reconnect your wallet.');
          }
          
          console.log('📋 WalletConnect transaction params:', {
            to: curveAddress,
            data: encodedData.substring(0, 50) + '...',
            dataLength: encodedData.length,
            value: totalCostWei.toString(),
            gas: (txOptions.gasLimit || 1000000).toString(),
            account: walletClient.account.address,
          });
          
          // Prepare transaction parameters
          const txParams: any = {
            to: curveAddress as `0x${string}`,
            data: encodedData as `0x${string}`,
            value: totalCostWei,
            gas: BigInt(txOptions.gasLimit || 1000000),
          };
          
          // For Hedera, prefer gasPrice over maxFeePerGas
          if (txOptions.gasPrice) {
            txParams.gasPrice = BigInt(txOptions.gasPrice);
          }
          
          console.log('📋 Final transaction params:', {
            ...txParams,
            data: txParams.data.substring(0, 50) + '...',
            value: txParams.value.toString(),
            gas: txParams.gas.toString(),
            gasPrice: txParams.gasPrice?.toString() || 'auto',
          });
          
          let txHash: `0x${string}` | null = null;
          try {
            txHash = await walletClient.sendTransaction(txParams);
          } catch (sendError: any) {
            console.error('❌ sendTransaction error:', sendError);
            // Check for user rejection
            if (sendError?.code === 4001 || sendError?.message?.toLowerCase().includes('reject')) {
              throw new Error('Transaction was rejected. Please approve the transaction in your HashPack wallet.');
            }
            // Check for other errors
            throw new Error(`Transaction failed: ${sendError?.message || 'Unknown error'}. Make sure you're on Hedera Testnet and have sufficient HBAR balance.`);
          }
          
          console.log('✅ Transaction sent via viem walletClient:', txHash);
          
          // Validate transaction hash
          if (!txHash || txHash === null || txHash === undefined) {
            throw new Error('Transaction was rejected or failed. The transaction hash is null. Please try again and make sure to approve the transaction in your HashPack wallet.');
          }
          
          // Convert viem transaction hash to ethers-compatible format
          tx = {
            hash: txHash,
            wait: async () => {
              // Use wagmi's waitForTransactionReceipt
              const { waitForTransactionReceipt } = await import('wagmi/actions');
              const { config } = await import('../config/wagmi');
              
              const receipt = await waitForTransactionReceipt(config, {
                hash: txHash,
              });
              
              // Convert to ethers-compatible format
              return {
                hash: receipt.transactionHash,
                status: receipt.status === 'success' ? 1 : 0,
                gasUsed: BigInt(receipt.gasUsed.toString()),
                blockNumber: Number(receipt.blockNumber),
              };
            },
          };
        } catch (wcError: any) {
          console.error('❌ WalletConnect transaction failed:', wcError);
          throw new Error(`Transaction failed: ${wcError.message || 'Unknown error'}. Make sure you're on Hedera Testnet in your HashPack wallet.`);
        }
      } else if (chainLower.includes('hedera')) {
        console.log('⚡ Hedera transaction - using manual construction with explicit data');
        console.log('📋 Encoded data length:', encodedData.length);
        console.log('📋 Encoded data (first 100 chars):', encodedData.substring(0, 100));
        
        // Manually construct the transaction with explicit data field
        // This is necessary because Hedera/MetaMask may not properly handle contract method calls
        const txRequest: {
          to: string;
          data: string;
          value: bigint;
          gasLimit: bigint;
          gasPrice?: bigint;
        } = {
          to: curveAddress,
          data: encodedData, // Explicitly set the encoded function call data
          value: totalCostWei,
          gasLimit: BigInt(txOptions.gasLimit || 1000000),
        };
        
        // Add gas price if available
        if (txOptions.gasPrice) {
          txRequest.gasPrice = txOptions.gasPrice;
        }
        
        console.log('📋 Manual transaction request (before send):', {
          to: txRequest.to,
          data: txRequest.data ? txRequest.data.substring(0, 50) + '...' : 'MISSING!',
          dataLength: txRequest.data?.length || 0,
          value: txRequest.value.toString(),
          gasLimit: txRequest.gasLimit.toString(),
          gasPrice: txRequest.gasPrice?.toString(),
        });
        
        // Verify data is not empty before sending
        if (!txRequest.data || txRequest.data === '0x' || txRequest.data.length < 10) {
          throw new Error('Transaction data is empty or invalid. Cannot send transaction without function call data.');
        }
        
        // Use populateTransaction to get the full transaction object, then send it
        // This ensures all fields are properly set
        const populatedTx = await signer.populateTransaction(txRequest);
        console.log('📋 Populated transaction:', {
          to: populatedTx.to,
          data: populatedTx.data ? populatedTx.data.substring(0, 50) + '...' : 'MISSING!',
          dataLength: populatedTx.data?.length || 0,
          value: populatedTx.value?.toString(),
          gasLimit: populatedTx.gasLimit?.toString(),
          gasPrice: populatedTx.gasPrice?.toString(),
          nonce: populatedTx.nonce?.toString(),
          chainId: populatedTx.chainId?.toString(),
        });
        
        // Verify populated transaction has data
        if (!populatedTx.data || populatedTx.data === '0x' || populatedTx.data.length < 10) {
          throw new Error('Populated transaction data is empty. This indicates a problem with transaction encoding.');
        }
        
        // For Hedera, even with Hedera Wallet Snap installed, MetaMask may still strip the data field
        // The snap might not automatically intercept all transactions
        // Try using the provider's sendTransaction method directly with explicit data
        console.log('📤 Attempting Hedera transaction with explicit data preservation...');
        console.log('📋 Populated transaction has data:', populatedTx.data ? 'YES' : 'NO');
        console.log('📋 Data length:', populatedTx.data?.length || 0);
        
        // Try to use provider.sendTransaction with a raw transaction request
        // This might work better with Hedera Wallet Snap
        try {
          const provider = signer.provider;
          if (!provider) {
            throw new Error('No provider available');
          }
          
          // Get the signer's address
          const signerAddress = await signer.getAddress();
          
          // Build a complete transaction request with all fields
          const rawTxRequest = {
            from: signerAddress,
            to: populatedTx.to!,
            data: populatedTx.data!,
            value: populatedTx.value || 0n,
            gasLimit: populatedTx.gasLimit || BigInt(txOptions.gasLimit || 1000000),
            gasPrice: populatedTx.gasPrice,
            nonce: populatedTx.nonce,
            chainId: populatedTx.chainId,
          };
          
          console.log('📋 Raw transaction request (before signing):', {
            from: rawTxRequest.from,
            to: rawTxRequest.to,
            data: rawTxRequest.data.substring(0, 50) + '...',
            dataLength: rawTxRequest.data.length,
            value: rawTxRequest.value.toString(),
            gasLimit: rawTxRequest.gasLimit.toString(),
          });
          
          // Use signer.sendTransaction which should preserve the data through MetaMask
          // The Hedera Wallet Snap should intercept this if properly configured
          tx = await signer.sendTransaction(rawTxRequest);
          console.log('✅ Sent via signer.sendTransaction with raw request');
        } catch (rawError: any) {
          console.warn('⚠️ Raw transaction failed, using populated transaction:', rawError.message);
          // Fallback to populated transaction
          tx = await signer.sendTransaction(populatedTx);
          console.log('✅ Sent via signer.sendTransaction with populated transaction (fallback)');
        }
      } else {
        // For other chains, use the contract method (standard approach)
        tx = await curveContract.buy(tokenAmount, {
          ...txOptions,
          value: totalCostWei,
        });
      }
      
      // Verify the transaction object has data (after sending)
      console.log('📤 Transaction object after send:', {
        hash: tx.hash,
        to: tx.to,
        data: tx.data ? tx.data.substring(0, 50) + '...' : 'MISSING!',
        dataLength: tx.data?.length || 0,
        value: tx.value?.toString(),
      });
      
      // Debug: Log transaction details
      console.log('📤 Transaction sent:', {
        hash: tx.hash,
        to: tx.to,
        value: tx.value?.toString(),
        data: tx.data?.substring(0, 20) + '...' || 'EMPTY',
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'buy-tx' });
      
      // Wait for transaction confirmation
      let receipt: any;
      try {
        receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', {
          hash: receipt.hash,
          status: receipt.status,
          gasUsed: receipt.gasUsed?.toString(),
          blockNumber: receipt.blockNumber,
        });
        
        // Check if transaction failed
        if (receipt.status === 0) {
          throw new Error('Transaction reverted. The contract call failed. This could be due to insufficient funds, contract revert, or invalid parameters.');
        }
      } catch (waitError: any) {
        console.error('❌ Transaction wait error:', waitError);
        console.error('Error message:', waitError.message);
        console.error('Error code:', waitError.code);
        console.error('Error reason:', waitError.reason);
        
        // If it's a receipt error, try to get more details
        if (waitError.receipt) {
          console.error('Transaction receipt details:', {
            status: waitError.receipt.status,
            gasUsed: waitError.receipt.gasUsed?.toString(),
            blockNumber: waitError.receipt.blockNumber,
            contractAddress: waitError.receipt.contractAddress,
            logs: waitError.receipt.logs?.length || 0,
            logsBloom: waitError.receipt.logsBloom?.substring(0, 20) + '...',
          });
          
          if (waitError.receipt.status === 0) {
            // Check if this is the Hedera/MetaMask data stripping issue
            const isHedera = chainLower.includes('hedera');
            const hasEmptyData = waitError.transaction?.data === '' || waitError.transaction?.data === undefined;
            
            if (isHedera && hasEmptyData) {
              throw new Error(
                `Transaction failed: MetaMask stripped the transaction data field. This is a known Hedera/MetaMask compatibility issue.\n\n` +
                `SOLUTION: Configure Hedera Wallet Snap for TESTNET:\n` +
                `1. Open MetaMask → Click the three dots (⋮) → Settings\n` +
                `2. Go to "Snaps" → Find "Hedera Wallet Snap"\n` +
                `3. Open the snap and check the network setting\n` +
                `4. Make sure it's set to "testnet" (not "mainnet")\n` +
                `5. If you see "Account not activated", visit https://portal.hedera.com to activate your testnet account\n` +
                `6. Try the transaction again\n\n` +
                `NOTE: The Hedera Wallet Snap must be configured for the same network (testnet) as your MetaMask network.`
              );
            }
            
            // Try to decode revert reason if available
            let revertReason = 'Unknown revert reason';
            if (waitError.receipt.logs && waitError.receipt.logs.length === 0) {
              revertReason = 'Transaction reverted with no logs. This usually means the contract call failed (e.g., require() failed, insufficient funds, or invalid parameters).';
            }
            throw new Error(`Transaction reverted (status: 0). ${revertReason} Check the contract state, your HBAR balance, or try a smaller amount.`);
          }
        }
        
        // Check if it's a timeout or network error
        if (waitError.code === 'TIMEOUT' || waitError.message?.includes('timeout')) {
          throw new Error('Transaction timeout. The transaction may still be pending. Please check the explorer or try again.');
        }
        
        throw waitError;
      }
      
      // Calculate price per token in USD for chart
      // priceEstimateWei is total cost in native token (ETH/BNB), divide by amount to get per token
      const pricePerTokenNative = parseFloat(ethers.formatEther(priceEstimateWei)) / parseFloat(amount);
      
      // Convert native token price to USD
      // Approximate prices: ETH ~$3000, BNB ~$600, Base uses ETH pricing
      const getNativeTokenPriceUSD = (chain: string): number => {
        const chainLower = chain.toLowerCase();
        if (chainLower.includes('bsc') || chainLower.includes('binance')) {
          return 600; // BNB price ~$600
        }
        // Ethereum, Base, Hedera, Unichain and others use ETH pricing
        return 3000; // ETH price ~$3000
      };
      
      const nativeTokenPriceUSD = getNativeTokenPriceUSD(chain);
      const pricePerTokenUSD = pricePerTokenNative * nativeTokenPriceUSD;
      
      // Record transaction in backend for chart display (store USD price)
      try {
        await axios.post(`${API_BASE}/transactions`, {
          tokenId,
          chain: chain.toLowerCase(),
          txHash: receipt.hash,
          type: 'buy',
          fromAddress: address,
          toAddress: curveAddress,
          amount: amount,
          price: pricePerTokenUSD, // Store USD price for chart
          status: 'confirmed',
        });
        console.log(`✅ Transaction recorded for chart (price: $${pricePerTokenUSD.toFixed(6)} USD)`);
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
      
      // Show transaction link in toast instead of auto-opening
      const testnetInfo = getTestnetInfo(chain as any);
      if (testnetInfo) {
        const txUrl = `${testnetInfo.explorer}/tx/${receipt.hash}`;
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Transaction confirmed!</span>
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => toast.dismiss(t.id)}
                className="text-primary-400 hover:text-primary-300 underline text-sm"
              >
                View on explorer →
              </a>
            </div>
          ),
          { id: 'buy-tx-success', duration: 8000 }
        );
      }
    } catch (error: any) {
      console.error('Buy error:', error);
      console.error('Error message:', error.message || 'No error message');
      console.error('Error code:', error.code || 'No error code');
      console.error('Error reason:', error.reason || 'No reason');
      console.error('Error data:', error.data || 'No data');
      console.error('Error name:', error.name || 'No name');
      
      if (error.receipt) {
        console.error('Receipt status:', error.receipt.status);
        console.error('Receipt gasUsed:', error.receipt.gasUsed?.toString());
        console.error('Receipt blockNumber:', error.receipt.blockNumber);
        console.error('Receipt contractAddress:', error.receipt.contractAddress);
      }
      
      if (error.transaction) {
        console.error('Transaction to:', error.transaction.to);
        console.error('Transaction data:', error.transaction.data?.substring(0, 50) + '...' || 'EMPTY');
        console.error('Transaction value:', error.transaction.value?.toString());
      }
      
      // Log full error object as JSON for debugging
      try {
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (jsonError) {
        console.error('Could not stringify error:', jsonError);
      }
      
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

      // Check if contracts are deployed using RPC provider for the specific chain
      // This ensures we check the contract on the correct chain, not the connected wallet's chain
      const rpcUrl = getRpcUrlForChain(chain);
      const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
      const curveCode = await rpcProvider.getCode(curveAddress);
      if (!curveCode || curveCode === '0x') {
        throw new Error('Bonding curve contract is not deployed.');
      }

      const tokenCode = await rpcProvider.getCode(tokenAddress);
      if (!tokenCode || tokenCode === '0x') {
        throw new Error('Token contract is not deployed.');
      }

      // Create contract instances: use RPC provider for reads, signer for writes
      // This ensures we read from the correct chain even if wallet is on different chain
      const tokenContractRead = new ethers.Contract(tokenAddress, tokenABI, rpcProvider);
      const tokenContractWrite = new ethers.Contract(tokenAddress, tokenABI, signer);
      const curveContractRead = new ethers.Contract(curveAddress, bondingCurveABI, rpcProvider);
      const curveContractWrite = new ethers.Contract(curveAddress, bondingCurveABI, signer);

      // Check if graduated (use RPC provider for read)
      try {
        const graduated = await curveContractRead.isGraduated();
        if (graduated) {
          throw new Error('Token has graduated to DEX. Please use a DEX to sell.');
        }
      } catch (err: any) {
        if (err.message?.includes('graduated')) throw err;
      }
      
      const tokenAmount = ethers.parseUnits(amount, 18);
      
      // Check balance (use RPC provider for read)
      const balance = await tokenContractRead.balanceOf(address);
      if (balance < tokenAmount) {
        throw new Error('Insufficient token balance');
      }
      
      // Check and approve if needed (use RPC provider for read, signer for write)
      const allowance = await tokenContractRead.allowance(address, curveAddress);
      if (allowance < tokenAmount) {
        toast.loading('Approving tokens...', { id: 'approve' });
        const approveTx = await tokenContractWrite.approve(curveAddress, ethers.MaxUint256);
        await approveTx.wait();
        toast.success('Tokens approved', { id: 'approve' });
      }
      
      toast.loading('Selling tokens...', { id: 'sell-tx' });
      
      // Log sell parameters for debugging
      console.log('📊 Selling tokens:', {
        tokenAmount: amount,
        tokenAmountWei: tokenAmount.toString(),
        curveAddress,
        tokenAddress,
        userAddress: address,
        chain,
        balance: balance.toString(),
        allowance: allowance.toString()
      });
      
      const tx = await curveContractWrite.sell(tokenAmount, {
        gasLimit: 500000,
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'sell-tx' });
      
      const receipt = await tx.wait();
      
      // Get price per token in USD for sell transaction
      // currentPrice prop is already in USD, but verify with contract if possible
      let pricePerTokenUSD = currentPrice;
      try {
        const currentPriceWei = await curveContractRead.getCurrentPrice();
        const pricePerTokenNative = parseFloat(ethers.formatEther(currentPriceWei));
        
        // Convert native token price to USD
        const getNativeTokenPriceUSD = (chain: string): number => {
          const chainLower = chain.toLowerCase();
          if (chainLower.includes('bsc') || chainLower.includes('binance')) {
            return 600; // BNB price ~$600
          }
          // Ethereum, Base, Hedera, Unichain and others use ETH pricing
          return 3000; // ETH price ~$3000
        };
        
        const nativeTokenPriceUSD = getNativeTokenPriceUSD(chain);
        pricePerTokenUSD = pricePerTokenNative * nativeTokenPriceUSD;
      } catch (err) {
        console.warn('Could not get current price from contract for sell transaction, using prop value (USD)');
        // currentPrice prop should already be in USD, so use it as-is
      }
      
      // Record transaction in backend for chart display (store USD price)
      try {
        await axios.post(`${API_BASE}/transactions`, {
          tokenId,
          chain: chain.toLowerCase(),
          txHash: receipt.hash,
          type: 'sell',
          fromAddress: address,
          toAddress: curveAddress,
          amount: amount,
          price: pricePerTokenUSD, // Store USD price for chart
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
      
      // Show transaction link in toast instead of auto-opening
      const testnetInfo = getTestnetInfo(chain as any);
      if (testnetInfo) {
        const txUrl = `${testnetInfo.explorer}/tx/${receipt.hash}`;
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Transaction confirmed!</span>
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => toast.dismiss(t.id)}
                className="text-primary-400 hover:text-primary-300 underline text-sm"
              >
                View on explorer →
              </a>
            </div>
          ),
          { id: 'sell-tx-success', duration: 8000 }
        );
      }
    } catch (error: any) {
      console.error('Sell error:', error);
      console.error('Sell error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        reason: error.reason,
        error: error.error,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
      // Also log the full error object for inspection
      console.dir(error, { depth: null });
      
      // Try to decode error message if it's a contract error
      let errorMessage = error.message || 'Failed to sell tokens';
      
      if (error.data) {
        try {
          // Try to decode revert reason from error data
          const errorData = error.data;
          if (typeof errorData === 'string' && errorData.startsWith('0x')) {
            // Remove 0x prefix and decode hex to ASCII
            const hexString = errorData.slice(2);
            let decoded = '';
            for (let i = 0; i < hexString.length; i += 2) {
              const charCode = parseInt(hexString.substr(i, 2), 16);
              if (charCode >= 32 && charCode <= 126) { // Printable ASCII range
                decoded += String.fromCharCode(charCode);
              } else {
                break; // Stop at first non-printable character
              }
            }
            if (decoded.length > 0) {
              console.log(`📝 Decoded error message: ${decoded}`);
              errorMessage = decoded;
            }
          }
        } catch (decodeErr) {
          console.warn('Could not decode error message:', decodeErr);
        }
      }
      
      if (error.code === 4001) {
        toast.error('Transaction rejected by user', { id: 'sell-tx' });
      } else if (error.message?.includes('Insufficient') || errorMessage?.includes('Insufficient')) {
        toast.error('Insufficient balance', { id: 'sell-tx' });
      } else if (error.message?.includes('not deployed') || errorMessage?.includes('not deployed')) {
        toast.error('Bonding curve contract is not deployed on this chain', { id: 'sell-tx' });
      } else {
        toast.error(errorMessage, { id: 'sell-tx' });
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
    <div data-buy-widget className="bg-gradient-to-br from-gray-800/90 to-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
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
              {/* Prefer currentPrice prop (from priceSync, uses global supply) over realCurrentPrice (from contract, uses local supply) */}
              ${currentPrice > 0 ? currentPrice.toFixed(6) : (realCurrentPrice !== null ? realCurrentPrice.toFixed(6) : '0.000000')}
            </p>
            {realCurrentPrice !== null && Math.abs(realCurrentPrice - currentPrice) > 0.0001 && (
              <p className="text-xs text-blue-400 mt-1">
                (Contract price: ${realCurrentPrice.toFixed(6)} - using unified global price for display)
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
                {debugInfo && (
                  <p className="text-xs text-gray-500 mt-2">
                    Price = ${(parseFloat(debugInfo.basePrice) * 3000).toFixed(6)} + (${(parseFloat(debugInfo.slope) * 3000).toFixed(6)} × {(debugInfo.globalSupply || debugInfo.localSupply)})
                    {' = '}${debugInfo.globalSupply ? currentPrice.toFixed(6) : (realCurrentPrice !== null ? realCurrentPrice.toFixed(6) : currentPrice.toFixed(6))}
                    {debugInfo.globalSupply && ' (using global supply)'}
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              {tab === 'buy' ? `Amount to Buy (${tokenSymbol})` : `Amount to Sell (${tokenSymbol})`}
            </label>
            {tab === 'sell' && isConnected && address && (
              <div className="flex items-center gap-2">
                {balanceLoading ? (
                  <span className="text-xs text-gray-500">Loading...</span>
                ) : (
                  <>
                    <span className="text-xs text-gray-400">Available:</span>
                    <span className="text-xs font-semibold text-primary-400">
                      {parseFloat(tokenBalance).toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}{' '}
                      {tokenSymbol}
                    </span>
                    {parseFloat(tokenBalance) > 0 && (
                      <button
                        onClick={() => setAmount(tokenBalance)}
                        className="text-xs px-2 py-1 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded border border-primary-500/30 transition"
                      >
                        Max
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.1"
              min="0"
              max={tab === 'sell' ? tokenBalance : undefined}
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
          {tab === 'sell' && parseFloat(amount) > 0 && parseFloat(tokenBalance) > 0 && parseFloat(amount) > parseFloat(tokenBalance) && (
            <p className="mt-1 text-xs text-red-400">Amount exceeds available balance</p>
          )}
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
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-300 mb-1">Wallet Not Connected</p>
              <p className="text-sm text-yellow-200/80 mb-3">Please connect your wallet to trade</p>
              {/* HashPack connection button for Hedera - Always show if on Hedera */}
              {chain.toLowerCase().includes('hedera') && (() => {
                try {
                  const hashpackProvider = getHashPackProvider();
                  
                  // Also check for any non-MetaMask providers in the array
                  let alternativeProvider: any = null;
                  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
                    const nonMetaMask = window.ethereum.providers.find((p: any) => 
                      !p.isMetaMask && !(p as any).isPhantom && !(p as any).isCoinbaseWallet
                    );
                    if (nonMetaMask) {
                      alternativeProvider = nonMetaMask;
                      console.log('🔍 Found alternative provider (might be HashPack):', {
                        isMetaMask: nonMetaMask.isMetaMask,
                        isPhantom: (nonMetaMask as any).isPhantom,
                        constructor: nonMetaMask.constructor?.name,
                      });
                    }
                  }
                  
                  const providerToUse = hashpackProvider || alternativeProvider;
                  const hasMultipleProviders = window.ethereum?.providers && window.ethereum.providers.length > 1;
                  
                  // Always show button on Hedera, even if HashPack not detected
                  return (
                    <div className="space-y-2">
                      {providerToUse ? (
                        <button
                          onClick={async () => {
                            try {
                              toast.loading('Connecting HashPack...', { id: 'connect-hashpack' });
                              
                              // Request accounts from the provider
                              if (providerToUse.request) {
                                const accounts = await providerToUse.request({ method: 'eth_requestAccounts' });
                                console.log('✅ Accounts requested:', accounts);
                                
                                // Connect via wagmi using injected connector
                                const injectedConnector = connectors.find((c: any) => c.id === 'injected' || c.name === 'MetaMask');
                                if (injectedConnector) {
                                  // Temporarily set the provider as window.ethereum
                                  const originalEthereum = window.ethereum;
                                  (window as any).ethereum = providerToUse;
                                  
                                  try {
                                    await connect({ connector: injectedConnector as any });
                                    toast.success('HashPack connected successfully!', { id: 'connect-hashpack' });
                                    
                                    // Switch to Hedera network
                                    try {
                                      await switchNetwork('hedera');
                                    } catch (switchError) {
                                      console.warn('Could not switch to Hedera network:', switchError);
                                    }
                                  } catch (connectError: any) {
                                    console.error('Connection error:', connectError);
                                    toast.error(`Connection failed: ${connectError.message || 'Unknown error'}`, { id: 'connect-hashpack' });
                                    // Restore original
                                    (window as any).ethereum = originalEthereum;
                                  }
                                } else {
                                  toast.error('Injected connector not found', { id: 'connect-hashpack' });
                                }
                              } else {
                                toast.error('Provider does not support request method', { id: 'connect-hashpack' });
                              }
                            } catch (error: any) {
                              console.error('Failed to connect HashPack:', error);
                              toast.error(`Failed to connect: ${error.message || 'Unknown error'}`, { id: 'connect-hashpack' });
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
                        >
                          {hashpackProvider ? 'Connect HashPack' : 'Try Alternative Wallet (HashPack?)'}
                        </button>
                      ) : hasMultipleProviders ? (
                        <button
                          onClick={async () => {
                            try {
                              toast.loading('Trying to connect alternative wallet...', { id: 'connect-hashpack' });
                              
                              // Try each non-MetaMask provider
                              const providers = window.ethereum?.providers || [];
                              const nonMetaMaskProviders = providers.filter((p: any) => 
                                !p.isMetaMask && !(p as any).isPhantom && !(p as any).isCoinbaseWallet
                              );
                              
                              if (nonMetaMaskProviders.length > 0) {
                                const provider = nonMetaMaskProviders[0];
                                console.log('🔍 Trying to connect provider:', {
                                  constructor: provider.constructor?.name,
                                  keys: Object.keys(provider).slice(0, 5),
                                });
                                
                                if (provider.request) {
                                  await provider.request({ method: 'eth_requestAccounts' });
                                  const injectedConnector = connectors.find((c: any) => c.id === 'injected');
                                  if (injectedConnector) {
                                    const originalEthereum = window.ethereum;
                                    (window as any).ethereum = provider;
                                    try {
                                      await connect({ connector: injectedConnector as any });
                                      toast.success('Wallet connected!', { id: 'connect-hashpack' });
                                      await switchNetwork('hedera');
                                    } catch (e: any) {
                                      (window as any).ethereum = originalEthereum;
                                      throw e;
                                    }
                                  }
                                }
                              } else {
                                toast.error('No alternative wallet found. Please install HashPack.', { id: 'connect-hashpack' });
                              }
                            } catch (error: any) {
                              console.error('Failed to connect:', error);
                              toast.error(`Connection failed: ${error.message || 'Unknown error'}`, { id: 'connect-hashpack' });
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
                        >
                          Try Connect HashPack
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-yellow-300/80 space-y-1">
                            <p>
                              HashPack not detected. HashPack uses WalletConnect for pairing:
                            </p>
                            <ul className="list-disc list-inside ml-2 space-y-0.5">
                              <li>
                                <strong>WalletConnect required:</strong> HashPack needs a WalletConnect Project ID to connect.
                                Get one free from{' '}
                                <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
                                  cloud.walletconnect.com
                                </a>
                              </li>
                              <li>Make sure HashPack extension is installed and unlocked</li>
                              <li>Try refreshing the page</li>
                              <li>If MetaMask is also installed, HashPack may not inject. Try:
                                <ul className="list-disc list-inside ml-4 mt-0.5">
                                  <li>Disabling MetaMask temporarily, or</li>
                                  <li>Using a different browser profile</li>
                                </ul>
                              </li>
                              <li>Install from{' '}
                                <a href="https://www.hashpack.app/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
                                  hashpack.app
                                </a>
                              </li>
                            </ul>
                          </div>
                          {/* Try connecting to HashPack directly or via wallet selection */}
                          <button
                            onClick={async () => {
                              const connectionTimeout = 30000; // 30 seconds timeout
                              let timeoutId: NodeJS.Timeout | null = null;
                              
                              try {
                                toast.loading('Attempting to connect HashPack...', { id: 'connect-hashpack' });
                                
                                // Set up timeout to prevent hanging
                                const timeoutPromise = new Promise((_, reject) => {
                                  timeoutId = setTimeout(() => {
                                    reject(new Error('Connection timeout. Please make sure HashPack is installed and unlocked, then try again.'));
                                  }, connectionTimeout);
                                });
                                
                                const connectionPromise = (async () => {
                                  // First, check if HashPack extension is installed via Chrome API
                                  const isExtensionInstalled = await checkHashPackExtensionInstalled();
                                  console.log(`🔍 HashPack extension check: ${isExtensionInstalled ? '✅ Installed' : '❌ Not found'}`);
                                  
                                  // Try to get HashPack provider using our helper
                                  const hashpackProvider = getHashPackProvider();
                                  if (hashpackProvider) {
                                    console.log('✅ Found HashPack provider, attempting connection...');
                                    try {
                                      // Request accounts from HashPack provider
                                      const accounts = await hashpackProvider.request({ method: 'eth_requestAccounts' });
                                      console.log('✅ HashPack accounts:', accounts);
                                      
                                      // Temporarily set as window.ethereum to connect via wagmi
                                      const originalEthereum = window.ethereum;
                                      (window as any).ethereum = hashpackProvider;
                                      
                                      try {
                                        const injectedConnector = connectors.find((c: any) => c.id === 'injected' || c.name === 'MetaMask');
                                        if (injectedConnector) {
                                          await connect({ connector: injectedConnector as any });
                                          toast.success('HashPack connected successfully!', { id: 'connect-hashpack' });
                                          return;
                                        }
                                      } finally {
                                        // Restore original
                                        (window as any).ethereum = originalEthereum;
                                      }
                                    } catch (e: any) {
                                      console.error('Error connecting to HashPack provider:', e);
                                      // Continue to fallback methods
                                    }
                                  }
                                  
                                  // If extension is installed but provider not found, HashPack might not be injecting
                                  // Try to find it in providers array or trigger injection
                                  if (isExtensionInstalled && !hashpackProvider) {
                                    console.log('⚠️ HashPack extension detected but provider not found. Checking providers array...');
                                    
                                    // Check if HashPack is in providers array but not detected
                                    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
                                      console.log(`🔍 Checking ${window.ethereum.providers.length} providers for HashPack...`);
                                      
                                      // Try each provider to see if it supports Hedera
                                      for (const provider of window.ethereum.providers) {
                                        try {
                                          // Check if this provider is NOT MetaMask/Phantom/Coinbase
                                          const isMetaMask = provider.isMetaMask;
                                          const isPhantom = !!(provider as any).isPhantom;
                                          const isCoinbase = !!(provider as any).isCoinbaseWallet;
                                          
                                          if (!isMetaMask && !isPhantom && !isCoinbase) {
                                            console.log('   Found non-MetaMask provider, checking if it supports Hedera...');
                                            
                                            // Try to get chain ID to see if it supports Hedera (with timeout)
                                            const chainIdPromise = provider.request({ method: 'eth_chainId' });
                                            const chainId = await Promise.race([
                                              chainIdPromise, 
                                              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                                            ]) as string;
                                            
                                            console.log(`   Provider chainId: ${chainId}`);
                                            // Hedera Testnet chain ID is 0x128 (296)
                                            if (chainId === '0x128' || chainId === '296') {
                                              console.log('✅ Found provider on Hedera chain - likely HashPack');
                                              // Temporarily set as window.ethereum
                                              const originalEthereum = window.ethereum;
                                              (window as any).ethereum = provider;
                                              
                                              try {
                                                const injectedConnector = connectors.find((c: any) => c.id === 'injected' || c.name === 'MetaMask');
                                                if (injectedConnector) {
                                                  await connect({ connector: injectedConnector as any });
                                                  toast.success('HashPack connected successfully!', { id: 'connect-hashpack' });
                                                  return;
                                                }
                                              } finally {
                                                // Restore original
                                                (window as any).ethereum = originalEthereum;
                                              }
                                            }
                                          }
                                        } catch (e) {
                                          // Provider might not support this method, continue
                                          console.log(`   Provider check failed:`, e);
                                        }
                                      }
                                    }
                                    
                                    // If we still haven't found it, try to trigger HashPack by checking window.hashpack directly
                                    const hashpackKeys = ['hashpack', 'HashPack', 'Hashpack', 'HASHPACK'];
                                    for (const key of hashpackKeys) {
                                      if ((window as any)[key]) {
                                        console.log(`🔍 Found window.${key}, attempting direct connection...`);
                                        const hashpack = (window as any)[key];
                                        
                                        // Try to get the provider from hashpack
                                        let hpProvider = hashpack.provider || hashpack.ethereum || hashpack;
                                        
                                        // If hashpack has a connect method, use it
                                        if (typeof hashpack.connect === 'function') {
                                          console.log('   Using hashpack.connect()');
                                          await hashpack.connect();
                                        }
                                        
                                        // Request accounts from HashPack provider
                                        if (hpProvider && typeof hpProvider.request === 'function') {
                                          console.log('   Requesting accounts from HashPack provider...');
                                          const accounts = await hpProvider.request({ method: 'eth_requestAccounts' });
                                          console.log('✅ HashPack accounts:', accounts);
                                          
                                          // Temporarily set as window.ethereum to connect via wagmi
                                          const originalEthereum = window.ethereum;
                                          (window as any).ethereum = hpProvider;
                                          
                                          try {
                                            const injectedConnector = connectors.find((c: any) => c.id === 'injected' || c.name === 'MetaMask');
                                            if (injectedConnector) {
                                              await connect({ connector: injectedConnector as any });
                                              toast.success('HashPack connected successfully!', { id: 'connect-hashpack' });
                                              return;
                                            }
                                          } finally {
                                            // Restore original
                                            (window as any).ethereum = originalEthereum;
                                          }
                                        }
                                      }
                                    }
                                  }
                                  
                                  // Final fallback: Try to connect via wagmi's injected connector
                                  // This will show the wallet selection dialog if multiple wallets are available
                                  console.log('⚠️ HashPack not found directly, trying wallet selection dialog...');
                                  const injectedConnector = connectors.find((c: any) => c.id === 'injected' || c.name === 'MetaMask');
                                  if (injectedConnector) {
                                    await connect({ connector: injectedConnector as any });
                                    toast.success('Wallet connected!', { id: 'connect-hashpack' });
                                  } else {
                                    throw new Error('No injected wallet connector found');
                                  }
                                })();
                                
                                // Race between connection and timeout
                                await Promise.race([connectionPromise, timeoutPromise]);
                                
                              } catch (error: any) {
                                console.error('Error connecting wallet:', error);
                                const errorMessage = error?.message || 'Failed to connect wallet.';
                                
                                // Provide helpful error message for HashPack
                                if (errorMessage.includes('timeout') || errorMessage.includes('Connection timeout')) {
                                  toast.error(
                                    'Connection timeout. HashPack may not be detected. ' +
                                    'Please ensure HashPack extension is installed, unlocked, and refresh the page. ' +
                                    'If HashPack is installed, try disabling MetaMask temporarily to allow HashPack to inject.',
                                    { id: 'connect-hashpack', duration: 8000 }
                                  );
                                } else if (errorMessage.includes('User rejected')) {
                                  toast.error('Connection cancelled by user', { id: 'connect-hashpack' });
                                } else {
                                  toast.error(
                                    errorMessage + ' Make sure HashPack is installed, unlocked, and try refreshing the page.',
                                    { id: 'connect-hashpack', duration: 6000 }
                                  );
                                }
                              } finally {
                                // Clear timeout if connection completed
                                if (timeoutId) {
                                  clearTimeout(timeoutId);
                                }
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
                          >
                            Connect HashPack
                          </button>
                        </div>
                      )}
                    </div>
                  );
                } catch (e) {
                  console.error('Error checking for HashPack:', e);
                  // Still show a button to try connecting
                  return (
                    <button
                      onClick={async () => {
                        toast.error('HashPack not detected. Please install HashPack from hashpack.app', { id: 'connect-hashpack' });
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
                    >
                      HashPack Not Found
                    </button>
                  );
                }
              })()}
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

