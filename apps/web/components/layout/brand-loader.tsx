'use client';

import React, { useState, useEffect } from 'react';
import { AnveshakLogo } from '@/components/ui/anveshak-logo';

interface BrandLoaderProps {
  onComplete?: () => void;
  durationMs?: number;
}

const BRAND_NAME = 'ANVESHAKHUB';

export function BrandLoader({
  onComplete,
  durationMs = 850,
}: BrandLoaderProps) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fast letter-by-letter reveal (every 40ms)
    const charInterval = Math.max(25, Math.floor((durationMs - 200) / BRAND_NAME.length));

    const timer = setInterval(() => {
      setDisplayedChars((prev) => {
        if (prev < BRAND_NAME.length) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, charInterval);

    const finishTimeout = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 250);
    }, durationMs);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimeout);
    };
  }, [durationMs, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0F19] text-white transition-opacity duration-300 selection:bg-amber-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft Ambient Radial Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,132,199,0.15)_0%,transparent_60%)] pointer-events-none" />

      {/* Main Center Module */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Logo Container */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/30 via-sky-500/30 to-indigo-500/30 blur-lg animate-pulse" />
          <div className="relative rounded-3xl border border-slate-800 bg-[#111827]/95 p-6 shadow-2xl backdrop-blur-md">
            <AnveshakLogo size="2xl" showText={false} variant="dark-bg" />
          </div>
        </div>

        {/* Letter-by-Letter Animated Brand Name Reveal */}
        <div className="h-10 flex items-center justify-center space-x-1 sm:space-x-1.5 font-extrabold tracking-[0.25em] text-2xl sm:text-3xl">
          {BRAND_NAME.split('').map((char, index) => {
            const isVisibleChar = index < displayedChars;
            return (
              <span
                key={index}
                className={`transition-all duration-200 transform ${
                  isVisibleChar
                    ? 'opacity-100 scale-100 translate-y-0 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-sky-300 to-white'
                    : 'opacity-0 scale-75 translate-y-2'
                }`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
