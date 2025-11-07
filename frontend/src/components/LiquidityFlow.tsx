import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Chain {
  name: string;
  liquidity: number;
  volume24h: number;
  priceImpact: number;
  price: number;
  color: string;
}

interface LiquidityFlowProps {
  totalLiquidity?: number;
  chains: Chain[];
  tokenName: string;
  tokenSymbol: string;
}

export default function LiquidityFlow({ chains }: LiquidityFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        if (containerRef.current) {
          setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chains.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      progress: number;
      speed: number;
      color: string;
      size: number;
    }> = [];

    // Create particles for each chain
    chains.forEach((chain, index) => {
      const angle = (Math.PI * 2 * index) / chains.length - Math.PI / 2; // Start from top
      const radius = Math.min(canvas.width, canvas.height) * 0.35;
      const targetX = centerX + Math.cos(angle) * radius;
      const targetY = centerY + Math.sin(angle) * radius;

      for (let i = 0; i < 30; i++) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 20,
          y: centerY + (Math.random() - 0.5) * 20,
          targetX,
          targetY,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          color: chain.color,
          size: 2 + Math.random() * 2,
        });
      }
    });

    let animationId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections with glow
      chains.forEach((chain, index) => {
        const angle = (Math.PI * 2 * index) / chains.length - Math.PI / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.35;
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;

        // Create gradient for connection line
        const gradient = ctx.createLinearGradient(centerX, centerY, targetX, targetY);
        gradient.addColorStop(0, `${chain.color}60`);
        gradient.addColorStop(0.5, `${chain.color}FF`);
        gradient.addColorStop(1, `${chain.color}60`);

        // Draw main connection line
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 25;
        ctx.shadowColor = chain.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Draw secondary glow
        ctx.strokeStyle = `${chain.color}40`;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.shadowBlur = 0;
      });

      // Update and draw particles
      particles.forEach((particle, idx) => {
        // Reset particle when it reaches target
        if (particle.progress >= 1) {
          particle.progress = 0;
          particle.x = centerX + (Math.random() - 0.5) * 20;
          particle.y = centerY + (Math.random() - 0.5) * 20;
        }

        particle.progress += particle.speed;

        // Calculate position along path
        const chainIndex = Math.floor(idx / 30);
        const angle = (Math.PI * 2 * chainIndex) / chains.length - Math.PI / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.35;
        const currentX = centerX + Math.cos(angle) * radius * particle.progress;
        const currentY = centerY + Math.sin(angle) * radius * particle.progress;

        particle.x = currentX;
        particle.y = currentY;

        // Draw particle with glow
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [chains, containerSize]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: '600px' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Top Blue Galaxy Orb */}
      <motion.div
        className="absolute top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 360],
        }}
        transition={{
          scale: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          rotate: {
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        <div
          className="w-32 h-32 rounded-full relative"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.6) 50%, rgba(29,78,216,0.4) 100%)',
            boxShadow: '0 0 50px rgba(59, 130, 246, 0.6), 0 0 80px rgba(37, 99, 235, 0.3)',
          }}
        >
          {/* Galaxy dots effect */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Central Golden Orb - Lower */}
      <motion.div
        className="absolute bottom-[40%] left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20"
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, -360],
        }}
        transition={{
          scale: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          rotate: {
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        <div
          className="w-36 h-36 rounded-full relative"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,1) 0%, rgba(255,165,0,1) 50%, rgba(255,215,0,0.8) 100%)',
            boxShadow: '0 0 60px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 165, 0, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Pulsing rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'rgba(255, 215, 0, 0.5)' }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'rgba(255, 215, 0, 0.3)' }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
          
          {/* Inner glow effect */}
          <div className="absolute inset-4 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        </div>
      </motion.div>

      {/* Chain Labels on Flow Lines */}
      {chains.map((chain, index) => {
        const angle = (Math.PI * 2 * index) / chains.length - Math.PI / 2;
        const radius = Math.min(containerSize.width, containerSize.height) * 0.35;
        const centerX = containerSize.width / 2;
        const centerY = containerSize.height / 2;
        const labelX = centerX + Math.cos(angle) * (radius * 0.5);
        const labelY = centerY + Math.sin(angle) * (radius * 0.5);
        
        return (
          <div
            key={chain.name}
            className="absolute z-10"
            style={{
              left: `${(labelX / containerSize.width) * 100}%`,
              top: `${(labelY / containerSize.height) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${chain.color}20`,
                color: chain.color,
                border: `1px solid ${chain.color}40`,
                boxShadow: `0 0 10px ${chain.color}40`,
              }}
            >
              {chain.name.toUpperCase()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
