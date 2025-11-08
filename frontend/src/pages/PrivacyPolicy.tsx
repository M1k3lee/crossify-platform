import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy - Crossify.io"
        description="Read the Privacy Policy for Crossify.io. Learn how we collect, use, and protect your personal information and data."
        keywords="privacy policy, data protection, privacy, GDPR, data privacy, crossify privacy"
        url="https://crossify.io/privacy"
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
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
                <Lock className="w-6 h-6 text-primary-400" />
                1. Introduction
              </h2>
              <p className="text-gray-300 leading-relaxed">
                At Crossify.io ("we," "our," or "us"), we are committed to protecting your privacy and personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                website and services (collectively, the "Service").
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                Please read this Privacy Policy carefully. By using Crossify.io, you agree to the collection and use of 
                information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-primary-400" />
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Information You Provide</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We collect information that you voluntarily provide when using our Service, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li><strong>Account Information:</strong> Wallet addresses, email addresses (if provided), and user preferences</li>
                <li><strong>Token Information:</strong> Token names, symbols, descriptions, logos, and configuration data</li>
                <li><strong>Transaction Data:</strong> Blockchain transaction hashes, token addresses, and deployment details</li>
                <li><strong>Contact Information:</strong> Information provided when contacting us through our contact form</li>
                <li><strong>Communication Data:</strong> Messages, feedback, and correspondence with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you use our Service, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on pages, and navigation patterns</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Log Data:</strong> Access logs, error logs, and performance metrics</li>
                <li><strong>Blockchain Data:</strong> Public blockchain data related to tokens and transactions</li>
                <li><strong>Cookies and Tracking:</strong> Cookies, web beacons, and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Public Blockchain Data</h3>
              <p className="text-gray-300 leading-relaxed">
                Please note that blockchain transactions are public and permanent. When you deploy tokens or interact with smart 
                contracts through our Service, your wallet address, transaction details, and token information become publicly 
                available on the blockchain and cannot be deleted or modified.
              </p>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary-400" />
                3. How We Use Your Information
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process token creation and deployment requests</li>
                <li>To facilitate cross-chain price synchronization and token trading</li>
                <li>To display token information on our marketplace and platform</li>
                <li>To communicate with you about your account and our Service</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our Terms of Service</li>
                <li>To send you updates, newsletters, and promotional materials (with your consent)</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. However, we may share your information 
                in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Service Providers</h3>
              <p className="text-gray-300 leading-relaxed">
                We may share your information with third-party service providers who perform services on our behalf, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Cloud hosting and infrastructure providers</li>
                <li>Analytics and monitoring services</li>
                <li>Email and communication services</li>
                <li>Blockchain infrastructure providers</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-300 leading-relaxed">
                We may disclose your information if required by law, court order, or government regulation, or if we believe 
                such disclosure is necessary to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Comply with legal obligations</li>
                <li>Protect our rights, property, or safety</li>
                <li>Prevent fraud, abuse, or illegal activity</li>
                <li>Respond to government requests or investigations</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Public Information</h3>
              <p className="text-gray-300 leading-relaxed">
                Token information, blockchain addresses, and transaction data are publicly available on blockchains and may be 
                displayed on our platform, marketplace, and in our marketing materials.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your information against unauthorized 
                access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic 
                storage is 100% secure.
              </p>
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-200 text-sm leading-relaxed">
                  <strong>Important:</strong> We do not store or have access to your private keys or wallet passwords. 
                  You are solely responsible for the security of your wallet and private keys. We cannot recover lost or 
                  stolen private keys or restore access to your wallet.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-primary-400" />
                6. Your Privacy Rights
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Depending on your jurisdiction, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to processing of your personal information</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing (where applicable)</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                Please note that blockchain data is immutable and cannot be deleted or modified. If you wish to exercise your 
                privacy rights, please contact us at privacy@crossify.io.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to collect and store information about your preferences and 
                usage of our Service. You can control cookies through your browser settings, but disabling cookies may affect 
                the functionality of our Service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mt-4">
                <li>Essential cookies: Required for the Service to function properly</li>
                <li>Analytics cookies: Help us understand how users interact with our Service</li>
                <li>Preferences cookies: Remember your settings and preferences</li>
                <li>Marketing cookies: Used to deliver relevant advertisements (with consent)</li>
              </ul>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Links and Services</h2>
              <p className="text-gray-300 leading-relaxed">
                Our Service may contain links to third-party websites, services, or applications. We are not responsible for 
                the privacy practices or content of these third-party services. We encourage you to review the privacy policies 
                of any third-party services you access through our platform.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Our Service is not intended for users under the age of 18. We do not knowingly collect personal information 
                from children under 18. If you believe we have collected information from a child under 18, please contact us 
                immediately at privacy@crossify.io, and we will take steps to delete such information.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. These 
                countries may have different data protection laws than your jurisdiction. By using our Service, you consent to 
                the transfer of your information to these countries.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the 
                updated policy on our website and updating the "Last updated" date. Your continued use of our Service after such 
                changes constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> privacy@crossify.io
                </p>
                <p className="text-gray-300 mt-2">
                  <strong>Website:</strong> <a href="https://crossify.io/contact" className="text-primary-400 hover:text-primary-300 underline">crossify.io/contact</a>
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}

