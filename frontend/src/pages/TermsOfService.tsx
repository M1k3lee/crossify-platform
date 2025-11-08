import { motion } from 'framer-motion';
import { FileText, Shield, AlertTriangle } from 'lucide-react';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function TermsOfService() {
  return (
    <>
      <SEO
        title="Terms of Service - Crossify.io"
        description="Read the Terms of Service for Crossify.io - Multi-chain token launch platform. Understand the terms and conditions for using our services."
        keywords="terms of service, terms and conditions, legal, crossify terms, token launch terms"
        url="https://crossify.io/terms"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-gray-700/50 space-y-8"
          >
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary-400" />
                1. Introduction
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to Crossify.io ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our website, 
                services, and platform (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                Crossify.io is a multi-chain token launch platform that enables users to create and deploy tokens on various blockchain networks, 
                including Ethereum, Binance Smart Chain (BSC), Base, and Solana. Our Service provides tools and infrastructure for token creation, 
                deployment, and cross-chain synchronization.
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Acceptance of Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing or using Crossify.io, you acknowledge that you have read, understood, and agree to be bound by these Terms. 
                If you do not agree to these Terms, you must not access or use our Service.
              </p>
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-200 text-sm">
                    <strong>Important:</strong> You must be at least 18 years old to use our Service. By using Crossify.io, you represent 
                    and warrant that you are of legal age in your jurisdiction.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Service Description</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Crossify.io provides the following services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Token creation and deployment tools</li>
                <li>Multi-chain token deployment (Ethereum, BSC, Base, Solana)</li>
                <li>Bonding curve mechanisms for token sales</li>
                <li>Cross-chain price synchronization</li>
                <li>Token marketplace and discovery features</li>
                <li>Analytics and dashboard tools</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                We reserve the right to modify, suspend, or discontinue any aspect of our Service at any time, with or without notice.
              </p>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. User Responsibilities</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                As a user of Crossify.io, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Provide accurate and complete information when creating tokens</li>
                <li>Comply with all applicable laws and regulations in your jurisdiction</li>
                <li>Not use our Service for illegal, fraudulent, or harmful purposes</li>
                <li>Not create tokens that infringe on intellectual property rights</li>
                <li>Not attempt to hack, disrupt, or compromise our Service or infrastructure</li>
                <li>Maintain the security of your wallet and private keys</li>
                <li>Not impersonate other users or entities</li>
                <li>Not use our Service to launder money or engage in financial crimes</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
              <p className="text-gray-300 leading-relaxed">
                All content, features, and functionality of Crossify.io, including but not limited to text, graphics, logos, icons, 
                images, software, and code, are owned by Crossify.io or its licensors and are protected by international copyright, 
                trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                Tokens created through our Service are the property of their respective creators. We do not claim ownership of tokens 
                created through our platform. However, by using our Service, you grant us a non-exclusive, royalty-free license to 
                display, distribute, and promote your tokens through our platform and marketing materials.
              </p>
            </section>

            {/* Fees and Payments */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Fees and Payments</h2>
              <p className="text-gray-300 leading-relaxed">
                Crossify.io may charge fees for certain services, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Token deployment fees (on mainnet)</li>
                <li>Platform usage fees</li>
                <li>Transaction fees (gas fees) on respective blockchains</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                All fees are non-refundable unless otherwise stated. You are responsible for all blockchain transaction fees (gas fees) 
                associated with your use of our Service. These fees are paid directly to the blockchain network and are not collected by Crossify.io.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimers</h2>
              <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg mb-4">
                <p className="text-red-200 text-sm leading-relaxed">
                  <strong>IMPORTANT DISCLAIMER:</strong> Crossify.io is provided "as is" and "as available" without warranties of any kind, 
                  either express or implied. We do not guarantee that our Service will be uninterrupted, error-free, or secure. 
                  Cryptocurrency and blockchain technology involve significant risks, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-200 text-sm mt-3 ml-4">
                  <li>Loss of funds due to smart contract bugs or exploits</li>
                  <li>Market volatility and price fluctuations</li>
                  <li>Regulatory changes and legal risks</li>
                  <li>Technical failures and network disruptions</li>
                  <li>Scams, fraud, and phishing attacks</li>
                </ul>
              </div>
              <p className="text-gray-300 leading-relaxed">
                You acknowledge and agree that your use of Crossify.io is at your own risk. We are not responsible for any losses, 
                damages, or liabilities arising from your use of our Service or the tokens created through our platform.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                To the maximum extent permitted by law, Crossify.io and its affiliates, officers, directors, employees, and agents shall 
                not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Loss of profits, revenue, or data</li>
                <li>Loss of cryptocurrency or tokens</li>
                <li>Business interruption</li>
                <li>Cost of substitute services</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                Our total liability to you for any claims arising from or related to our Service shall not exceed the amount you paid 
                to us in the 12 months preceding the claim, or $100, whichever is greater.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Indemnification</h2>
              <p className="text-gray-300 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Crossify.io and its affiliates, officers, directors, employees, and 
                agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) 
                arising from or related to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Your use of our Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Tokens created through our Service</li>
                <li>Your infringement of any third-party rights</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to suspend or terminate your access to our Service at any time, with or without cause or notice, 
                for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of our Service or other users</li>
                <li>Request by law enforcement or regulatory authorities</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                You may terminate your use of our Service at any time by ceasing to use our platform. However, tokens already deployed 
                on blockchains will remain on-chain and cannot be removed.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the 
                updated Terms on our website and updating the "Last updated" date. Your continued use of our Service after such changes 
                constitutes your acceptance of the modified Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to 
                its conflict of law provisions. Any disputes arising from or related to these Terms or our Service shall be resolved 
                in the courts of [Your Jurisdiction].
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> legal@crossify.io
                </p>
                <p className="text-gray-300 mt-2">
                  <strong>Website:</strong> <a href="https://crossify.io/contact" className="text-primary-400 hover:text-primary-300 underline">crossify.io/contact</a>
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="pt-8 border-t border-gray-700/50">
              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-blue-200 text-sm leading-relaxed">
                  By using Crossify.io, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                  If you do not agree to these Terms, please do not use our Service.
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}

