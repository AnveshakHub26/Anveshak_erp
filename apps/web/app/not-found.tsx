import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-[#17202A] flex items-center justify-center">
      <div className="mx-auto max-w-lg rounded border border-[#D7DEE6] bg-white p-8 text-center shadow-sm space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F8FA] text-[#1F4E79] border border-[#D7DEE6]">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-page-title font-semibold text-[#17324D]">
            404 Page Not Found
          </h1>
          <p className="text-body text-[#5B6673]">
            The requested application URL or module resource does not exist.
          </p>
        </div>

        <div className="pt-2 flex justify-center space-x-3">
          <Link href="/">
            <Button variant="primary">
              <Home className="mr-2 h-4 w-4" /> Go to Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
