'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, LogIn, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '403';

  const is401 = code === '401';
  const title = is401 ? '401 Authentication Required' : '403 Access Forbidden';
  const message = is401
    ? 'You must be logged in with an active session to view this protected enterprise resource.'
    : 'Your account does not possess the required role permissions to access this administrative feature or organization scope.';

  return (
    <div className="min-h-screen bg-[#151c2e] px-4 py-16 text-[#f8fafc] flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-lg rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d49b38]/10 text-[#d49b38] border border-[#d49b38]/30">
          <ShieldAlert className="h-8 w-8 text-[#d49b38]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-sm text-[#94a3b8] leading-relaxed">{message}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {is401 ? (
            <Link href="/login">
              <Button variant="primary" className="w-full sm:w-auto bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                <LogIn className="mr-2 h-4 w-4" /> Log In
              </Button>
            </Link>
          ) : (
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto rounded-lg border border-[#d49b38]/40 bg-[#151c2e] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#182238] transition-colors"
            >
              <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5 text-[#d49b38]" /> Back to Previous Page
            </button>
          )}

          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto border-[#d49b38]/40 bg-[#151c2e] text-white hover:bg-[#182238]">
              <Home className="mr-2 h-4 w-4 text-[#d49b38]" /> Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Fnd12UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-label text-[#5B6673]">Loading page...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
