'use client';

import React from 'react';

interface AnveshakLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export function AnveshakLogo({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-white',
}: AnveshakLogoProps) {
  const dimensions = {
    sm: { height: 28, width: 36, text: 'text-sm' },
    md: { height: 38, width: 48, text: 'text-base' },
    lg: { height: 48, width: 62, text: 'text-xl' },
    xl: { height: 64, width: 84, text: 'text-2xl' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Precision Vector AH Monogram */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md transition-transform hover:scale-105"
      >
        <defs>
          {/* Amber / Orange Gradient for Left A Leg */}
          <linearGradient id="ahAmber" x1="0%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Cyan / Sky Blue Gradient for Middle Diagonal Ribbon */}
          <linearGradient id="ahCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          {/* Brushed Metallic Silver Gradient for Right H Pillar */}
          <linearGradient id="ahSilver" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {/* 1. Left Orange/Amber Diagonal Leg of 'A' */}
        <polygon
          points="5,70 30,20 44,20 28,70 17,70 24,50 14,50"
          fill="url(#ahAmber)"
        />

        {/* 2. Middle Cyan/Blue Angled Ribbon (Connecting A and H) */}
        <polygon
          points="32,20 46,20 68,60 52,60"
          fill="url(#ahCyan)"
        />
        <polygon
          points="42,20 56,20 72,50 58,50"
          fill="url(#ahCyan)"
          opacity="0.85"
        />

        {/* 3. Right Metallic Silver Vertical Pillar of 'H' */}
        <polygon
          points="74,20 86,20 86,70 74,70"
          fill="url(#ahSilver)"
        />
        {/* Horizontal Notch for H */}
        <polygon
          points="62,45 74,45 74,52 66,52"
          fill="url(#ahSilver)"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight ${dimensions.text} ${textColor} flex items-center gap-1.5`}>
            <span>AnveshakHub</span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 ring-1 ring-amber-500/30 uppercase tracking-wider">
              Enterprise
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
            Bridging Innovation & Industry
          </span>
        </div>
      )}
    </div>
  );
}
