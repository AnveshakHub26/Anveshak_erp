'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NotificationHeaderBell } from './notification-header-bell';
import { Search, ArrowLeft, Home } from 'lucide-react';

export const TopNav: React.FC = () => {
  const router = useRouter();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-6 shadow-sm">
      {/* Navigation Controls & Global Search */}
      <div className="flex items-center space-x-3 w-auto md:w-[480px]">
        {/* Back & Home controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center space-x-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:border-[#d49b38] hover:text-[#0F172A] transition-colors cursor-pointer"
            title="Go to previous page"
            aria-label="Go to previous page"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#d49b38]" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link
            href="/"
            className="flex items-center space-x-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:border-[#d49b38] hover:text-[#0F172A] transition-colors"
            title="Navigate to Home Page"
            aria-label="Navigate to Home Page"
          >
            <Home className="h-3.5 w-3.5 text-[#d49b38]" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        {/* Global Search Header Input */}
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Global Search (organizations, personnel, documents)..."
            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right Notifications & Profile */}
      <div className="flex items-center space-x-4">
        <NotificationHeaderBell />
        <div className="h-5 w-px bg-[#E2E8F0]" />
        <UserMenu />
      </div>
    </header>
  );
};
