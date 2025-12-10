import { FileText, Target, Zap, Globe, TrendingUp, Users, Calendar, Rocket, ArrowRight, CheckCircle, Shield, Layers, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Whitepaper() {
  return (
    <>
      <SEO
        title="Whitepaper - Crossify Platform Overview | Crossify.io"
        description="Read the Crossify whitepaper to learn about our multi-chain token launch platform, cross-chain synchronization technology, tokenomics, and roadmap."
        keywords="crossify whitepaper, token launch platform, cross-chain technology, LayerZero, multi-chain tokens, platform overview, technical documentation"
        url="https://crossify.io/whitepaper"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
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
                <FileText className="w-12 h-12 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Crossify.io Whitepaper
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            The Future of Multichain Token Launches
          </p>
          <p className="text-gray-400 text-sm">Version 1.0 | Last Updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        {/* Executive Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Executive Summary</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed text-lg mb-4">
                Crossify.io is a revolutionary multichain token launch platform that solves the fragmentation problem 
                in decentralized finance. Traditional token launches require separate deployments on each blockchain, 
                leading to fragmented liquidity, price discrepancies, and complex user experiences.
              </p>
              <p className="text-gray-300 leading-relaxed text-lg mb-4">
                Our platform enables creators to launch tokens simultaneously across Ethereum, BSC, Solana, Base, and Hedera 
                with unified virtual liquidity, ensuring consistent pricing and seamless cross-chain trading. Through 
                innovative bonding curve mechanics and automatic DEX graduation, Crossify.io democratizes token creation 
                while maintaining security and transparency.
              </p>
              <p className="text-gray-300 leading-relaxed text-lg">
                We've built a revolutionary <strong className="text-primary-400">three-phase cross-chain liquidity system</strong> that solves 
                the industry's biggest challenge: maintaining accessible liquidity across all blockchains, even after tokens 
                graduate to DEX pools. This breakthrough ensures users can always trade on any chain, regardless of where 
                liquidity is concentrated.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Completed Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">What We've Built: Foundation of Innovation</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Core Infrastructure ✅</h3>
                <div className="grid md:grid-cols-2 gap-3 text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Smart Contract Suite deployed on all testnets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Bonding Curve System with automated pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Token Factory for multi-chain deployment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Comprehensive database architecture</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Cross-Chain Price Synchronization ✅</h3>
                <div className="grid md:grid-cols-2 gap-3 text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span><strong className="text-blue-400">LayerZero</strong> integration (30s latency)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span><strong className="text-purple-400">Supra HyperNova</strong> dual-protocol architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Real-time global supply tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>&lt;0.5% price variance maintained</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Automatic sync on every trade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Dual-protocol failover system</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Liquidity Management System ✅</h3>
                <div className="grid md:grid-cols-2 gap-3 text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Per-chain bonding curves with local reserves</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Cross-Chain Liquidity Bridge operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Proactive rebalancing every 30 seconds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Complete REST API for liquidity operations</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Chain Integrations ✅</h3>
                <div className="grid md:grid-cols-2 gap-3 text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span><strong className="text-green-400">Hedera</strong>: 3-5s finality, ~$0.0001/tx</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Hedera Consensus Service for audit trails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Hedera File Service for metadata storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Multi-DEX: Raydium, Uniswap V3/V4, PancakeSwap, BaseSwap</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">DEX Graduation System ✅</h3>
                <div className="grid md:grid-cols-2 gap-3 text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Automatic market cap threshold detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Coordinated cross-chain graduation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Chain-specific DEX selection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Analytics dashboard with success rates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Problem Statement */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Problem Statement</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Fragmented Liquidity</h3>
                <p className="text-gray-300 leading-relaxed">
                  Tokens deployed on different chains have separate liquidity pools, leading to price discrepancies 
                  and arbitrage opportunities. This fragmentation reduces capital efficiency and creates confusion for users.
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-red-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Post-Graduation Liquidity Lock-In</h3>
                <p className="text-gray-300 leading-relaxed mb-3">
                  When tokens graduate to DEX pools, liquidity becomes locked per-chain. Each chain's liquidity sits in separate pools:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-300 ml-2 mb-3">
                  <li>Ethereum: Uniswap V3 pool</li>
                  <li>Solana: Raydium pool</li>
                  <li>BSC: PancakeSwap pool</li>
                  <li>Base: BaseSwap pool</li>
                </ul>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 mt-4">
                  <p className="text-red-300 text-sm">
                    <strong>Critical Issue:</strong> If most liquidity is on Solana ($50k) but a user wants to sell $10k on Ethereum 
                    (only $5k liquidity), they're stuck. Traditional platforms can't solve this—<strong className="text-white">we can.</strong>
                  </p>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Complex Deployment Process</h3>
                <p className="text-gray-300 leading-relaxed">
                  Launching tokens across multiple chains requires deep technical knowledge, multiple transactions, 
                  and significant gas costs. This barrier prevents many creators from reaching their full potential.
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Lack of Price Synchronization</h3>
                <p className="text-gray-300 leading-relaxed">
                  Without unified pricing mechanisms, tokens on different chains can have vastly different prices, 
                  creating unfair advantages for arbitrageurs and disadvantaging regular users.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Solution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Our Solution</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Cross-Chain Price Synchronization</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Crossify.io introduces a revolutionary cross-chain price synchronization system powered by 
                  <strong className="text-primary-400"> dual-protocol architecture</strong> combining 
                  <strong className="text-blue-400"> LayerZero</strong> and 
                  <strong className="text-purple-400"> Supra HyperNova</strong>, with immutable audit trails via 
                  <strong className="text-green-400"> Hedera Consensus Service</strong>. When tokens are traded on any DEX 
                  (Uniswap, PancakeSwap, etc.), our smart contracts automatically detect the trade and broadcast 
                  price updates across all chains in under 1 second (via Supra) or ~30 seconds (via LayerZero), ensuring perfect price consistency. Every sync event is immutably 
                  logged to Hedera for enterprise-grade auditability.
                </p>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <h4 className="text-lg font-semibold text-white mb-2">How Cross-Chain Sync Works:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong>DEX Trade Detection:</strong> CrossChainToken automatically detects trades via transfer hooks</li>
                    <li><strong>Dual-Protocol Messaging:</strong> Price updates broadcast via LayerZero (~30s) or Supra HyperNova (600-900ms)</li>
                    <li><strong>Automatic Protocol Selection:</strong> System chooses optimal protocol (LayerZero, Supra, or both)</li>
                    <li><strong>Sub-Second Propagation:</strong> Supra enables updates across all chains in under 1 second</li>
                    <li><strong>Consistent Pricing:</strong> All chains see the same price based on global supply</li>
                    <li><strong>Arbitrage Elimination:</strong> No price discrepancies means no arbitrage opportunities</li>
                    <li><strong>Automatic Fee Collection:</strong> 0.5% fee on DEX trades covers cross-chain messaging costs</li>
                    <li><strong>Bridgeless Security:</strong> Supra's L1-to-L1 consensus eliminates bridge attack vectors</li>
                  </ul>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">Powered by LayerZero</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      LayerZero is the leading cross-chain interoperability protocol, enabling secure and efficient 
                      communication between blockchains. Our integration with LayerZero ensures reliable, trustless 
                      price synchronization across all supported chains.
                    </p>
                    <div className="flex items-center gap-2 text-blue-400">
                      <span className="text-xs">Learn more at</span>
                      <a href="https://layerzero.network" target="_blank" rel="noopener noreferrer" className="text-xs underline hover:text-blue-300">
                        layerzero.network
                      </a>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 rounded-xl p-6 border border-purple-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">Enhanced by Supra HyperNova</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Supra HyperNova provides bridgeless cross-chain messaging with L1-to-L1 cryptographic consensus, 
                      delivering sub-second finality (600-900ms). Our dual-protocol architecture with LayerZero ensures 
                      33x faster performance and eliminates bridge attack vectors entirely.
                    </p>
                    <div className="flex items-center gap-2 text-purple-400">
                      <span className="text-xs">Learn more at</span>
                      <a href="https://supra.com" target="_blank" rel="noopener noreferrer" className="text-xs underline hover:text-purple-300">
                        supra.com
                      </a>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                    <h4 className="text-lg font-semibold text-white mb-2">Audited by Hedera</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Hedera Consensus Service (HCS) provides immutable, timestamped audit logs for all cross-chain 
                      price synchronization events. Every sync operation is cryptographically verified and permanently 
                      recorded, providing enterprise-grade auditability and compliance.
                    </p>
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="text-xs">Learn more at</span>
                      <a href="https://hedera.com" target="_blank" rel="noopener noreferrer" className="text-xs underline hover:text-green-300">
                        hedera.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Bonding Curve Mechanics</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our bonding curve system provides automatic market making with linear price discovery. The price 
                  formula ensures fair and transparent pricing:
                </p>
                <div className="bg-gradient-to-r from-primary-500/20 to-blue-600/20 rounded-xl p-6 border border-primary-500/30">
                  <code className="text-primary-400 text-lg font-mono">
                    Price = Base Price + (Slope × Global Supply Sold)
                  </code>
                  <p className="text-gray-300 text-sm mt-3">
                    Where supply is converted from wei (1e18) to base token units. The formula ensures linear price discovery based on global supply across all chains.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Automatic DEX Graduation</h3>
                <p className="text-gray-300 leading-relaxed">
                  When a token reaches its graduation threshold (market cap), it automatically migrates to a DEX pool 
                  with full liquidity. This ensures smooth transition from bonding curve to decentralized exchange, 
                  providing continuous liquidity for traders.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Cross-Chain Liquidity: The Complete Solution</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Crossify.io has solved the most critical challenge in multichain token deployment: maintaining accessible liquidity 
                  across all blockchains, <strong className="text-primary-400">even after tokens graduate to DEX pools</strong>. Our revolutionary 
                  three-phase cross-chain liquidity system ensures users can always trade on any chain, regardless of where liquidity is concentrated.
                </p>

                {/* Pre-Graduation System (Completed) */}
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-500/30 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h4 className="text-xl font-semibold text-white">Pre-Graduation: Bonding Curve Liquidity ✅ (Fully Operational)</h4>
                  </div>
                  <p className="text-gray-300 mb-4">
                    Our four-tier liquidity management system is fully implemented and working:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-gray-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span><strong className="text-white">Tier 1:</strong> Per-chain bonding curves with local reserves</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span><strong className="text-white">Tier 2:</strong> Cross-chain liquidity bridge (LayerZero/Supra)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span><strong className="text-white">Tier 3:</strong> Proactive rebalancing every 30 seconds</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                      <span><strong className="text-white">Tier 4:</strong> Reserve pool emergency fallback</span>
                    </div>
                  </div>
                </div>

                {/* Post-Graduation Problem */}
                <div className="bg-gray-900/50 rounded-xl p-6 border border-red-700/30 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">The Post-Graduation Challenge</h4>
                  <p className="text-gray-300 mb-3">
                    When tokens graduate to DEX pools, liquidity becomes locked in chain-specific pools. Traditional platforms can't solve this:
                  </p>
                  <div className="bg-gray-800/50 rounded-lg p-4 font-mono text-sm text-gray-300 mb-3">
                    <div className="mb-2">Token graduates to DEX pools:</div>
                    <div className="ml-4 mb-1">├── Solana Raydium: $50,000 liquidity ✅</div>
                    <div className="ml-4 mb-1">├── Ethereum Uniswap: $5,000 liquidity ⚠️</div>
                    <div className="ml-4 mb-2">└── BSC PancakeSwap: $3,000 liquidity ⚠️</div>
                    <div className="mt-3 mb-1">User wants to sell $10,000 on Ethereum:</div>
                    <div className="ml-4 mb-1">├── Ethereum Uniswap only has $5,000 ❌</div>
                    <div className="ml-4 mb-1">├── Liquidity locked on Solana (can't access) ❌</div>
                    <div className="ml-4">└── Result: Transaction fails or massive slippage ❌</div>
                  </div>
                  <p className="text-red-300 text-sm">
                    <strong>This is the problem we're solving in Q2 2026.</strong>
                  </p>
                </div>

                {/* Three-Phase Solution */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">1</div>
                      <h4 className="text-xl font-semibold text-white">Phase 1: Perpetual Reserve Pool System</h4>
                      <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">Q2 2026 - Weeks 1-8</span>
                    </div>
                    <p className="text-gray-300 mb-4">
                      <strong>The Breakthrough:</strong> Maintain reserve pools alongside DEX pools during graduation.
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 text-sm mb-2"><strong>During Graduation:</strong></p>
                      <div className="font-mono text-sm text-gray-300 ml-4">
                        <div>Total: $50,000</div>
                        <div>├── DEX Pool: $42,500 (85%) - Standard trading</div>
                        <div>└── Reserve Pool: $7,500 (15%) - Cross-chain liquidity</div>
                        <div className="ml-4 mt-1">├── Ethereum Reserve: $3,750</div>
                        <div className="ml-4">├── Solana Reserve: $2,250</div>
                        <div className="ml-4">└── BSC Reserve: $1,500</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Modified Graduation:</strong> Split liquidity 85% DEX / 15% reserve</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Reserve Pool Contract:</strong> PostGraduationReservePool.sol manages reserves</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Automatic Routing:</strong> System finds best liquidity source (DEX or reserve)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Bridge Integration:</strong> Uses existing CrossChainLiquidityBridge</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                      <p className="text-green-300 text-sm">
                        <strong>Impact:</strong> Users can always sell on any chain, even post-graduation. Transparent operation—works like normal DEX trading.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-xl p-6 border border-cyan-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">2</div>
                      <h4 className="text-xl font-semibold text-white">Phase 2: Community-Driven Arbitrage System</h4>
                      <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">Q2 2026 - Weeks 9-18</span>
                    </div>
                    <p className="text-gray-300 mb-4">
                      <strong>The Innovation:</strong> Incentivize community bots to maintain liquidity balance while profiting from arbitrage.
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 text-sm mb-2"><strong>How It Works:</strong></p>
                      <div className="font-mono text-sm text-gray-300 ml-4">
                        <div>Price Discrepancy: Ethereum $1.00, Solana $1.01</div>
                        <div className="mt-2">Arbitrage Bot:</div>
                        <div className="ml-4">├── Buy on Ethereum ($1.00)</div>
                        <div className="ml-4">├── Bridge Ethereum → Solana</div>
                        <div className="ml-4">├── Sell on Solana ($1.01)</div>
                        <div className="ml-4">├── Profit: $0.01 - fees</div>
                        <div className="ml-4">└── Result: Liquidity rebalanced ✅</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Price Monitoring:</strong> Real-time tracking every 5 seconds across all DEX pools</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Arbitrage API:</strong> Public endpoints for bot developers</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Profit Sharing:</strong> 50% to bot operator, 50% to platform</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Bot SDK:</strong> Complete developer toolkit and documentation</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                      <p className="text-cyan-300 text-sm">
                        <strong>Impact:</strong> Self-sustaining liquidity rebalancing. Bot operators earn profits while maintaining price parity automatically.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-pink-600 flex items-center justify-center text-white font-bold">3</div>
                      <h4 className="text-xl font-semibold text-white">Phase 3: Intelligent DEX Aggregator Router</h4>
                      <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">Q2 2026 - Weeks 19-30</span>
                    </div>
                    <p className="text-gray-300 mb-4">
                      <strong>The Vision:</strong> One-click cross-chain trading with optimal routing across all chains and DEXes.
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                      <p className="text-gray-300 text-sm mb-2"><strong>Routing Example:</strong></p>
                      <div className="font-mono text-sm text-gray-300 ml-4">
                        <div>User wants to sell $10,000 on Ethereum</div>
                        <div className="mt-2">Router evaluates:</div>
                        <div className="ml-4">├── Route 1: Ethereum Uniswap</div>
                        <div className="ml-8 text-red-400">Liquidity: $5,000 (insufficient) ❌</div>
                        <div className="ml-4">├── Route 2: Bridge → Solana Raydium</div>
                        <div className="ml-8 text-green-400">Liquidity: $50,000 ✅ Score: 95/100</div>
                        <div className="ml-4">└── Route 3: Bridge → BSC PancakeSwap</div>
                        <div className="ml-8 text-yellow-400">Liquidity: $20,000 Score: 75/100</div>
                        <div className="mt-2 text-green-400">→ Selected: Route 2 (Best price & liquidity)</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Multi-Factor Optimization:</strong> Price, slippage, fees, speed, user preferences</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">DEX Pool Aggregation:</strong> Queries liquidity from ALL DEX pools on ALL chains</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Automatic Execution:</strong> Handles bridging, swapping, and return seamlessly</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0" />
                        <span><strong className="text-white">Smart Contract:</strong> CrossChainDEXRouter for secure execution</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                      <p className="text-indigo-300 text-sm">
                        <strong>Impact:</strong> Revolutionary user experience. Always finds best price, saves 15%+ vs manual routing, executes in &lt;2 minutes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary-500/20 to-blue-600/20 rounded-xl p-6 border border-primary-500/30 mt-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Completion Timeline</h4>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-center justify-between">
                      <span><strong>Phase 1:</strong> Perpetual Reserve Pool</span>
                      <span className="text-primary-400 font-semibold">April - May 2026 (8 weeks)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span><strong>Phase 2:</strong> Arbitrage Infrastructure</span>
                      <span className="text-primary-400 font-semibold">May - July 2026 (10 weeks)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span><strong>Phase 3:</strong> DEX Aggregator Router</span>
                      <span className="text-primary-400 font-semibold">July - September 2026 (12 weeks)</span>
                    </div>
                    <div className="pt-3 border-t border-primary-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-lg">Total Completion</span>
                        <span className="text-green-400 font-bold text-lg">September 2026 ✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Technology Architecture */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Technology Architecture</h2>
            </div>
            <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                    <h3 className="text-xl font-semibold text-white mb-3">Smart Contracts</h3>
                <ul className="space-y-3 text-gray-300">
                  <li>
                    <strong className="text-white">TokenFactory:</strong> Factory contract for creating tokens and 
                    bonding curves on each EVM chain. Supports both standard and cross-chain token deployments. 
                    <span className="text-green-400"> ✅ Deployed on Sepolia, BSC Testnet, Base Sepolia, Hedera</span>
                  </li>
                  <li>
                    <strong className="text-white">CrossChainToken:</strong> Advanced ERC20 token with built-in cross-chain 
                    synchronization. Automatically detects DEX trades and triggers price sync across all chains via LayerZero v2 and Supra. 
                    <span className="text-green-400"> ✅ Fully operational</span>
                  </li>
                  <li>
                    <strong className="text-white">UnifiedCrossChainSync:</strong> Abstraction layer that routes messages to LayerZero, Supra, or both. 
                    Handles protocol selection, message deduplication, and automatic failover. 
                    <span className="text-green-400"> ✅ Deployed and operational</span>
                  </li>
                  <li>
                    <strong className="text-white">SupraSync:</strong> Adapter contract for Supra HyperNova integration. 
                    Message tracking, chain ID mapping, and HyperNova interface. 
                    <span className="text-green-400"> ✅ Contracts deployed, ready for EVM support</span>
                  </li>
                  <li>
                    <strong className="text-white">GlobalSupplyTracker:</strong> Tracks global token supply across all chains. 
                    BondingCurve queries this contract to ensure unified pricing based on total supply sold across all networks. 
                    <span className="text-green-400"> ✅ Operational</span>
                  </li>
                  <li>
                    <strong className="text-white">BondingCurve:</strong> Manages token sales, fee collection, and 
                    graduation logic. Uses global supply for pricing to ensure cross-chain consistency. 
                    <span className="text-green-400"> ✅ Fully functional</span>
                  </li>
                  <li>
                    <strong className="text-white">CrossChainLiquidityBridge:</strong> Handles cross-chain reserve transfers 
                    to ensure all chains maintain sufficient liquidity. Automatically bridges when reserves are low. 
                    <span className="text-green-400"> ✅ Fully operational for bonding curves</span>
                  </li>
                  <li>
                    <strong className="text-white">CrossifyToken:</strong> Standard ERC20 token with metadata and advanced 
                    features (mintable, burnable, pausable) for single-chain deployments. 
                    <span className="text-green-400"> ✅ Deployed</span>
                  </li>
                  <li>
                    <strong className="text-white">CFY Token (CFYToken):</strong> Platform token with advanced tokenomics 
                    including automatic buyback (50% of fees), liquidity provision (30%), deflationary burns (10%), operations (7%), treasury (3%), staking rewards, 
                    fee discounts, and governance. Powers the entire Crossify ecosystem.
                  </li>
                  <li>
                    <strong className="text-white">BuybackContract:</strong> Automatically buys CFY tokens using platform fees, 
                    distributing 80% to liquidity pools and 20% for permanent burns.
                  </li>
                  <li>
                    <strong className="text-white">LiquidityProvisionContract:</strong> Automatically adds liquidity to CFY pools 
                    across all supported chains, ensuring deep liquidity for trading.
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Cross-Chain Architecture</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Dual-Protocol Architecture: LayerZero + Supra HyperNova</h4>
                    <p className="text-gray-300 mb-4">
                      Crossify.io leverages a <strong className="text-primary-400">dual-protocol architecture</strong> combining 
                      <strong className="text-blue-400"> LayerZero</strong> and <strong className="text-purple-400">Supra HyperNova</strong> 
                      for enhanced security, performance, and redundancy.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                        <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          LayerZero Integration ✅
                        </h5>
                        <ul className="space-y-1 text-gray-300 text-sm ml-6">
                          <li>• Battle-tested cross-chain messaging</li>
                          <li>• ~30 second latency</li>
                          <li>• Proven reliability</li>
                          <li>• Primary protocol for liquidity bridging</li>
                          <li>• LayerZero Endpoint V2 deployed</li>
                        </ul>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                        <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          Supra HyperNova Integration ✅
                        </h5>
                        <ul className="space-y-1 text-gray-300 text-sm ml-6">
                          <li>• <strong>L1-to-L1 cryptographic consensus</strong> (no bridge trust)</li>
                          <li>• <strong>Sub-second finality:</strong> 600-900ms (33x faster)</li>
                          <li>• <strong>Bridgeless architecture</strong> (eliminates bridge risks)</li>
                          <li>• <strong>Mathematically provable security</strong></li>
                          <li>• Contracts deployed & operational on Sepolia</li>
                          <li>• EVM support launched Q1-Q2 2025</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
                      <h5 className="text-white font-semibold mb-2">Dual-Protocol Benefits</h5>
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• <strong>Automatic Failover:</strong> If LayerZero fails, Supra handles it (and vice versa)</li>
                        <li>• <strong>Zero Downtime:</strong> Redundancy ensures continuous operation</li>
                        <li>• <strong>Performance Optimization:</strong> Auto-select best protocol based on metrics</li>
                        <li>• <strong>Message Deduplication:</strong> Prevents double-processing when both deliver</li>
                        <li>• <strong>Enhanced Security:</strong> Supra's bridgeless architecture eliminates bridge attack vectors</li>
                        <li>• <strong>Speed Advantage:</strong> Supra delivers 33x faster (600-900ms vs ~30s)</li>
                      </ul>
                    </div>
                    <div className="mt-4 bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                      <h5 className="text-white font-semibold mb-3">Performance Comparison</h5>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-300 mb-2">Cross-Chain Message Delivery:</div>
                          <div className="space-y-1 ml-4">
                            <div className="flex items-center justify-between text-gray-400">
                              <span>LayerZero:</span>
                              <span className="text-blue-400">~30 seconds</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-400">
                              <span>Supra HyperNova:</span>
                              <span className="text-purple-400 font-semibold">600-900ms</span>
                            </div>
                            <div className="flex items-center justify-between text-green-400 mt-2 pt-2 border-t border-gray-700">
                              <span className="font-semibold">Improvement:</span>
                              <span className="font-bold">33x faster</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-300 mb-2">Security Model:</div>
                          <div className="space-y-1 ml-4">
                            <div className="flex items-center gap-2 text-gray-400">
                              <span>Traditional Bridge:</span>
                              <span className="text-red-400">Trust assumption ❌</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <span>Supra HyperNova:</span>
                              <span className="text-green-400">L1-to-L1 consensus ✅</span>
                            </div>
                            <div className="text-purple-300 text-xs mt-2 pt-2 border-t border-gray-700">
                              Eliminates bridge attack vectors entirely
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h5 className="text-lg font-semibold text-white mb-2">Deployed Contracts ✅</h5>
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• <strong>UnifiedCrossChainSync:</strong> <code className="text-primary-400">0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e</code> (Sepolia)</li>
                        <li>• <strong>SupraSync:</strong> <code className="text-primary-400">0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569</code> (Sepolia)</li>
                        <li>
                          <a 
                            href="https://sepolia.etherscan.io/address/0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline text-xs"
                          >
                            View on Etherscan →
                          </a>
                        </li>
                      </ul>
                      <div className="mt-3 bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                        <h6 className="text-white font-semibold text-xs mb-2">Future Supra Integrations (Planned)</h6>
                        <ul className="space-y-1 text-gray-300 text-xs ml-4">
                          <li>• <strong>DORA 2.0 Oracle:</strong> Sub-second price feeds for real-time verification</li>
                          <li>• <strong>AutoFi:</strong> Zero-block delay automation for instant cross-chain operations</li>
                          <li>• <strong>SupraEVM:</strong> Direct token deployment when EVM support launches (500,000+ TPS)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Price Synchronization Flow</h4>
                    <ol className="space-y-2 text-gray-300 ml-4 list-decimal">
                      <li>User buys/sells token on any DEX (Uniswap, PancakeSwap, etc.)</li>
                      <li>CrossChainToken detects the trade via transfer hooks</li>
                      <li>Supply update is calculated and broadcast via UnifiedCrossChainSync</li>
                      <li>Protocol selection: System chooses LayerZero (~30s) or Supra (600-900ms) based on metrics</li>
                      <li>Messages sent via selected protocol(s) to all other chains</li>
                      <li>Price updates propagate across all networks: <span className="text-purple-400">~1 second (Supra)</span> or <span className="text-blue-400">~30 seconds (LayerZero)</span></li>
                      <li>All chains update to consistent global price</li>
                      <li>Sync event logged immutably to Hedera Consensus Service</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Security</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Smart Contract Security</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Built on <strong className="text-primary-400">OpenZeppelin's</strong> audited contracts</li>
                      <li>• ReentrancyGuard protection on all state-changing functions</li>
                      <li>• Ownable access control for administrative functions</li>
                      <li>• Comprehensive testing and security audits</li>
                      <li>• Multi-signature wallet support for critical operations</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Cross-Chain Security</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• <strong className="text-purple-400">Supra HyperNova:</strong> Bridgeless L1-to-L1 cryptographic consensus eliminates bridge attack vectors</li>
                      <li>• <strong className="text-blue-400">LayerZero:</strong> Battle-tested secure message passing infrastructure</li>
                      <li>• <strong>Dual-Protocol Redundancy:</strong> Automatic failover prevents single points of failure</li>
                      <li>• <strong>Message Deduplication:</strong> Prevents double-processing attacks</li>
                      <li>• <strong className="text-green-400">Hedera Consensus Service:</strong> Immutable audit trails for all cross-chain operations</li>
                      <li>• <strong>Trust Minimization:</strong> No bridge custody required</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary-500/20 to-blue-600/20 rounded-xl p-6 border border-primary-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">Technology Partners</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                    <h4 className="text-lg font-semibold text-primary-400 mb-2">LayerZero</h4>
                    <p className="text-gray-300 text-sm">
                      Cross-chain messaging protocol enabling secure communication between blockchains. 
                      Powers our price synchronization infrastructure.
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                    <h4 className="text-lg font-semibold text-green-400 mb-2">OpenZeppelin</h4>
                    <p className="text-gray-300 text-sm">
                      Industry-standard security libraries and contracts. Our tokens are built on 
                      audited OpenZeppelin contracts for maximum security.
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-purple-500/30">
                    <h4 className="text-lg font-semibold text-purple-400 mb-2">Supra HyperNova ✅</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Next-generation <strong>bridgeless</strong> cross-chain protocol with L1-to-L1 cryptographic consensus. 
                      Delivers sub-second finality (600-900ms) and eliminates bridge attack vectors entirely.
                    </p>
                    <div className="text-xs text-purple-300 space-y-1">
                      <div>• <strong>33x faster</strong> than traditional bridges</div>
                      <div>• <strong>Mathematically provable security</strong></div>
                      <div>• <strong>Zero bridge trust assumptions</strong></div>
                      <div>• Operational on Sepolia with EVM support launched</div>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-green-500/30">
                    <h4 className="text-lg font-semibold text-green-400 mb-2">Hedera</h4>
                    <p className="text-gray-300 text-sm">
                      Enterprise-grade blockchain with 10,000+ TPS, 3-5s finality, and ~$0.0001 per transaction. 
                      Immutable audit trails via Consensus Service and permanent metadata storage via File Service.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Supported Chains</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-gray-300">Ethereum Sepolia (Testnet)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-gray-300">BSC Testnet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-gray-300">Solana Devnet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                    <span className="text-gray-300">Base Sepolia (Testnet)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-gray-300">Hedera Testnet ⚡</span>
                    <span className="text-xs text-green-400">Fast & Cheap</span>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-yellow-300 text-sm">
                      <strong>Current Status:</strong> Platform is live on testnets. Mainnet deployment will occur after comprehensive security audits and testing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Presale System */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Presale System</h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Complete Presale Infrastructure</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Crossify.io includes a comprehensive Solana-based presale system that enables token creators to launch 
                  professional presales with automated fund management, token distribution, and vesting schedules.
                </p>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Core Features</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>Real-Time Monitoring:</strong> Automatic SOL transaction detection and tracking</li>
                    <li>• <strong>Token Allocation:</strong> Automatic calculation and tracking of token allocations based on SOL contributions</li>
                    <li>• <strong>Configurable Pricing:</strong> Set SOL price per token with min/max purchase limits</li>
                    <li>• <strong>Referral System:</strong> Built-in affiliate/referral tracking with rewards</li>
                    <li>• <strong>Live Dashboard:</strong> Beautiful presale page with real-time stats and progress tracking</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-500/30 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Automated Fund Splitting</h4>
                  <p className="text-gray-300 mb-3">
                    One of the most powerful features is automatic fund splitting. When presale funds are received, the system 
                    automatically splits them to multiple wallets based on configured percentages:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>Liquidity Wallet:</strong> Funds for initial DEX liquidity provision</li>
                    <li>• <strong>Development Wallet:</strong> Funds for ongoing development and operations</li>
                    <li>• <strong>Marketing Wallet:</strong> Funds for marketing and community growth</li>
                    <li>• <strong>Threshold-Based:</strong> Splits automatically when accumulated funds reach a threshold (e.g., 1 SOL)</li>
                    <li>• <strong>Full Transparency:</strong> All splits tracked with transaction hashes and timestamps</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Automated Token Distribution</h4>
                  <p className="text-gray-300 mb-3">
                    At token launch, the system automatically distributes tokens to all presale buyers:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>TGE Distribution:</strong> 20% of tokens released immediately at Token Generation Event</li>
                    <li>• <strong>Batch Processing:</strong> Efficient batch distribution with configurable batch sizes</li>
                    <li>• <strong>Vesting Setup:</strong> Remaining 80% set up for linear vesting over 18 months</li>
                    <li>• <strong>Status Tracking:</strong> Real-time tracking of distribution status and unclaimed allocations</li>
                    <li>• <strong>SPL Token Support:</strong> Native Solana SPL token distribution</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <h4 className="text-lg font-semibold text-white mb-3">Vesting Schedule</h4>
                  <p className="text-gray-300 mb-3">
                    All presale tokens are subject to a vesting schedule designed to protect long-term value:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>20% at TGE:</strong> Immediate release at token launch</li>
                    <li>• <strong>80% Linear Vesting:</strong> Released monthly over 18 months</li>
                    <li>• <strong>Value Protection:</strong> Prevents large dumps that could crash token price</li>
                    <li>• <strong>Platform Growth:</strong> Gives platform time to generate fees and build value</li>
                    <li>• <strong>Staking Integration:</strong> Vested tokens can be staked to earn additional rewards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tokenomics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">CFY Platform Token</h2>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/30 mb-6">
              <p className="text-gray-300 leading-relaxed mb-4">
                The <strong className="text-white">Crossify Token (CFY)</strong> is our native platform token with advanced tokenomics 
                designed to create sustainable value for all stakeholders. CFY powers the entire Crossify ecosystem through 
                automatic buyback, liquidity provision, deflationary burns, staking rewards, fee discounts, and governance.
              </p>
              <Link
                to="/tokenomics"
                className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold transition"
              >
                Learn More About CFY Tokenomics
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-4">Key Features</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Automatic buyback (50% of fees)</li>
                  <li>• Liquidity provision (30% of fees)</li>
                  <li>• Deflationary burns (10% of fees)</li>
                  <li>• Staking rewards (up to 100% APY)</li>
                  <li>• Fee discounts (up to 50% off)</li>
                  <li>• Governance voting (1 CFY = 1 vote)</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-4">Distribution</h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Presale</span>
                    <span className="text-white font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liquidity Pool</span>
                    <span className="text-white font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team & Advisors</span>
                    <span className="text-white font-semibold">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ecosystem</span>
                    <span className="text-white font-semibold">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staking Rewards</span>
                    <span className="text-white font-semibold">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Treasury</span>
                    <span className="text-white font-semibold">5%</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-4">Value Proposition</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Platform utility & discounts</li>
                  <li>• Governance participation</li>
                  <li>• Staking rewards</li>
                  <li>• Buyback increases value</li>
                  <li>• Burns create scarcity</li>
                  <li>• Cross-chain compatibility</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Roadmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Roadmap</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Completed Foundation (2024-2025) ✅</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-gray-300 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Smart contracts deployed on all testnets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>LayerZero integration operational</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Supra HyperNova dual-protocol architecture</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Hedera integration (3-5s finality)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Cross-chain liquidity bridge operational</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Proactive rebalancing every 30 seconds</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>DEX graduation system working</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Complete frontend and backend services</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                  <h3 className="text-xl font-semibold text-white">Q1 2026 - Mainnet Launch 🚀</h3>
                </div>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Complete security audits</li>
                  <li>• Mainnet contract deployment (Ethereum, BSC, Base, Hedera)</li>
                  <li>• Contract verification on all explorers</li>
                  <li>• Infrastructure scaling for production</li>
                  <li>• Monitoring and alerting systems</li>
                  <li>• Gradual user onboarding</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                  <h3 className="text-xl font-semibold text-white">Q2 2026 - The Cross-Chain Liquidity Revolution 🌟</h3>
                </div>
                <p className="text-gray-300 mb-4 text-sm">
                  Solving the industry's biggest challenge: post-graduation cross-chain liquidity.
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">1</div>
                      <h4 className="text-white font-semibold">Phase 1: Perpetual Reserve Pool System</h4>
                      <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">Weeks 1-8</span>
                    </div>
                    <ul className="space-y-1 text-gray-300 text-sm ml-8">
                      <li>• Modified graduation (85% DEX / 15% reserve)</li>
                      <li>• PostGraduationReservePool.sol contract</li>
                      <li>• Reserve pool monitoring service</li>
                      <li>• Integration with existing bridge system</li>
                    </ul>
                    <p className="text-purple-300 text-xs mt-2 ml-8">Impact: Users can always sell on any chain, even post-graduation</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                      <h4 className="text-white font-semibold">Phase 2: Arbitrage Bot Infrastructure</h4>
                      <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">Weeks 9-18</span>
                    </div>
                    <ul className="space-y-1 text-gray-300 text-sm ml-8">
                      <li>• Real-time price monitoring (5-second intervals)</li>
                      <li>• Arbitrage opportunity API</li>
                      <li>• Automated execution service</li>
                      <li>• Bot SDK and developer documentation</li>
                      <li>• Incentive program launch</li>
                    </ul>
                    <p className="text-cyan-300 text-xs mt-2 ml-8">Impact: Self-sustaining liquidity rebalancing through community bots</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">3</div>
                      <h4 className="text-white font-semibold">Phase 3: Intelligent DEX Aggregator Router</h4>
                      <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">Weeks 19-30</span>
                    </div>
                    <ul className="space-y-1 text-gray-300 text-sm ml-8">
                      <li>• DEX pool query service (all chains, all DEXes)</li>
                      <li>• Multi-factor routing algorithm</li>
                      <li>• CrossChainDEXRouter smart contract</li>
                      <li>• Frontend integration</li>
                      <li>• Testing and optimization</li>
                    </ul>
                    <p className="text-indigo-300 text-xs mt-2 ml-8">Impact: Revolutionary one-click cross-chain trading with best price discovery</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Q2 2026 Completion:</span>
                    <span className="text-green-400 font-bold">September 2026 ✅</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <h3 className="text-xl font-semibold text-white">Q3 2026 - Expansion & Enterprise</h3>
                </div>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Additional chain support (Polygon, Arbitrum, Optimism, Avalanche)</li>
                  <li>• Enterprise tools (white-label, API access, bulk operations)</li>
                  <li>• Compliance & legal framework</li>
                  <li>• Advanced analytics for institutions</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <h3 className="text-xl font-semibold text-white">Q4 2026 - Advanced Features</h3>
                </div>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Supra DORA 2.0 Oracle integration (sub-second price verification)</li>
                  <li>• Supra AutoFi (zero-block delay automation)</li>
                  <li>• SupraEVM token deployment (500,000+ TPS)</li>
                  <li>• Layer 2 optimizations</li>
                  <li>• Mobile app beta (iOS & Android)</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Team & Vision */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Vision & Mission</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed text-lg">
                Our vision is to create a world where token creation is accessible to everyone, regardless of technical 
                expertise. We believe that the future of DeFi lies in seamless cross-chain experiences that eliminate 
                fragmentation and complexity.
              </p>
              <p className="text-gray-300 leading-relaxed text-lg">
                Crossify.io is committed to building the infrastructure that enables the next generation of decentralized 
                applications. Through innovation, security, and community-driven development, we're shaping the future of 
                multichain token launches.
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/30 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-6">
            Join us in revolutionizing multichain token launches
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/builder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg"
            >
              Launch Your Token
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-lg transition-all border border-gray-700"
            >
              Read Documentation
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}

