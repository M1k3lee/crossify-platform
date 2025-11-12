import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ExternalLink, X, Sparkles } from 'lucide-react';

interface GraduationCelebrationProps {
  isVisible: boolean;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  dexPoolAddress?: string;
  dexName?: string;
  onClose: () => void;
}

export default function GraduationCelebration({
  isVisible,
  tokenName,
  tokenSymbol,
  chain,
  dexPoolAddress,
  dexName = 'DEX',
  onClose,
}: GraduationCelebrationProps) {
  useEffect(() => {
    if (isVisible) {
      // Trigger confetti animation using canvas-confetti if available
      // Otherwise, we'll use CSS animations
      try {
        // Try to use canvas-confetti if available
        const confetti = (window as any).confetti;
        if (confetti) {
          const duration = 3000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
          }

          const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }, 250);
        }
      } catch (error) {
        // Confetti not available, that's okay
        console.log('Confetti animation not available');
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getDexLink = () => {
    if (!dexPoolAddress) return null;
    
    // Raydium links
    if (dexName.toLowerCase().includes('raydium')) {
      return `https://raydium.io/liquidity/?ammId=${dexPoolAddress}`;
    }
    
    // Uniswap links
    if (dexName.toLowerCase().includes('uniswap')) {
      return `https://app.uniswap.org/#/pool/${dexPoolAddress}`;
    }
    
    // PancakeSwap links
    if (dexName.toLowerCase().includes('pancake')) {
      return `https://pancakeswap.finance/liquidity/${dexPoolAddress}`;
    }
    
    return null;
  };

  const dexLink = getDexLink();

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border-2 border-purple-500/50 shadow-2xl relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-center text-white mb-2"
                  >
                    🎉 Congratulations! 🎉
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-gray-300 mb-6"
                  >
                    <span className="font-semibold text-white">{tokenName}</span> ({tokenSymbol}) has graduated to {dexName}!
                  </motion.p>

                  {/* Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 rounded-xl p-4 mb-6 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Your token is now live on {dexName}</span>
                    </div>
                    {dexPoolAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Pool Address:</span>
                        <code className="text-xs text-purple-400 font-mono">
                          {dexPoolAddress.slice(0, 8)}...{dexPoolAddress.slice(-6)}
                        </code>
                      </div>
                    )}
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    {dexLink && (
                      <a
                        href={dexLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition text-center flex items-center justify-center gap-2"
                      >
                        <span>Trade on {dexName}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={onClose}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                      Continue
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

