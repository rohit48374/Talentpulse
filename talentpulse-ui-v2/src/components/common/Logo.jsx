import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ size = 'md', className = '', theme = 'light' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };
  
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`${iconSizes[size]} flex-shrink-0 relative flex items-center justify-center`}
      >
        {/* Professional Sliced HV Monogram Logo for Hirevant */}
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hvBrandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6345ED" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#00F2FE" />
            </linearGradient>
            <filter id="hvLogoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#6345ED" floodOpacity="0.3" />
            </filter>
          </defs>
          
          <g filter="url(#hvLogoGlow)">
            {/* The Professional Sliced H Path */}
            <path 
              d="M 16 21 A 6 6 0 0 1 28 21 L 28 44 L 44 44 L 44 21 A 6 6 0 0 1 56 21 L 56 36 L 44 64 L 44 56 L 28 56 L 28 79 A 6 6 0 0 1 16 79 Z" 
              fill="url(#hvBrandGradient)" 
            />
            
            {/* The Professional Sliced V Path */}
            <path 
              d="M 61 36 L 49 64 L 65 80 A 6 6 0 0 0 77 80 L 89 30 A 6 6 0 0 0 77 30 L 65 68 Z" 
              fill="url(#hvBrandGradient)" 
            />
          </g>
        </svg>
      </motion.div>
      <span className={`${sizeClasses[size]} font-black tracking-tight ${textColor} flex items-center`}>
        Hire<span className="text-[#6345ED]">vant</span>
      </span>
    </div>
  );
};


