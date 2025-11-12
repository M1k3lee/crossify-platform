import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config/api';

interface PresaleData {
  id: string;
  token_symbol: string;
  token_name: string;
  status: string;
  total_raised_sol: number;
  total_contributors: number;
  presale_price: number;
  stats?: {
    total_raised: number;
    unique_buyers: number;
  };
}

export default function PresaleBanner() {
  const [presale, setPresale] = useState<PresaleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresale();
    // Refresh every 30 seconds
    const interval = setInterval(loadPresale, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPresale = async () => {
    try {
      const response = await axios.get(`${API_BASE}/presale?id=default`);
      if (response.data && response.data.status === 'active') {
        setPresale(response.data);
      } else {
        setPresale(null);
      }
    } catch (error: any) {
      // Presale not found or not active - hide banner
      if (error.response?.status !== 404) {
        console.error('Error loading presale:', error);
      }
      setPresale(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !presale) {
    return null; // Don't show banner if no active presale
  }

  const progress = presale.total_raised_sol > 0 
    ? Math.min((presale.total_raised_sol / 10000) * 100, 100) // Assuming 10k SOL target for progress
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-12"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 blur-3xl opacity-50 rounded-3xl" />
      
      <div className="relative bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-yellow-500/30 shadow-2xl overflow-hidden">
        {/* Animated sparkles background */}
        <div className="absolute inset-0 opacity-20">
          <Sparkles className="absolute top-4 left-4 w-8 h-8 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute top-12 right-8 w-6 h-6 text-orange-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute bottom-8 left-12 w-7 h-7 text-red-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left side - Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-50 rounded-full" />
                  <div className="relative p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 font-semibold text-sm">LIVE NOW</span>
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  {presale.token_name} Presale
                </span>
                <span className="text-white"> is Live!</span>
              </h2>

              <p className="text-gray-300 mb-4 text-lg">
                Get early access to <span className="font-semibold text-yellow-400">{presale.token_symbol}</span> tokens at exclusive presale pricing
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    <span className="text-white font-semibold">{presale.total_raised_sol.toFixed(2)} SOL</span> raised
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    <span className="text-white font-semibold">{presale.total_contributors}</span> contributors
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">
                    <span className="text-white font-semibold">{presale.presale_price} SOL</span> per token
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Presale Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Right side - CTA */}
            <div className="flex-shrink-0">
              <Link
                to={`/presale?id=${presale.id}`}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 hover:from-yellow-700 hover:via-orange-700 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/70 transform hover:scale-105"
              >
                <Zap className="w-6 h-6" />
                <span className="text-lg">Join Presale</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-white/20 to-yellow-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

