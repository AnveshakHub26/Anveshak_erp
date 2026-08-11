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
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-[#17202A] flex items-center justify-center">
      <div className="mx-auto max-w-lg rounded border border-[#D7DEE6] bg-white p-8 text-center shadow-sm space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F8FA] text-red-600 border border-[#D7DEE6]">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-page-title font-semibold text-[#17324D]">
            System Operational Notice
          </h1>
          <p className="text-body text-[#5B6673]">
            An unexpected error occurred while processing your request. Internal technical details have been suppressed for security compliance.
          </p>
        </div>

        <div className="pt-2 flex justify-center space-x-3">
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
  );
}
