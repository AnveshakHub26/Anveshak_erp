'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Info,
  X,
  FileText,
  BadgeAlert,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';

interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isPaid: boolean;
  annualAllocation: number;
}

interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  isApplicationBased?: boolean;
  isMonthly?: boolean;
  monthlyLimit?: number;
  usedThisMonth?: number;
  displayBalance?: string;
  leaveType: LeaveType;
}

interface LeaveRequest {
  id: string;
  referenceCode: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentKey?: string | null;
  documentName?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  leaveType: LeaveType;
  reviewedBy?: { id: string; email: string } | null;
}

export function MyLeaveTab() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [documentKey, setDocumentKey] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const fetchLeaveData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [balRes, typesRes, reqRes] = await Promise.allSettled([
        apiRequest<{ success: boolean; data: LeaveBalance[] }>('/leave/balances/me'),
        apiRequest<{ success: boolean; data: LeaveType[] }>('/leave/types'),
        apiRequest<{ success: boolean; data: { items: LeaveRequest[] } }>('/leave/requests/me'),
      ]);

      if (balRes.status === 'fulfilled' && balRes.value?.data) {
        setBalances(balRes.value.data);
      }
      if (typesRes.status === 'fulfilled' && typesRes.value?.data) {
        setLeaveTypes(typesRes.value.data);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value?.data) {
        setRequests(reqRes.value.data.items || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  // Duration calculation for Apply Leave Modal
  const calculatedDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const selectedType = React.useMemo(() => {
    return leaveTypes.find((t) => t.id === selectedTypeId);
  }, [leaveTypes, selectedTypeId]);

  const selectedBalance = React.useMemo(() => {
    return balances.find((b) => b.leaveTypeId === selectedTypeId);
  }, [balances, selectedTypeId]);

  const isOverBalance = React.useMemo(() => {
    if (!selectedType || !selectedBalance) return false;
    const code = selectedType.code.toUpperCase();
    if (code === 'STUDY' || code === 'UNPAID') return false;
    if (code === 'MENSTRUAL') {
      return calculatedDays > 1 || (selectedBalance.usedThisMonth || 0) >= 1;
    }
    return calculatedDays > selectedBalance.availableDays;
  }, [selectedType, selectedBalance, calculatedDays]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    if (!selectedTypeId) {
      setApplyError('Please select a leave type.');
      return;
    }
    if (!startDate || !endDate) {
      setApplyError('Please select start and end dates.');
      return;
    }
    if (calculatedDays <= 0) {
      setApplyError('End date cannot be earlier than start date.');
      return;
    }
    if (!reason.trim()) {
      setApplyError('Please provide a reason for your leave request.');
      return;
    }

    const code = selectedType?.code.toUpperCase();
    if (code === 'STUDY' && !documentKey.trim()) {
      setApplyError('Supporting proof document (exam timetable, hall ticket, training registration) is required for Study / Training Leave.');
      return;
    }
    if (code === 'MATERNITY' && !documentKey.trim()) {
      setApplyError('Supporting medical / hospital documentation is mandatory for Maternity Leave.');
      return;
    }
    if (code === 'MENSTRUAL' && calculatedDays > 1) {
      setApplyError('Menstrual Leave cannot exceed 1 day per calendar month.');
      return;
    }

    setApplySubmitting(true);
    try {
      await apiRequest('/leave/requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: selectedTypeId,
          startDate,
          endDate,
          reason: reason.trim(),
          documentKey: documentKey.trim() || undefined,
          documentName: documentName.trim() || undefined,
        }),
      });

      setIsApplyModalOpen(false);
      setSelectedTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setDocumentKey('');
      setDocumentName('');
      await fetchLeaveData();
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit leave request.');
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await apiRequest(`/leave/requests/${id}/cancel`, { method: 'PATCH' });
      await fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel request.');
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Apply Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">My Leave Workspace</h2>
          <p className="text-xs text-[#64748B]">
            Track leave balances, apply for leave, and view request status
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaveData}
            disabled={loading}
            className="border-[#E2E8F0] text-xs text-[#64748B]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setApplyError(null);
              setIsApplyModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold text-xs shadow-sm hover:opacity-95"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Apply for Leave
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-4 text-xs text-red-700 border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
          Leave Balances ({new Date().getFullYear()})
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div className="p-6 bg-white border border-[#E2E8F0] rounded-xl text-center text-xs text-[#64748B]">
            No leave balances assigned for this year.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <Card
                key={b.id}
                className="border border-[#E2E8F0] bg-white shadow-xs hover:border-[#d49b38] transition-colors"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F172A]">
                      {b.leaveType.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.leaveType.isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  {b.isApplicationBased ? (
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px] font-bold">
                        Application-Based
                      </span>
                      <p className="text-[10px] text-[#64748B] mt-1.5 leading-tight">
                        Subject to HR approval &amp; valid supporting proof.
                      </p>
                    </div>
                  ) : b.isMonthly ? (
                    <div>
                      <div className="flex items-baseline pt-1">
                        <span className="text-2xl font-extrabold text-[#d49b38]">
                          {b.availableDays}
                        </span>
                        <span className="text-xs text-[#64748B] ml-1">day available this month</span>
                      </div>
                      <p className="text-[10px] text-[#64748B] border-t border-[#E2E8F0] pt-1.5 mt-2">
                        {b.usedThisMonth || 0}/1 used in current month (non-cumulative)
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-2xl font-extrabold text-[#d49b38]">
                            {b.availableDays}
                          </span>
                          <span className="text-xs text-[#64748B] ml-1">days available</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] text-[#64748B] border-t border-[#E2E8F0] pt-2 mt-2">
                        <div>
                          Allocated: <strong className="text-[#0F172A]">{b.allocatedDays}</strong>
                        </div>
                        <div>
                          Used: <strong className="text-[#0F172A]">{b.usedDays}</strong>
                        </div>
                        <div>
                          Pending: <strong className="text-[#0F172A]">{b.pendingDays}</strong>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Leave Requests Table */}
      <Card className="border border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-6">
          <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#d49b38]" />
            My Leave Applications
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-[#64748B]">
              <Calendar className="h-10 w-10 mx-auto text-[#d49b38] mb-3 opacity-60" />
              <p className="font-semibold text-[#0F172A]">No Leave Applications Found</p>
              <p className="text-xs text-[#64748B] mt-1">
                You haven&apos;t submitted any leave requests yet.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Ref Code</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Proof Attached</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                          {req.referenceCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#0F172A]">
                            {req.leaveType.name}
                          </span>
                          <span className="ml-1.5 text-[10px] text-[#64748B]">
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
                          {req.documentKey ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              <Paperclip className="h-3 w-3" />
                              <span>{req.documentName || 'Proof Document'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">None</span>
                          )}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(req)}
                            className="text-[11px] h-7 px-2.5 border-[#E2E8F0]"
                          >
                            Details
                          </Button>
                          {req.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelRequest(req.id)}
                              className="text-[11px] h-7 px-2.5 border-red-200 text-red-700 hover:bg-red-50"
                            >
                              Cancel
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
                {requests.map((req) => (
                  <div key={req.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0F172A]">
                        {req.referenceCode}
                      </span>
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
                      <strong>{req.leaveType.name}</strong> ({req.totalDays} day
                      {req.totalDays > 1 ? 's' : ''})
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {formatDate(req.startDate)} to {formatDate(req.endDate)}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(req)}
                        className="text-[11px] h-7 px-2.5 border-[#E2E8F0]"
                      >
                        Details
                      </Button>
                      {req.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(req.id)}
                          className="text-[11px] h-7 px-2.5 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Cancel
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

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#151c2e] text-white">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#d49b38]" />
                <h3 className="text-base font-bold">Apply for Leave</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
              {applyError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {/* Leave Type Select */}
              <div className="space-y-1">
                <label className="font-semibold text-[#0F172A]">Leave Type *</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => {
                    setSelectedTypeId(e.target.value);
                    setDocumentKey('');
                    setDocumentName('');
                  }}
                  required
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">-- Select Leave Category --</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.isPaid ? 'Paid' : 'Unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Policy Banner & Balance Summary Hint */}
              {selectedType && (
                <div className="p-3 rounded-lg bg-slate-50 border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] font-semibold">Policy Entitlement Status:</span>
                    <span className="font-bold text-xs text-[#d49b38]">
                      {selectedBalance?.displayBalance || `${selectedBalance?.availableDays ?? 0} Days Available`}
                    </span>
                  </div>
                  {selectedType.code.toUpperCase() === 'STUDY' && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                      ⚠️ Supporting proof document (exam timetable / hall ticket / training registration) is mandatory for Study / Training Leave.
                    </p>
                  )}
                  {selectedType.code.toUpperCase() === 'MATERNITY' && (
                    <p className="text-[11px] text-indigo-800 bg-indigo-50 p-2 rounded border border-indigo-200 mt-1">
                      ℹ️ Supporting medical / hospital documentation is mandatory for Maternity Leave.
                    </p>
                  )}
                  {selectedType.code.toUpperCase() === 'MENSTRUAL' && (
                    <p className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded border border-purple-200 mt-1">
                      🌸 Maximum 1 day per calendar month allowed. Non-cumulative (unused entitlement expires at month end).
                    </p>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#0F172A]">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#0F172A]">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated Duration Display */}
              {calculatedDays > 0 && (
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                  <span className="text-amber-900 font-medium">Requested Duration:</span>
                  <span className="font-extrabold text-amber-900 text-sm">
                    {calculatedDays} day{calculatedDays > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Overbalance Warning */}
              {isOverBalance && (
                <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-start gap-2">
                  <BadgeAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    Requested leave violates corporate policy balance or monthly limit caps.
                  </span>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-semibold text-[#0F172A]">Reason for Leave *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Provide detailed explanation for your leave request..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                />
              </div>

              {/* Supporting Document Proof Key / Name */}
              <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                <label className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-[#d49b38]" />
                  <span>Supporting Proof Document / Reference</span>
                  {(selectedType?.code.toUpperCase() === 'STUDY' || selectedType?.code.toUpperCase() === 'MATERNITY') && (
                    <span className="text-red-500 font-bold">* (Mandatory)</span>
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Document Title (e.g. Exam_Hall_Ticket.pdf)"
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={documentKey}
                    onChange={(e) => setDocumentKey(e.target.value)}
                    placeholder="Storage Key / File Reference"
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-mono text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Attach document storage reference for HR validation.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsApplyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={applySubmitting || isOverBalance}
                  className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold"
                >
                  {applySubmitting ? 'Submitting...' : 'Submit Leave Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#151c2e] text-white">
              <div>
                <span className="font-mono text-xs font-bold text-[#d49b38]">
                  {selectedRequest.referenceCode}
                </span>
                <h3 className="text-base font-bold">Leave Request Record</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B]">Leave Category:</span>
                  <p className="font-bold text-[#0F172A]">{selectedRequest.leaveType.name}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Classification:</span>
                  <p className="font-bold text-[#0F172A]">
                    {selectedRequest.leaveType.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B]">Start Date:</span>
                  <p className="font-bold text-[#0F172A]">
                    {formatDate(selectedRequest.startDate)}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B]">End Date:</span>
                  <p className="font-bold text-[#0F172A]">{formatDate(selectedRequest.endDate)}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Total Days:</span>
                  <p className="font-bold text-[#d49b38]">{selectedRequest.totalDays} day(s)</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Status:</span>
                  <p className="font-bold uppercase text-[#0F172A]">
                    {selectedRequest.status}
                  </p>
                </div>
              </div>

              {selectedRequest.documentKey && (
                <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 space-y-1">
                  <span className="text-indigo-900 font-bold block">Attached Supporting Document:</span>
                  <div className="flex items-center gap-2 text-indigo-950 font-semibold">
                    <Paperclip className="h-4 w-4 text-indigo-600" />
                    <span>{selectedRequest.documentName || 'Proof Document'}</span>
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-[#0F172A]">Reason Submitted:</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-[#E2E8F0] mt-1 text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <span className="font-bold block">Rejection Reason:</span>
                  <p className="mt-0.5">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                  Reviewed by {selectedRequest.reviewedBy.email} on{' '}
                  {selectedRequest.reviewedAt
                    ? new Date(selectedRequest.reviewedAt).toLocaleString()
                    : 'N/A'}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
