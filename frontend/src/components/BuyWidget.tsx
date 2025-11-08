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

        if (tab === 'buy') {
          // Calculate ETH/BNB needed for token amount
          const tokenAmount = ethers.parseUnits(amount, 18);
          try {
            const price = await curveContract.getPriceForAmount(tokenAmount);
            const priceWithFee = (price * BigInt(110)) / BigInt(100); // 10% buffer
            setPriceEstimate(Number(ethers.formatEther(priceWithFee)));
            setTokensEstimate(parseFloat(amount));
          } catch {
            // Fallback to current price
            const currentPriceWei = await curveContract.getCurrentPrice();
            const tokenAmount = ethers.parseUnits(amount, 18);
            const estimate = (currentPriceWei * tokenAmount) / ethers.parseEther('1');
            setPriceEstimate(Number(ethers.formatEther(estimate * BigInt(110) / BigInt(100))));
            setTokensEstimate(parseFloat(amount));
          }
        } else {
          // Calculate ETH/BNB received for token amount
          const tokenAmount = ethers.parseUnits(amount, 18);
          try {
            const price = await curveContract.getPriceForAmount(tokenAmount);
            setPriceEstimate(Number(ethers.formatEther(price)));
            setTokensEstimate(parseFloat(amount));
          } catch {
            const currentPriceWei = await curveContract.getCurrentPrice();
            const tokenAmount = ethers.parseUnits(amount, 18);
            const estimate = (currentPriceWei * tokenAmount) / ethers.parseEther('1');
            setPriceEstimate(Number(ethers.formatEther(estimate)));
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
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Check current network first
      const ethereumProvider = getPreferredEVMProvider();
      const currentChainIdHex = await ethereumProvider.request({ method: 'eth_chainId' }) as string;
      const expectedChainIdHex = chain === 'ethereum' ? '0xAA36A7' : chain === 'bsc' ? '0x61' : '0x14A34';
      
      // Normalize chain IDs (convert to lowercase and compare as integers)
      const currentChainId = parseInt(currentChainIdHex.toLowerCase(), 16);
      const expectedChainId = parseInt(expectedChainIdHex.toLowerCase(), 16);
      
      console.log(`🔍 Current chain ID: ${currentChainIdHex} (${currentChainId}), Expected: ${expectedChainIdHex} (${expectedChainId})`);
      
      // Only switch if we're on a different network
      if (currentChainId !== expectedChainId) {
        console.log(`🔄 Switching to ${chain} network before buy...`);
        await switchNetwork(chain as 'ethereum' | 'bsc' | 'base');
        
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
      
      // Get price estimate with detailed logging
      let priceEstimateWei: bigint;
      try {
        priceEstimateWei = await curveContract.getPriceForAmount(tokenAmount);
        console.log(`💰 Price estimate from contract: ${priceEstimateWei.toString()} wei (${ethers.formatEther(priceEstimateWei)} ETH)`);
      } catch (err: any) {
        console.warn('⚠️ getPriceForAmount failed, using currentPrice fallback:', err.message);
        const currentPriceWei = await curveContract.getCurrentPrice();
        console.log(`💰 Current price per token: ${currentPriceWei.toString()} wei (${ethers.formatEther(currentPriceWei)} ETH)`);
        // Calculate: price = currentPrice * tokenAmount
        priceEstimateWei = (currentPriceWei * tokenAmount) / ethers.parseEther('1');
        console.log(`💰 Fallback price estimate: ${priceEstimateWei.toString()} wei (${ethers.formatEther(priceEstimateWei)} ETH)`);
      }
      
      // Validate price estimate is reasonable
      if (priceEstimateWei <= 0 || priceEstimateWei > ethers.parseEther('1000')) {
        throw new Error(`Invalid price estimate: ${ethers.formatEther(priceEstimateWei)} ETH. This seems too high.`);
      }
      
      // Add 10% buffer for safety (contract will refund excess)
      const priceWithFee = (priceEstimateWei * BigInt(110)) / BigInt(100);
      console.log(`💰 Price with 10% buffer: ${priceWithFee.toString()} wei (${ethers.formatEther(priceWithFee)} ETH)`);
      
      // Double-check the value before sending
      const valueInEth = ethers.formatEther(priceWithFee);
      if (parseFloat(valueInEth) > 1000) {
        throw new Error(`Price too high: ${valueInEth} ETH. Something is wrong with the price calculation.`);
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

  const chainSymbol = chain === 'bsc' ? 'BNB' : 'ETH';

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

