import { FileText, Target, Zap, Globe, TrendingUp, Users, Calendar, Rocket, ArrowRight, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import QuantumBackground from '../components/QuantumBackground';

export default function Whitepaper() {
  return (
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
              <p className="text-gray-300 leading-relaxed text-lg">
                Our platform enables creators to launch tokens simultaneously across Ethereum, BSC, Solana, and Base 
                with unified virtual liquidity, ensuring consistent pricing and seamless cross-chain trading. Through 
                innovative bonding curve mechanics and automatic DEX graduation, Crossify.io democratizes token creation 
                while maintaining security and transparency.
              </p>
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
                  <strong className="text-primary-400"> LayerZero</strong>. When tokens are traded on any DEX 
                  (Uniswap, PancakeSwap, etc.), our smart contracts automatically detect the trade and broadcast 
                  price updates across all chains, ensuring perfect price consistency.
                </p>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <h4 className="text-lg font-semibold text-white mb-2">How Cross-Chain Sync Works:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li><strong>DEX Trade Detection:</strong> CrossChainToken automatically detects trades via transfer hooks</li>
                    <li><strong>LayerZero Messaging:</strong> Price updates are broadcast via LayerZero's secure messaging protocol</li>
                    <li><strong>Real-Time Propagation:</strong> Updates reach all chains within seconds</li>
                    <li><strong>Consistent Pricing:</strong> All chains see the same price based on global supply</li>
                    <li><strong>Arbitrage Elimination:</strong> No price discrepancies means no arbitrage opportunities</li>
                    <li><strong>Automatic Fee Collection:</strong> 0.5% fee on DEX trades covers cross-chain messaging costs</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30 mt-4">
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
                <h3 className="text-2xl font-semibold text-white mb-4">Cross-Chain Liquidity Bridge</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  One of the critical challenges in cross-chain token deployment is ensuring sufficient liquidity on all chains, 
                  even when trading activity is unevenly distributed. Crossify.io solves this with our innovative 
                  <strong className="text-primary-400"> Cross-Chain Liquidity Bridge</strong> system.
                </p>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">The Problem</h4>
                  <p className="text-gray-300 mb-3">
                    Consider this scenario: 100 users buy tokens on Solana, driving the price up globally. 5 users buy on 
                    Ethereum at the elevated price. When Ethereum users want to sell, the Ethereum bonding curve lacks 
                    sufficient reserves because most liquidity is on Solana.
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-red-400">Traditional Solution:</strong> Users are stuck with tokens they can't sell, 
                    or must manually bridge to another chain.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-500/30 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Our Solution: Multi-Tier Liquidity System</h4>
                  <div className="space-y-3 text-gray-300">
                    <div>
                      <strong className="text-white">Tier 1 - Per-Chain Bonding Curves:</strong> Each chain maintains local 
                      reserves for immediate buy/sell operations.
                    </div>
                    <div>
                      <strong className="text-white">Tier 2 - Automatic Liquidity Bridge:</strong> When a chain needs liquidity, 
                      automatically bridges reserves from chains with excess liquidity via LayerZero. Users pay minimal fees 
                      (0.1% + LayerZero costs).
                    </div>
                    <div>
                      <strong className="text-white">Tier 3 - Proactive Rebalancing:</strong> Continuously monitors reserve levels 
                      and automatically rebalances before critical thresholds, maintaining optimal liquidity distribution.
                    </div>
                    <div>
                      <strong className="text-white">Tier 4 - Reserve Pool:</strong> Central reserve pool accessible from any chain, 
                      funded by platform fees, ensures liquidity even in extreme scenarios.
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                  <h4 className="text-lg font-semibold text-white mb-3">How It Works</h4>
                  <ol className="space-y-2 text-gray-300 ml-4 list-decimal">
                    <li><strong>Reserve Monitoring:</strong> System tracks reserves on all chains every 30 seconds</li>
                    <li><strong>Ideal Reserve Calculation:</strong> Calculates ideal reserves per chain based on trading volume: 
                    <code className="text-primary-400 ml-1">idealReserve = (globalReserves × chainVolume) / globalVolume</code></li>
                    <li><strong>Automatic Rebalancing:</strong> When a chain drops below 30% of ideal, automatically bridges from excess chains</li>
                    <li><strong>On-Demand Bridge:</strong> If user tries to sell and reserves are low, automatically triggers bridge request</li>
                    <li><strong>Seamless Execution:</strong> User's transaction completes after bridge confirmation (~30 seconds)</li>
                  </ol>
                  <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <p className="text-blue-300 text-sm">
                      <strong>Result:</strong> Users can always buy/sell on any chain, regardless of where most liquidity is concentrated. 
                      Fees are transparent (~$0.01-0.05 + 0.1%) and shown before transaction confirmation.
                    </p>
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
                  </li>
                  <li>
                    <strong className="text-white">CrossChainToken:</strong> Advanced ERC20 token with built-in cross-chain 
                    synchronization. Automatically detects DEX trades and triggers price sync across all chains via LayerZero.
                  </li>
                  <li>
                    <strong className="text-white">CrossChainSync:</strong> Central contract that manages LayerZero messaging 
                    for cross-chain supply and price synchronization. Handles message routing and fee collection.
                  </li>
                  <li>
                    <strong className="text-white">BondingCurve:</strong> Manages token sales, fee collection, and 
                    graduation logic. Integrates with global supply tracking for cross-chain price consistency. Enhanced 
                    with liquidity bridge support for cross-chain reserve management.
                  </li>
                  <li>
                    <strong className="text-white">CrossChainLiquidityBridge:</strong> Handles cross-chain reserve transfers 
                    to ensure all chains maintain sufficient liquidity. Automatically bridges reserves when needed and manages 
                    proactive rebalancing to prevent liquidity shortages.
                  </li>
                  <li>
                    <strong className="text-white">CrossifyToken:</strong> Standard ERC20 token with metadata and advanced 
                    features (mintable, burnable, pausable) for single-chain deployments.
                  </li>
                  <li>
                    <strong className="text-white">CFY Token (CrossifyToken):</strong> Platform token with advanced tokenomics 
                    including automatic buyback (50% of fees), liquidity provision (30%), deflationary burns (10%), staking rewards, 
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
                    <h4 className="text-lg font-semibold text-white mb-2">LayerZero Integration</h4>
                    <p className="text-gray-300 mb-3">
                      Crossify.io leverages <strong className="text-primary-400">LayerZero</strong>, the leading 
                      cross-chain messaging protocol, to enable seamless price synchronization across all supported chains. 
                      LayerZero's secure message passing ensures that price updates are reliably broadcast across networks.
                    </p>
                    <ul className="space-y-2 text-gray-300 ml-4">
                      <li>• <strong>LayerZero Endpoint V2:</strong> Secure cross-chain message delivery</li>
                      <li>• <strong>Automatic Message Routing:</strong> Messages automatically routed to all target chains</li>
                      <li>• <strong>Fee Collection:</strong> 0.5% fee on DEX trades covers LayerZero messaging costs</li>
                      <li>• <strong>Trusted Remote Verification:</strong> Secure message validation using trusted remote addresses</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Price Synchronization Flow</h4>
                    <ol className="space-y-2 text-gray-300 ml-4 list-decimal">
                      <li>User buys/sells token on any DEX (Uniswap, PancakeSwap, etc.)</li>
                      <li>CrossChainToken detects the trade via transfer hooks</li>
                      <li>Supply update is calculated and broadcast via CrossChainSync</li>
                      <li>LayerZero sends messages to all other chains</li>
                      <li>Price updates propagate across all networks within seconds</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Security</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Built on <strong className="text-primary-400">OpenZeppelin's</strong> audited contracts</li>
                  <li>• ReentrancyGuard protection on all state-changing functions</li>
                  <li>• Ownable access control for administrative functions</li>
                  <li>• LayerZero's secure message passing infrastructure</li>
                  <li>• Comprehensive testing and security audits</li>
                  <li>• Multi-signature wallet support for critical operations</li>
                </ul>
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
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                    <h4 className="text-lg font-semibold text-purple-400 mb-2">Supra Oracles</h4>
                    <p className="text-gray-300 text-sm">
                      Oracle network for price verification. Ensures accurate price data across 
                      all chains for cross-chain synchronization.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-xl font-semibold text-white mb-3">Supported Chains</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-gray-300">Ethereum (Mainnet & Sepolia)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-gray-300">BSC (Mainnet & Testnet)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-gray-300">Solana (Mainnet & Devnet)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                    <span className="text-gray-300">Base (Mainnet & Sepolia)</span>
                  </div>
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
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <h3 className="text-xl font-semibold text-white">Q1 2024 - Testnet Launch</h3>
                </div>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Deploy contracts to testnets</li>
                  <li>• Launch beta platform</li>
                  <li>• Community testing and feedback</li>
                  <li>• Security audits</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                  <h3 className="text-xl font-semibold text-white">Q2 2024 - Mainnet Launch</h3>
                </div>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Mainnet deployment</li>
                  <li>• Public token sale</li>
                  <li>• DEX integrations</li>
                  <li>• Advanced features rollout</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <h3 className="text-xl font-semibold text-white">Q3-Q4 2024 - Expansion</h3>
                </div>
                <ul className="space-y-2 text-gray-300 ml-6">
                  <li>• Additional chain support (Polygon, Avalanche, Arbitrum)</li>
                  <li>• Mobile app launch</li>
                  <li>• Advanced analytics dashboard</li>
                  <li>• Governance platform</li>
                  <li>• Strategic partnerships</li>
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
  );
}

