import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicShell } from '@/components/layout/public-shell';

export default function NotFound() {
  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-lg text-center">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm space-y-6">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0]">
              <FileQuestion className="h-8 w-8 text-[#d49b38]" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">404 Page Not Found</h1>
              <p className="text-sm text-[#64748B] leading-relaxed">
                The requested application URL or module resource does not exist.
              </p>
            </div>

            {/* Action */}
            <div className="flex justify-center pt-2">
              <Link href="/">
                <Button variant="primary">
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
