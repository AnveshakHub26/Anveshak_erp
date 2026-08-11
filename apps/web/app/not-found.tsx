import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#151c2e] px-4 py-16 text-[#f8fafc] flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-lg rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d49b38]/10 text-[#d49b38] border border-[#d49b38]/30">
          <FileQuestion className="h-8 w-8 text-[#d49b38]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            404 Page Not Found
          </h1>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            The requested application URL or module resource does not exist.
          </p>
        </div>

        <div className="pt-2 flex justify-center space-x-3">
          <Link href="/">
            <Button variant="primary" className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
              <Home className="mr-2 h-4 w-4" /> Return to Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
