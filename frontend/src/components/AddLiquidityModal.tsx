import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { getTestnetInfo, getPreferredEVMProvider, switchNetwork } from '../services/blockchain';

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  chain: string;
  curveAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  currentPrice: number;
  onSuccess?: () => void;
}

export default function AddLiquidityModal({
  isOpen,
  onClose,
  chain,
  curveAddress,
  tokenAddress,
  tokenSymbol,
  currentPrice,
  onSuccess,
}: AddLiquidityModalProps) {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  const handleBuy = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate addresses
    if (!curveAddress || curveAddress === '0x0000000000000000000000000000000000000000' || !ethers.isAddress(curveAddress)) {
      toast.error('Invalid bonding curve address. Please deploy the token first.');
      return;
    }

    try {
      setLoading(true);
      
      // Check if MetaMask is available
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
      
      // BondingCurve ABI - just the buy function
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
        console.warn('Could not check graduation status:', err.message);
      }
      
      // Convert amount to token units (assuming 18 decimals)
      const tokenAmount = ethers.parseUnits(amount, 18);
      console.log(`📊 Buying ${amount} tokens (${tokenAmount.toString()} wei)`);
      
      // Get price estimate with detailed logging
      let priceEstimate: bigint;
      try {
        priceEstimate = await curveContract.getPriceForAmount(tokenAmount);
        console.log(`💰 Price estimate from contract: ${priceEstimate.toString()} wei (${ethers.formatEther(priceEstimate)} ETH)`);
      } catch (err: any) {
        console.warn('⚠️ getPriceForAmount failed, using currentPrice fallback:', err.message);
        try {
          const currentPrice = await curveContract.getCurrentPrice();
          console.log(`💰 Current price per token: ${currentPrice.toString()} wei (${ethers.formatEther(currentPrice)} ETH)`);
          // Calculate: price = currentPrice * tokenAmount
          priceEstimate = (currentPrice * tokenAmount) / ethers.parseEther('1');
          console.log(`💰 Fallback price estimate: ${priceEstimate.toString()} wei (${ethers.formatEther(priceEstimate)} ETH)`);
        } catch (fallbackErr: any) {
          throw new Error('Could not get price estimate. The contract may not be properly deployed.');
        }
      }
      
      // Validate price estimate is reasonable
      if (!priceEstimate || priceEstimate === BigInt(0)) {
        throw new Error('Invalid price estimate. Please try a different amount.');
      }
      
      if (priceEstimate > ethers.parseEther('1000')) {
        throw new Error(`Price estimate too high: ${ethers.formatEther(priceEstimate)} ETH. This seems incorrect.`);
      }
      
      const priceWithFee = (priceEstimate * BigInt(110)) / BigInt(100); // Add 10% buffer
      console.log(`💰 Price with 10% buffer: ${priceWithFee.toString()} wei (${ethers.formatEther(priceWithFee)} ETH)`);
      
      // Double-check the value before sending
      const valueInEth = ethers.formatEther(priceWithFee);
      if (parseFloat(valueInEth) > 1000) {
        throw new Error(`Price too high: ${valueInEth} ETH. Something is wrong with the price calculation.`);
      }
      
      console.log(`🚀 Sending buy transaction with value: ${priceWithFee.toString()} wei`);
      
      // Execute buy transaction
      const tx = await curveContract.buy(tokenAmount, {
        value: priceWithFee,
        gasLimit: 500000,
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'buy-tx' });
      
      const receipt = await tx.wait();
      
      toast.success(`Successfully bought ${amount} ${tokenSymbol}!`, { id: 'buy-tx' });
      
      setAmount('');
      onSuccess?.();
      
      // Show explorer link
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

    // Validate addresses
    if (!curveAddress || curveAddress === '0x0000000000000000000000000000000000000000' || !ethers.isAddress(curveAddress)) {
      toast.error('Invalid bonding curve address. Please deploy the token first.');
      return;
    }

    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000' || !ethers.isAddress(tokenAddress)) {
      toast.error('Invalid token address. Please deploy the token first.');
      return;
    }

    try {
      setLoading(true);
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Token ABI for approval
      const tokenABI = [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
      ];

      // BondingCurve ABI
      const bondingCurveABI = [
        'function sell(uint256 tokenAmount) external',
        'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
        'function isGraduated() external view returns (bool)',
      ];

      // Check if contracts are deployed
      const curveCode = await provider.getCode(curveAddress);
      if (!curveCode || curveCode === '0x') {
        throw new Error('Bonding curve contract is not deployed. Please deploy the token first.');
      }

      const tokenCode = await provider.getCode(tokenAddress);
      if (!tokenCode || tokenCode === '0x') {
        throw new Error('Token contract is not deployed. Please deploy the token first.');
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
        // If isGraduated doesn't exist, that's okay - continue
        console.warn('Could not check graduation status:', err.message);
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
      
      // Execute sell transaction
      toast.loading('Selling tokens...', { id: 'sell-tx' });
      const tx = await curveContract.sell(tokenAmount, {
        gasLimit: 500000,
      });

      toast.loading(`Transaction submitted: ${tx.hash}`, { id: 'sell-tx' });
      
      const receipt = await tx.wait();
      
      // Get price estimate (optional, for display)
      let ethReceived = '0';
      try {
        const priceEstimate = await curveContract.getPriceForAmount(tokenAmount);
        ethReceived = ethers.formatEther(priceEstimate);
      } catch (err) {
        console.warn('Could not get price estimate for display:', err);
      }
      
      toast.success(`Successfully sold ${amount} ${tokenSymbol}${ethReceived !== '0' ? ` for ${ethReceived} ETH` : ''}!`, { id: 'sell-tx' });
      
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

  // Validate addresses on mount/open
  const isValidAddress = curveAddress && 
    curveAddress !== '0x0000000000000000000000000000000000000000' && 
    ethers.isAddress(curveAddress);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Trade {tokenSymbol}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Warning if contract not deployed */}
          {!isValidAddress && (
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-300 mb-1">Contract Not Deployed</p>
                <p className="text-sm text-yellow-200/80">
                  The bonding curve contract is not deployed yet. Please deploy the token first before adding liquidity.
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-900/50 rounded-lg p-1">
            <button
              onClick={() => setTab('buy')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                tab === 'buy'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTab('sell')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                tab === 'sell'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount ({tokenSymbol})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="p-4 bg-gray-900/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Price</span>
                  <span className="text-white font-semibold">${currentPrice.toFixed(6)}</span>
                </div>
                {tab === 'buy' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Cost</span>
                    <span className="text-white font-semibold">
                      ~${(parseFloat(amount) * currentPrice).toFixed(4)} ETH
                    </span>
                  </div>
                )}
                {tab === 'sell' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Receive</span>
                    <span className="text-white font-semibold">
                      ~${(parseFloat(amount) * currentPrice).toFixed(4)} ETH
                    </span>
                  </div>
                )}
              </div>
            )}

            {!isConnected && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">Please connect your wallet to continue</p>
              </div>
            )}

            <button
              onClick={tab === 'buy' ? handleBuy : handleSell}
              disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0 || !isValidAddress}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `${tab === 'buy' ? 'Buy' : 'Sell'} ${tokenSymbol}`
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}





