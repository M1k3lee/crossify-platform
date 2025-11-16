import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import QuantumBackground from '../components/QuantumBackground';
import SEO from '../components/SEO';

export default function Presale() {

  // Simplified message for presale page
  return (
    <>
      <SEO
        title="Presale - Coming Soon | Crossify.io"
        description="A presale may be available soon. Follow our socials to stay updated."
        keywords="token presale, early access, crypto presale"
        url="https://crossify.io/presale"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
        <QuantumBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 blur-2xl opacity-50 rounded-full" />
                <div className="relative p-4 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm rounded-full border border-yellow-500/50">
                  <Zap className="w-12 h-12 text-yellow-400" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Presale Coming Soon
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              A presale may be available soon. Follow our socials to stay updated on announcements and opportunities.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-sm mb-8">
              <Clock className="w-4 h-4" />
              <span>Stay tuned for updates!</span>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
