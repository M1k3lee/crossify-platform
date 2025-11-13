import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Users, Clock, ArrowRight } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-8"
    >
      <div className="relative bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/30 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left side - Compact Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 font-medium text-xs">LIVE</span>
              </div>
              <h3 className="text-lg font-bold text-white truncate">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {presale.token_name}
                </span>
                <span className="text-gray-300"> Presale</span>
              </h3>
            </div>

            {/* Compact Stats */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-gray-300">
                  <span className="text-white font-semibold">{presale.total_raised_sol.toFixed(1)} SOL</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-300">
                  <span className="text-white font-semibold">{presale.total_contributors}</span> buyers
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-300">
                  <span className="text-white font-semibold">{presale.presale_price} SOL</span>/token
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Compact CTA */}
          <div className="flex-shrink-0">
            <Link
              to={`/presale?id=${presale.id}`}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm">Join</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

