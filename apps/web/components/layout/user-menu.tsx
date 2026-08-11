'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { User, LogOut, Shield } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded p-1.5 hover:bg-[#F7F8FA] focus:outline-none"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F4E79] text-xs font-semibold text-white">
          {user.email.substring(0, 2).toUpperCase()}
        </div>
        <span className="hidden text-body font-medium text-[#17202A] md:inline">{user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded border border-[#D7DEE6] bg-white p-2 shadow-lg z-50">
          <div className="border-b border-[#D7DEE6] pb-2 px-3 py-1">
            <p className="text-body font-semibold text-[#17202A]">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.roles?.map((r) => (
                <span key={r} className="inline-block rounded bg-[#F7F8FA] px-1.5 py-0.5 text-xs text-[#5B6673]">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={logout}
              className="flex w-full items-center space-x-2 rounded px-3 py-2 text-table text-[#B42318] hover:bg-[#FDF2F2]"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
