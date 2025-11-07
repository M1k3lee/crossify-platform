import { useState } from 'react';
import { Gift, CheckCircle, Clock, Users, ExternalLink, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

export default function Airdrop() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [eligibilityStatus, setEligibilityStatus] = useState<{
    isEligible: boolean;
    reason?: string;
    checked: boolean;
  }>({ isEligible: false, checked: false });

  // Validate wallet address format
  const isValidAddress = (address: string): boolean => {
    // EVM address validation (0x followed by 40 hex characters)
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;
    // Solana address validation (base58, 32-44 characters)
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return evmRegex.test(address) || solanaRegex.test(address);
  };

  const handleCheckEligibility = async () => {
    const trimmedAddress = walletAddress.trim();
    
    if (!trimmedAddress) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (!isValidAddress(trimmedAddress)) {
      toast.error('Please enter a valid wallet address (EVM or Solana format)');
      return;
    }

    setIsChecking(true);
    setEligibilityStatus({ isEligible: false, checked: false });

    try {
      // Simulate API call - in production, this would check against actual eligibility criteria
      // For now, we'll implement basic validation logic
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Eligibility criteria (placeholder logic - replace with actual backend check)
      // For MVP, we'll check:
      // 1. Address format is valid
      // 2. Address hasn't been checked before (in production, check database)
      // 3. Address meets criteria (early adopter, community member, etc.)
      
      // For now, we'll randomly determine eligibility for demo purposes
      // In production, replace this with actual backend API call
      const isEligible = Math.random() > 0.5; // 50% chance for demo
      
      // In production, you would do:
      // const response = await axios.post('/api/airdrop/check-eligibility', { address: trimmedAddress });
      // const isEligible = response.data.eligible;

      if (isEligible) {
        setEligibilityStatus({
          isEligible: true,
          reason: 'Your wallet meets the eligibility criteria for the airdrop!',
          checked: true,
        });
        toast.success('You are eligible for the airdrop!');
      } else {
        setEligibilityStatus({
          isEligible: false,
          reason: 'Your wallet does not currently meet the eligibility criteria. Complete quests on Zealy or become an early adopter to become eligible.',
          checked: true,
        });
        toast.error('Not eligible at this time');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast.error('Failed to check eligibility. Please try again.');
      setEligibilityStatus({ isEligible: false, checked: false });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <SEO
        title="Airdrop - Earn CFY Tokens | Crossify.io"
        description="Join the Crossify airdrop campaign and earn CFY tokens. Complete quests on Zealy, become an early adopter, and participate in our community to receive free tokens."
        keywords="airdrop, crypto airdrop, token airdrop, CFY token, free tokens, zealy campaign, token rewards, community airdrop, early adopter rewards"
        url="https://crossify.io/airdrop"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 blur-2xl opacity-50 rounded-full" />
              <div className="relative p-4 bg-gradient-to-br from-primary-500/20 to-purple-600/20 backdrop-blur-sm rounded-full border border-primary-500/50">
                <Gift className="w-12 h-12 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Crossify Airdrop
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Join our community and earn <span className="text-primary-400 font-semibold">CFY tokens</span> through our exclusive airdrop campaign!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Campaign starts soon - Stay tuned!</span>
          </div>
        </motion.div>

        {/* Zealy Campaign Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/30 mb-12"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Zealy Campaign</h2>
              <p className="text-gray-300 leading-relaxed">
                Participate in our official Zealy campaign to earn exclusive rewards and early access to Crossify features. 
                Complete quests, invite friends, and climb the leaderboard to unlock special rewards.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Complete Quests</span>
              </div>
              <p className="text-gray-400 text-sm">Earn points by completing various tasks and challenges</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Invite Friends</span>
              </div>
              <p className="text-gray-400 text-sm">Get bonus rewards for each friend you invite</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">Early Access</span>
              </div>
              <p className="text-gray-400 text-sm">Unlock exclusive features before public launch</p>
            </div>
          </div>

          <a
            href="https://zealy.io/cw/crossifyio/invite/4G_tDpbtDV0N1QCYDo3qb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <span>Join Zealy Campaign</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Airdrop Eligibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Check Your Eligibility</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Early Adopters</p>
                <p className="text-gray-400 text-sm">Users who create tokens on testnet before mainnet launch</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Community Members</p>
                <p className="text-gray-400 text-sm">Active participants in our Discord and Twitter communities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Zealy Quest Completers</p>
                <p className="text-gray-400 text-sm">Users who complete all quests in our Zealy campaign</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter Your Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  // Reset eligibility status when address changes
                  if (eligibilityStatus.checked) {
                    setEligibilityStatus({ isEligible: false, checked: false });
                  }
                }}
                placeholder="0x... or Solana address"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isChecking}
              />
              <p className="text-gray-500 text-xs mt-2">
                Enter your EVM (0x...) or Solana wallet address
              </p>
            </div>
            <button
              onClick={handleCheckEligibility}
              disabled={isChecking || !walletAddress.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Eligibility'
              )}
            </button>

            {eligibilityStatus.checked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={eligibilityStatus.isEligible 
                  ? "bg-green-500/20 border border-green-500/50 rounded-lg p-6"
                  : "bg-red-500/20 border border-red-500/50 rounded-lg p-6"
                }
              >
                <div className="flex items-center gap-3 mb-2">
                  {eligibilityStatus.isEligible ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-semibold">You're Eligible!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      <span className="text-red-400 font-semibold">Not Eligible</span>
                    </>
                  )}
                </div>
                <p className="text-gray-300 text-sm">
                  {eligibilityStatus.reason}
                </p>
                {!eligibilityStatus.isEligible && (
                  <div className="mt-4 pt-4 border-t border-red-500/30">
                    <p className="text-gray-400 text-sm mb-2">To become eligible:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                      <li>Complete quests on our <a href="https://zealy.io/cw/crossifyio/invite/4G_tDpbtDV0N1QCYDo3qb" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline">Zealy campaign</a></li>
                      <li>Create a token on testnet before mainnet launch</li>
                      <li>Join our Discord and Twitter communities</li>
                      <li>Be an active community member</li>
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-xl font-bold text-white mb-3">Airdrop Details</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Total Airdrop: 10,000,000 CFY tokens</li>
              <li>• Distribution: Phased over 6 months</li>
              <li>• Minimum: 100 CFY per eligible wallet</li>
              <li>• Maximum: 10,000 CFY per wallet</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-xl font-bold text-white mb-3">Important Notes</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Airdrop is only available on mainnet launch</li>
              <li>• Tokens will be distributed automatically</li>
              <li>• No gas fees required to claim</li>
              <li>• Stay updated via our social channels</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

