import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, Zap, Globe, Shield, Rocket, Coins } from 'lucide-react';
import QuantumBackground from '../components/QuantumBackground';
import SEO, { generateFAQSchema } from '../components/SEO';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'tokens' | 'trading' | 'technical' | 'security';
}

const faqs: FAQItem[] = [
  // General
  {
    question: 'What is Crossify.io?',
    answer: 'Crossify.io is a multi-chain token launch platform that enables you to create and deploy tokens simultaneously on Ethereum, Binance Smart Chain (BSC), Base, and Solana. Our platform features automatic cross-chain price synchronization, bonding curves, and a comprehensive marketplace for token discovery.',
    category: 'general',
  },
  {
    question: 'How do I get started with Crossify?',
    answer: 'Getting started is easy! Simply connect your MetaMask or Phantom wallet, navigate to the "Launch Token" page, configure your token settings (name, symbol, supply, etc.), select the blockchains you want to deploy on, and click deploy. Your token will be created on all selected chains simultaneously.',
    category: 'general',
  },
  {
    question: 'Is Crossify.io free to use?',
    answer: 'Crossify.io is free to use on testnets. On mainnet, there is a small platform fee for token deployment plus standard blockchain gas fees. Gas fees are paid directly to the blockchain network and vary based on network congestion.',
    category: 'general',
  },
  {
    question: 'Which blockchains does Crossify support?',
    answer: 'Currently, Crossify supports Ethereum (Sepolia testnet), Binance Smart Chain (BSC Testnet), Base (Base Sepolia), and Solana (Devnet). Mainnet support is coming soon. We plan to add support for additional blockchains in the future.',
    category: 'general',
  },
  
  // Tokens
  {
    question: 'How do I create a token on Crossify?',
    answer: 'To create a token, go to the "Launch Token" page, fill in your token details (name, symbol, description, logo), set your initial supply and bonding curve parameters, select which blockchains to deploy on, and click deploy. The platform will guide you through each step.',
    category: 'tokens',
  },
  {
    question: 'What is a bonding curve?',
    answer: 'A bonding curve is a mathematical formula that determines the price of tokens based on supply and demand. As more tokens are purchased, the price increases. Crossify uses linear bonding curves, where price = basePrice + (slope × supply). This creates a fair and transparent pricing mechanism.',
    category: 'tokens',
  },
  {
    question: 'Can I customize my token?',
    answer: 'Yes! You can customize your token name, symbol, description, logo, initial supply, bonding curve parameters (base price and slope), fees, and initial distribution. You can also enable or disable features like minting, burning, and cross-chain synchronization.',
    category: 'tokens',
  },
  {
    question: 'What happens after I deploy my token?',
    answer: 'After deployment, your token will be live on all selected blockchains. You can view it on the marketplace, track its price and performance on your dashboard, manage token settings, and users can start buying and selling through the bonding curve.',
    category: 'tokens',
  },
  {
    question: 'Can I mint more tokens after deployment?',
    answer: 'If you enabled minting during token creation, you can mint additional tokens through your creator dashboard. However, minting affects the token price and should be done carefully. You can also disable minting after deployment if needed.',
    category: 'tokens',
  },
  
  // Trading
  {
    question: 'How do I buy tokens on Crossify?',
    answer: 'To buy tokens, browse the marketplace, select a token, and click "Trade" or "Buy Now". Enter the amount of tokens you want to buy, review the price estimate, and confirm the transaction in your wallet. The tokens will be sent to your wallet after the transaction is confirmed.',
    category: 'trading',
  },
  {
    question: 'How do I sell tokens?',
    answer: 'To sell tokens, go to the token detail page, click "Trade", select the "Sell" tab, enter the amount of tokens you want to sell, approve the token spending (first time only), and confirm the transaction. You will receive ETH/BNB in return based on the current bonding curve price.',
    category: 'trading',
  },
  {
    question: 'What is cross-chain price synchronization?',
    answer: 'Cross-chain price synchronization ensures your token maintains the same price across all blockchains. When someone buys or sells on one chain, the price updates automatically on all other chains within minutes. This creates a unified market experience across multiple blockchains.',
    category: 'trading',
  },
  {
    question: 'Are there fees for trading?',
    answer: 'Yes, there may be trading fees set by the token creator. Additionally, you will pay standard blockchain gas fees for each transaction. Gas fees vary by network and network congestion. Crossify does not charge additional fees for trading.',
    category: 'trading',
  },
  {
    question: 'What is token graduation?',
    answer: 'Token graduation occurs when a token reaches a certain market cap threshold and automatically migrates from the bonding curve to a decentralized exchange (DEX) like Uniswap. After graduation, trading continues on the DEX, and the bonding curve is no longer used.',
    category: 'trading',
  },
  
  // Technical
  {
    question: 'What wallets are supported?',
    answer: 'Crossify supports MetaMask for Ethereum, BSC, and Base networks, and Phantom or Solflare for Solana. We recommend using MetaMask for EVM chains and Phantom for Solana. Make sure your wallet is connected to the correct network before deploying or trading.',
    category: 'technical',
  },
  {
    question: 'How do I switch networks?',
    answer: 'Crossify will prompt you to switch networks automatically when needed. You can also switch manually in MetaMask by clicking the network dropdown and selecting the desired network. For Solana, use your Solana wallet to switch between networks.',
    category: 'technical',
  },
  {
    question: 'What are gas fees?',
    answer: 'Gas fees are transaction fees paid to the blockchain network to process transactions. Gas fees vary based on network congestion and transaction complexity. Ethereum typically has higher gas fees than BSC or Base. Gas fees are paid in the native token of each network (ETH, BNB, etc.).',
    category: 'technical',
  },
  {
    question: 'How long does token deployment take?',
    answer: 'Token deployment typically takes a few minutes. The time varies by network: Ethereum transactions can take 1-5 minutes, BSC and Base are usually faster (30 seconds to 2 minutes), and Solana transactions are typically confirmed within seconds.',
    category: 'technical',
  },
  {
    question: 'Can I deploy the same token on multiple chains?',
    answer: 'Yes! That\'s one of Crossify\'s main features. When you deploy a token, you can select multiple blockchains, and the same token will be deployed on all selected chains with cross-chain price synchronization enabled.',
    category: 'technical',
  },
  
  // Security
  {
    question: 'Is Crossify.io secure?',
    answer: 'We take security seriously. Our smart contracts are audited, and we use industry-standard security practices. However, cryptocurrency and blockchain technology involve inherent risks. Always verify contract addresses, never share your private keys, and only interact with verified tokens.',
    category: 'security',
  },
  {
    question: 'Do you store my private keys?',
    answer: 'No! Crossify.io never stores or has access to your private keys or wallet passwords. You are solely responsible for the security of your wallet. We cannot recover lost or stolen private keys or restore access to your wallet.',
    category: 'security',
  },
  {
    question: 'How can I verify a token contract?',
    answer: 'You can verify token contracts by checking the contract address on blockchain explorers (Etherscan, BscScan, etc.). Always verify contract addresses before interacting with tokens. Crossify displays contract addresses on token detail pages for easy verification.',
    category: 'security',
  },
  {
    question: 'What should I do if I encounter a scam token?',
    answer: 'If you encounter a scam token, report it to us immediately through our contact form. Do not interact with suspicious tokens, and always verify contract addresses and token information before trading. We actively monitor our platform for suspicious activity.',
    category: 'security',
  },
  {
    question: 'Are my funds safe on Crossify?',
    answer: 'Your funds are stored in your wallet, not on Crossify. When you trade, transactions are executed directly on the blockchain through smart contracts. However, always be cautious, verify contract addresses, and never share your private keys or seed phrases with anyone.',
    category: 'security',
  },
];

