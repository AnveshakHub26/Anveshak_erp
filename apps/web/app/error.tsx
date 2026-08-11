'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception safely without exposing internal details to client state
    console.error('System Exception:', error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#151c2e] px-4 py-16 text-[#f8fafc] flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-lg rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B42318]/15 text-[#B42318] border border-[#B42318]/30">
          <AlertTriangle className="h-8 w-8 text-[#d49b38]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            System Operational Notice
          </h1>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            An unexpected error occurred while processing your request. Internal technical details have been suppressed for security compliance.
          </p>
        </div>

        <div className="pt-2 flex justify-center space-x-3">
          <Button variant="outline" onClick={() => reset()} className="border-[#d49b38]/40 bg-[#151c2e] text-white hover:bg-[#182238]">
            <RefreshCw className="mr-2 h-4 w-4 text-[#d49b38]" /> Try Again
          </Button>
          <Link href="/">
            <Button variant="primary" className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
              <Home className="mr-2 h-4 w-4" /> Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
