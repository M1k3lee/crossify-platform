import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Rocket, Network, Layers, Zap, Shield, TrendingUp, Globe, 
  ArrowRight, CheckCircle, Coins, Gauge, Lock, Sparkles,
  Activity, FileText
} from 'lucide-react';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function HowItWorks() {
  return (
    <>
      <SEO
        title="How Crossify Works - Multichain Token Launch Platform | Crossify.io"
        description="Learn how Crossify.io enables simultaneous token deployment across Ethereum, BSC, Base, Solana, and Hedera with automatic cross-chain price synchronization."
        keywords="how crossify works, multichain token launch, cross-chain sync, token deployment, bonding curve, how to launch token"
        url="https://crossify.io/how-it-works"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
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
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 blur-2xl opacity-50 rounded-full" />
                <div className="relative p-4 bg-gradient-to-br from-primary-500/20 to-blue-600/20 backdrop-blur-sm rounded-full border border-primary-500/50">
                  <Network className="w-12 h-12 text-primary-400" />
                </div>
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                How Crossify Works
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Launch your token on <span className="text-primary-400 font-semibold">5 blockchains</span> simultaneously with <span className="text-green-400 font-semibold">perfect price synchronization</span>
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              No technical knowledge required. Just configure, deploy, and watch your token go live across all chains in minutes.
            </p>
          </motion.div>

          {/* Quick Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <div className="bg-gradient-to-r from-primary-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-primary-500/30">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-400 mb-2">5</div>
                  <div className="text-gray-300">Blockchains</div>
                  <div className="text-sm text-gray-400 mt-1">Ethereum, BSC, Base, Solana, Hedera</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">1</div>
                  <div className="text-gray-300">Click Deploy</div>
                  <div className="text-sm text-gray-400 mt-1">All chains simultaneously</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
                  <div className="text-gray-300">Price Sync</div>
                  <div className="text-sm text-gray-400 mt-1">Same price on all chains</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step-by-Step Process */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              Simple 4-Step Process
            </h2>
            
            <div className="space-y-8">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Rocket className="w-6 h-6 text-primary-400" />
                      <h3 className="text-2xl font-bold text-white">Configure Your Token</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Fill in your token details: name, symbol, description, and logo. Set your initial supply and choose your bonding curve parameters (starting price and price increase rate).
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-2">What you'll set:</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">Token Name</span>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">Symbol</span>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">Initial Supply</span>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">Starting Price</span>
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">Price Curve</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="w-6 h-6 text-blue-400" />
                      <h3 className="text-2xl font-bold text-white">Select Your Blockchains</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Choose which blockchains to deploy on. You can select one, some, or all five chains. Each chain has its own benefits:
                    </p>
                    <div className="grid md:grid-cols-5 gap-3 mb-4">
                      {[
                        { name: 'Ethereum', color: 'from-blue-500 to-blue-600', desc: 'Most established' },
                        { name: 'BSC', color: 'from-yellow-500 to-yellow-600', desc: 'Low fees' },
                        { name: 'Base', color: 'from-indigo-500 to-indigo-600', desc: 'Coinbase backed' },
                        { name: 'Solana', color: 'from-purple-500 to-purple-600', desc: 'Ultra fast' },
                        { name: 'Hedera', color: 'from-green-500 to-green-600', desc: '⚡ Fast & Cheap' },
                      ].map((chain) => (
                        <div key={chain.name} className={`bg-gradient-to-br ${chain.color} rounded-lg p-4 text-center`}>
                          <div className="text-white font-semibold mb-1">{chain.name}</div>
                          <div className="text-white/80 text-xs">{chain.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-blue-300 font-semibold mb-1">Enable Cross-Chain Sync</div>
                          <div className="text-gray-300 text-sm">
                            When deploying to 2+ chains, enable cross-chain price synchronization. Your token will maintain the same price across all chains automatically!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-6 h-6 text-green-400" />
                      <h3 className="text-2xl font-bold text-white">Deploy with One Click</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Click "Deploy" and watch the magic happen. Your token is created simultaneously on all selected blockchains. No need for separate transactions or complex setups.
                    </p>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 border border-green-500/30">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                          <div className="text-green-300 font-semibold mb-2">What Happens During Deployment:</div>
                          <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Token contract created on each chain
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Bonding curve initialized
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Cross-chain sync configured (if enabled)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              Token appears in marketplace
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-4">
                        ⏱️ Deployment typically takes 1-5 minutes depending on network congestion
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-primary-500/50 transition-all"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      4
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                      <h3 className="text-2xl font-bold text-white">Start Trading & Growing</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Your token is now live! Users can buy and sell on any chain, and prices automatically stay synchronized. As your token grows, it can automatically graduate to DEXes like Uniswap or Raydium.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                        <div className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                          <Coins className="w-5 h-5" />
                          Trading Features
                        </div>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Buy/sell on bonding curve</li>
                          <li>• Real-time price updates</li>
                          <li>• Cross-chain price sync</li>
                          <li>• Automatic DEX graduation</li>
                        </ul>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                        <div className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Analytics & Tracking
                        </div>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Live price charts</li>
                          <li>• Market cap tracking</li>
                          <li>• Holder count</li>
                          <li>• Trading volume</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* Cross-Chain Price Sync Explained */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-20"
          >
            <div className="bg-gradient-to-r from-primary-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-primary-500/30">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-500/20 rounded-full mb-4">
                  <Network className="w-5 h-5 text-primary-400" />
                  <span className="text-primary-300 font-semibold">The Magic: Cross-Chain Price Sync</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                  One Token, Same Price Everywhere
                </h2>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                  When someone buys your token on Ethereum, the price automatically updates on BSC, Base, Solana, and Hedera. Our unified price system ensures all chains display the same price based on global supply. No arbitrage. No confusion. Just perfect synchronization.
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                    <span className="text-xs text-blue-300">Powered by</span>
                    <span className="text-sm font-semibold text-blue-400">LayerZero</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                    <span className="text-xs text-purple-300">Powered by</span>
                    <span className="text-sm font-semibold text-purple-400">Supra</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                    <span className="text-xs text-green-300">Audited by</span>
                    <span className="text-sm font-semibold text-green-400">Hedera</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/20 rounded-full border border-pink-500/30">
                    <span className="text-xs text-pink-300">DEX by</span>
                    <span className="text-sm font-semibold text-pink-400">Uniswap V4</span>
                  </div>
                </div>
              </div>

              {/* Visual Flow */}
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-5 gap-4 mb-8">
                  {[
                    { name: 'Ethereum', icon: '⟠', color: 'from-blue-500 to-blue-600' },
                    { name: 'BSC', icon: '◉', color: 'from-yellow-500 to-yellow-600' },
                    { name: 'Base', icon: '⬡', color: 'from-indigo-500 to-indigo-600' },
                    { name: 'Solana', icon: '◎', color: 'from-purple-500 to-purple-600' },
                    { name: 'Hedera', icon: '⚡', color: 'from-green-500 to-green-600' },
                  ].map((chain, idx) => (
                    <motion.div
                      key={chain.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + idx * 0.1 }}
                      className={`bg-gradient-to-br ${chain.color} rounded-xl p-6 text-center`}
                    >
                      <div className="text-3xl mb-2">{chain.icon}</div>
                      <div className="text-white font-semibold mb-2">{chain.name}</div>
                      <div className="text-white/80 text-sm">$0.201</div>
                      <div className="text-white/60 text-xs mt-1">Same Price</div>
                    </motion.div>
                  ))}
                </div>

                {/* Flow Diagram */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex-1 text-center">
                      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                        <div className="text-blue-300 font-semibold mb-1">User Buys on Ethereum</div>
                        <div className="text-gray-400 text-sm">500 tokens @ $0.201</div>
                      </div>
                    </div>
                    <ArrowRight className="w-8 h-8 text-primary-400" />
                    <div className="flex-1 text-center">
                      <div className="bg-primary-500/20 rounded-lg p-4 border border-primary-500/30">
                        <div className="text-primary-300 font-semibold mb-1">Cross-Chain Sync</div>
                        <div className="text-gray-400 text-sm">Broadcasts to all chains</div>
                        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-blue-400/70">LayerZero</span>
                          <span className="text-xs text-gray-500">+</span>
                          <span className="text-xs text-purple-400/70">Supra</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-8 h-8 text-primary-400" />
                    <div className="flex-1 text-center">
                      <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                        <div className="text-green-300 font-semibold mb-1">Hedera Audit Log</div>
                        <div className="text-gray-400 text-sm">Immutable record created</div>
                        <div className="text-xs text-green-400/70 mt-1">Powered by Hedera</div>
                      </div>
                    </div>
                    <ArrowRight className="w-8 h-8 text-primary-400" />
                    <div className="flex-1 text-center">
                      <div className="bg-emerald-500/20 rounded-lg p-4 border border-emerald-500/30">
                        <div className="text-emerald-300 font-semibold mb-1">All Chains Update</div>
                        <div className="text-gray-400 text-sm">Price = $0.251 everywhere</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-400 space-y-1">
                    <div>⚡ Happens in seconds via LayerZero & Supra cross-chain messaging</div>
                    <div className="text-xs">📝 Immutably logged via Hedera Consensus Service</div>
                    <div className="text-xs">🆔 Token ID system ensures perfect sync across all chains</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Key Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              Why Crossify is Different
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Network,
                  title: 'Multichain from Day One',
                  description: 'Deploy to 5 blockchains simultaneously. No need to choose - get the benefits of all chains at once.',
                  color: 'from-primary-500 to-blue-600',
                },
                {
                  icon: Layers,
                  title: 'Perfect Price Sync',
                  description: 'Automatic price synchronization across all chains. Buy on any chain, price updates everywhere instantly.',
                  color: 'from-blue-500 to-purple-600',
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Hedera offers 3-5 second finality. Ethereum, BSC, Base, and Solana each bring their own speed advantages.',
                  color: 'from-yellow-500 to-orange-600',
                },
                {
                  icon: Shield,
                  title: 'Secure & Audited',
                  description: 'Built on OpenZeppelin standards. Smart contracts are battle-tested and secure.',
                  color: 'from-green-500 to-emerald-600',
                },
                {
                  icon: TrendingUp,
                  title: 'Auto DEX Graduation',
                  description: 'When your token reaches market cap threshold, it automatically migrates to DEX pools with full liquidity.',
                  color: 'from-purple-500 to-pink-600',
                },
                {
                  icon: Gauge,
                  title: 'Ultra Low Fees',
                  description: 'Hedera charges ~$0.0001 per transaction. Other chains offer competitive fees too.',
                  color: 'from-indigo-500 to-blue-600',
                },
              ].map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + idx * 0.1 }}
                  className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 hover:border-primary-500/50 transition-all"
                >
                  <div className={`inline-flex p-3 bg-gradient-to-br ${feature.color} rounded-xl mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Technical Details Link */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="mb-20"
          >
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <div className="text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">Want Technical Details?</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  For developers and technical users, we have comprehensive documentation covering smart contracts, 
                  cross-chain architecture, and deployment details.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/docs"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg"
                  >
                    <FileText className="w-5 h-5" />
                    View Documentation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/whitepaper"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 hover:bg-gray-600/80 text-white font-semibold rounded-lg transition-all border border-gray-600"
                  >
                    Read Whitepaper
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/30">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                Ready to Launch Your Token?
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Join thousands of creators launching tokens across multiple blockchains with Crossify.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/builder"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Token Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-lg transition-all border border-gray-700"
                >
                  <Coins className="w-5 h-5" />
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