const categoryIcons = {
  general: HelpCircle,
  tokens: Coins,
  trading: Zap,
  technical: Globe,
  security: Shield,
};

const categoryColors = {
  general: 'from-blue-500 to-cyan-500',
  tokens: 'from-purple-500 to-pink-500',
  trading: 'from-green-500 to-emerald-500',
  technical: 'from-orange-500 to-red-500',
  security: 'from-yellow-500 to-orange-500',
};

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQItem['category']>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const categories: Array<{ key: 'all' | FAQItem['category']; label: string; icon: any }> = [
    { key: 'all', label: 'All Questions', icon: HelpCircle },
    { key: 'general', label: 'General', icon: HelpCircle },
    { key: 'tokens', label: 'Tokens', icon: Coins },
    { key: 'trading', label: 'Trading', icon: Zap },
    { key: 'technical', label: 'Technical', icon: Globe },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <>
      <SEO
        title="FAQ - Frequently Asked Questions | Crossify.io"
        description="Find answers to frequently asked questions about Crossify.io - token creation, deployment, trading, cross-chain synchronization, and more."
        keywords="FAQ, frequently asked questions, crossify FAQ, token launch FAQ, how to create token, how to deploy token, bonding curve FAQ"
        url="https://crossify.io/faq"
        schema={generateFAQSchema(faqs.map(f => ({ question: f.question, answer: f.answer })))}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl mb-6">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Find answers to common questions about Crossify.io, token creation, deployment, trading, and more.
            </p>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-wrap gap-3 justify-center mb-8"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.key;
              return (
                <button
                  key={category.key}
                  onClick={() => {
                    setSelectedCategory(category.key);
                    setOpenIndex(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${categoryColors[category.key === 'all' ? 'general' : category.key]} text-white shadow-lg`
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </motion.div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => {
              const isOpen = openIndex === index;
              const Icon = categoryIcons[faq.category];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[faq.category]}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pl-20">
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 text-center"
          >
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <Rocket className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
              <p className="text-gray-300 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

