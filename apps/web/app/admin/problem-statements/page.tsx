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
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FolderPlus,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';

interface ProblemStatementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: string;
  budgetEstimate?: string;
  expectedTimeline?: string;
  status: string;
  createdAt: string;
  businessVertical: { code: string; name: string };
  organization: { id: string; legalName: string; orgNumber: string; type: string };
  createdBy: { id: string; email: string };
  project?: { id: string; projectCode: string; status: string } | null;
  documents?: { id: string; storageKey: string }[];
}

export default function AdminProblemStatementsPage() {
  const router = useRouter();
  const { hasRole } = usePermissions();

  const [items, setItems] = useState<ProblemStatementItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected item for review drawer / modal
  const [selectedItem, setSelectedItem] = useState<ProblemStatementItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [activeActionModal, setActiveActionModal] = useState<'REJECT' | 'REQUEST_CHANGES' | null>(null);

  const loadProblemStatements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiRequest(`/admin/problem-statements?${params.toString()}`);
      if (res && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ADMIN problem statements queue.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (hasRole('ADMIN')) {
      loadProblemStatements();
    } else {
      router.push('/unauthorized');
    }
  }, [hasRole, router, loadProblemStatements]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', reason?: string) => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await apiRequest(`/admin/problem-statements/${selectedItem.id}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, reason }),
      });

      if (res && res.data) {
        setSelectedItem(null);
        setActiveActionModal(null);
        setRejectReason('');
        setChangeReason('');
        await loadProblemStatements();
      }
    } catch (err: any) {
      setError(err.message || `Failed to execute ${decision} decision.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateProject = async (psId: string) => {
    if (!confirm('Are you sure you want to instantiate a Project from this APPROVED problem statement?')) {
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const res = await apiRequest(`/admin/problem-statements/${psId}/create-project`, {
        method: 'POST',
      });

      if (res && res.data) {
        alert(`Project ${res.data.projectCode} instantiated successfully!`);
        setSelectedItem(null);
        await loadProblemStatements();
        router.push(`/projects/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to instantiate project.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDoc = async (docId: string) => {
    try {
      const res = await apiRequest(`/documents/${docId}/download-url`);
      if (res && res.data) {
        window.open(res.data, '_blank');
      }
    } catch {
      alert('Could not generate presigned download URL.');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">Submitted</span>;
      case 'CHANGES_REQUESTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF7E0] text-[#B06000]">Changes Requested</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F]">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B]">{status}</span>;
    }
  };

  if (!hasRole('ADMIN')) return null;

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Page Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#151c2e] text-[#d49b38] shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                ADMIN Problem Statement Governance &amp; Review
              </h1>
              <p className="text-xs text-[#64748B]">
                Review submitted technical proposals, request changes, approve requirements, and instantiate Projects.
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadProblemStatements} className="text-xs font-semibold">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </Button>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Filters & Search */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { label: 'All Statuses', value: '' },
              { label: 'Submitted (Pending)', value: 'SUBMITTED' },
              { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
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

          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Search by problem statement title, code, or organization..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
            />
          </div>
        </div>

        {/* Table Queue */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Code &amp; Title</th>
                  <th className="px-5 py-3.5">Organization</th>
                  <th className="px-5 py-3.5">Business Vertical</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Linked Project</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#64748B]">
                      Loading governance queue...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#64748B]">
                      No problem statements found matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0F172A]">{item.title}</div>
                        <div className="text-[11px] font-mono text-[#d49b38] mt-0.5">{item.code}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0F172A]">{item.organization.legalName}</div>
                        <div className="text-[11px] text-[#64748B]">{item.organization.orgNumber}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#0F172A]">
                        {item.businessVertical.code} — {item.businessVertical.name}
                      </td>
                      <td className="px-5 py-4">{statusBadge(item.status)}</td>
                      <td className="px-5 py-4 font-mono text-xs">
                        {item.project ? (
                          <Link href={`/projects/${item.project.id}`} className="text-[#d49b38] font-bold hover:underline">
                            {item.project.projectCode}
                          </Link>
                        ) : (
                          <span className="text-[#94A3B8]">None</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          className="text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 bg-[#F8FAFC]">
              <div className="text-xs text-[#64748B]">
                Page <span className="font-semibold text-[#0F172A]">{page}</span> of{' '}
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

        {/* Detailed Inspection Drawer / Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">

              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#d49b38]">{selectedItem.code}</span>
                    <span className="text-[#64748B]">•</span>
                    <h2 className="text-lg font-bold text-[#0F172A]">{selectedItem.title}</h2>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Submitted by <span className="font-semibold text-[#0F172A]">{selectedItem.organization.legalName}</span> ({selectedItem.organization.orgNumber})
                  </p>
                </div>
                <div>{statusBadge(selectedItem.status)}</div>
              </div>

              {/* Technical Requirement Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B]">Business Vertical:</span>
                  <p className="font-bold text-[#0F172A]">{selectedItem.businessVertical.code} — {selectedItem.businessVertical.name}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Category:</span>
                  <p className="font-semibold text-[#0F172A]">{selectedItem.category || 'General'}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Budget Estimate:</span>
                  <p className="font-semibold text-[#0F172A]">{selectedItem.budgetEstimate || 'Unspecified'}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Target Timeline:</span>
                  <p className="font-semibold text-[#0F172A]">{selectedItem.expectedTimeline || 'Unspecified'}</p>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#0F172A]">Detailed Technical Description:</span>
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-[#0F172A] whitespace-pre-wrap leading-relaxed">
                  {selectedItem.description}
                </div>
              </div>

              {/* Governance Actions Bar */}
              <div className="border-t border-[#E2E8F0] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)} className="text-xs">
                  Close Window
                </Button>

                <div className="flex items-center space-x-2">
                  {/* If status is NOT APPROVED/REJECTED */}
                  {selectedItem.status !== 'APPROVED' && selectedItem.status !== 'REJECTED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => setActiveActionModal('REQUEST_CHANGES')}
                        className="text-xs font-semibold text-[#B06000] border-[#FEF7E0] hover:bg-[#FEF7E0]"
                      >
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        Request Changes
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => setActiveActionModal('REJECT')}
                        className="text-xs font-semibold text-[#C5221F] border-[#FCE8E6] hover:bg-[#FCE8E6]"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleDecision('APPROVE')}
                        className="text-xs font-bold bg-[#137333] hover:bg-[#0d5224]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Approve Problem Statement
                      </Button>
                    </>
                  )}

                  {/* Standalone Project Creation Button: ONLY when APPROVED and NO project exists */}
                  {selectedItem.status === 'APPROVED' && !selectedItem.project && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleCreateProject(selectedItem.id)}
                      className="text-xs font-bold bg-[#151c2e] text-[#d49b38] hover:bg-[#182238] border border-[#d49b38]"
                    >
                      <FolderPlus className="h-3.5 w-3.5 mr-1 text-[#d49b38]" />
                      Instantiate Project (PRJ-2026-XXXX)
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Action Reason Input Modal (for REJECT or REQUEST_CHANGES) */}
        {activeActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A]">
                {activeActionModal === 'REJECT' ? 'Reject Problem Statement' : 'Request Changes'}
              </h3>
              <p className="text-xs text-[#64748B]">
                Provide mandatory feedback explaining your governance decision:
              </p>

              <textarea
                rows={4}
                value={activeActionModal === 'REJECT' ? rejectReason : changeReason}
                onChange={(e) =>
                  activeActionModal === 'REJECT' ? setRejectReason(e.target.value) : setChangeReason(e.target.value)
                }
                placeholder="Enter mandatory reason or required revision comments..."
                className="w-full rounded-lg border border-[#E2E8F0] p-3 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
              />

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActiveActionModal(null)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={
                    isProcessing ||
                    !(activeActionModal === 'REJECT' ? rejectReason.trim() : changeReason.trim())
                  }
                  onClick={() =>
                    handleDecision(
                      activeActionModal,
                      activeActionModal === 'REJECT' ? rejectReason : changeReason,
                    )
                  }
                  className="text-xs font-semibold"
                >
                  Submit Decision
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
