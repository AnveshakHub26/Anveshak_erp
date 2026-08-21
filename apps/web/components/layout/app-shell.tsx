'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { UserMenu } from './user-menu';
import { useAuthStore } from '@/hooks/useAuth';
import {
  Menu,
  X,
  ArrowLeft,
  Home,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

import { BrandLoader } from './brand-loader';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Protected route guard: Redirect to /login if unauthenticated after initialization
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, isAuthenticated, pathname, router]);

  // Show a sleek executive brand loading screen while initializing session
  if (isInitializing) {
    return <BrandLoader subtitle="Verifying AnveshakHub Enterprise Authorization..." durationMs={1200} />;
  }

  // If unauthenticated, return empty container while router redirects
  if (!isAuthenticated) {
    return null;
  }

  // Generate dynamic breadcrumbs from path
  const pathSegments = pathname.split('/').filter(Boolean);

  const getSegmentLabel = (segment: string): string => {
    if (segment === 'hr') return 'HR Workforce';
    if (segment === 'onboard') return 'Onboarding';
    if (segment === 'projects') return 'Projects';
    if (segment === 'employee') return 'Employee';
    if (segment === 'dashboard') return 'Dashboard';
    if (segment === 'industry') return 'Industry Portal';
    if (segment === 'admin') return 'Admin';
    if (segment === 'approvals') return 'Approvals';
    if (segment === 'problem-statements') return 'Problem Statements';
    if (segment === 'notifications') return 'Notifications';
    if (segment === 'profile') return 'User Profile';
    if (segment.length > 20) return `ID: ${segment.substring(0, 8)}...`;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* 1. Desktop Fixed Sidebar (md: and up) */}
      <aside className="hidden md:flex w-64 border-r border-[#182238] bg-[#151c2e] min-h-screen flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* 2. Mobile Slide-out Drawer (< md) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex w-72 max-w-full flex-col bg-[#151c2e] z-10 shadow-2xl">
            <div className="absolute right-3 top-3.5 z-20">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#182238] hover:text-white"
                aria-label="Close Drawer Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onItemClick={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Application Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 shadow-xs shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Drawer Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex md:hidden rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#d49b38]"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Back & Home controls */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center space-x-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:border-[#d49b38] hover:text-[#0F172A] transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#d49b38]" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <Link
                href="/"
                className="flex items-center space-x-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:border-[#d49b38] hover:text-[#0F172A] transition-colors"
                title="Home Landing"
              >
                <Home className="h-3.5 w-3.5 text-[#d49b38]" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>

            {/* Dynamic Breadcrumbs */}
            <div className="hidden lg:flex items-center space-x-1 text-xs text-[#64748B] truncate ml-2">
              <ChevronRight className="h-3.5 w-3.5 text-[#CBD5E1] shrink-0" />
              {pathSegments.length === 0 ? (
                <span className="font-semibold text-[#0F172A]">Dashboard</span>
              ) : (
                pathSegments.map((segment, idx) => {
                  const href = '/' + pathSegments.slice(0, idx + 1).join('/');
                  const isLast = idx === pathSegments.length - 1;
                  return (
                    <React.Fragment key={href}>
                      {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#CBD5E1] shrink-0" />}
                      {isLast ? (
                        <span className="font-bold text-[#0F172A] truncate">
                          {getSegmentLabel(segment)}
                        </span>
                      ) : (
                        <Link href={href} className="hover:text-[#d49b38] transition-colors truncate">
                          {getSegmentLabel(segment)}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Global Search Bar (Desktop) */}
            <div className="relative hidden md:block w-56 lg:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search projects, personnel..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-3 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
              />
            </div>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d49b38]" />
            </Link>

            <div className="h-5 w-px bg-[#E2E8F0]" />

            {/* User Dropdown Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="mx-auto max-w-7xl w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
