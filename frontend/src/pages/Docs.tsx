import { Book, Code, Zap, Lock, ArrowRight, ExternalLink, FileText, Layers, Network, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Docs() {
  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
      content: [
        {
          title: 'What is Crossify.io?',
          description: 'Crossify.io is a multichain token launch platform that enables creators to deploy tokens simultaneously across Ethereum, BSC, Solana, and Base with unified virtual liquidity and cross-chain price synchronization.',
        },
        {
          title: 'Key Features',
          description: '• Multichain deployment in one transaction\n• Bonding curve sales with automatic DEX graduation\n• Virtual liquidity for consistent pricing across chains\n• Real-time price synchronization\n• No-code token creation interface',
        },
        {
          title: 'Quick Start',
          description: '1. Click "Launch Token" in the navigation\n2. Fill in your token details (name, symbol, supply)\n3. Configure bonding curve parameters\n4. Select chains for deployment\n5. Deploy and start trading!',
        },
      ],
    },
    {
      id: 'bonding-curves',
      title: 'Bonding Curves',
      icon: Layers,
      color: 'from-blue-500 to-purple-600',
      content: [
        {
          title: 'How Bonding Curves Work',
          description: 'Bonding curves create automatic market making for your token. The price increases linearly as more tokens are sold, creating a fair and transparent pricing mechanism.',
        },
        {
          title: 'Price Formula',
          description: 'Price = Base Price + (Slope × Supply Sold)\n\n• Base Price: Starting price per token\n• Slope: Price increase per token sold\n• Supply Sold: Total tokens purchased from the curve',
        },
        {
          title: 'Graduation Threshold',
          description: 'When your token reaches a certain market cap (graduation threshold), it automatically migrates to a DEX pool with full liquidity. This ensures smooth transition from bonding curve to decentralized exchange.',
        },
        {
          title: 'Fees',
          description: '• Buy Fee: Applied when purchasing tokens (default: 2%)\n• Sell Fee: Applied when selling tokens (default: 3%)\n• Platform Fee: One-time fee during token creation (FREE on testnet)',
        },
      ],
    },
    {
      id: 'cross-chain-sync',
      title: 'Cross-Chain Price Sync',
      icon: Network,
      color: 'from-green-500 to-emerald-600',
      content: [
        {
          title: 'What is Cross-Chain Price Synchronization?',
          description: 'Our cross-chain price synchronization system uses LayerZero to automatically sync token prices across all chains. When someone buys or sells your token on any DEX (Uniswap, PancakeSwap, etc.), the price automatically updates on all other chains within seconds.',
        },
        {
          title: 'How It Works',
          description: '1. User trades token on any DEX (Uniswap, PancakeSwap, etc.)\n2. CrossChainToken detects the trade via transfer hooks\n3. CrossChainSync contract calculates new supply/price\n4. LayerZero broadcasts the update to all other chains\n5. Prices sync across all networks in real-time\n6. All chains show consistent pricing based on global supply',
        },
        {
          title: 'Benefits',
          description: '• Perfect price consistency across all chains\n• No arbitrage opportunities\n• Automatic synchronization on every trade\n• Works with any DEX (Uniswap, PancakeSwap, etc.)\n• Low cost: Only 0.5% fee on DEX trades\n• Powered by LayerZero for reliability',
        },
        {
          title: 'LayerZero Integration',
          description: 'We use LayerZero, the leading cross-chain messaging protocol, to enable secure and efficient price synchronization. LayerZero ensures reliable message delivery across all supported blockchains with minimal fees and maximum security.',
        },
        {
          title: 'Fee Mechanism',
          description: 'Cross-chain synchronization is funded by a 0.5% fee collected on DEX trades. This fee covers LayerZero messaging costs, ensuring the system remains sustainable while keeping costs low for users.',
        },
      ],
    },
    {
      id: 'token-creation',
      title: 'Token Creation',
      icon: Code,
      color: 'from-purple-500 to-pink-600',
      content: [
        {
          title: 'Token Parameters',
          description: '• Name: Your token\'s full name (e.g., "My Awesome Token")\n• Symbol: Token ticker (e.g., "MAT")\n• Initial Supply: Starting token supply\n• Decimals: Number of decimal places (default: 18)',
        },
        {
          title: 'Bonding Curve Configuration',
          description: '• Base Price: Starting price in ETH/BNB\n• Slope: Price increase per token (in wei)\n• Graduation Threshold: Market cap in USD to trigger DEX migration\n• Buy/Sell Fees: Transaction fees as percentages',
        },
        {
          title: 'Chain Selection & Cross-Chain Option',
          description: 'Select which chains to deploy on:\n• Ethereum (Sepolia testnet)\n• BSC (BSC Testnet)\n• Base (Base Sepolia)\n• Solana (Devnet)\n\nYou can deploy to all chains simultaneously!\n\nCross-Chain Sync: When deploying to 2+ chains, you can enable cross-chain price synchronization. This uses LayerZero to keep prices consistent across all chains automatically.',
        },
        {
          title: 'Metadata',
          description: 'Add optional metadata:\n• Logo (IPFS hash)\n• Description\n• Social links (Twitter, Discord, Telegram, Website)',
        },
      ],
    },
    {
      id: 'smart-contracts',
      title: 'Smart Contracts',
      icon: Lock,
      color: 'from-red-500 to-orange-600',
      content: [
        {
          title: 'TokenFactory',
          description: 'The main factory contract that creates tokens and bonding curves. Deployed on each EVM chain (Ethereum, BSC, Base). Supports both standard (CrossifyToken) and cross-chain (CrossChainToken) deployments based on user preference.',
        },
        {
          title: 'CrossChainToken',
          description: 'Advanced ERC20 token with built-in cross-chain synchronization. Automatically detects DEX trades and triggers price sync across all chains via LayerZero. Includes all standard ERC20 features plus cross-chain capabilities.',
        },
        {
          title: 'CrossChainSync',
          description: 'Central contract managing LayerZero messaging for cross-chain synchronization. Handles supply updates, price broadcasts, and fee collection. Implements LayerZero v2 interfaces for secure message passing.',
        },
        {
          title: 'BondingCurve',
          description: 'Manages token sales through bonding curve mechanics. Handles buy/sell operations, fee collection, and graduation to DEX. Integrates with global supply tracking for cross-chain price consistency.',
        },
        {
          title: 'CrossifyToken',
          description: 'Standard ERC20 token contract with metadata URI support. Includes burnable, pausable, and mintable functionality. Used for single-chain deployments without cross-chain features.',
        },
        {
          title: 'CFY Platform Token',
          description: 'The Crossify Token (CFY) is our native platform token with advanced tokenomics:\n\n• Automatic Buyback: 50% of platform fees used to buy back CFY\n• Liquidity Provision: 30% of fees added to CFY liquidity pools\n• Deflationary Burns: 10% of fees used for permanent token burns\n• Staking Rewards: Up to 100% APY on LP staking\n• Fee Discounts: Hold CFY to receive discounts on platform fees\n• Governance: Vote on platform decisions (1 CFY = 1 vote)\n\nTotal Supply: 1 billion CFY\nDistribution: Presale (30%), Liquidity (25%), Team (15%), Ecosystem (15%), Staking (10%), Treasury (5%)',
        },
        {
          title: 'BuybackContract & LiquidityProvisionContract',
          description: 'Advanced contracts that manage CFY token economics:\n\n• BuybackContract: Automatically buys CFY using platform fees, distributing 80% to liquidity and 20% for burns\n• LiquidityProvisionContract: Automatically adds liquidity to CFY pools across all chains, ensuring deep liquidity\n\nThese contracts work together to create a sustainable tokenomics model where platform fees drive token value.',
        },
        {
          title: 'Security & Partners',
          description: '• Built on OpenZeppelin audited contracts\n• LayerZero secure messaging infrastructure\n• ReentrancyGuard protection\n• Ownable access control\n• Comprehensive testing\n• Technology partners: LayerZero, OpenZeppelin, Supra Oracles',
        },
      ],
    },
    {
      id: 'cfy-token',
      title: 'CFY Platform Token',
      icon: Coins,
      color: 'from-yellow-500 to-orange-600',
      content: [
        {
          title: 'What is CFY Token?',
          description: 'The Crossify Token (CFY) is the native utility and governance token for Crossify.io. It powers the entire platform ecosystem with advanced tokenomics including automatic buyback, liquidity provision, deflationary burns, staking rewards, fee discounts, and governance voting.',
        },
        {
          title: 'Token Details',
          description: '• Name: Crossify Token\n• Symbol: CFY\n• Total Supply: 1,000,000,000 CFY (1 billion)\n• Type: Cross-chain token (deployed on all supported chains)\n• Decimals: 18',
        },
        {
          title: 'Advanced Tokenomics',
          description: 'CFY features a comprehensive tokenomics model:\n\n• Automatic Buyback (50% of fees): Buys CFY from market, 80% to liquidity, 20% burned\n• Liquidity Provision (30% of fees): Adds liquidity to CFY pools on all chains\n• Deflationary Burns (10% of fees): Permanent token burns reduce supply\n• Staking Rewards: Locked staking (up to 50% APY), Flexible (10-20% APY), LP staking (up to 100% APY)\n• Fee Discounts: Hold 1K CFY (5% off), 10K (10% off), 100K (20% off + premium), 1M (50% off + VIP)\n• Governance: 1 CFY = 1 vote, minimum 10K to propose, 1M to vote',
        },
        {
          title: 'Revenue Model',
          description: 'Platform fees are collected from:\n• Token Creation: 0.01 ETH per token\n• Mint Operations: 0.1% of minted tokens\n• Cross-Chain Sync: 0.5% of DEX trade value\n• Liquidity Bridge: 0.1% + LayerZero costs\n\nFee Distribution:\n• 50% → CFY Buyback\n• 30% → Liquidity Provision\n• 10% → Token Burns\n• 10% → Operations & Treasury',
        },
        {
          title: 'Presale Information',
          description: 'Public Presale (200M CFY):\n• Tier 1: $0.01/CFY (First 50M)\n• Tier 2: $0.015/CFY (Next 50M)\n• Tier 3: $0.02/CFY (Next 50M)\n• Tier 4: $0.025/CFY (Last 50M)\n• Vesting: 20% TGE, 80% linear over 12 months\n\nPrivate Sale (100M CFY):\n• Price: $0.008/CFY (20% discount)\n• Vesting: 6-month cliff, 18-month linear',
        },
        {
          title: 'Value Creation Cycle',
          description: 'The CFY tokenomics creates a sustainable value cycle:\n\n1. Platform fees collected from token operations\n2. 50% of fees used for automatic CFY buyback\n3. Buyback increases token demand and value\n4. 30% of fees add liquidity, ensuring deep markets\n5. 10% of fees burned, reducing supply and increasing scarcity\n6. Increased value attracts more users and fees\n7. Cycle continues, creating sustainable growth',
        },
      ],
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: Network,
      color: 'from-indigo-500 to-blue-600',
      content: [
        {
          title: 'Base URL',
          description: 'All API endpoints are prefixed with `/api`\n\nExample: `https://crossify.io/api/tokens`',
        },
        {
          title: 'Create Token',
          description: 'POST /api/tokens/create\n\nCreates a new token with bonding curve configuration.',
        },
        {
          title: 'Deploy Token',
          description: 'POST /api/tokens/:id/deploy\n\nDeploys a token to specified chains.',
        },
        {
          title: 'Get Token Status',
          description: 'GET /api/tokens/:id/status\n\nReturns deployment status across all chains.',
        },
        {
          title: 'Price Sync',
          description: 'GET /api/tokens/:id/price-sync\n\nReturns current prices across all chains with synchronization status.',
        },
      ],
    },
  ];

  return (
    <>
      <SEO
        title="Documentation - How to Use Crossify | Crossify.io"
        description="Complete documentation for Crossify token launch platform. Learn how to create tokens, deploy on multiple blockchains, use cross-chain features, and integrate with your project."
        keywords="crossify documentation, token launch guide, how to use crossify, crossify tutorial, token deployment guide, API documentation, integration guide"
        url="https://crossify.io/docs"
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
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 blur-2xl opacity-50 rounded-full" />
              <div className="relative p-4 bg-gradient-to-br from-primary-500/20 to-blue-600/20 backdrop-blur-sm rounded-full border border-primary-500/50">
                <Book className="w-12 h-12 text-primary-400" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Complete guide to using Crossify.io and understanding our technology
          </p>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Table of Contents</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors group"
              >
                <section.icon className={`w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors`} />
                <span className="text-gray-300 group-hover:text-white transition-colors">{section.title}</span>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary-400 ml-auto transition-colors" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Documentation Sections */}
        <div className="space-y-12">
          {sections.map((section, sectionIdx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + sectionIdx * 0.1 }}
                className="scroll-mt-20"
              >
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 bg-gradient-to-br ${section.color} rounded-xl`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">{section.title}</h2>
                  </div>

                  <div className="space-y-6">
                    {section.content.map((item, itemIdx) => (
                      <div key={itemIdx} className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/30">
                        <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-line">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-16 bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/30"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/whitepaper"
              className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all group"
            >
              <FileText className="w-8 h-8 text-primary-400 group-hover:text-primary-300 transition-colors" />
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                  Whitepaper
                </h3>
                <p className="text-gray-400 text-sm">Read our comprehensive whitepaper</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 ml-auto group-hover:text-primary-400 transition-colors" />
            </Link>
            <Link
              to="/tokenomics"
              className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all group"
            >
              <Coins className="w-8 h-8 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">
                  Tokenomics
                </h3>
                <p className="text-gray-400 text-sm">Learn about CFY token economics</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 ml-auto group-hover:text-yellow-400 transition-colors" />
            </Link>
            <a
              href="https://github.com/crossify"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-all group"
            >
              <Code className="w-8 h-8 text-primary-400 group-hover:text-primary-300 transition-colors" />
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                  GitHub
                </h3>
                <p className="text-gray-400 text-sm">View our open-source code</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 ml-auto group-hover:text-primary-400 transition-colors" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}

