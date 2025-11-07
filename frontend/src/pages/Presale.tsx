import { Clock, Zap, TrendingUp, Users, Lock, Gift, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Presale() {
  return (
    <>
      <SEO
        title="Presale - Early Access to CFY Token | Crossify.io"
        description="Join the CFY token presale for early access. Get exclusive pricing and bonuses by participating in our token presale before the public launch."
        keywords="CFY presale, token presale, early access, CFY token sale, presale bonus, token investment, crypto presale"
        url="https://crossify.io/presale"
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
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 blur-2xl opacity-50 rounded-full" />
              <div className="relative p-4 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-full border border-yellow-500/50">
                <Lock className="w-12 h-12 text-yellow-400" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              CFY Token Presale
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Get early access to <span className="text-yellow-400 font-semibold">CFY tokens</span> at exclusive presale prices
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Presale Coming Soon - Join the waitlist!</span>
          </div>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-12 border border-yellow-500/30 mb-12 text-center"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block mb-6"
            >
              <Clock className="w-16 h-16 text-yellow-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Presale Launching Soon</h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              We're putting the finishing touches on our presale platform. Be among the first to know when we go live 
              and secure your spot for exclusive early-bird pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/airdrop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg"
              >
                <Gift className="w-5 h-5" />
                Join Airdrop Instead
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-lg transition-all border border-gray-700"
              >
                Get Notified
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Presale Details Preview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl w-fit mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Early Bird Pricing</h3>
            <p className="text-gray-400 text-sm">
              Get CFY tokens at a discounted rate during the presale period. Limited time offer with exclusive bonuses.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl w-fit mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Vesting Schedule</h3>
            <p className="text-gray-400 text-sm">
              Tokens will be released gradually over a vesting period to ensure long-term project stability and growth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-fit mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Community Benefits</h3>
            <p className="text-gray-400 text-sm">
              Presale participants get exclusive access to governance features, staking rewards, and platform benefits.
            </p>
          </motion.div>
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
        >
          <h2 className="text-2xl font-bold text-white mb-6">What to Expect</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Presale Structure</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Multiple tiers with different pricing</li>
                <li>• Minimum and maximum purchase limits</li>
                <li>• Whitelist opportunities for early supporters</li>
                <li>• Bonus tokens for larger contributions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">How to Participate</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Connect your wallet when presale opens</li>
                <li>• Complete KYC verification (if required)</li>
                <li>• Select your preferred tier</li>
                <li>• Claim tokens after vesting period</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}




