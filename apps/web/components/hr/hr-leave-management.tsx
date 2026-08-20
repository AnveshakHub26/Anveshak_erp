'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';

interface LeaveType {
  id: string;
  code: string;
  name: string;
  isPaid: boolean;
}

interface HRLeaveRequestItem {
  id: string;
  referenceCode: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  leaveType: LeaveType;
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: string;
    designation: string;
  };
  reviewedBy?: { id: string; email: string } | null;
}

export function HRLeaveManagement() {
  const [items, setItems] = useState<HRLeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [activeRequest, setActiveRequest] = useState<HRLeaveRequestItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchHRRequests = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const q = new URLSearchParams();
      q.set('page', page.toString());
      q.set('limit', '20');
      if (statusFilter) q.set('status', statusFilter);
      if (departmentFilter.trim()) q.set('department', departmentFilter.trim());

      const res = await apiRequest<{
        success: boolean;
        data: {
          items: HRLeaveRequestItem[];
          total: number;
          totalPages: number;
        };
      }>(`/hr/leave/requests?${q.toString()}`);

      if (res && res.data) {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load HR leave requests.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchHRRequests();
  }, [fetchHRRequests]);

  const handleApprove = async () => {
    if (!activeRequest) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      await apiRequest(`/hr/leave/requests/${activeRequest.id}/approve`, {
        method: 'POST',
      });
      setActiveRequest(null);
      setActionType(null);
      await fetchHRRequests();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve leave request.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }

    setActionSubmitting(true);
    setActionError(null);
    try {
      await apiRequest(`/hr/leave/requests/${activeRequest.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      setActiveRequest(null);
      setActionType(null);
      setRejectionReason('');
      await fetchHRRequests();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject leave request.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      item.employee.fullName.toLowerCase().includes(q) ||
      item.employee.employeeCode.toLowerCase().includes(q) ||
      item.referenceCode.toLowerCase().includes(q) ||
      item.leaveType.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Card className="border border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-[#d49b38]" />
              <div>
                <CardTitle className="text-base font-bold text-[#0F172A]">
                  HR Leave Approvals &amp; Management
                </CardTitle>
                <p className="text-xs text-[#64748B]">
                  Review, approve, or reject employee leave applications
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none font-semibold"
              >
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="">All Statuses</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchHRRequests}
                disabled={loading}
                className="border-[#E2E8F0] text-xs text-[#0F172A]"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-700 text-xs flex items-center gap-2 border-b border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-[#64748B]">
              <Calendar className="h-10 w-10 mx-auto text-[#d49b38] mb-3 opacity-60" />
              <p className="font-semibold text-[#0F172A]">No Leave Applications Found</p>
              <p className="text-xs text-[#64748B] mt-1">
                {statusFilter === 'PENDING'
                  ? 'There are no pending leave requests awaiting HR review.'
                  : 'No leave requests match the selected status or filters.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Ref Code</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredItems.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A]">
                            {req.employee.fullName}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {req.employee.employeeCode} • {req.employee.department}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                          {req.referenceCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#0F172A]">
                            {req.leaveType.name}
                          </span>
                          <span className="ml-1 text-[10px] text-[#64748B]">
                            ({req.leaveType.isPaid ? 'Paid' : 'Unpaid'})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#334155]">
                          {formatDate(req.startDate)} to {formatDate(req.endDate)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          {req.totalDays} day{req.totalDays > 1 ? 's' : ''}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              req.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {req.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setActiveRequest(req);
                                  setActionType('APPROVE');
                                  setActionError(null);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-3 font-bold"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveRequest(req);
                                  setActionType('REJECT');
                                  setRejectionReason('');
                                  setActionError(null);
                                }}
                                className="border-red-200 text-red-700 hover:bg-red-50 text-[11px] h-7 px-3"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveRequest(req);
                                setActionType(null);
                              }}
                              className="text-[11px] h-7 px-2.5 border-[#E2E8F0]"
                            >
                              Details
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y divide-[#E2E8F0]">
                {filteredItems.map((req) => (
                  <div key={req.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-[#0F172A]">
                          {req.employee.fullName}
                        </strong>
                        <span className="text-[10px] text-[#64748B] block font-mono">
                          {req.employee.employeeCode}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#334155]">
                      <strong>{req.leaveType.name}</strong> ({req.totalDays} days)
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                      {req.status === 'PENDING' ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveRequest(req);
                              setActionType('APPROVE');
                              setActionError(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-3 font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveRequest(req);
                              setActionType('REJECT');
                              setRejectionReason('');
                              setActionError(null);
                            }}
                            className="border-red-200 text-red-700 hover:bg-red-50 text-[11px] h-7 px-3"
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveRequest(req);
                            setActionType(null);
                          }}
                          className="text-[11px] h-7 px-2.5 border-[#E2E8F0]"
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* HR Action Modal (Approve / Reject / Details) */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#151c2e] text-white">
              <div>
                <span className="font-mono text-xs font-bold text-[#d49b38]">
                  {activeRequest.referenceCode}
                </span>
                <h3 className="text-base font-bold">
                  {actionType === 'APPROVE'
                    ? 'Approve Leave Application'
                    : actionType === 'REJECT'
                    ? 'Reject Leave Application'
                    : 'Leave Request Details'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveRequest(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <div>
                    <span className="font-bold text-[#0F172A] text-sm">
                      {activeRequest.employee.fullName}
                    </span>
                    <span className="text-[11px] text-[#64748B] block font-mono">
                      {activeRequest.employee.employeeCode} • {activeRequest.employee.department}
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-[#d49b38]">
                    {activeRequest.totalDays} day(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-[#64748B]">Leave Type:</span>
                    <p className="font-semibold text-[#0F172A]">
                      {activeRequest.leaveType.name} (
                      {activeRequest.leaveType.isPaid ? 'Paid' : 'Unpaid'})
                    </p>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Dates:</span>
                    <p className="font-semibold text-[#0F172A]">
                      {formatDate(activeRequest.startDate)} to {formatDate(activeRequest.endDate)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#64748B] font-semibold">Reason:</span>
                  <p className="mt-0.5 text-[#334155] leading-relaxed">{activeRequest.reason}</p>
                </div>
              </div>

              {/* Action specific UI */}
              {actionType === 'APPROVE' ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  Confirming approval will convert this pending request to APPROVED and deduct{' '}
                  <strong>{activeRequest.totalDays} day(s)</strong> from employee&apos;s available
                  leave balance.
                </div>
              ) : actionType === 'REJECT' ? (
                <form onSubmit={handleReject} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#0F172A]">
                      Rejection Reason * (Required)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      required
                      placeholder="Specify clear rationale for rejecting this leave application..."
                      className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveRequest(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={actionSubmitting}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      {actionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                  </div>
                </form>
              ) : null}

              {actionType === 'APPROVE' && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setActiveRequest(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={actionSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {actionSubmitting ? 'Approving...' : 'Confirm Approval'}
                  </Button>
                </div>
              )}

              {actionType === null && (
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setActiveRequest(null)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
