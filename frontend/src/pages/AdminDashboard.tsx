import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Lock, TrendingUp, DollarSign, Coins, Activity, 
  LogOut, RefreshCw 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { API_BASE } from '../config/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tokens' | 'fees' | 'statistics'>('overview');
  const [feePeriod, setFeePeriod] = useState('30d');

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE}/admin/login`, { password });
      localStorage.setItem('admin_token', response.data.token);
      setIsAuthenticated(true);
      toast.success('Login successful');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    navigate('/');
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    }
  };

  // fetchFees function - kept for future use
  // const fetchFees = async () => {
  //   try {
  //     const token = localStorage.getItem('admin_token');
  //     const response = await axios.get(`${API_BASE}/admin/fees`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //       params: { period: feePeriod },
  //     });
  //     return response.data;
  //   } catch (error) {
  //     toast.error('Failed to fetch fees');
  //     return null;
  //   }
  // };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Enter password to access</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-4 border-b border-gray-700">
          {(['overview', 'tokens', 'fees', 'statistics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 font-medium transition ${
                selectedTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {selectedTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <Coins className="w-8 h-8 text-primary-400" />
                  <RefreshCw 
                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white"
                    onClick={fetchDashboardData}
                  />
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Total Tokens</h3>
                <p className="text-3xl font-bold text-white">{dashboardData.overview.totalTokens}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <Activity className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-gray-400 text-sm mb-1">Active Tokens (7d)</h3>
                <p className="text-3xl font-bold text-white">{dashboardData.overview.activeTokens}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <DollarSign className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-gray-400 text-sm mb-1">Total Fees (30d)</h3>
                <p className="text-3xl font-bold text-white">
                  ${(dashboardData.fees.total || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <TrendingUp className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-gray-400 text-sm mb-1">Fee Count (30d)</h3>
                <p className="text-3xl font-bold text-white">{dashboardData.overview.feeCount30d}</p>
              </motion.div>
            </div>

            {/* Fee Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4">Fee Breakdown (30 days)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardData.fees.byType).map(([type, amount]: [string, any]) => (
                  <div key={type} className="bg-gray-900/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1 capitalize">{type.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-white">
                      ${(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Tokens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-xl font-bold text-white mb-4">Top Tokens by Fees</h2>
              <div className="space-y-2">
                {dashboardData.topTokens.map((token: any, idx: number) => (
                  <div key={token.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-semibold">{token.name} ({token.symbol})</p>
                        <p className="text-gray-400 text-sm">{token.fee_count} fees</p>
                      </div>
                    </div>
                    <p className="text-primary-400 font-bold">
                      ${(token.total_fees || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {selectedTab === 'fees' && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Fee Analytics</h2>
              <select
                value={feePeriod}
                onChange={(e) => setFeePeriod(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <p className="text-gray-400">Fee analytics coming soon...</p>
          </div>
        )}

        {selectedTab === 'tokens' && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">All Tokens</h2>
            <p className="text-gray-400">Token list coming soon...</p>
          </div>
        )}

        {selectedTab === 'statistics' && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Platform Statistics</h2>
            <p className="text-gray-400">Statistics coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

