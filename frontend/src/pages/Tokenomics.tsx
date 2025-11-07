import { motion } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Flame, Zap, Users, 
  BarChart3, PieChart, Target, Rocket,
  ArrowRight, CheckCircle, Gift, Coins, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Tokenomics() {
  return (
    <>
      <SEO
        title="CFY Tokenomics - Crossify Token Economics | Crossify.io"
        description="Learn about CFY token economics, distribution, staking rewards, buyback mechanisms, and token utility. CFY powers the Crossify ecosystem with deflationary mechanics and governance."
        keywords="CFY token, crossify token, tokenomics, token economics, token distribution, staking rewards, buyback, token burn, deflationary token, governance token"
        url="https://crossify.io/tokenomics"
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
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-600 blur-2xl opacity-50 rounded-full" />
              <div className="relative p-4 bg-gradient-to-br from-primary-500/20 to-purple-600/20 backdrop-blur-sm rounded-full border border-primary-500/50">
                <Coins className="w-12 h-12 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CFY Tokenomics
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            The Crossify Platform Token - Powering the Future of Multi-Chain Token Launches
          </p>
          <p className="text-gray-400 text-sm">Advanced Tokenomics • Sustainable Growth • Community-Driven</p>
        </motion.div>

        {/* Token Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-500/20 to-blue-600/20 rounded-xl p-6 border border-primary-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-8 h-8 text-primary-400" />
                  <h3 className="text-xl font-bold text-white">Token Symbol</h3>
                </div>
                <p className="text-3xl font-bold text-primary-400 mb-2">CFY</p>
                <p className="text-gray-400 text-sm">Crossify Token</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-8 h-8 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Total Supply</h3>
                </div>
                <p className="text-3xl font-bold text-green-400 mb-2">1 Billion</p>
                <p className="text-gray-400 text-sm">1,000,000,000 CFY</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Type</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400 mb-2">Cross-Chain</p>
                <p className="text-gray-400 text-sm">Ethereum • BSC • Base • Solana</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Token Distribution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Token Distribution</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                        <span className="text-gray-300">Presale</span>
                      </div>
                      <span className="text-white font-bold">30% (300M)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full" style={{ width: '30%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded"></div>
                        <span className="text-gray-300">Liquidity Pool</span>
                      </div>
                      <span className="text-white font-bold">25% (250M)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '25%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
                        <span className="text-gray-300">Team & Advisors</span>
                      </div>
                      <span className="text-white font-bold">15% (150M)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded"></div>
                        <span className="text-gray-300">Ecosystem</span>
                      </div>
                      <span className="text-white font-bold">15% (150M)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded"></div>
                        <span className="text-gray-300">Staking Rewards</span>
                      </div>
                      <span className="text-white font-bold">10% (100M)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded"></div>
                        <span className="text-gray-300">Treasury</span>
                      </div>
                      <span className="text-white font-bold">5% (50M)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full" style={{ width: '5%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution Details */}
              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <h3 className="text-xl font-bold text-white mb-4">Distribution Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Presale (30%)</p>
                        <p className="text-gray-400 text-sm">Public presale with tiered pricing. 20% TGE, 80% linear vesting over 12 months.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Liquidity Pool (25%)</p>
                        <p className="text-gray-400 text-sm">Initial DEX liquidity (15%) and reserve pool (10%) for all supported chains.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Team & Advisors (15%)</p>
                        <p className="text-gray-400 text-sm">6-month cliff, 24-month linear vesting to ensure long-term commitment.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Ecosystem (15%)</p>
                        <p className="text-gray-400 text-sm">Partnerships (8%), Marketing (5%), and Development (2%).</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Staking Rewards (10%)</p>
                        <p className="text-gray-400 text-sm">Distributed over 4 years to stakers. Rewards decrease annually (halving).</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-white font-semibold">Treasury (5%)</p>
                        <p className="text-gray-400 text-sm">Reserve fund for platform operations and emergency situations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Advanced Tokenomics Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Advanced Tokenomics Features</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Automatic Buyback */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Automatic Buyback</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  50% of all platform fees are used to automatically buy back CFY tokens from the market.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Distribution:</span>
                    <span className="text-white font-semibold">80% Liquidity, 20% Burned</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white font-semibold">Daily ($1K+), Weekly ($5K+)</span>
                  </div>
                </div>
              </motion.div>

              {/* Liquidity Provision */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Liquidity Provision</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  30% of platform fees are automatically added to CFY liquidity pools on all supported chains.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Chains:</span>
                    <span className="text-white font-semibold">ETH, BSC, Base, SOL</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Result:</span>
                    <span className="text-white font-semibold">Deep Liquidity</span>
                  </div>
                </div>
              </motion.div>

              {/* Deflationary Burns */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-red-500/20 to-orange-600/20 rounded-xl p-6 border border-red-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Flame className="w-8 h-8 text-red-400" />
                  <h3 className="text-xl font-bold text-white">Deflationary Burns</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  10% of platform fees are used for permanent token burns, reducing supply and increasing scarcity.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Schedule:</span>
                    <span className="text-white font-semibold">Quarterly Burns</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Max/Year:</span>
                    <span className="text-white font-semibold">5% of Supply</span>
                  </div>
                </div>
              </motion.div>

              {/* Staking Rewards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Staking Rewards</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Stake CFY tokens to earn passive income with up to 100% APY on LP staking.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Locked:</span>
                    <span className="text-white font-semibold">Up to 50% APY</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">LP Staking:</span>
                    <span className="text-white font-semibold">Up to 100% APY</span>
                  </div>
                </div>
              </motion.div>

              {/* Fee Discounts */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Fee Discounts</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Hold CFY tokens to receive discounts on platform fees and access premium features.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">1K CFY:</span>
                    <span className="text-white font-semibold">5% Discount</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">100K CFY:</span>
                    <span className="text-white font-semibold">20% + Premium</span>
                  </div>
                </div>
              </motion.div>

              {/* Governance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                className="bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-xl p-6 border border-indigo-500/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-indigo-400" />
                  <h3 className="text-xl font-bold text-white">Governance</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Vote on platform decisions, propose new features, and influence the direction of Crossify.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Voting:</span>
                    <span className="text-white font-semibold">1 CFY = 1 Vote</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Minimum:</span>
                    <span className="text-white font-semibold">10K CFY to Propose</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Revenue Model */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Revenue Model & Fee Distribution</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Fee Sources */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-bold text-white mb-4">Platform Fee Sources</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Token Creation</span>
                    <span className="text-primary-400 font-bold">0.01 ETH</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Mint Operations</span>
                    <span className="text-primary-400 font-bold">0.1% of tokens</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Cross-Chain Sync</span>
                    <span className="text-primary-400 font-bold">0.5% of trade</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Liquidity Bridge</span>
                    <span className="text-primary-400 font-bold">0.1% + costs</span>
                  </div>
                </div>
              </div>

              {/* Fee Distribution */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-bold text-white mb-4">Fee Distribution (100%)</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-lg border border-green-500/30">
                    <span className="text-gray-300">Buyback (CFY)</span>
                    <span className="text-green-400 font-bold">50%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
                    <span className="text-gray-300">Liquidity</span>
                    <span className="text-blue-400 font-bold">30%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-500/20 to-orange-600/20 rounded-lg border border-red-500/30">
                    <span className="text-gray-300">Burns</span>
                    <span className="text-red-400 font-bold">10%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Operations</span>
                    <span className="text-gray-400 font-bold">7%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Treasury</span>
                    <span className="text-gray-400 font-bold">3%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-500/20 to-purple-600/20 rounded-xl p-6 border border-primary-500/30">
              <h4 className="text-lg font-bold text-white mb-3">Value Creation Cycle</h4>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary-400 mb-2">1</div>
                  <p className="text-gray-300 text-sm">Platform Fees Collected</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 mx-auto my-auto hidden md:block" />
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-2">2</div>
                  <p className="text-gray-300 text-sm">Buyback & Liquidity</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 mx-auto my-auto hidden md:block" />
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">3</div>
                  <p className="text-gray-300 text-sm">Token Value Increases</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 mx-auto my-auto hidden md:block" />
                <div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">4</div>
                  <p className="text-gray-300 text-sm">More Users & Fees</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Presale Information */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-br from-primary-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Presale Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-bold text-white mb-4">Public Presale (200M CFY)</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Tier 1 (First 50M)</span>
                      <span className="text-green-400 font-bold">$0.01/CFY</span>
                    </div>
                    <p className="text-gray-400 text-sm">Early bird pricing</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Tier 2 (Next 50M)</span>
                      <span className="text-blue-400 font-bold">$0.015/CFY</span>
                    </div>
                    <p className="text-gray-400 text-sm">Second wave pricing</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Tier 3 (Next 50M)</span>
                      <span className="text-purple-400 font-bold">$0.02/CFY</span>
                    </div>
                    <p className="text-gray-400 text-sm">Third wave pricing</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Tier 4 (Last 50M)</span>
                      <span className="text-orange-400 font-bold">$0.025/CFY</span>
                    </div>
                    <p className="text-gray-400 text-sm">Final wave pricing</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-primary-500/20 rounded-lg border border-primary-500/30">
                  <p className="text-white text-sm">
                    <strong>Vesting:</strong> 20% at TGE, 80% linear vesting over 12 months
                  </p>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-bold text-white mb-4">Private Sale (100M CFY)</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold">Price</span>
                      <span className="text-purple-400 font-bold text-2xl">$0.008/CFY</span>
                    </div>
                    <p className="text-gray-300 text-sm">20% discount from public presale</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Strategic Partners</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Early Investors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">Platform Contributors</span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <p className="text-white text-sm">
                      <strong>Vesting:</strong> 6-month cliff, 18-month linear vesting
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/presale"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition"
              >
                Join Presale
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Use Cases */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">CFY Token Use Cases</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Platform Utility</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Pay for token creation with discounts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Access premium features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Priority customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Early access to new features
                  </li>
                </ul>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Governance</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Vote on platform decisions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Propose new features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Influence platform direction
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Treasury allocation voting
                  </li>
                </ul>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Staking & Rewards</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Earn passive income (up to 100% APY)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Support platform security
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Participate in governance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    LP staking rewards
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Roadmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">CFY Token Roadmap</h2>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-1 h-full bg-gray-700 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Phase 1: Launch (Q1 2025)</h3>
                  <p className="text-gray-300 mb-3">
                    Deploy CFY token on all supported chains, launch presale, create initial liquidity pools, and deploy staking contracts.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Token Deployment</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Presale Launch</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Initial Liquidity</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div className="w-1 h-full bg-gray-700 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Phase 2: Integration (Q2 2025)</h3>
                  <p className="text-gray-300 mb-3">
                    Activate buyback mechanism, implement fee discount system, launch governance platform, and enable LP staking rewards.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">Buyback Activation</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">Fee Discounts</span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">Governance</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div className="w-1 h-full bg-gray-700 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Phase 3: Expansion (Q3 2025)</h3>
                  <p className="text-gray-300 mb-3">
                    Add additional staking pools, enable cross-chain staking, launch governance proposals, and implement treasury management.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">More Staking Pools</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">Cross-Chain Staking</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">Treasury Management</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Phase 4: Maturity (Q4 2025)</h3>
                  <p className="text-gray-300 mb-3">
                    Full tokenomics implementation, community governance, revenue sharing, and platform sustainability.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Full Implementation</span>
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Community Governance</span>
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Revenue Sharing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-500/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-12 border border-primary-500/50">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Join the Crossify Ecosystem?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Get early access to CFY tokens, earn staking rewards, and help shape the future of multi-chain token launches.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/presale"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg transition text-lg"
              >
                Join Presale
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/whitepaper"
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-8 py-4 rounded-lg transition text-lg"
              >
                Read Whitepaper
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
    </>
  );
}




