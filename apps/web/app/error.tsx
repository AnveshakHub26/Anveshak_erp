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
    console.error('System Exception:', error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Minimal dark header */}
      <header className="border-b border-[#182238] bg-[#151c2e] py-4 px-6">
        <div className="mx-auto max-w-7xl flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-sm">
            AH
          </div>
          <span className="text-sm font-bold text-white">Anveshak Hub</span>
        </div>
      </header>

      {/* Light workspace error content */}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-lg text-center">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm space-y-6">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FDF2F2] border border-[#B42318]/20">
              <AlertTriangle className="h-8 w-8 text-[#B42318]" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">System Operational Notice</h1>
              <p className="text-sm text-[#64748B] leading-relaxed">
                An unexpected error occurred while processing your request. Internal technical details have been suppressed for security compliance.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => reset()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
              <Link href="/">
                <Button variant="primary">
                  <Home className="mr-2 h-4 w-4" /> Go to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
