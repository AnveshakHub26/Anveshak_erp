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
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  HelpCircle,
  PhoneCall,
  PlusCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  subItems?: { label: string; href: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  // Admin & Staff Navigation
  {
    label: 'System Monitor',
    href: '/admin/system-monitor',
    icon: ShieldAlert,
    roles: ['ADMIN'],
  },
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
    label: 'HR Attendance Audit',
    href: '/hr/attendance',
    icon: Clock,
    roles: ['ADMIN', 'HR'],
  },
  {
    label: 'HR Leave Approvals',
    href: '/hr/leave',
    icon: Calendar,
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
    label: 'Workshop Management',
    href: '/admin/workshops',
    icon: Calendar,
    roles: ['ADMIN'],
  },
  {
    label: 'Employee Workspace',
    href: '/employee/dashboard',
    icon: UserCheck,
    roles: ['HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE'],
    subItems: [
      { label: 'Overview', href: '/employee/dashboard' },
      { label: 'My Profile', href: '/employee/profile' },
      { label: 'My Attendance', href: '/employee/attendance' },
      { label: 'My Leave', href: '/employee/leave' },
      { label: 'My Documents', href: '/employee/documents' },
    ],
  },

  // Dedicated Industry Client Portal Navigation (ORG_USER)
  {
    label: 'Overview',
    href: '/industry',
    icon: LayoutDashboard,
    roles: ['ORG_USER'],
  },
  {
    label: 'Problem Statements',
    href: '/industry/problem-statements',
    icon: FileText,
    roles: ['ORG_USER'],
    subItems: [
      { label: 'All Statements', href: '/industry/problem-statements' },
      { label: 'Drafts', href: '/industry/problem-statements?status=DRAFT' },
      { label: '+ New Statement', href: '/industry/problem-statements/new' },
    ],
  },
  {
    label: 'Projects',
    href: '/industry/projects',
    icon: FolderGit2,
    roles: ['ORG_USER'],
  },
  {
    label: 'Deliverables',
    href: '/industry/deliverables',
    icon: CheckCircle2,
    roles: ['ORG_USER'],
  },
  {
    label: 'Meetings',
    href: '/industry/meetings',
    icon: Calendar,
    roles: ['ORG_USER'],
  },
  {
    label: 'Documents',
    href: '/industry/documents',
    icon: FileSpreadsheet,
    roles: ['ORG_USER'],
  },
  {
    label: 'Queries & Support',
    href: '/industry/queries',
    icon: HelpCircle,
    roles: ['ORG_USER'],
  },
  {
    label: 'Organization Profile',
    href: '/industry/profile',
    icon: Building2,
    roles: ['ORG_USER'],
  },
  {
    label: 'Contact AnveshakHub',
    href: '/industry/contact',
    icon: PhoneCall,
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

  const isOrgUser = hasExactRole('ORG_USER');

  return (
    <div className="flex h-full w-full flex-col bg-[#151c2e] text-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-[#182238] shrink-0">
        <Link href={isOrgUser ? '/industry' : '/'} prefetch={true} className="flex items-center space-x-3 group" onClick={onItemClick}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] flex items-center justify-center font-extrabold text-[#151c2e] text-sm shadow-md group-hover:scale-105 transition-transform">
            AH
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white">AnveshakHub</span>
            <span className="text-[10px] text-[#d49b38] font-semibold tracking-wider uppercase">
              {isOrgUser ? 'Client Portal' : 'Enterprise ERP'}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Header Title */}
      {isOrgUser && (
        <div className="px-6 pt-4 pb-1 text-[10px] font-bold text-[#d49b38] uppercase tracking-wider">
          INDUSTRY PORTAL
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {!isHydrated || isInitializing ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-full rounded-lg bg-[#182238]/60 animate-pulse" />
            ))}
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/industry'
                ? pathname === '/industry'
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <div key={item.href} className="space-y-1">
                <Link
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
                  <span className="truncate flex-1">{item.label}</span>
                </Link>

                {/* Render sub-items if present and active parent */}
                {item.subItems && isActive && (
                  <div className="pl-9 pr-2 space-y-1 py-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          prefetch={true}
                          onClick={onItemClick}
                          className={cn(
                            'block text-[11px] py-1 px-2 rounded font-medium transition-colors',
                            isSubActive
                              ? 'text-[#d49b38] font-bold bg-[#182238]/40'
                              : 'text-[#94a3b8] hover:text-white hover:bg-[#182238]/30',
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer System Info */}
      <div className="p-4 border-t border-[#182238] text-xs text-[#94a3b8] shrink-0">
        <div className="font-semibold text-white text-xs flex items-center justify-between">
          <span>AnveshakHub Enterprise</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational"></span>
        </div>
        <div className="text-[11px] text-[#64748b] mt-0.5">Enterprise Operations Platform</div>
      </div>
    </div>
  );
};
