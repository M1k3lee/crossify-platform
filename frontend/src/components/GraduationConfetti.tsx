/**
 * Small confetti animation component for token page
 * Shows a subtle confetti effect when token graduates
 */
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface GraduationConfettiProps {
  trigger: boolean;
}

export default function GraduationConfetti({ trigger }: GraduationConfettiProps) {
  useEffect(() => {
    if (trigger) {
      // Small, elegant confetti burst
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { 
        startVelocity: 20, 
        spread: 60, 
        ticks: 40, 
        zIndex: 1000,
        colors: ['#FFD700', '#FF6B6B', '#4ECDC7', '#45E7FF', '#8B5CF6']
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // Initial burst from top center
      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: 0.5, y: 0.1 },
        angle: randomInRange(60, 120),
      });

      // Gentle continuous shower
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 20 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.3, 0.7), y: 0.1 },
          angle: randomInRange(60, 120),
        });
      }, 300);

      return () => {
        clearInterval(interval);
      };
    }
  }, [trigger]);

  return null; // This component doesn't render anything
}

