import { Gift, CheckCircle, Clock, Users, ExternalLink, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Airdrop() {

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
              Token Airdrop
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            We may have a token airdrop soon. If we do, we will favor those who have helped us grow and test the app.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-sm mb-6">
            <Clock className="w-4 h-4" />
            <span>Follow our Zealy for quests to stay updated!</span>
          </div>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Help us grow and test the platform to increase your chances of receiving tokens in the airdrop.
          </p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Follow Our Zealy for Quests</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Complete quests on Zealy to help us grow and test the app. Those who actively participate will be favored in the upcoming token airdrop.
              </p>
              <p className="text-gray-400 text-sm">
                Stay updated on new quests and opportunities by following our Zealy campaign.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Complete Quests</span>
              </div>
              <p className="text-gray-400 text-sm">Help us grow and test by completing various tasks</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Test the App</span>
              </div>
              <p className="text-gray-400 text-sm">Actively use and test Crossify features</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">Get Rewarded</span>
              </div>
              <p className="text-gray-400 text-sm">Be favored in the upcoming airdrop</p>
            </div>
          </div>

          <a
            href="https://zealy.io/cw/crossifyio/invite/4G_tDpbtDV0N1QCYDo3qb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <span>Follow Zealy for Quests</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </motion.div>

        {/* How to Qualify */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">How to Qualify</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Help Us Grow</p>
                <p className="text-gray-400 text-sm">Actively participate in growing the Crossify community and platform</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Test the App</p>
                <p className="text-gray-400 text-sm">Use and test Crossify features, report bugs, and provide feedback</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold">Complete Zealy Quests</p>
                <p className="text-gray-400 text-sm">Follow our Zealy campaign and complete quests to stay updated</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Important:</span> If we do have a token airdrop, we will favor those who have actively helped us grow and test the app. Make sure to follow our Zealy for quests and updates!
                </p>
              </div>
            </div>
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
            <h3 className="text-xl font-bold text-white mb-3">Stay Updated</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Follow our Zealy campaign for quests</li>
              <li>• Help us grow and test the app</li>
              <li>• Active contributors will be favored</li>
              <li>• Check back here for updates</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <h3 className="text-xl font-bold text-white mb-3">Get Involved</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Complete Zealy quests regularly</li>
              <li>• Test features and provide feedback</li>
              <li>• Share and help grow the community</li>
              <li>• Stay engaged to maximize chances</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}

