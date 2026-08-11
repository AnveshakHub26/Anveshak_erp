'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
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
    { label: 'Admin Governance', href: '/admin', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  const filteredItems = navItems.filter((item) => hasRole('ADMIN') || item.roles.some((r) => hasRole(r)));

  return (
    <aside className="w-64 border-r border-[#182238] bg-[#151c2e] text-white min-h-screen flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-[#182238]">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d49b38] to-[#c48b28] flex items-center justify-center font-bold text-[#151c2e] shadow-md shadow-[#d49b38]/10 group-hover:scale-105 transition-transform">
            AH
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white">AnveshakHub</span>
            <span className="text-[10px] text-[#d49b38] font-medium tracking-wider uppercase">Enterprise</span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 p-3">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-[#182238] text-white shadow-sm border-l-2 border-[#d49b38]'
                  : 'text-[#94a3b8] hover:bg-[#182238]/60 hover:text-white',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#d49b38]' : 'text-[#94a3b8]')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Version */}
      <div className="p-4 border-t border-[#182238] text-xs text-[#94a3b8]">
        <div className="font-semibold text-white">AnveshakHub v3.0 Master</div>
        <div className="text-[11px] text-[#64748b] mt-0.5">Unified Enterprise System</div>
      </div>
    </aside>
  );
};
