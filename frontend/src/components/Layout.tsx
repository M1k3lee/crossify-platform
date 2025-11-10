import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Home, Coins, Rocket, LayoutDashboard, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Logo from './Logo';
import Footer from './Footer';
import { useWalletTracking } from '../hooks/useWalletTracking';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setAppLaunched] = useState(() => {
    return localStorage.getItem('appLaunched') === 'true';
  });
  
  // Track wallet connections
  useWalletTracking();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/marketplace', label: 'Marketplace', icon: Coins },
    { path: '/builder', label: 'Launch Token', icon: Rocket },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const handleLaunchApp = () => {
    setAppLaunched(true);
    localStorage.setItem('appLaunched', 'true');
    navigate('/marketplace');
  };

  // Check if we're on the homepage
  const isHomepage = location.pathname === '/';
  
  // Show full navigation menu on app pages (marketplace, builder, dashboard, etc.), but not on homepage
  const showFullNav = !isHomepage;
  
  // Show wallet buttons on app pages (not on homepage)
  const showWalletButtons = showFullNav || 
    location.pathname === '/builder' || 
    location.pathname === '/dashboard' || 
    location.pathname.startsWith('/token/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link 
                to="/" 
                className="flex items-center gap-3 group flex-shrink-0"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="flex-shrink-0"
                >
                  <Logo size="md" animated />
                </motion.div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-primary-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all whitespace-nowrap">
                  Crossify.io
                </span>
              </Link>
              
              {/* Only show navigation menu on app pages (not homepage) */}
              {showFullNav && (
                <>
                  {/* Desktop navigation menu */}
                  <div className="hidden md:flex items-center gap-1 ml-4 overflow-x-auto scrollbar-hide">
                    {navItems
                      .filter(item => item.path !== '/') // Hide Home link in nav menu
                      .map((item) => {
                        const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
                        const Icon = item.icon;
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`relative inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                              isActive
                                ? 'text-white'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-600/20 rounded-lg border border-primary-500/30"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}
                            <Icon className={`w-4 h-4 relative z-10 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-current'}`} />
                            <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                          </Link>
                        );
                      })}
                  </div>
                  
                  {/* Mobile navigation menu - show as dropdown or always visible on small screens */}
                  <div className="md:hidden flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
                    {navItems
                      .filter(item => item.path !== '/') // Hide Home link in nav menu
                      .map((item) => {
                        const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
                        const Icon = item.icon;
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`relative inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                              isActive
                                ? 'text-white bg-primary-500/20'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-current'}`} />
                            <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                          </Link>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {isHomepage ? (
                // On homepage, show "Launch App" button
                <button
                  onClick={handleLaunchApp}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  <span className="hidden sm:inline">Launch App</span>
                  <span className="sm:hidden">Launch</span>
                </button>
              ) : showWalletButtons ? (
                // On app pages, show wallet connect
                <>
                  {/* EVM Wallet (RainbowKit) - handles all EVM chains (Ethereum, BSC, Base) */}
                  <ConnectButton showBalance={false} />
                </>
              ) : (
                // Fallback: show Launch App button if not on homepage and wallet buttons not shown
                <button
                  onClick={handleLaunchApp}
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Launch App</span>
                  <span className="sm:hidden">Launch</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}

