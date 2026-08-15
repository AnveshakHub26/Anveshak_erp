'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';

export const UserMenu: React.FC = () => {
  const { user, isInitializing, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center space-x-2.5 rounded-lg p-1.5">
        <div className="h-8 w-8 rounded-lg bg-[#E2E8F0] animate-pulse" />
        <div className="hidden h-4 w-24 rounded bg-[#E2E8F0] animate-pulse md:block" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 rounded-lg p-1.5 hover:bg-[#F8FAFC] focus:outline-none transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-xs font-bold text-[#151c2e] shadow-sm">
          {user.email.substring(0, 2).toUpperCase()}
        </div>
        <span className="hidden text-xs font-semibold text-[#0F172A] md:inline">{user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-lg z-50">
          <div className="border-b border-[#E2E8F0] pb-2.5 px-3 py-2">
            <p className="text-xs font-bold text-[#0F172A] truncate">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {user.roles?.map((r) => (
                <span key={r} className="inline-block rounded-full bg-[#151c2e] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-2 space-y-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <User className="h-4 w-4 text-[#d49b38]" />
              <span>User Profile</span>
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FDF2F2] transition-colors"
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
