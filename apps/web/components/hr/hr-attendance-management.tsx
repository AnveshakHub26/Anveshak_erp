'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Calendar,
  UserCheck,
  X,
  Users,
  Briefcase,
} from 'lucide-react';

interface AttendanceBreak {
  id: string;
  startTime: string;
  endTime?: string | null;
  durationMins: number;
}

interface HRAttendanceItem {
  id: string;
  employeeId: string;
  attendanceDate: string;
  clockInAt: string;
  clockOutAt?: string | null;
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  status: 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';
  breaks: AttendanceBreak[];
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: string;
    designation: string;
  };
}

interface AttendanceSummary {
  totalActiveEmployees: number;
  presentCount: number;
  workingCount: number;
  onBreakCount: number;
  completedCount: number;
  onLeaveCount: number;
}

export function HRAttendanceManagement() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [items, setItems] = useState<HRAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState<HRAttendanceItem | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: AttendanceSummary }>(
        '/attendance/admin/summary',
      );
      if (res && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      // Summary metric fetch error handled gracefully
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const q = new URLSearchParams();
      q.set('page', page.toString());
      q.set('limit', '20');
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      if (departmentFilter.trim()) q.set('department', departmentFilter.trim());
      if (statusFilter) q.set('status', statusFilter);

      const res = await apiRequest<{
        success: boolean;
        data: {
          items: HRAttendanceItem[];
          total: number;
          totalPages: number;
        };
      }>(`/attendance/admin/history?${q.toString()}`);

      if (res && res.data) {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, departmentFilter, statusFilter]);

  const loadData = useCallback(() => {
    fetchSummary();
    fetchRecords();
  }, [fetchSummary, fetchRecords]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMinutes = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m}m`;
    return `${hrs}h ${m}m`;
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      item.employee.fullName.toLowerCase().includes(q) ||
      item.employee.employeeCode.toLowerCase().includes(q) ||
      item.employee.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              Present Today
            </span>
            <p className="text-xl font-extrabold text-[#0F172A]">
              {summary ? summary.presentCount : '--'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              Working
            </span>
            <p className="text-xl font-extrabold text-emerald-600">
              {summary ? summary.workingCount : '--'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Coffee className="h-3.5 w-3.5 text-amber-600" />
              On Break
            </span>
            <p className="text-xl font-extrabold text-amber-600">
              {summary ? summary.onBreakCount : '--'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              Completed
            </span>
            <p className="text-xl font-extrabold text-blue-600">
              {summary ? summary.completedCount : '--'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E2E8F0] bg-white shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-4 space-y-1">
            <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              On Leave
            </span>
            <p className="text-xl font-extrabold text-purple-600">
              {summary ? summary.onLeaveCount : '--'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Records Card */}
      <Card className="border border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-[#d49b38]" />
              <div>
                <CardTitle className="text-base font-bold text-[#0F172A]">
                  Organization Attendance Audit
                </CardTitle>
                <p className="text-xs text-[#64748B]">
                  Real-time workforce clock logs, break durations, and worked hours
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-40">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                />
              </div>

              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                placeholder="From Date"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                placeholder="To Date"
              />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="CLOCKED_IN">Working</option>
                <option value="ON_BREAK">On Break</option>
                <option value="CLOCKED_OUT">Completed</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
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
            <div className="p-4 bg-red-50 text-red-700 text-xs flex items-center justify-between border-b border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <Button variant="outline" size="sm" onClick={loadData} className="border-red-200 text-xs">
                Retry
              </Button>
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
              <Clock className="h-10 w-10 mx-auto text-[#d49b38] mb-3 opacity-60" />
              <p className="font-semibold text-[#0F172A]">No Attendance Records Found</p>
              <p className="text-xs text-[#64748B] mt-1">
                No employee clock logs match your selected date or department filters.
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
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Clock In</th>
                      <th className="py-3 px-4">Clock Out</th>
                      <th className="py-3 px-4">Break</th>
                      <th className="py-3 px-4">Worked Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A]">
                            {item.employee.fullName}
                          </div>
                          <div className="text-[11px] text-[#64748B] font-mono">
                            {item.employee.employeeCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#334155]">
                          {item.employee.department}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                          {formatDate(item.attendanceDate)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#334155]">
                          {formatTime(item.clockInAt)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#334155]">
                          {formatTime(item.clockOutAt)}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {item.totalBreakMinutes > 0 ? `${item.totalBreakMinutes}m` : '0m'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          {formatMinutes(item.totalWorkedMinutes)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              item.status === 'CLOCKED_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'ON_BREAK'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                            className="text-[11px] h-7 px-2.5 border-[#E2E8F0]"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y divide-[#E2E8F0]">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-[#0F172A]">
                          {item.employee.fullName}
                        </strong>
                        <span className="text-[10px] text-[#64748B] block font-mono">
                          {item.employee.employeeCode} • {item.employee.department}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.status === 'CLOCKED_IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'ON_BREAK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] pt-1">
                      <div>
                        <span>Date: </span>
                        <strong className="text-[#0F172A]">{formatDate(item.attendanceDate)}</strong>
                      </div>
                      <div>
                        <span>In: </span>
                        <strong className="text-[#0F172A]">{formatTime(item.clockInAt)}</strong>
                      </div>
                      <div>
                        <span>Out: </span>
                        <strong className="text-[#0F172A]">{formatTime(item.clockOutAt)}</strong>
                      </div>
                      <div>
                        <span>Worked: </span>
                        <strong className="text-[#d49b38]">
                          {formatMinutes(item.totalWorkedMinutes)}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        className="text-[11px] h-7 px-2.5 border-[#E2E8F0]"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#151c2e] text-white">
              <div>
                <span className="font-mono text-xs font-bold text-[#d49b38]">
                  {selectedItem.employee.employeeCode}
                </span>
                <h3 className="text-base font-bold">Attendance Session Details</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B]">Employee:</span>
                  <p className="font-bold text-[#0F172A]">{selectedItem.employee.fullName}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Department:</span>
                  <p className="font-bold text-[#0F172A]">{selectedItem.employee.department}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Date:</span>
                  <p className="font-bold text-[#0F172A]">{formatDate(selectedItem.attendanceDate)}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Status:</span>
                  <p className="font-bold uppercase text-[#0F172A]">
                    {selectedItem.status.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748B]">Clock In:</span>
                  <p className="font-bold text-[#0F172A]">{formatTime(selectedItem.clockInAt)}</p>
                </div>
                <div>
                  <span className="text-[#64748B]">Clock Out:</span>
                  <p className="font-bold text-[#0F172A]">{formatTime(selectedItem.clockOutAt)}</p>
                </div>
              </div>

              {/* Break Sessions Timeline */}
              <div className="space-y-2">
                <span className="font-bold text-[#0F172A] block">Break Sessions Timeline</span>
                {selectedItem.breaks.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-500 border border-[#E2E8F0] text-center">
                    No break sessions taken during this shift.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedItem.breaks.map((b, idx) => (
                      <div
                        key={b.id}
                        className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-between"
                      >
                        <span className="font-semibold text-amber-900">Break {idx + 1}:</span>
                        <span className="font-mono text-[#0F172A]">
                          {formatTime(b.startTime)} &rarr; {formatTime(b.endTime)} (
                          {b.durationMins}m)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                <div className="p-3 bg-slate-50 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Total Break Duration</span>
                  <strong className="text-sm font-extrabold text-[#0F172A]">
                    {formatMinutes(selectedItem.totalBreakMinutes)}
                  </strong>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                  <span className="text-amber-900 block text-[11px]">Total Worked Duration</span>
                  <strong className="text-sm font-extrabold text-[#d49b38]">
                    {formatMinutes(selectedItem.totalWorkedMinutes)}
                  </strong>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
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
