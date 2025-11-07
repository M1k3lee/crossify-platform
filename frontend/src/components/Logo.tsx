import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function Logo({ className = '', size = 'md', animated = true }: LogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  useEffect(() => {
    if (!animated || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // TypeScript: context is guaranteed to be non-null after this check
    const ctx = context;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    let animationId: number;
    let time = 0;

    const particles: Array<{
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      colorPhase: number;
    }> = [];

    // Create particles for better effect
    for (let i = 0; i < 12; i++) {
      particles.push({
        angle: (Math.PI * 2 * i) / 12,
        radius: width * 0.35,
        speed: 0.015 + Math.random() * 0.015,
        size: 2.5 + Math.random() * 2.5,
        opacity: 0.5 + Math.random() * 0.4,
        colorPhase: Math.random() * Math.PI * 2,
      });
    }

    function animate() {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Enhanced central glow with pulsing
      const pulseIntensity = 0.7 + Math.sin(time * 2) * 0.3;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.5);
      gradient.addColorStop(0, `rgba(59, 130, 246, ${0.8 * pulseIntensity})`);
      gradient.addColorStop(0.4, `rgba(147, 51, 234, ${0.5 * pulseIntensity})`);
      gradient.addColorStop(0.7, `rgba(236, 72, 153, ${0.3 * pulseIntensity})`);
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic connecting lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        const nextIdx = (i + 1) % particles.length;
        const p2 = particles[nextIdx];

        const x1 = centerX + Math.cos(p1.angle + time * p1.speed) * p1.radius;
        const y1 = centerY + Math.sin(p1.angle + time * p1.speed) * p1.radius;
        const x2 = centerX + Math.cos(p2.angle + time * p2.speed) * p2.radius;
        const y2 = centerY + Math.sin(p2.angle + time * p2.speed) * p2.radius;

        const colorPhase = (time * 0.5 + i * 0.3) % (Math.PI * 2);
        const r = Math.floor(59 + Math.sin(colorPhase) * 50);
        const g = Math.floor(130 + Math.sin(colorPhase + Math.PI * 2/3) * 60);
        const b = Math.floor(246 + Math.sin(colorPhase + Math.PI * 4/3) * 60);
        
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + Math.sin(time + i) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Enhanced particles
      particles.forEach((p) => {
        const x = centerX + Math.cos(p.angle + time * p.speed) * p.radius;
        const y = centerY + Math.sin(p.angle + time * p.speed) * p.radius;

        const colorPhase = (time * 0.8 + p.colorPhase) % (Math.PI * 2);
        const r = Math.floor(147 + Math.sin(colorPhase) * 60);
        const g = Math.floor(197 + Math.sin(colorPhase + Math.PI * 2/3) * 40);
        const b = Math.floor(253);

        const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3);
        particleGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.opacity})`);
        particleGradient.addColorStop(0.5, `rgba(${r - 50}, ${g - 50}, ${b}, ${p.opacity * 0.5})`);
        particleGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, 255, ${p.opacity + 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enhanced center X symbol
      const symbolSize = width * 0.18;
      const symbolGlow = ctx.createLinearGradient(
        centerX - symbolSize, centerY - symbolSize,
        centerX + symbolSize, centerY + symbolSize
      );
      symbolGlow.addColorStop(0, 'rgba(147, 197, 253, 1)');
      symbolGlow.addColorStop(0.5, 'rgba(236, 72, 153, 0.9)');
      symbolGlow.addColorStop(1, 'rgba(59, 130, 246, 1)');
      
      ctx.strokeStyle = symbolGlow;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(147, 197, 253, 0.8)';
      
      const rotation = Math.sin(time * 0.5) * 0.05;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      const x1 = centerX - symbolSize;
      const y1 = centerY - symbolSize;
      const x2 = centerX + symbolSize;
      const y2 = centerY + symbolSize;
      const rx1 = centerX + (x1 - centerX) * cos - (y1 - centerY) * sin;
      const ry1 = centerY + (x1 - centerX) * sin + (y1 - centerY) * cos;
      const rx2 = centerX + (x2 - centerX) * cos - (y2 - centerY) * sin;
      const ry2 = centerY + (x2 - centerX) * sin + (y2 - centerY) * cos;
      
      ctx.beginPath();
      ctx.moveTo(rx1, ry1);
      ctx.lineTo(rx2, ry2);
      
      const x3 = centerX + symbolSize;
      const y3 = centerY - symbolSize;
      const x4 = centerX - symbolSize;
      const y4 = centerY + symbolSize;
      const rx3 = centerX + (x3 - centerX) * cos - (y3 - centerY) * sin;
      const ry3 = centerY + (x3 - centerX) * sin + (y3 - centerY) * cos;
      const rx4 = centerX + (x4 - centerX) * cos - (y4 - centerY) * sin;
      const ry4 = centerY + (x4 - centerX) * sin + (y4 - centerY) * cos;
      
      ctx.moveTo(rx3, ry3);
      ctx.lineTo(rx4, ry4);
      ctx.stroke();

      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animated]);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)',
            '0 0 30px rgba(236, 72, 153, 0.7), 0 0 50px rgba(59, 130, 246, 0.5)',
            '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(147, 51, 234, 0.4)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {animated && (
        <canvas
          ref={canvasRef}
          width={64}
          height={64}
          className="absolute inset-0 w-full h-full rounded-full"
        />
      )}
      
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-600"
        animate={{
          scale: animated ? [1, 1.15, 1] : 1,
          opacity: animated ? [0.9, 1, 0.9] : 1,
        }}
        transition={{
          duration: 2,
          repeat: animated ? Infinity : 0,
          ease: 'easeInOut',
        }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="65%"
          height="65%"
          viewBox="0 0 24 24"
          fill="none"
          className="text-blue-200 drop-shadow-lg"
        >
          <motion.path
            d="M6 6L18 18M18 6L6 18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={animated ? {
              opacity: [0.8, 1, 0.8],
              pathLength: [0.8, 1, 0.8],
            } : {}}
            transition={{
              duration: 2.5,
              repeat: animated ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>
    </div>
  );
}





