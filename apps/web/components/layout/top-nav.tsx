'use client';

import React from 'react';
import Link from 'next/link';
import { UserMenu } from './user-menu';
import { Bell, Search } from 'lucide-react';

export const TopNav: React.FC = () => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-6 shadow-sm">
      {/* Global Search Header Input */}
      <div className="flex items-center w-96">
        <div className="relative w-full">
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
        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
          title="Notification Center"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d49b38]" />
        </Link>
        <div className="h-5 w-px bg-[#E2E8F0]" />
        <UserMenu />
      </div>
    </header>
  );
};
