'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  Building2,
  FolderGit2,
  Users,
  UserCheck,
  CheckSquare,
  FileText,
  UserPlus,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Admin Approvals',
    href: '/admin/approvals',
    icon: CheckSquare,
    roles: ['ADMIN'],
  },
  {
    label: 'Projects & Resource Mgmt',
    href: '/projects',
    icon: FolderGit2,
    roles: ['ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'HR'],
  },
  {
    label: 'HR & Workforce',
    href: '/hr',
    icon: Users,
    roles: ['ADMIN', 'HR'],
  },
  {
    label: 'Employee Onboarding',
    href: '/hr/onboard',
    icon: UserPlus,
    roles: ['ADMIN', 'HR'],
  },
  {
    label: 'Problem Statements',
    href: '/admin/problem-statements',
    icon: FileText,
    roles: ['ADMIN'],
  },
  {
    label: 'Employee Workspace',
    href: '/employee/dashboard',
    icon: UserCheck,
    roles: ['HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE'],
  },
  {
    label: 'Industry Client Portal',
    href: '/industry',
    icon: Building2,
    roles: ['ORG_USER'],
  },
];

export const Sidebar: React.FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const pathname = usePathname();
  const { hasExactRole, isInitializing } = usePermissions();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => hasExactRole(r)),
  );

  return (
    <div className="flex h-full w-full flex-col bg-[#151c2e] text-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-[#182238] shrink-0">
        <Link href="/" prefetch={true} className="flex items-center space-x-3 group" onClick={onItemClick}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] flex items-center justify-center font-extrabold text-[#151c2e] text-sm shadow-md group-hover:scale-105 transition-transform">
            AH
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white">AnveshakHub</span>
            <span className="text-[10px] text-[#d49b38] font-semibold tracking-wider uppercase">Enterprise ERP</span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {!isHydrated || isInitializing ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-full rounded-lg bg-[#182238]/60 animate-pulse" />
            ))}
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onItemClick}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-[#182238] text-white shadow-sm border-l-2 border-[#d49b38]'
                    : 'text-[#94a3b8] hover:bg-[#182238]/60 hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#d49b38]' : 'text-[#94a3b8]')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer System Info */}
      <div className="p-4 border-t border-[#182238] text-xs text-[#94a3b8] shrink-0">
        <div className="font-bold text-white">AnveshakHub v3.0</div>
        <div className="text-[11px] text-[#64748b] mt-0.5">Enterprise Operations Platform</div>
      </div>
    </div>
  );
};
