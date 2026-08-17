'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
  ShieldCheck,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Mail,
  Phone,
  User,
  Globe,
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react';

interface OrganizationItem {
  id: string;
  orgNumber: string;
  legalName: string;
  tradeName?: string;
  type: string;
  website?: string;
  address?: string;
  status: string;
  createdAt: string;
  primaryBv?: { code: string; name: string };
  organizationBvs?: { businessVertical: { code: string; name: string }; isPrimary: boolean }[];
  organizationUsers?: { user: { email: string }; orgRole: string }[];
  documents?: { id: string; storageKey: string; type: string; createdAt: string }[];
}

export default function AdminApprovalsPage() {
  const router = useRouter();
  const { hasRole, isInitializing, user } = usePermissions();

  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Detail Modal State
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
    reason: string;
  }>({
    isOpen: false,
    decision: 'APPROVE',
    reason: '',
  });
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    orgId: string;
    orgName: string;
    orgNumber: string;
    email: string;
  }>({
    isOpen: false,
    orgId: '',
    orgName: '',
    orgNumber: '',
    email: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Check ADMIN Authorization
  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!hasRole('ADMIN')) {
      setError('Access Restricted: Administrator privileges are required to view the approval queue.');
    }
  }, [isInitializing, user, hasRole, router]);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Applications List
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const res = await apiRequest(`/organizations?${params.toString()}`);
      if (res && res.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      if (err.status === 401 || err.message === 'Unauthorized' || err.status === 403 || err.message === 'Forbidden') {
        setError('Access Restricted: You do not have Administrator permissions to access the Organization Approvals Queue. Please sign in as an Administrator.');
      } else {
        setError(err.message || 'Failed to load organization applications list.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    if (hasRole('ADMIN')) {
      loadApplications();
    }
  }, [hasRole, loadApplications]);

  // Load Single Application Details & Presigned Documents
  const openDetailModal = async (orgId: string) => {
    setIsDetailLoading(true);
    try {
      const res = await apiRequest(`/organizations/${orgId}`);
      if (res && res.data) {
        setSelectedOrg(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Could not fetch detailed organization information.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Download Document via Authorized Presigned URL
  const handleDownloadDocument = async (docId: string) => {
    try {
      const res = await apiRequest(`/documents/${docId}/download-url`);
      const url = res?.data?.downloadUrl || (typeof res?.data === 'string' ? res.data : null);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Download URL could not be generated from API response.');
      }
    } catch (err: any) {
      alert(err?.message || 'Could not generate presigned download URL for document.');
    }
  };

  // Decision Submission Handler
  const handleDecisionSubmit = async () => {
    if (!selectedOrg) return;
    if (
      (decisionModal.decision === 'REJECT' || decisionModal.decision === 'REQUEST_CHANGES') &&
      !decisionModal.reason.trim()
    ) {
      setError('A mandatory reason must be provided for Rejection or Requesting Changes.');
      return;
    }

    setIsSubmittingDecision(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<{ success: boolean; data: any }>(
        `/organizations/${selectedOrg.id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision: decisionModal.decision,
            reason: decisionModal.reason.trim() || undefined,
          }),
        },
      );

      if (res.success) {
        setSuccessMsg(
          `Organization '${selectedOrg.legalName}' application successfully ${
            decisionModal.decision === 'APPROVE'
              ? 'APPROVED'
              : decisionModal.decision === 'REJECT'
              ? 'REJECTED'
              : 'updated to CHANGES_REQUESTED'
          }. Notification email dispatched.`,
        );

        setDecisionModal({ isOpen: false, decision: 'APPROVE', reason: '' });
        setSelectedOrg(null);
        await loadApplications();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record administrative decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleDirectApprove = async (orgId: string, legalName: string) => {
    setIsSubmittingDecision(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(
        `/organizations/${orgId}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({ decision: 'APPROVE' }),
        },
      );
      if (res.success) {
        setSuccessMsg(`Organization '${legalName}' application successfully APPROVED.`);
        setSelectedOrg(null);
        await loadApplications();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve organization.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Delete Organization Application Handler
  const handleDeleteSubmit = async () => {
    if (!deleteModal.orgId) return;

    setIsDeleting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>(
        `/organizations/${deleteModal.orgId}`,
        {
          method: 'DELETE',
        },
      );

      if (res.success) {
        setSuccessMsg(`Registration application for '${deleteModal.orgName}' (${deleteModal.orgNumber}) has been cancelled and deleted.`);
        setDeleteModal({ isOpen: false, orgId: '', orgName: '', orgNumber: '', email: '' });
        if (selectedOrg?.id === deleteModal.orgId) {
          setSelectedOrg(null);
        }
        await loadApplications();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization registration application.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#137333]">Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FCE8E6] text-[#C5221F]">Rejected</span>;
      case 'CHANGES_REQUESTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF7E0] text-[#B06000]">Changes Requested</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8]">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3E8FD] text-[#9333EA]">Under Review</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">

        {/* Page Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#151c2e] text-[#d49b38] shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                Organization Verification & Approvals
              </h1>
              <p className="text-xs text-[#64748B]">
                Review, verify, approve, or return Company/Industry onboarding applications.
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApplications}
              className="text-xs font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-800 flex items-start space-x-3 shadow-xs">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-900 text-sm">
                {error.includes('Access Restricted') ? 'Access Restricted' : 'Action Requirement'}
              </div>
              <p className="mt-0.5 text-red-700 leading-relaxed">{error}</p>
            </div>
            {error.includes('Access Restricted') && (
              <Button
                size="sm"
                onClick={() => router.push('/login')}
                className="bg-red-700 hover:bg-red-800 text-white font-medium text-xs border-0"
              >
                Sign In as Admin
              </Button>
            )}
          </div>
        )}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        {/* Filter Controls & Search */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: 'Pending (Submitted)', value: 'SUBMITTED' },
                { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'All Applications', value: '' },
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

            {/* Type Filter */}
            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="h-4 w-4 text-[#64748B]" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
              >
                <option value="">All Org Types</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Institution">Institution</option>
                <option value="Startup">Startup</option>
                <option value="Government">Government</option>
                <option value="NGO">NGO</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
              placeholder="Search by organization legal name, trade name, or reference number (e.g. ORG-000001)..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Applications List Table */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-5 py-3.5">Ref No. & Legal Name</th>
                  <th className="px-5 py-3.5">Org Type</th>
                  <th className="px-5 py-3.5">Primary Business Vertical</th>
                  <th className="px-5 py-3.5">Primary Contact</th>
                  <th className="px-5 py-3.5">Submission Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#64748B]">
                      Loading applications queue...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#64748B]">
                      No organization onboarding applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const primaryUser = item.organizationUsers?.[0]?.user;
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#0F172A]">{item.legalName}</div>
                          <div className="text-[11px] font-mono text-[#d49b38] mt-0.5">{item.orgNumber}</div>
                          {item.tradeName && <div className="text-[10px] text-[#64748B]">DBA: {item.tradeName}</div>}
                        </td>
                        <td className="px-5 py-4 font-medium text-[#64748B]">{item.type}</td>
                        <td className="px-5 py-4">
                          {item.primaryBv ? (
                            <span className="font-semibold text-[#0F172A]">
                              {item.primaryBv.code} — {item.primaryBv.name}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-[#0F172A]">{primaryUser?.email || 'N/A'}</div>
                        </td>
                        <td className="px-5 py-4 text-[#64748B]">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4">{renderStatusBadge(item.status)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openDetailModal(item.id)}
                              className="text-xs font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Review
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  orgId: item.id,
                                  orgName: item.legalName,
                                  orgNumber: item.orgNumber,
                                  email: primaryUser?.email || 'N/A',
                                })
                              }
                              className="text-xs text-[#EF4444] border-[#EF4444]/30 hover:bg-[#FCE8E6] transition-colors"
                              title="Delete Organization Record & Free Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* APPLICATION DETAIL MODAL */}
        {selectedOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-xs">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-2xl space-y-6">

              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">{selectedOrg.legalName}</h2>
                    {renderStatusBadge(selectedOrg.status)}
                  </div>
                  <p className="text-xs font-mono text-[#d49b38] mt-1 font-semibold">Reference Number: {selectedOrg.orgNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Organization Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Column 1: Entity Info */}
                <div className="space-y-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <h3 className="font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center">
                    <Building2 className="h-4 w-4 text-[#d49b38] mr-1.5" />
                    Entity Profile
                  </h3>
                  <div>
                    <span className="text-[#64748B]">Legal Name:</span>
                    <p className="font-semibold text-[#0F172A]">{selectedOrg.legalName}</p>
                  </div>
                  {selectedOrg.tradeName && (
                    <div>
                      <span className="text-[#64748B]">Trade Name (DBA):</span>
                      <p className="font-semibold text-[#0F172A]">{selectedOrg.tradeName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[#64748B]">Classification Type:</span>
                    <p className="font-semibold text-[#0F172A]">{selectedOrg.type}</p>
                  </div>
                  {selectedOrg.website && (
                    <div>
                      <span className="text-[#64748B]">Website:</span>
                      <p className="font-semibold text-[#d49b38] flex items-center mt-0.5">
                        <Globe className="h-3 w-3 mr-1" />
                        <a href={selectedOrg.website} target="_blank" rel="noreferrer" className="underline">
                          {selectedOrg.website}
                        </a>
                      </p>
                    </div>
                  )}
                  {selectedOrg.address && (
                    <div>
                      <span className="text-[#64748B]">Registered Address:</span>
                      <p className="font-semibold text-[#0F172A]">{selectedOrg.address}</p>
                    </div>
                  )}
                </div>

                {/* Column 2: Contact & Verticals */}
                <div className="space-y-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <h3 className="font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center">
                    <User className="h-4 w-4 text-[#d49b38] mr-1.5" />
                    Primary Contact & Classification
                  </h3>
                  <div>
                    <span className="text-[#64748B]">Contact Email:</span>
                    <p className="font-semibold text-[#0F172A]">
                      {selectedOrg.organizationUsers?.[0]?.user?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Primary Business Vertical:</span>
                    <p className="font-semibold text-[#0F172A]">
                      {selectedOrg.primaryBv ? `${selectedOrg.primaryBv.code} — ${selectedOrg.primaryBv.name}` : 'N/A'}
                    </p>
                  </div>

                  {selectedOrg.organizationBvs && selectedOrg.organizationBvs.length > 1 && (
                    <div>
                      <span className="text-[#64748B]">Additional Business Verticals:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedOrg.organizationBvs
                          .filter((bv) => !bv.isPrimary)
                          .map((bv) => (
                            <span
                              key={bv.businessVertical.code}
                              className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] font-medium"
                            >
                              {bv.businessVertical.code}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ATTACHED REGISTRATION DOCUMENTS */}
              <div className="space-y-3 rounded-lg border border-[#E2E8F0] bg-white p-4">
                <h3 className="font-bold text-xs text-[#0F172A] flex items-center">
                  <FileText className="h-4 w-4 text-[#d49b38] mr-1.5" />
                  Attached Registration Documents
                </h3>
                {selectedOrg.documents && selectedOrg.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrg.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="h-4 w-4 text-[#d49b38] shrink-0" />
                          <span className="font-medium text-[#0F172A] truncate">{doc.storageKey}</span>
                          <span className="text-[10px] text-[#64748B]">({doc.type})</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="text-xs"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download Document
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">No registration documents uploaded during onboarding.</p>
                )}
              </div>

              {/* ADMIN DECISION ACTIONS */}
              <div className="border-t border-[#E2E8F0] pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="text-xs text-[#64748B] max-w-md">
                  Executing an action will update status, persist audit logs, and notify the applicant.
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        orgId: selectedOrg.id,
                        orgName: selectedOrg.legalName,
                        orgNumber: selectedOrg.orgNumber,
                        email: selectedOrg.organizationUsers?.[0]?.user?.email || 'N/A',
                      })
                    }
                    className="text-xs font-semibold border-[#EF4444] text-[#C5221F] hover:bg-[#FCE8E6] whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete Record
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setDecisionModal({ isOpen: true, decision: 'REQUEST_CHANGES', reason: '' })
                    }
                    className="text-xs font-semibold border-[#F59E0B] text-[#B06000] hover:bg-[#FEF7E0] whitespace-nowrap shrink-0"
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Request Changes
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setDecisionModal({ isOpen: true, decision: 'REJECT', reason: '' })
                    }
                    className="text-xs font-semibold border-[#EF4444] text-[#C5221F] hover:bg-[#FCE8E6] whitespace-nowrap shrink-0"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject Application
                  </Button>

                  <Button
                    variant="primary"
                    isLoading={isSubmittingDecision}
                    onClick={() => handleDirectApprove(selectedOrg.id, selectedOrg.legalName)}
                    className="text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Approve Application
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DECISION REASON / CONFIRMATION MODAL */}
        {decisionModal.isOpen && selectedOrg && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
                Confirm Decision: {decisionModal.decision}
              </h3>

              <p className="text-xs text-[#64748B]">
                Organization: <strong className="text-[#0F172A]">{selectedOrg.legalName}</strong> ({selectedOrg.orgNumber})
              </p>

              {decisionModal.decision !== 'APPROVE' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0F172A]">
                    {decisionModal.decision === 'REJECT' ? 'Mandatory Rejection Reason:' : 'Mandatory Feedback / Requested Changes:'}
                  </label>
                  <textarea
                    rows={4}
                    value={decisionModal.reason}
                    onChange={(e) => setDecisionModal({ ...decisionModal, reason: e.target.value })}
                    placeholder={
                      decisionModal.decision === 'REJECT'
                        ? 'State why this application was rejected...'
                        : 'State exact changes required before resubmission...'
                    }
                    className="w-full rounded-lg border border-[#E2E8F0] p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  />
                </div>
              ) : (
                <p className="text-xs text-[#10B981] font-medium bg-[#E6F4EA] p-3 rounded-lg">
                  Approving this request will set the organization status to APPROVED and activate the primary user account.
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModal({ isOpen: false, decision: 'APPROVE', reason: '' })}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingDecision}
                  onClick={handleDecisionSubmit}
                  className={
                    decisionModal.decision === 'REJECT'
                      ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                      : decisionModal.decision === 'REQUEST_CHANGES'
                      ? 'bg-[#F59E0B] hover:bg-[#D97706]'
                      : 'bg-[#10B981] hover:bg-[#059669]'
                  }
                >
                  Confirm {decisionModal.decision}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-[#EF4444] border-b border-[#E2E8F0] pb-3">
                <Trash2 className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Delete Organization Record?
                </h3>
              </div>

              <div className="text-xs text-[#64748B] space-y-2">
                <p>
                  You are about to permanently delete organization <strong className="text-[#0F172A]">{deleteModal.orgName}</strong> ({deleteModal.orgNumber}).
                </p>
                <p className="bg-[#FCE8E6] text-[#C5221F] p-3 rounded-lg font-medium">
                  ⚠️ This action will permanently purge the organization profile, document links, and primary user account ({deleteModal.email}). The email address will become available for re-registration immediately.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModal({ isOpen: false, orgId: '', orgName: '', orgNumber: '', email: '' })}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isDeleting}
                  onClick={handleDeleteSubmit}
                  className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
