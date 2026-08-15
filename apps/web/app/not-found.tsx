'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicShell } from '@/components/layout/public-shell';

export default function NotFound() {
  const router = useRouter();

  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-lg text-center">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm space-y-6">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <FileQuestion className="h-8 w-8 text-[#d49b38]" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">404 Page Not Found</h1>
              <p className="text-sm text-[#64748B] leading-relaxed">
                The requested URL or application module resource does not exist or has been moved.
              </p>
            </div>

            {/* Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4 text-[#d49b38]" /> Go Back
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto">
                  <Home className="mr-2 h-4 w-4" /> Return to Home Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
