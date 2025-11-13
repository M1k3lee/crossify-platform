import { Mail, Twitter, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact Us - Get in Touch | Crossify.io"
        description="Have questions about Crossify? Contact our team via X (Twitter), Discord, or Email."
        url="https://crossify.io/contact"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
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
                  <Mail className="w-12 h-12 text-primary-400" />
                </div>
              </div>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Get In Touch
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Reach out to us through any of these channels.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center hover:border-primary-500/50 transition-all"
            >
              <div className="p-4 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl w-fit mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Email</h3>
              <a
                href="mailto:webapp@crossify.io"
                className="text-primary-400 hover:text-primary-300 transition-colors text-lg break-all block mb-4"
              >
                webapp@crossify.io
              </a>
              <p className="text-gray-400 text-sm">
                Send us an email and we'll get back to you as soon as possible.
              </p>
            </motion.div>

            {/* X (Twitter) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center hover:border-blue-500/50 transition-all"
            >
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl w-fit mx-auto mb-6">
                <Twitter className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">X (Twitter)</h3>
              <a
                href="https://x.com/crossify_io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors text-lg block mb-4"
              >
                @crossify_io
              </a>
              <p className="text-gray-400 text-sm">
                Follow us for updates and send us a DM.
              </p>
            </motion.div>

            {/* Discord */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center hover:border-indigo-500/50 transition-all"
            >
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl w-fit mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Discord</h3>
              <a
                href="https://discord.gg/WQMevJek"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors text-lg block mb-4"
              >
                Join our Discord
              </a>
              <p className="text-gray-400 text-sm">
                Chat with the community and get support.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400 text-sm">
              We typically respond within 24-48 hours during business days.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
