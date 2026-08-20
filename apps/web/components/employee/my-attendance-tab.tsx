'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { AttendanceWidget } from './attendance-widget';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Coffee, Filter, RefreshCw, AlertCircle } from 'lucide-react';

interface AttendanceBreak {
  id: string;
  startTime: string;
  endTime?: string | null;
  durationMins: number;
}

interface AttendanceItem {
  id: string;
  attendanceDate: string;
  clockInAt: string;
  clockOutAt?: string | null;
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  status: 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';
  breaks: AttendanceBreak[];
}

export function MyAttendanceTab() {
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const q = new URLSearchParams();
      q.set('page', page.toString());
      q.set('limit', '15');
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);

      const res = await apiRequest<{
        success: boolean;
        data: {
          items: AttendanceItem[];
          total: number;
          totalPages: number;
        };
      }>(`/attendance/my-history?${q.toString()}`);

      if (res && res.data) {
        setItems(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load attendance history.');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

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

  return (
    <div className="space-y-6">
      {/* Realtime Attendance Control Card */}
      <AttendanceWidget onStatusChange={fetchHistory} />

      {/* History & Filtering Card */}
      <Card className="border border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[#d49b38]" />
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Attendance History
              </CardTitle>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
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
              <span className="text-xs text-[#94a3b8]">to</span>
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

              {(startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFilterReset}
                  className="border-[#E2E8F0] text-xs text-[#64748B]"
                >
                  Clear Filters
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchHistory}
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
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-[#64748B]">
              <Clock className="h-10 w-10 mx-auto text-[#d49b38] mb-3 opacity-60" />
              <p className="font-semibold text-[#0F172A]">No Attendance Records Found</p>
              <p className="text-xs text-[#64748B] mt-1">
                {startDate || endDate
                  ? 'No attendance sessions match your date filter.'
                  : 'Clock in above to start logging your daily work attendance.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Clock In</th>
                      <th className="py-3 px-4">Clock Out</th>
                      <th className="py-3 px-4">Break Mins</th>
                      <th className="py-3 px-4">Worked Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {items.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                          {formatDate(row.attendanceDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              row.status === 'CLOCKED_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.status === 'ON_BREAK'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#334155]">
                          {formatTime(row.clockInAt)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#334155]">
                          {formatTime(row.clockOutAt)}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B]">
                          {row.totalBreakMinutes > 0 ? `${row.totalBreakMinutes}m` : '0m'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          {formatMinutes(row.totalWorkedMinutes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y divide-[#E2E8F0]">
                {items.map((row) => (
                  <div key={row.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0F172A]">
                        {formatDate(row.attendanceDate)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          row.status === 'CLOCKED_IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.status === 'ON_BREAK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {row.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] pt-1">
                      <div>
                        <span>In: </span>
                        <strong className="text-[#0F172A]">{formatTime(row.clockInAt)}</strong>
                      </div>
                      <div>
                        <span>Out: </span>
                        <strong className="text-[#0F172A]">{formatTime(row.clockOutAt)}</strong>
                      </div>
                      <div>
                        <span>Breaks: </span>
                        <strong>{row.totalBreakMinutes}m</strong>
                      </div>
                      <div>
                        <span>Worked: </span>
                        <strong className="text-[#d49b38]">
                          {formatMinutes(row.totalWorkedMinutes)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#E2E8F0] p-4 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-[#64748B]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
