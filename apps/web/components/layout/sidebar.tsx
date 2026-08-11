'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  FolderGit2,
  Users,
  CircleDollarSign,
  TrendingUp,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { hasRole } = usePermissions();

  const navItems = [
    { label: 'External Interface', href: '/external', icon: UserCheck, roles: ['ADMIN', 'CRM_STAFF'] },
    { label: 'CRM', href: '/crm', icon: Building2, roles: ['ADMIN', 'CRM_STAFF', 'ORG_USER'] },
    { label: 'Projects', href: '/projects', icon: FolderGit2, roles: ['ADMIN', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'] },
    { label: 'HR', href: '/hr', icon: Users, roles: ['ADMIN', 'HR'] },
    { label: 'Finance', href: '/finance', icon: CircleDollarSign, roles: ['ADMIN', 'FINANCE'] },
    { label: 'Sales', href: '/sales', icon: TrendingUp, roles: ['ADMIN', 'SALES', 'FINANCE'] },
    { label: 'Purchase', href: '/purchase', icon: ShoppingBag, roles: ['ADMIN', 'PURCHASE', 'FINANCE'] },
    { label: 'Admin Governance', href: '/admin', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const filteredItems = navItems.filter((item) => hasRole('SUPER_ADMIN') || item.roles.some((r) => hasRole(r)));

  return (
    <aside className="w-64 border-r border-[#D7DEE6] bg-[#17324D] text-white min-h-screen flex flex-col">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-[#1F4E79]">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-[#1F4E79] flex items-center justify-center font-bold text-white">
            AH
          </div>
          <span className="font-semibold text-lg tracking-wide text-white">AnveshakHub</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded px-3 py-2 text-body transition-colors',
                isActive
                  ? 'bg-[#1F4E79] font-medium text-white'
                  : 'text-[#D7DEE6] hover:bg-[#1F4E79]/50 hover:text-white',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Version */}
      <div className="p-4 border-t border-[#1F4E79] text-xs text-[#D7DEE6]">
        <div>AnveshakHub v3.0 Master</div>
        <div className="text-[#5B6673] mt-0.5">Enterprise Platform</div>
      </div>
    </aside>
  );
};
