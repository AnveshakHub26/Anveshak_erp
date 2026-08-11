'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, LogIn, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicShell } from '@/components/layout/public-shell';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '403';

  const is401 = code === '401';
  const title = is401 ? '401 Authentication Required' : '403 Access Forbidden';
  const message = is401
    ? 'You must be logged in with an active session to view this protected enterprise resource.'
    : 'Your account does not possess the required role permissions to access this administrative feature or organization scope.';

  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-lg text-center">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm space-y-6">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF3C7] border border-[#FDE68A]">
              <ShieldAlert className="h-8 w-8 text-[#92400E]" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
              <p className="text-sm text-[#64748B] leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {is401 ? (
                <Link href="/login">
                  <Button variant="primary" className="w-full sm:w-auto">
                    <LogIn className="mr-2 h-4 w-4" /> Log In
                  </Button>
                </Link>
              ) : (
                <button
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#d49b38] transition-colors"
                >
                  <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" /> Back to Previous Page
                </button>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" /> Go to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

export default function Fnd12UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#64748B]">Loading page...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
