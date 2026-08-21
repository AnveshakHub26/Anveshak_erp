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
  subtitle = 'Initializing AnveshakHub Enterprise OS...',
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
        }, 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F19] text-white transition-opacity duration-500 selection:bg-amber-500 selection:text-slate-950 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Radial Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,132,199,0.08)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Center Brand Module */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full">
        {/* Animated Brand Logo Container */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Subtle Ring Pulse */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-indigo-500/20 blur-md animate-pulse" />
          <div className="relative rounded-2xl border border-slate-800 bg-[#111827]/90 p-5 shadow-2xl backdrop-blur-md">
            <AnveshakLogo size="xl" showText={false} />
          </div>
        </div>

        {/* Brand Identity Label */}
        <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>AnveshakHub</span>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-500 ring-1 ring-amber-500/30 uppercase tracking-wider">
            Enterprise
          </span>
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium tracking-wide">
          {subtitle}
        </p>

        {/* Progress Bar & Telemetry Status */}
        <div className="mt-8 w-full space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>Verifying Services</span>
            </span>
            <span className="font-bold text-slate-200">{progress}%</span>
          </div>
        </div>

        {/* Security Footer Badge */}
        <div className="mt-10 flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/60 px-3.5 py-1 text-[10px] text-slate-400 font-semibold backdrop-blur-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
          <span>Encrypted Enterprise Session</span>
        </div>
      </div>
    </div>
  );
}
