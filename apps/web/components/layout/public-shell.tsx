import React from 'react';
import Link from 'next/link';

interface PublicShellProps {
  children: React.ReactNode;
}

/**
 * PublicShell — Shared layout wrapper for all public/auth pages.
 * Provides the consistent dark Midnight Navy header + light workspace background
 * that matches the landing page design language.
 */
export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#d49b38] selection:text-[#151c2e]">
      {/* Midnight Navy Header — identical to landing page */}
      <header className="sticky top-0 z-50 border-b border-[#182238] bg-[#151c2e] text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-lg p-1 transition-opacity hover:opacity-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-base shadow-sm">
              AH
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center">
                Anveshak Hub
                <span className="ml-2 rounded-full border border-[#d49b38]/40 bg-[#d49b38]/10 px-2 py-0.5 text-[10px] font-semibold text-[#d49b38] uppercase">
                  Enterprise
                </span>
              </span>
              <span className="text-[10px] font-medium text-[#94a3b8] tracking-wide">
                Bridging Innovation, Enterprise &amp; Academia
              </span>
            </div>
          </Link>

          {/* Desktop Nav CTAs */}
          <div className="hidden items-center space-x-3 md:flex">
            <Link
              href="/register"
              className="rounded-lg border border-[#d49b38]/40 bg-[#182238] px-4 py-2 text-xs font-semibold text-white hover:border-[#d49b38] transition-all"
            >
              Register Organization
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-5 py-2 text-xs font-bold text-[#151c2e] hover:opacity-95 shadow-sm transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Light Workspace Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Midnight Navy Footer — identical to landing page */}
      <footer className="border-t border-[#182238] bg-[#151c2e] py-6 text-xs text-[#94a3b8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-[10px]">
                AH
              </div>
              <span className="font-semibold text-white text-xs">Anveshak Hub Private Limited</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center space-x-5 text-xs">
              <Link href="/privacy" className="hover:text-[#d49b38] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#d49b38] transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-[#d49b38] transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
