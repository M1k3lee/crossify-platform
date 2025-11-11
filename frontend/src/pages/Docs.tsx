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
          description: 'Price = Base Price + (Slope × Supply Sold)\n\n• Base Price: Starting price per token (in wei)\n• Slope: Price increase per token sold (in wei per token)\n• Supply Sold: Total tokens purchased from the curve (in base units, not wei)\n\nNote: The contract converts supply from wei (1e18) to base token units for calculation. The formula ensures linear price discovery as more tokens are sold.',
        },
        {
          title: 'Graduation Threshold',
          description: 'When your token reaches a certain market cap (graduation threshold), it automatically migrates to a DEX pool with full liquidity. This ensures smooth transition from bonding curve to decentralized exchange.',
        },
        {
          title: 'Fees',
          description: '• Buy Fee: Applied when purchasing tokens (configurable, default: 0%)\n• Sell Fee: Applied when selling tokens (configurable, default: 0%)\n• Cross-Chain Sync Fee: 0.5% fee on DEX trades to fund LayerZero messaging\n• Platform Fee: One-time fee during token creation (FREE on testnet)\n\nNote: Buy and sell fees are set by the token creator during deployment. They can range from 0% to 10%.',
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
          description: 'Select which chains to deploy on:\n• Ethereum (Sepolia testnet)\n• BSC (BSC Testnet)\n• Base (Base Sepolia)\n• Solana (Devnet)\n\nYou can deploy to all chains simultaneously!\n\nCross-Chain Sync: When deploying to 2+ chains, you can enable cross-chain price synchronization. This uses LayerZero v2 to keep prices consistent across all chains automatically. The system tracks global supply across all chains and ensures unified pricing.\n\nNote: Currently deployed on testnets only. Mainnet deployment coming after security audits.',
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
          title: 'Deployed Contracts on Testnet',
          description: 'All our contracts are deployed and verified on testnets. You can view them on block explorers:\n\n🔗 Ethereum Sepolia:\n• TokenFactory: 0x8eF1A74d477448630282EFC130ac9D17f495Bca4\n  View: https://sepolia.etherscan.io/address/0x8eF1A74d477448630282EFC130ac9D17f495Bca4\n\n🔗 BSC Testnet:\n• TokenFactory: 0xFF8c690B5b65905da20D8de87Cd6298c223a40B6\n  View: https://testnet.bscscan.com/address/0xFF8c690B5b65905da20D8de87Cd6298c223a40B6\n\n🔗 Base Sepolia:\n• TokenFactory: 0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58\n  View: https://sepolia-explorer.base.org/address/0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58\n\nNote: Mainnet deployment will occur after comprehensive testing and security audits.',
        },
        {
          title: 'TokenFactory - The Foundation',
          description: 'TokenFactory is the core contract that creates all tokens on Crossify. When you deploy a token, the factory:\n\n1. Deploys your token contract (CrossChainToken or CrossifyToken)\n2. Deploys a BondingCurve contract for initial sales\n3. Links them together for seamless trading\n4. Registers the token for cross-chain synchronization\n\nEach chain has its own TokenFactory, but they all work together through LayerZero to keep prices synchronized. The factory is Ownable, meaning only authorized addresses can create tokens, ensuring security and preventing spam.',
        },
        {
          title: 'CrossChainToken - Smart ERC20 with Cross-Chain Magic',
          description: 'CrossChainToken is an advanced ERC20 that automatically syncs prices across all chains:\n\n✨ Key Features:\n• Standard ERC20 functionality (transfer, approve, etc.)\n• Built-in DEX detection - automatically recognizes Uniswap, PancakeSwap, etc.\n• Transfer hooks - detects when tokens move to/from DEX pairs\n• Automatic price sync - triggers LayerZero messages on every DEX trade\n• Fee collection - collects 0.5% fee on DEX trades to fund cross-chain sync\n• Global supply tracking - queries GlobalSupplyTracker for unified pricing\n\n🔧 How It Works:\nWhen someone trades your token on Uniswap (Ethereum), the token contract detects the transfer, calculates the new supply, and sends a LayerZero message to all other chains. Within seconds, prices update on BSC, Base, and Solana automatically!',
        },
        {
          title: 'BondingCurve - Automated Market Making',
          description: 'BondingCurve creates a fair, transparent market for your token before it graduates to a DEX:\n\n📊 Price Formula:\nPrice = Base Price + (Slope × Global Supply Sold)\n\nThe curve uses GLOBAL supply, meaning if someone buys on Ethereum, the price increases on ALL chains instantly!\n\n💰 Features:\n• Linear price increase - fair and predictable\n• Buy/Sell operations - users can trade directly\n• Fee collection - configurable buy/sell fees\n• Graduation - automatically migrates to DEX at threshold\n• Global supply integration - queries GlobalSupplyTracker for unified pricing\n• Maximum price protection - prevents purchases exceeding 100 ETH total\n\n🎯 The Magic:\nEvery token deployed via Crossify gets its own BondingCurve. When you buy tokens, the curve calculates price based on GLOBAL supply across all chains, ensuring perfect price consistency.',
        },
        {
          title: 'CrossChainSync - LayerZero Message Router',
          description: 'CrossChainSync is the central hub that manages all cross-chain communication:\n\n🌐 Responsibilities:\n• Receives supply updates from tokens on any chain\n• Validates updates using LayerZero security\n• Broadcasts updates to all other chains\n• Manages LayerZero endpoint IDs for each chain\n• Handles fee collection and distribution\n• Implements LayerZero v2 interfaces for maximum security\n\n💸 Fee Mechanism:\nWhen a user trades on a DEX, CrossChainToken collects a 0.5% fee. This fee is used to:\n• Pay LayerZero messaging costs\n• Fund cross-chain operations\n• Ensure sustainable synchronization\n\nThe user pays this fee automatically - no extra steps required!',
        },
        {
          title: 'How Contracts Work Together - The Cross-Chain Flow',
          description: 'Here\'s exactly how the magic happens when someone buys your token:\n\n1️⃣ User buys tokens on Ethereum via BondingCurve\n   → BondingCurve calculates price using GlobalSupplyTracker\n   → Tokens transferred to user\n   → GlobalSupplyTracker updates global supply\n\n2️⃣ CrossChainToken detects the supply change\n   → Triggers CrossChainSync.syncSupplyUpdate()\n   → Collects 0.5% fee from the trade\n\n3️⃣ CrossChainSync sends LayerZero message\n   → Message contains: token address, new supply, source chain\n   → LayerZero securely delivers to all other chains\n\n4️⃣ Other chains receive the update\n   → BSC, Base, Solana all update their GlobalSupplyTracker\n   → BondingCurves on all chains now show the new price\n   → Price is synchronized across ALL chains!\n\n⚡ Result: Perfect price consistency across Ethereum, BSC, Base, and Solana in seconds!',
        },
        {
          title: 'LayerZero Integration - Secure Cross-Chain Messaging',
          description: 'We use LayerZero v2, the industry-leading cross-chain protocol:\n\n🔒 Security:\n• LayerZero uses decentralized oracles and relayers\n• Messages are cryptographically verified\n• No single point of failure\n• Battle-tested with billions in value secured\n\n⚡ Performance:\n• Messages delivered in seconds\n• Low gas costs\n• Reliable delivery guarantees\n• Supports all major chains\n\n💰 Cost:\n• LayerZero fees are minimal\n• Covered by the 0.5% DEX trade fee\n• Users don\'t pay extra - it\'s built into every trade\n• Sustainable model for long-term operation',
        },
        {
          title: 'Fee Payment Flow - How Users Pay for Cross-Chain Sync',
          description: 'Users automatically pay for cross-chain synchronization:\n\n💳 On BondingCurve Purchases:\n• User buys tokens from BondingCurve\n• BondingCurve collects buy fee (e.g., 2%)\n• Part of this fee funds cross-chain operations\n• No extra steps - it\'s automatic!\n\n💳 On DEX Trades:\n• User trades on Uniswap/PancakeSwap/etc.\n• CrossChainToken detects the transfer\n• Automatically collects 0.5% fee from the trade\n• Fee is used to send LayerZero messages\n• Price syncs across all chains\n• User sees updated prices everywhere!\n\n✅ Benefits:\n• No upfront costs\n• Pay-as-you-go model\n• Fees are transparent\n• Sustainable for long-term operation',
        },
        {
          title: 'Security & Auditing',
          description: 'Our contracts are built with security as the top priority:\n\n🛡️ Security Features:\n• OpenZeppelin audited contracts (ERC20, Ownable, ReentrancyGuard)\n• LayerZero v2 secure messaging\n• Comprehensive input validation\n• Maximum price protection (100 ETH limit)\n• Access control (Ownable pattern)\n• Reentrancy protection on all external calls\n\n🔍 Auditing:\n• Built on battle-tested OpenZeppelin contracts\n• LayerZero infrastructure audited by top security firms\n• Comprehensive test coverage\n• Continuous security monitoring\n\n🤝 Technology Partners:\n• LayerZero - Cross-chain messaging\n• OpenZeppelin - Security standards\n• Supra Oracles - Price feeds (future)',
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
          description: 'Platform fees are collected from:\n• Token Creation: 0.01 ETH per token\n• Mint Operations: 0.1% of minted tokens\n• Cross-Chain Sync: 0.5% of DEX trade value\n• Liquidity Bridge: 0.1% + LayerZero costs\n\nFee Distribution:\n• 50% → CFY Buyback (80% to liquidity, 20% burned)\n• 30% → Liquidity Provision\n• 10% → Token Burns\n• 7% → Operations\n• 3% → Treasury',
        },
        {
          title: 'Presale System',
          description: 'Crossify includes a complete Solana presale system for any token:\n\n💰 Features:\n• Real-time SOL transaction monitoring\n• Automatic token allocation tracking\n• Configurable pricing (SOL per token)\n• Min/max purchase limits\n• Affiliate/referral system with rewards\n• Fund allocation (liquidity, dev, marketing)\n• Beautiful presale page with live updates\n\n📊 Vesting Schedule:\n• 20% released at Token Generation Event (TGE)\n• 80% linear vesting over 18 months\n• Protects long-term value and prevents dumps\n\n💡 How It Works:\n1. Creator sets up presale with token details and SOL price\n2. Users send SOL to presale wallet address\n3. System automatically tracks contributions\n4. Tokens allocated based on SOL contributed\n5. Vesting schedule applied when tokens are distributed\n\n🔗 Access: Visit /presale?id=presale-id to view any active presale',
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
          title: 'Base URL & Authentication',
          description: 'Base URL: `https://crossify-platform-production.up.railway.app/api`\n\nAll endpoints are prefixed with `/api`\n\n🔐 Authentication:\n• Most endpoints are public\n• Some endpoints require `x-creator-address` header\n• Rate limiting: 100 requests per 15 minutes per IP\n• CORS enabled for crossify.io and localhost',
        },
        {
          title: 'Token Management',
          description: 'POST /api/tokens/create\nCreate a new token\n\nRequest Body:\n{\n  "name": "My Token",\n  "symbol": "MTK",\n  "initialSupply": "1000000",\n  "basePrice": 0.0001,\n  "slope": 0.00001,\n  "crossChainEnabled": true\n}\n\nResponse: { "id": "uuid", "name": "My Token", ... }\n\n---\n\nGET /api/tokens/:id/status\nGet token deployment status\n\nResponse: {\n  "id": "uuid",\n  "deployments": [...],\n  "priceSync": {...}\n}\n\n---\n\nPOST /api/tokens/:id/deploy\nDeploy token to chains\n\nRequest: { "chains": ["ethereum", "bsc", "base"] }\n\n---\n\nGET /api/tokens/marketplace\nGet all tokens in marketplace\n\nQuery Params: ?search=term&verified=true&chain=ethereum',
        },
        {
          title: 'Token Analytics & Data',
          description: 'GET /api/tokens/:id/analytics\nGet token analytics (volume, transactions, price change)\n\nResponse: {\n  "totalVolume": "100.5",\n  "buyCount": 50,\n  "sellCount": 20,\n  "priceChange24h": 15.5\n}\n\n---\n\nGET /api/tokens/:id/related\nGet related tokens (similar tokens)\n\nResponse: [{ "id": "...", "name": "...", ... }]\n\n---\n\nGET /api/tokens/:id/metadata\nGet token metadata (logo, banner, colors, etc.)\n\n---\n\nGET /api/tokens/:id/market-depth\nGet market depth data for charts\n\n---\n\nGET /api/tokens/:id/price-sync\nGet cross-chain price synchronization status',
        },
        {
          title: 'Transactions',
          description: 'GET /api/transactions\nGet transaction history\n\nQuery Params:\n• ?tokenId=uuid - Filter by token\n• ?chain=ethereum - Filter by chain\n• ?type=buy - Filter by type (buy/sell)\n• ?address=0x... - Filter by wallet address\n\nResponse: [{\n  "id": "...",\n  "tokenId": "uuid",\n  "chain": "ethereum",\n  "type": "buy",\n  "amount": "100",\n  "price": "0.001",\n  "txHash": "0x...",\n  "timestamp": "2024-01-01T00:00:00Z"\n}]\n\n---\n\nPOST /api/transactions\nRecord a new transaction (usually called by frontend after blockchain confirmation)',
        },
        {
          title: 'File Uploads',
          description: 'POST /api/upload/logo\nUpload token logo\n\nContent-Type: multipart/form-data\nBody: file (image file)\n\nResponse: {\n  "success": true,\n  "filename": "abc123.jpg",\n  "url": "https://.../upload/file/abc123.jpg"\n}\n\n---\n\nPOST /api/upload/banner\nUpload token banner\n\nSame format as logo upload\n\n---\n\nGET /api/upload/file/:filename\nServe uploaded file\n\nReturns the image file with proper CORS headers',
        },
        {
          title: 'Admin Endpoints',
          description: 'POST /api/admin/login\nAdmin login\n\nBody: { "password": "..." }\n\n---\n\nGET /api/admin/dashboard\nGet admin dashboard statistics\n\nRequires: Admin authentication\n\nResponse: {\n  "totalTokens": 100,\n  "totalTransactions": 5000,\n  "totalVolume": "1000.5",\n  "verifiedTokens": 25\n}\n\n---\n\nPOST /api/admin/tokens/:id/verify\nVerify a token (add verified badge)\n\nRequires: Admin authentication\n\n---\n\nPATCH /api/admin/tokens/:id\nUpdate token status (archive, pin, delete, visible)\n\nRequires: Admin authentication',
        },
        {
          title: 'Health & Debug',
          description: 'GET /api/health\nHealth check endpoint\n\nResponse: { "status": "ok", "timestamp": "..." }\n\n---\n\nGET /api/health-check\nDetailed health check\n\nResponse: {\n  "status": "ok",\n  "database": { "connected": true },\n  "redis": { "connected": true }\n}\n\n---\n\nGET /api/debug/tokens\nDebug endpoint for token data\n\n---\n\nPOST /api/debug/sync-tokens\nManually trigger token sync from blockchain',
        },
        {
          title: 'Cross-Chain Endpoints',
          description: 'GET /api/crosschain/status\nGet cross-chain synchronization status\n\nResponse: {\n  "tokens": [...],\n  "count": 10\n}\n\n---\n\nPOST /api/crosschain/swap\nManually trigger fee swap for a token',
        },
        {
          title: 'CFY Token Endpoints',
          description: 'GET /api/cfy/vesting\nGet CFY vesting information\n\n---\n\nPOST /api/cfy/stake\nStake CFY tokens\n\nBody: { "amount": "1000", "lockPeriod": 30 }\n\n---\n\nGET /api/cfy/staking\nGet staking information\n\n---\n\nPOST /api/cfy/unstake\nUnstake CFY tokens',
        },
        {
          title: 'Presale Endpoints',
          description: 'GET /api/presale\nGet all presales or specific presale\n\nQuery: ?id=presale-id\n\n---\n\nPOST /api/presale\nCreate a new presale\n\n---\n\nPOST /api/presale/:id/purchase\nPurchase presale tokens',
        },
        {
          title: 'Using the API',
          description: '📝 Example: Create a token\n\n```javascript\nconst response = await fetch(\'https://crossify-platform-production.up.railway.app/api/tokens/create\', {\n  method: \'POST\',\n  headers: { \'Content-Type\': \'application/json\' },\n  body: JSON.stringify({\n    name: "My Token",\n    symbol: "MTK",\n    initialSupply: "1000000",\n    basePrice: 0.0001,\n    slope: 0.00001\n  })\n});\nconst token = await response.json();\n```\n\n📝 Example: Get token analytics\n\n```javascript\nconst response = await fetch(\'https://crossify-platform-production.up.railway.app/api/tokens/{id}/analytics\');\nconst analytics = await response.json();\n```\n\n✅ All endpoints return JSON\n✅ CORS enabled for crossify.io\n✅ Rate limited: 100 req/15min per IP',
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
                        <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                          {item.description.split('\n').map((line, lineIdx) => {
                            // Check if line contains a URL
                            const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                            if (urlMatch) {
                              const parts = line.split(urlMatch[0]);
                              return (
                                <span key={lineIdx}>
                                  {parts[0]}
                                  <a
                                    href={urlMatch[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-400 hover:text-primary-300 underline break-all"
                                  >
                                    {urlMatch[0]}
                                  </a>
                                  {parts[1]}
                                  {lineIdx < item.description.split('\n').length - 1 && <br />}
                                </span>
                              );
                            }
                            return (
                              <span key={lineIdx}>
                                {line}
                                {lineIdx < item.description.split('\n').length - 1 && <br />}
                              </span>
                            );
                          })}
                        </div>
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

