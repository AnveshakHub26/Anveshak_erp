'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  FolderGit2,
  Search,
  RefreshCw,
  Eye,
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  projectCode: string;
  title: string;
  category?: string;
  status: string;
  createdAt: string;
  organization: { id: string; legalName: string; orgNumber: string };
  problemStatement: { id: string; code: string; title: string };
  businessVertical: { code: string; name: string };
}

export default function ProjectsListPage() {
  const router = useRouter();
  const { hasAnyRole } = usePermissions();

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiRequest(`/projects?${params.toString()}`);
      if (res && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects list.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (hasAnyRole(['ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'])) {
      loadProjects();
    } else {
      router.push('/unauthorized');
    }
  }, [hasAnyRole, router, loadProjects]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'INITIATED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">Initiated</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">In Progress</span>;
      case 'RESOURCE_ASSIGNMENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3E8FD] text-[#9333EA]">Resource Assignment</span>;
      case 'ON_HOLD':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF7E0] text-[#B06000]">On Hold</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F]">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B]">{status}</span>;
    }
  };

  if (!hasAnyRole(['ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'])) return null;

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#151c2e] text-[#d49b38] shadow-sm">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                Enterprise Projects Repository
              </h1>
              <p className="text-xs text-[#64748B]">
                Track formal projects instantiated from approved technical problem statements.
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadProjects} className="text-xs font-semibold">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Search & Status Filters */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: 'All Statuses', value: '' },
                { label: 'Initiated', value: 'INITIATED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'On Hold', value: 'ON_HOLD' },
                { label: 'Completed', value: 'COMPLETED' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.value
                      ? 'bg-[#151c2e] text-white shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Search by project code (e.g. PRJ-2026-000001), title, or client..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
            />
          </div>
        </div>

        {/* Projects Queue Table */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Project Code &amp; Title</th>
                  <th className="px-5 py-3.5">Client Organization</th>
                  <th className="px-5 py-3.5">Business Vertical</th>
                  <th className="px-5 py-3.5">Source Requirement</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#64748B]">
                      Loading projects repository...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#64748B]">
                      No active projects found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0F172A]">{item.title}</div>
                        <div className="text-[11px] font-mono text-[#d49b38] font-bold mt-0.5">{item.projectCode}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0F172A]">{item.organization.legalName}</div>
                        <div className="text-[11px] text-[#64748B]">{item.organization.orgNumber}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#0F172A]">
                        {item.businessVertical.code} — {item.businessVertical.name}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-[#64748B]">
                        {item.problemStatement.code}
                      </td>
                      <td className="px-5 py-4">{statusBadge(item.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/projects/${item.id}`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 bg-[#F8FAFC]">
              <div className="text-xs text-[#64748B]">
                Showing page <span className="font-semibold text-[#0F172A]">{page}</span> of{' '}
                <span className="font-semibold text-[#0F172A]">{totalPages}</span> ({total} total)
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
