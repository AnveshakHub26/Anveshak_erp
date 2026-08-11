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
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-[#17202A] flex items-center justify-center">
      <div className="mx-auto max-w-lg rounded border border-[#D7DEE6] bg-white p-8 text-center shadow-sm space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F8FA] text-[#17324D] border border-[#D7DEE6]">
          <ShieldAlert className="h-8 w-8 text-[#1F4E79]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-page-title font-semibold text-[#17324D]">{title}</h1>
          <p className="text-body text-[#5B6673]">{message}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {is401 ? (
            <Link href="/login">
              <Button variant="primary" className="w-full sm:w-auto">
                <LogIn className="mr-2 h-4 w-4" /> Log In
              </Button>
            </Link>
          ) : (
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto rounded border border-[#D7DEE6] bg-white px-4 py-2 text-xs font-semibold text-[#17202A] hover:bg-[#F7F8FA]"
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
  );
}

export default function Fnd12UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-label text-[#5B6673]">Loading page...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
