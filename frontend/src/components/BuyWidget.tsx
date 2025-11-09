import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { getTestnetInfo, getPreferredEVMProvider, switchNetwork } from '../services/blockchain';

interface BuyWidgetProps {
  chain: string;
  curveAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice: number;
  onSuccess?: () => void;
}

export default function BuyWidget({
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
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [priceEstimate, setPriceEstimate] = useState<number | null>(null);
  const [tokensEstimate, setTokensEstimate] = useState<number | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Validate addresses and check contract deployment
  useEffect(() => {
    const validate = async () => {
      if (!curveAddress || curveAddress === '0x0000000000000000000000000000000000000000' || !ethers.isAddress(curveAddress)) {
        setIsValidAddress(false);
        return;
      }

      try {
        if (typeof window === 'undefined' || !window.ethereum) {
          setIsValidAddress(false);
          return;
        }

        const provider = getPreferredEVMProvider();
        if (!provider) {
          setIsValidAddress(false);
          return;
        }

        const ethersProvider = new ethers.BrowserProvider(provider);
        const code = await ethersProvider.getCode(curveAddress);
        setIsValidAddress(!!(code && code !== '0x'));
      } catch {
        setIsValidAddress(false);
      }
    };

    validate();
  }, [curveAddress]);

  // Calculate price estimate when amount changes
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0 || !isValidAddress) {
        setPriceEstimate(null);
        setTokensEstimate(null);
        return;
      }

      try {
        if (typeof window === 'undefined' || !window.ethereum) {
          return;
        }

        const provider = getPreferredEVMProvider();
        if (!provider) return;

        const ethersProvider = new ethers.BrowserProvider(provider);
        
        const bondingCurveABI = [
          'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
          'function getCurrentPrice() external view returns (uint256)',
        ];

        const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, ethersProvider);

        // Always get current price first for validation
        const currentPriceWei = await curveContract.getCurrentPrice();
        const currentPriceEth = parseFloat(ethers.formatEther(currentPriceWei));
        const tokenAmount = ethers.parseUnits(amount, 18);
        
        // Expected price using current price (safe fallback)
        const expectedPriceEth = currentPriceEth * parseFloat(amount);
        const absoluteMaxPrice = Math.max(1, parseFloat(amount) * 0.1); // 0.1 ETH per token max

        if (tab === 'buy') {
          // Calculate ETH/BNB needed for token amount
          try {
            const priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
            const priceEth = parseFloat(ethers.formatEther(priceFromContract));
            
            // Validate: if price is way too high, use fallback
            if (priceEth > absoluteMaxPrice || priceEth > 100 || (expectedPriceEth > 0.0001 && priceEth > expectedPriceEth * 100)) {
              console.warn(`⚠️ Contract price too high (${priceEth} ETH), using safe fallback (${expectedPriceEth} ETH)`);
              // Use current price * amount as fallback
              const safeEstimate = expectedPriceEth * 1.1; // Add 10% buffer
              setPriceEstimate(safeEstimate);
              setTokensEstimate(parseFloat(amount));
            } else {
              const priceWithFee = (priceFromContract * BigInt(110)) / BigInt(100); // 10% buffer
              setPriceEstimate(Number(ethers.formatEther(priceWithFee)));
              setTokensEstimate(parseFloat(amount));
            }
          } catch {
            // Fallback to current price
            const safeEstimate = expectedPriceEth * 1.1; // Add 10% buffer
            setPriceEstimate(safeEstimate);
            setTokensEstimate(parseFloat(amount));
          }
        } else {
          // Calculate ETH/BNB received for token amount
          try {
            const priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
            const priceEth = parseFloat(ethers.formatEther(priceFromContract));
            
            // Validate: if price is way too high, use fallback
            if (priceEth > absoluteMaxPrice || priceEth > 100 || (expectedPriceEth > 0.0001 && priceEth > expectedPriceEth * 100)) {
              console.warn(`⚠️ Contract price too high (${priceEth} ETH), using safe fallback (${expectedPriceEth} ETH)`);
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
  }, [amount, tab, curveAddress, isValidAddress]);

  // Get chain-specific currency symbol (define before handleBuy)
  const getChainSymbol = (chainName: string): string => {
    const chainLower = chainName.toLowerCase();
    
    // Handle testnet variants
    if (chainLower.includes('bsc') || chainLower === 'bsc-testnet') {
      return 'BNB';
    }
    if (chainLower.includes('ethereum') || chainLower === 'sepolia' || chainLower === 'eth') {
      return 'ETH';
    }
    if (chainLower.includes('base') || chainLower === 'base-sepolia') {
      return 'ETH'; // Base uses ETH as native currency
    }
    if (chainLower.includes('solana') || chainLower === 'sol') {
      return 'SOL';
    }
    
    // Default fallback
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

    try {
      setLoading(true);
      
      // Get chain symbol for this transaction
      const chainSymbol = getChainSymbol(chain);
      
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
      try {
        // First get current price to validate
        const currentPriceWei = await curveContract.getCurrentPrice();
        const currentPriceEth = parseFloat(ethers.formatEther(currentPriceWei));
        console.log(`💰 Current price per token: ${currentPriceWei.toString()} wei (${currentPriceEth} ETH)`);
        
        // Validate current price is reasonable (should be very small for testnet tokens)
        if (currentPriceEth > 1) {
          console.warn(`⚠️ Current price seems high: ${currentPriceEth} ETH per token`);
        }
        
        // Try to get price for amount
        try {
          const priceFromContract = await curveContract.getPriceForAmount(tokenAmount);
          
          // First check: Validate the raw BigInt value before converting to ETH
          // Maximum reasonable price: 100 ETH = 100 * 10^18 wei
          const maxReasonableWei = ethers.parseEther('100');
          if (priceFromContract > maxReasonableWei) {
            console.warn(`⚠️ Price from contract is too high (raw wei): ${priceFromContract.toString()}`);
            console.warn(`   Maximum reasonable: ${maxReasonableWei.toString()} wei (100 ETH/BNB)`);
            console.warn(`   Using fallback calculation.`);
            throw new Error('Contract price too high (BigInt check) - using fallback');
          }
          
          const priceEth = parseFloat(ethers.formatEther(priceFromContract));
          console.log(`💰 Price estimate from contract: ${priceFromContract.toString()} wei (${priceEth} ${chainSymbol})`);
          
          // Validate: price should be reasonable
          // The contract might have a unit mismatch bug where it multiplies wei by wei
          // For a new token with basePrice ~0.0001 ETH and buying 100 tokens:
          // Expected price ≈ 0.0001 * 100 = 0.01 ETH (for linear curve with no supply)
          // With supply, it should be slightly higher, but not astronomical
          
          // Calculate expected price range
          const expectedPrice = currentPriceEth * parseFloat(amount);
          const expectedMaxPrice = expectedPrice * 10; // Allow 10x buffer for bonding curve
          const absoluteMaxPrice = Math.max(1, parseFloat(amount) * 1); // Absolute max: 1 ETH per token
          
          // Check if price is NaN or Infinity (invalid number)
          if (isNaN(priceEth) || !isFinite(priceEth)) {
            console.warn(`⚠️ Price from contract is invalid (NaN or Infinity). Using fallback.`);
            throw new Error('Invalid price from contract - using fallback');
          }
          
          // Check 1: Absolute maximum - if price is > 100 ETH or > absoluteMaxPrice, use fallback
          if (priceEth > 100 || priceEth > absoluteMaxPrice) {
            console.warn(`⚠️ Price from contract is too high: ${priceEth} ${chainSymbol} (expected max: ${absoluteMaxPrice} ${chainSymbol}).`);
            console.warn(`   This indicates a unit mismatch bug in the bonding curve contract.`);
            console.warn(`   Using fallback calculation based on current price.`);
            throw new Error('Contract price too high - using fallback');
          }
          
          // Check 2: Compare against expected price (currentPrice * amount)
          // If contract price is 100x+ higher than expected, use fallback
          if (expectedPrice > 0 && priceEth > expectedMaxPrice) {
            console.warn(`⚠️ Price from contract (${priceEth} ${chainSymbol}) is much higher than expected (${expectedPrice} ${chainSymbol}, max: ${expectedMaxPrice} ${chainSymbol}).`);
            console.warn(`   Using fallback calculation.`);
            throw new Error('Price validation failed - using fallback');
          }
          
          // Check 3: For small amounts, price should be reasonable
          // Buying tokens should cost a reasonable amount
          if (parseFloat(amount) <= 100 && priceEth > 5) {
            console.warn(`⚠️ Price too high for ${amount} tokens: ${priceEth} ${chainSymbol}. Using fallback.`);
            throw new Error('Price validation failed - using fallback');
          }
          
          // All validations passed - use contract price
          priceEstimateWei = priceFromContract;
          console.log(`✅ Using contract price: ${priceEth} ${chainSymbol}`);
        } catch (priceErr: any) {
          // Fallback: use currentPrice * amount (simple linear calculation)
          console.warn('⚠️ Using fallback price calculation (currentPrice * amount)');
          console.warn(`   Reason: ${priceErr.message || 'Contract price validation failed'}`);
          console.warn('   This happens when the bonding curve contract has calculation issues.');
          console.warn('   Fallback uses a simple linear approximation: price = currentPrice * amount');
          
          // Validate current price is reasonable before using it
          if (currentPriceEth <= 0 || currentPriceEth > 1) {
            throw new Error(`Invalid current price: ${currentPriceEth} ${chainSymbol} per token. Cannot calculate fallback price.`);
          }
          
          // Use currentPrice * amount with proper wei calculation
          // currentPriceWei is in wei per token, tokenAmount is in wei (with 18 decimals)
          // Multiply and divide by 1e18 to get total price in wei
          try {
            priceEstimateWei = (currentPriceWei * tokenAmount) / ethers.parseEther('1');
            const fallbackPriceEth = parseFloat(ethers.formatEther(priceEstimateWei));
            console.log(`💰 Fallback price estimate: ${priceEstimateWei.toString()} wei (${fallbackPriceEth} ${chainSymbol})`);
            
            // Validate fallback is reasonable
            if (isNaN(fallbackPriceEth) || !isFinite(fallbackPriceEth) || fallbackPriceEth <= 0) {
              throw new Error(`Invalid fallback price calculation: ${fallbackPriceEth}`);
            }
            
            if (fallbackPriceEth > 10) {
              throw new Error(`Fallback price too high: ${fallbackPriceEth} ${chainSymbol}. Current price per token: ${currentPriceEth} ${chainSymbol}. Please try a smaller amount.`);
            }
            
            console.log(`✅ Using fallback price: ${fallbackPriceEth} ${chainSymbol}`);
          } catch (fallbackErr: any) {
            console.error('❌ Fallback calculation failed:', fallbackErr);
            throw new Error(`Failed to calculate price: ${fallbackErr.message}. Please try a smaller amount or contact support.`);
          }
        }
      } catch (err: any) {
        console.error('⚠️ Error getting price estimate:', err);
        throw new Error(`Failed to get price estimate: ${err.message}. Please try again or contact support.`);
      }
      
      // Final validation: price should be reasonable
      const finalPriceEth = parseFloat(ethers.formatEther(priceEstimateWei));
      if (priceEstimateWei <= 0 || finalPriceEth > 100 || isNaN(finalPriceEth) || !isFinite(finalPriceEth)) {
        throw new Error(`Invalid price estimate: ${finalPriceEth.toExponential(2)} ${chainSymbol}. This suggests an issue with the bonding curve. Please try a smaller amount or contact support.`);
      }
      
      // Add 10% buffer for safety (contract will refund excess)
      const priceWithFee = (priceEstimateWei * BigInt(110)) / BigInt(100);
      const priceWithFeeEth = parseFloat(ethers.formatEther(priceWithFee));
      console.log(`💰 Price with 10% buffer: ${priceWithFee.toString()} wei (${priceWithFeeEth} ${chainSymbol})`);
      
      // Final validation before sending
      if (priceWithFeeEth > 100 || isNaN(priceWithFeeEth) || !isFinite(priceWithFeeEth)) {
        throw new Error(`Price validation failed: ${priceWithFeeEth} ${chainSymbol}. Please try a smaller amount or contact support.`);
      }
      
      console.log(`🚀 Sending buy transaction with value: ${priceWithFee.toString()} wei`);
      
      const tx = await curveContract.buy(tokenAmount, {
        value: priceWithFee,
        gasLimit: 500000,
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'buy-tx' });
      
      const receipt = await tx.wait();
      
      toast.success(`Successfully bought ${amount} ${tokenSymbol}!`, { id: 'buy-tx' });
      
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
      } else if (error.message?.includes('insufficient')) {
        toast.error('Insufficient funds for this transaction', { id: 'buy-tx' });
      } else if (error.message?.includes('graduated')) {
        toast.error('Token has graduated to DEX. Please use a DEX to buy.', { id: 'buy-tx' });
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
      
      toast.success(`Successfully sold ${amount} ${tokenSymbol}!`, { id: 'sell-tx' });
      
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
            <p className="text-3xl font-bold text-white">${currentPrice.toFixed(6)}</p>
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
          onClick={tab === 'buy' ? handleBuy : handleSell}
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

