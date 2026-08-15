'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import {
  FolderGit2,
  Search,
  RefreshCw,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
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
  const { hasAnyRole, hasExactRole, isInitializing } = usePermissions();

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
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
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (isInitializing) return;
    if (hasAnyRole(['ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'HR', 'STAFF', 'EXECUTIVE'])) {
      loadProjects();
    } else {
      router.push('/unauthorized');
    }
  }, [hasAnyRole, isInitializing, router, loadProjects]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'INITIATED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Initiated</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">In Progress</span>;
      case 'RESOURCE_ASSIGNMENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Resource Assignment</span>;
      case 'ON_HOLD':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">On Hold</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold shadow-sm shrink-0">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
              Enterprise Projects Repository
            </h1>
            <p className="text-xs text-[#64748B]">
              Track formal projects instantiated from approved technical problem statements.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasExactRole('ADMIN') && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-[#151c2e] to-[#182238] text-[#d49b38] hover:opacity-95 shadow-md font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Project
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadProjects}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Search & Status Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap focus:outline-none ${
                  statusFilter === tab.value
                    ? 'bg-[#151c2e] text-white shadow-sm'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project code (PRJ-...), title, or scope description..."
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table / Empty State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No Enterprise Projects Found"
          description={
            statusFilter || search
              ? 'No projects match your search or filter parameters. Clear filters to see all records.'
              : 'No enterprise projects have been created in the ERP yet.'
          }
          actionLabel={hasExactRole('ADMIN') ? 'Create First Project' : undefined}
          onAction={hasExactRole('ADMIN') ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-semibold text-[#64748B]">
                <tr>
                  <th className="p-3.5 pl-4">Project Code</th>
                  <th className="p-3.5">Title & Vertical</th>
                  <th className="p-3.5">Client Organization</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                {items.map((prj) => (
                  <tr key={prj.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5 pl-4 font-mono font-bold text-[#151c2e] whitespace-nowrap">
                      {prj.projectCode}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-[#0F172A]">{prj.title}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {prj.businessVertical?.name || 'Vertical Unassigned'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{prj.organization?.legalName || 'N/A'}</div>
                      <div className="text-[11px] text-[#64748B]">Org #{prj.organization?.orgNumber}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">{statusBadge(prj.status)}</td>
                    <td className="p-3.5 text-[#64748B] whitespace-nowrap">
                      {new Date(prj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right pr-4 whitespace-nowrap">
                      <Link
                        href={`/projects/${prj.id}`}
                        className="inline-flex items-center space-x-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] hover:border-[#d49b38] hover:text-[#d49b38] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#d49b38]" />
                        <span>Open Workspace</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-xs text-[#64748B]">
              <div>
                Showing page <span className="font-bold text-[#0F172A]">{page}</span> of{' '}
                <span className="font-bold text-[#0F172A]">{totalPages}</span> ({total} total projects)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadProjects}
      />
    </div>
  );
}
