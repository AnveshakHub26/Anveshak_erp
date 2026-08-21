'use client';

import React, { useState, useEffect } from 'react';
import { AnveshakLogo } from '@/components/ui/anveshak-logo';
import { ShieldCheck, Activity } from 'lucide-react';

interface BrandLoaderProps {
  onComplete?: () => void;
  durationMs?: number;
  subtitle?: string;
}

export function BrandLoader({
  onComplete,
  durationMs = 1800,
  subtitle = 'Enterprise Operations Platform',
}: BrandLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / durationMs) * 100), 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setIsFading(true);
        setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 500);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0F19] text-white transition-opacity duration-500 selection:bg-amber-500 selection:text-slate-950 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,132,199,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Center Loading Module */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md w-full">
        {/* Vector AH Monogram Logo Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute -inset-5 rounded-3xl bg-gradient-to-r from-amber-500/25 via-sky-500/25 to-indigo-500/25 blur-lg animate-pulse" />
          <div className="relative rounded-3xl border border-slate-800 bg-[#111827]/95 p-6 shadow-2xl backdrop-blur-md">
            <AnveshakLogo size="2xl" showText={false} variant="dark-bg" />
          </div>
        </div>

        {/* Brand Name Typography Reveal Below Logo */}
        <div className="space-y-1 mt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-sky-300 to-slate-100 drop-shadow-md">
            ANVESHAKHUB
          </h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            {subtitle}
          </p>
        </div>

        {/* Progress Bar & Status */}
        <div className="mt-8 w-full max-w-xs space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90 p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-sky-400 to-indigo-500 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>System Initialization</span>
            </span>
            <span className="font-bold text-slate-200">{progress}%</span>
          </div>
        </div>

        {/* Security Footer Badge */}
        <div className="mt-8 flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/60 px-4 py-1 text-[10px] text-slate-400 font-semibold backdrop-blur-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>Encrypted Enterprise Operating System</span>
        </div>
      </div>
    </div>
  );
}
