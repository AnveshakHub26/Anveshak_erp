'use client';

import React from 'react';
import Link from 'next/link';
import { UserMenu } from './user-menu';
import { Bell, Search } from 'lucide-react';

export const TopNav: React.FC = () => {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#D7DEE6] bg-white px-6">
      {/* Global Search Header Input */}
      <div className="flex items-center w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6673]" />
          <input
            type="text"
            placeholder="Global Search (3+ chars)... [FND-08]"
            className="w-full rounded border border-[#D7DEE6] bg-[#F7F8FA] pl-9 pr-3 py-1.5 text-body text-[#17202A] focus:border-[#1F4E79] focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Right Notifications & Profile */}
      <div className="flex items-center space-x-4">
        <Link
          href="/notifications"
          className="relative rounded p-2 text-[#5B6673] hover:bg-[#F7F8FA] hover:text-[#17202A]"
          title="FND-09 Notification Center"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#B42318]" />
        </Link>
        <div className="h-6 w-px bg-[#D7DEE6]" />
        <UserMenu />
      </div>
    </header>
  );
};
