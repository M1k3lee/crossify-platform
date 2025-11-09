import { Link } from 'react-router-dom';
import { Rocket, Zap, Globe, TrendingUp, Sparkles, ArrowRight, Network, Layers, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import SEO, { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareApplicationSchema, generateHowToSchema, generateFAQSchema } from '../components/SEO';

export default function Home() {
  const howToSteps = [
    {
      name: 'Connect Your Wallet',
      text: 'Connect your MetaMask or Phantom wallet to get started with token creation.',
    },
    {
      name: 'Configure Your Token',
      text: 'Set your token name, symbol, initial supply, and bonding curve parameters.',
    },
    {
      name: 'Select Blockchains',
      text: 'Choose which blockchains to deploy on: Ethereum, BSC, Base, or Solana.',
    },
    {
      name: 'Deploy Your Token',
      text: 'Click deploy and your token will be created simultaneously on all selected chains.',
    },
  ];

  const faqs = [
    {
      question: 'How do I launch a token on multiple blockchains?',
      answer: 'Crossify allows you to launch your token simultaneously on Ethereum, BSC, Base, and Solana with one click. Simply configure your token settings and select the blockchains you want to deploy on.',
    },
    {
      question: 'What is cross-chain price synchronization?',
      answer: 'Cross-chain price synchronization ensures your token maintains the same price across all blockchains automatically. When someone buys on Ethereum, the price updates on all other chains within minutes.',
    },
    {
      question: 'How much does it cost to launch a token?',
      answer: 'Token creation on Crossify is free on testnet. On mainnet, there is a small platform fee plus blockchain gas fees for deployment. No hidden costs.',
    },
    {
      question: 'Can I launch a memecoin using Crossify?',
      answer: 'Yes! Crossify is perfect for launching memecoins and tokens. You can customize all aspects of your token including name, symbol, logo, and initial distribution.',
    },
    {
      question: 'Which blockchains does Crossify support?',
      answer: 'Crossify currently supports Ethereum, Binance Smart Chain (BSC), Base, and Solana. More blockchains will be added in the future.',
    },
  ];

  const homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Crossify.io - Launch Your Token on All Chains',
    description: 'Launch your token simultaneously on Ethereum, BSC, Base, and Solana with one click.',
    url: 'https://crossify.io',
  };

  return (
    <>
      <SEO
        title="Crossify.io - Launch Your Token on All Chains | How to Launch a Memecoin"
        description="Launch your token or memecoin simultaneously on Ethereum, BSC, Base, and Solana with one click. Crossify is the easiest way to create and deploy tokens with automatic cross-chain price synchronization. Learn how to launch a token today!"
        keywords="crossify, launch token, launch memecoin, how to launch a memecoin, how to launch a token, create token, deploy token, multi-chain token, cross-chain token, token launch platform, memecoin launch, token creator, ethereum token, solana token, BSC token, base token, cross-chain sync, token deployment, defi token, crypto token launch, create memecoin, launch crypto token"
        schema={homeSchema}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateOrganizationSchema(),
            generateWebSiteSchema(),
            generateSoftwareApplicationSchema(),
            generateHowToSchema(howToSteps),
            generateFAQSchema(faqs),
          ]),
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      <QuantumBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
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

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-sm mb-6">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span>Currently on Testnet - Mainnet Launch Coming Soon!</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Launch Across All Chains
            </span>
            <br />
            <span className="text-white">With One Click</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            Deploy your token simultaneously on{' '}
            <span className="text-primary-400 font-semibold">Ethereum</span>,{' '}
            <span className="text-yellow-400 font-semibold">BSC</span>,{' '}
            <span className="text-blue-400 font-semibold">Base</span>, and{' '}
            <span className="text-purple-400 font-semibold">Solana</span>
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Automatic price synchronization across all chains keeps your token's value consistent, 
            eliminating arbitrage and creating a seamless cross-chain experience powered by <span className="text-primary-400 font-semibold">LayerZero</span>.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/marketplace"
              className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/70 flex items-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Cross-Chain Highlight Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <div className="bg-gradient-to-r from-primary-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 md:p-12 border-2 border-primary-500/30 shadow-2xl">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary-500/20 rounded-full mb-4">
                  <Network className="w-5 h-5 text-primary-400" />
                  <span className="text-primary-300 font-semibold">Cross-Chain Price Synchronization</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                  One Launch, All Chains, Perfect Price Sync
                </h2>
                <p className="text-lg text-gray-300">
                  When someone buys your token on Ethereum, the price automatically updates on BSC, Base, and Solana. 
                  No arbitrage. No price discrepancies. Just seamless cross-chain harmony.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-10">
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Multi-Chain Launch</h3>
                  <p className="text-gray-400 text-sm">
                    Deploy to Ethereum, BSC, Base, and Solana simultaneously with one transaction. 
                    Your token is live on all chains instantly.
                  </p>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Layers className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Automatic Price Sync</h3>
                  <p className="text-gray-400 text-sm">
                    Powered by LayerZero, prices stay synchronized across all chains in real-time. 
                    Buy on any chain, price updates everywhere.
                  </p>
                </div>

                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">DEX Integration</h3>
                  <p className="text-gray-400 text-sm">
                    Automatic detection of DEX trades triggers cross-chain sync. 
                    Works seamlessly with Uniswap, PancakeSwap, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            {
              icon: Network,
              title: 'Launch on All Chains',
              description: 'Deploy simultaneously on Ethereum, BSC, Base, and Solana with one click. No need for separate deployments.',
              gradient: 'from-primary-500 to-blue-600',
            },
            {
              icon: Layers,
              title: 'Price Matching',
              description: 'Automatic price synchronization across all chains ensures consistent pricing. No arbitrage opportunities.',
              gradient: 'from-blue-500 to-purple-600',
            },
            {
              icon: Zap,
              title: 'Real-Time Sync',
              description: 'Buy or sell on any chain and watch prices update across all networks within seconds via LayerZero messaging.',
              gradient: 'from-yellow-500 to-orange-600',
            },
            {
              icon: TrendingUp,
              title: 'Unified Liquidity',
              description: 'Shared virtual liquidity pool accessible from any chain. One token, consistent price, infinite possibilities.',
              gradient: 'from-green-500 to-emerald-600',
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.5 }}
              className="group relative bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/20"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
              
              <div className="relative z-10">
                <div className={`inline-flex p-3 bg-gradient-to-br ${feature.gradient} rounded-xl mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How Cross-Chain Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
            How Cross-Chain Price Sync Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Launch on Multiple Chains',
                description: 'Deploy your token simultaneously on Ethereum, BSC, Base, and Solana. All chains are live instantly.',
                icon: Rocket,
              },
              {
                step: '02',
                title: 'Buy on Any Chain',
                description: 'When someone buys your token on Ethereum (or any chain), the transaction is detected automatically.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'LayerZero Messaging',
                description: 'Our smart contracts use LayerZero to broadcast price updates to all other chains in real-time.',
                icon: Network,
              },
              {
                step: '04',
                title: 'Price Syncs Everywhere',
                description: 'Within seconds, prices update on all chains. Buyers see the same price everywhere, eliminating arbitrage.',
                icon: CheckCircle,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className="relative bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-primary-500/50 transition-all"
              >
                <div className="text-6xl font-bold text-primary-500/20 mb-4">{item.step}</div>
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mb-20"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              Powered by Industry Leaders
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {/* LayerZero Logo Placeholder */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Network className="w-12 h-12 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-300">LayerZero</span>
                <span className="text-xs text-gray-500">Cross-Chain Messaging</span>
              </div>
              
              {/* OpenZeppelin Logo Placeholder */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <Shield className="w-12 h-12 text-green-400" />
                </div>
                <span className="text-sm font-semibold text-gray-300">OpenZeppelin</span>
                <span className="text-xs text-gray-500">Security Standards</span>
              </div>
              
              {/* Supra Oracle Logo Placeholder */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <Layers className="w-12 h-12 text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-gray-300">Supra Oracle</span>
                <span className="text-xs text-gray-500">Price Verification</span>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-6">
              Built on trusted infrastructure for maximum security and reliability
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/30">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              Ready to Launch Cross-Chain?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join the future of multichain token launches. Deploy your token on all major chains with perfect price synchronization.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                Launch Token Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-lg transition-all border border-gray-700"
              >
                Read Documentation
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
