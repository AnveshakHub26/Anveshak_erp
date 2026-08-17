'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Home, Calendar, LogIn, Building2, Menu, X } from 'lucide-react';

interface PublicShellProps {
  children: React.ReactNode;
}

/**
 * PublicShell — Shared layout wrapper for all public/auth pages.
 * Fully responsive: compact mobile nav with slide-down drawer for links.
 */
export function PublicShell({ children }: PublicShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#d49b38] selection:text-[#151c2e]">
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-[#182238] bg-[#151c2e] text-white shadow-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left: Brand + Back/Home */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-lg p-1 transition-opacity hover:opacity-90 shrink-0"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-sm shadow-sm">
                AH
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Anveshak Hub
                  <span className="rounded-full border border-[#d49b38]/40 bg-[#d49b38]/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#d49b38] uppercase">
                    Enterprise
                  </span>
                </span>
                <span className="hidden sm:block text-[10px] font-medium text-[#94a3b8] tracking-wide">
                  Bridging Innovation, Enterprise &amp; Academia
                </span>
              </div>
            </Link>

            {/* Back & Home pills */}
            <div className="flex items-center gap-1.5 border-l border-[#182238] pl-2 sm:pl-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1 rounded-lg border border-[#182238] bg-[#182238]/80 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-[#94a3b8] hover:bg-[#182238] hover:text-white hover:border-[#d49b38]/50 transition-all cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#d49b38]" />
                <span className="hidden xs:inline">Back</span>
              </button>

              {!isHome && (
                <Link
                  href="/"
                  className="flex items-center gap-1 rounded-lg border border-[#182238] bg-[#182238]/80 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-[#94a3b8] hover:bg-[#182238] hover:text-white hover:border-[#d49b38]/50 transition-all"
                  aria-label="Go to Home"
                >
                  <Home className="h-3.5 w-3.5 text-[#d49b38]" />
                  <span className="hidden xs:inline">Home</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Desktop nav CTAs */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/workshops"
              className="rounded-lg border border-[#d49b38]/40 bg-[#182238] px-3 py-2 text-xs font-semibold text-[#d49b38] hover:border-[#d49b38] hover:bg-[#182238]/90 transition-all flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              Workshops
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-[#d49b38]/40 bg-[#182238] px-3 sm:px-4 py-2 text-xs font-semibold text-white hover:border-[#d49b38] transition-all flex items-center gap-1.5"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Register Org
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-4 sm:px-5 py-2 text-xs font-bold text-[#151c2e] hover:opacity-95 shadow-sm transition-all"
            >
              Login
            </Link>
          </div>

          {/* Mobile: Hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-[#182238] bg-[#182238]/80 text-[#94a3b8] hover:text-white hover:border-[#d49b38]/50 transition-all shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#182238] bg-[#151c2e] px-4 py-3 space-y-2">
            <Link
              href="/workshops"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 w-full rounded-lg border border-[#182238] bg-[#182238] px-4 py-2.5 text-sm font-semibold text-[#d49b38] hover:border-[#d49b38]/50 transition-all"
            >
              <Calendar className="h-4 w-4" />
              Workshops &amp; Masterclasses
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 w-full rounded-lg border border-[#182238] bg-[#182238] px-4 py-2.5 text-sm font-semibold text-white hover:border-[#d49b38]/50 transition-all"
            >
              <Building2 className="h-4 w-4 text-slate-400" />
              Register Organization
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-4 py-2.5 text-sm font-bold text-[#151c2e] hover:opacity-95 shadow-sm transition-all"
            >
              <LogIn className="h-4 w-4" />
              Login to Portal
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#182238] bg-[#151c2e] py-5 sm:py-6 text-xs text-[#94a3b8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-0">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-[10px]">
                AH
              </div>
              <span className="font-semibold text-white text-xs">Anveshak Hub Private Limited</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-5 text-xs flex-wrap justify-center">
              <Link href="/" className="hover:text-[#d49b38] transition-colors">Home</Link>
              <Link href="/workshops" className="hover:text-[#d49b38] transition-colors">Workshops</Link>
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
