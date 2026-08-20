'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  PauseCircle,
  RefreshCw,
} from 'lucide-react';

interface AttendanceBreak {
  id: string;
  startTime: string;
  endTime?: string | null;
  durationMins: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  clockInAt: string;
  clockOutAt?: string | null;
  totalWorkedMinutes: number;
  totalBreakMinutes: number;
  status: 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';
  breaks: AttendanceBreak[];
}

interface AttendanceWidgetProps {
  onStatusChange?: () => void;
  className?: string;
}

export function AttendanceWidget({ onStatusChange, className = '' }: AttendanceWidgetProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [workedTimer, setWorkedTimer] = useState<string>('00:00:00');
  const [breakTimer, setBreakTimer] = useState<string>('00:00:00');

  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: AttendanceRecord | null }>(
        '/attendance/today',
      );
      if (res && res.data) {
        setAttendance(res.data);
      } else {
        setAttendance(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch today attendance:', err);
      setErrorMsg(err.message || 'Failed to load attendance status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  // Live timer tick logic (Local visual timer based on backend timestamps)
  useEffect(() => {
    if (!attendance) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();

      if (attendance.status === 'CLOCKED_IN') {
        const clockInTime = new Date(attendance.clockInAt).getTime();
        const breakMs = (attendance.totalBreakMinutes || 0) * 60 * 1000;
        const diffMs = Math.max(0, now - clockInTime - breakMs);

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        setWorkedTimer(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        );
      } else if (attendance.status === 'ON_BREAK') {
        const activeBreak = attendance.breaks.find((b) => !b.endTime);
        if (activeBreak) {
          const breakStartTime = new Date(activeBreak.startTime).getTime();
          const diffMs = Math.max(0, now - breakStartTime);

          const hours = Math.floor(diffMs / 3600000);
          const minutes = Math.floor((diffMs % 3600000) / 60000);
          const seconds = Math.floor((diffMs % 60000) / 1000);

          setBreakTimer(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
          );
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attendance]);

  const handleAction = async (endpoint: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await apiRequest(endpoint, { method: 'POST' });
      await fetchTodayAttendance();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeStr = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMinutes = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m}m`;
    return `${hrs}h ${m}m`;
  };

  return (
    <Card className={`border border-[#E2E8F0] shadow-sm bg-white overflow-hidden ${className}`}>
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Today&apos;s Attendance</h3>
              <p className="text-[11px] text-[#64748B]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {loading ? (
            <div className="h-6 w-24 rounded-full bg-[#E2E8F0] animate-pulse" />
          ) : !attendance ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
              Not Started
            </span>
          ) : attendance.status === 'CLOCKED_IN' ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Working
            </span>
          ) : attendance.status === 'ON_BREAK' ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <Coffee className="h-3 w-3 text-amber-600" />
              On Break
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
              Completed
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Timer & Metrics Display */}
        {loading ? (
          <div className="h-20 w-full rounded-xl bg-[#F8FAFC] animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-center">
            {/* Clock In Time */}
            <div className="p-2 space-y-0.5">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Clock In</span>
              <p className="text-sm font-extrabold text-[#0F172A]">
                {attendance ? formatTimeStr(attendance.clockInAt) : '--:--'}
              </p>
            </div>

            {/* Worked Duration / Timer */}
            <div className="p-2 space-y-0.5 border-l border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Worked Time</span>
              <p className="text-sm font-extrabold text-[#d49b38]">
                {!attendance
                  ? '00:00:00'
                  : attendance.status === 'CLOCKED_IN'
                  ? workedTimer
                  : formatMinutes(attendance.totalWorkedMinutes)}
              </p>
            </div>

            {/* Break Time */}
            <div className="p-2 space-y-0.5 border-l sm:border-l border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Break Duration</span>
              <p className="text-sm font-extrabold text-[#64748B]">
                {!attendance
                  ? '0m'
                  : attendance.status === 'ON_BREAK'
                  ? breakTimer
                  : formatMinutes(attendance.totalBreakMinutes)}
              </p>
            </div>

            {/* Clock Out Time */}
            <div className="p-2 space-y-0.5 border-l border-[#E2E8F0]">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Clock Out</span>
              <p className="text-sm font-extrabold text-[#0F172A]">
                {attendance?.clockOutAt ? formatTimeStr(attendance.clockOutAt) : '--:--'}
              </p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTodayAttendance}
            disabled={loading || submitting}
            className="border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {!attendance ? (
            <Button
              onClick={() => handleAction('/attendance/clock-in')}
              disabled={submitting || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs text-xs px-4"
            >
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Clock In
            </Button>
          ) : attendance.status === 'CLOCKED_IN' ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction('/attendance/break-start')}
                disabled={submitting}
                className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-semibold text-xs"
              >
                <Coffee className="h-3.5 w-3.5 mr-1.5 text-amber-700" />
                Start Break
              </Button>
              <Button
                onClick={() => handleAction('/attendance/clock-out')}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs text-xs px-4"
              >
                <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Clock Out
              </Button>
            </>
          ) : attendance.status === 'ON_BREAK' ? (
            <Button
              onClick={() => handleAction('/attendance/break-end')}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs text-xs px-4"
            >
              <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
              End Break
            </Button>
          ) : (
            <div className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
              Worked {formatMinutes(attendance.totalWorkedMinutes)} today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
