import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface OrganicAIElementProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function OrganicAIElement({ size = "md", className = "" }: OrganicAIElementProps) {
  const [animationState, setAnimationState] = useState<"idle" | "thinking" | "responding">("idle");
  
  // Cycle through animation states more naturally
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState(prev => {
        if (prev === "idle") return "thinking";
        if (prev === "thinking") return "responding";
        return "idle";
      });
    }, 4000 + Math.random() * 2000); // Randomize timing for more organic feel
    
    return () => clearInterval(interval);
  }, []);

  const sizeConfig = {
    sm: { width: 59, height: 59 },
    md: { width: 92, height: 92 },
    lg: { width: 134, height: 134 }
  };

  const { width, height } = sizeConfig[size];
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3.5;

  // Create organic flowing paths with more complexity
  const createFlowingPath = (offset: number, scale: number = 1, segments: number = 12) => {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + offset;
      // More organic shape with multiple harmonics
      const harmonics = Math.sin(angle * 3) * 0.3 + Math.sin(angle * 5) * 0.15 + Math.sin(angle * 7) * 0.1;
      const r = radius * scale * (1 + harmonics);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      points.push([x, y]);
    }
    
    // Create smooth curved path with better bezier curves
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[i > 0 ? i - 1 : points.length - 1];
      
      // Calculate control points for smoother curves
      const cp1x = curr[0] + (next[0] - prev[0]) * 0.15;
      const cp1y = curr[1] + (next[1] - prev[1]) * 0.15;
      const cp2x = next[0] - (curr[0] - prev[0]) * 0.15;
      const cp2y = next[1] - (curr[1] - prev[1]) * 0.15;
      
      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${next[0]} ${next[1]}`;
    }
    path += ` Z`;
    return path;
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div 
        className="relative"
        animate={{
          scale: [1, 1.02, 0.98, 1],
          rotateY: [0, 5, -5, 0],
          z: [0, 8, -4, 0],
        }}
        transition={{
          duration: 8,
          ease: [0.25, 0.46, 0.45, 0.94],
          repeat: Infinity,
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Subtle background glow */}
        <motion.div 
          className="absolute inset-0 rounded-full blur-lg opacity-5"
          style={{
            background: "radial-gradient(circle, #3B82F6 0%, #8B5CF6 100%)",
            width: width * 0.9,
            height: height * 0.9,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)"
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 6,
            ease: [0.25, 0.46, 0.45, 0.94],
            repeat: Infinity,
          }}
        />
        
        <svg width={width} height={height} className="relative z-10">
          {/* Central core - respiração natural */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.15}
            fill="url(#coreGradient)"
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.7, 0.85, 0.7],
            }}
            transition={{
              duration: 4.5,
              ease: [0.4, 0.0, 0.6, 1],
              repeat: Infinity,
            }}
          />
          
          {/* Dots com movimento orbital natural */}
          {[...Array(6)].map((_, i) => {
            const baseAngle = (i / 6) * Math.PI * 2;
            const baseRadius = radius * 0.45;
            
            return (
              <motion.circle
                key={`dot-${i}`}
                r={1.2}
                fill="url(#particleGradient)"
                animate={{
                  cx: [
                    centerX + Math.cos(baseAngle) * baseRadius,
                    centerX + Math.cos(baseAngle + 0.15) * (baseRadius * 1.1),
                    centerX + Math.cos(baseAngle + 0.3) * baseRadius,
                    centerX + Math.cos(baseAngle + 0.15) * (baseRadius * 0.9),
                    centerX + Math.cos(baseAngle) * baseRadius,
                  ],
                  cy: [
                    centerY + Math.sin(baseAngle) * baseRadius,
                    centerY + Math.sin(baseAngle + 0.15) * (baseRadius * 1.1),
                    centerY + Math.sin(baseAngle + 0.3) * baseRadius,
                    centerY + Math.sin(baseAngle + 0.15) * (baseRadius * 0.9),
                    centerY + Math.sin(baseAngle) * baseRadius,
                  ],
                  opacity: [0.6, 0.8, 0.6, 0.9, 0.6],
                  scale: [1, 1.2, 1, 0.8, 1],
                }}
                transition={{
                  duration: 5 + (i * 0.3),
                  ease: [0.25, 0.46, 0.45, 0.94],
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.5" />
            </linearGradient>
            
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#2563EB" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.5" />
            </radialGradient>
            
            <radialGradient id="particleGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
            </radialGradient>
            
            <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0.4" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}