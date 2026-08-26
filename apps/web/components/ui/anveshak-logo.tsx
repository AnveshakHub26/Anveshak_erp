'use client';

import React from 'react';

interface AnveshakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textColor?: string;
  variant?: 'dark-bg' | 'light-bg' | 'auto';
}

export function AnveshakLogo({
  className = '',
  size = 'md',
  showText = true,
  textColor,
  variant = 'auto',
}: AnveshakLogoProps) {
  const dimensions = {
    sm: { height: 24, width: 30, text: 'text-xs', sub: 'text-[8px]', gap: 'gap-2' },
    md: { height: 32, width: 40, text: 'text-sm', sub: 'text-[9px]', gap: 'gap-2.5' },
    lg: { height: 50, width: 64, text: 'text-xl', sub: 'text-[11px]', gap: 'gap-3.5' },
    xl: { height: 72, width: 92, text: 'text-2xl', sub: 'text-xs', gap: 'gap-4' },
    '2xl': { height: 96, width: 122, text: 'text-3xl', sub: 'text-sm', gap: 'gap-5' },
  }[size];

  // Determine silver pillar fill based on background variant
  const isLightBg = variant === 'light-bg';
  const silverStart = isLightBg ? '#334155' : '#FFFFFF';
  const silverMid = isLightBg ? '#475569' : '#CBD5E1';
  const silverEnd = isLightBg ? '#64748B' : '#94A3B8';
  const textClass = textColor || (isLightBg ? 'text-slate-900' : 'text-white');

  return (
    <div className={`inline-flex items-center ${dimensions.gap} ${className}`}>
      {/* Precision Vector AH Monogram with High-Contrast Gradients */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 110 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md transition-transform hover:scale-105"
      >
        <defs>
          {/* Amber / Gold Gradient for Left Leg of 'A' */}
          <linearGradient id={`ahAmber_${size}`} x1="0%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="45%" stopColor="#E07A1E" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Cyan / Sky Blue Gradient for Middle Diagonal Ribbon */}
          <linearGradient id={`ahCyan_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* High-Contrast Silver / Steel Metallic Gradient for 'H' Pillar */}
          <linearGradient id={`ahSilver_${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={silverStart} />
            <stop offset="40%" stopColor={silverMid} />
            <stop offset="100%" stopColor={silverEnd} />
          </linearGradient>

          <filter id={`ahGlow_${size}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.25" />
          </filter>
        </defs>

        <g filter={`url(#ahGlow_${size})`}>
          {/* 1. Left Orange/Amber Diagonal Leg of 'A' */}
          <path
            d="M 6 74 L 32 18 L 47 18 L 30 74 Z M 16 52 L 35 52 L 28 74 L 16 74 Z"
            fill={`url(#ahAmber_${size})`}
          />

          {/* 2. Middle Cyan/Blue Angled Ribbon */}
          <path
            d="M 33 18 L 48 18 L 70 62 L 53 62 Z"
            fill={`url(#ahCyan_${size})`}
          />
          <path
            d="M 44 18 L 59 18 L 76 52 L 61 52 Z"
            fill={`url(#ahCyan_${size})`}
            opacity="0.88"
          />

          {/* 3. Right High-Contrast Metallic Silver Vertical Pillar of 'H' */}
          <path
            d="M 76 18 L 92 18 L 92 74 L 76 74 Z"
            fill={`url(#ahSilver_${size})`}
            stroke={isLightBg ? '#1E293B' : '#0F172A'}
            strokeWidth="0.8"
          />
          {/* Horizontal Notch for H */}
          <path
            d="M 63 44 L 76 44 L 76 52 L 67 52 Z"
            fill={`url(#ahSilver_${size})`}
            stroke={isLightBg ? '#1E293B' : '#0F172A'}
            strokeWidth="0.8"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col whitespace-nowrap select-none overflow-hidden min-w-0">
          <div className={`font-extrabold tracking-tight ${dimensions.text} ${textClass} flex items-center gap-1.5 whitespace-nowrap`}>
            <span>AnveshakHub</span>
          </div>
          <span className={`font-semibold text-slate-400 tracking-wider uppercase whitespace-nowrap ${dimensions.sub}`}>
            Bridging Innovation &amp; Industry
          </span>
        </div>
      )}
    </div>
  );
}
