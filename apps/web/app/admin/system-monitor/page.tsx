'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  Building2,
  FolderGit2,
  FileText,
  Clock,
  Calendar,
  AlertCircle,
  Search,
  Key,
  Mail,
  Lock,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
  Server,
  Zap,
  Eye,
  FileSearch,
  Radio,
  PauseCircle,
  PlayCircle,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

interface MetricsData {
  totalEmployees: number;
  activeEmployees: number;
  exitedEmployees: number;
  totalOrganizations: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsOnHold: number;
  totalDocuments: number;
  totalFolders: number;
  pendingLeaveRequests: number;
  totalLeaveRequests?: number;
  attendancePresentToday: number;
  currentlyWorking: number;
  currentlyOnBreak: number;
  completedAttendance: number;
  totalAttendanceRecords?: number;
  totalUsers: number;
  activeUsersCount: number;
  unreadNotifications: number;
  totalNotifications?: number;
  failedEmailsCount: number;
  totalEmailLogs?: number;
  totalAuditLogs?: number;
}

interface ActiveUser {
  id: string;
  userId: string;
  email: string;
  role: string;
  lastActivity: string;
  loginTime: string;
  currentRoute: string;
  ipAddress?: string;
}

interface InfrastructureServiceItem {
  label: string;
  status: 'CONNECTED' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
  url: string | null;
}

interface HealthData {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
  services: {
    api: { status: string; port: number };
    database: { status: string; latencyMs: number };
    prisma: { status: string; version: string };
    supabaseAuth: { status: string; endpoint: string };
    supabaseStorage: { status: string; bucket: string };
    email: { status: string; provider: string; host: string };
  };
  infrastructureLinks: {
    supabaseProject: string | null;
    supabaseDatabase: string | null;
    supabaseStorage: string | null;
    sentry: string | null;
    grafana: string | null;
  };
  infrastructureServices?: {
    supabaseProject: InfrastructureServiceItem;
    supabaseDatabase: InfrastructureServiceItem;
    supabaseStorage: InfrastructureServiceItem;
    sentry: InfrastructureServiceItem;
    grafana: InfrastructureServiceItem;
  };
}

interface FailedEmailLog {
  id: string;
  category: string;
  recipient: string;
  subject: string;
  provider: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string | null;
  messageId?: string | null;
  sentAt?: string | null;
  createdAt: string;
  nextAttemptAt?: string | null;
}

export default function SystemMonitorPage() {
  const router = useRouter();
  const { user, isInitializing } = usePermissions();

  // Security Gate State
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);

  // Security Settings Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [showForgotForm, setShowForgotForm] = useState<boolean>(false);

  // Failed Email Logs Diagnostic Modal State
  const [showFailedEmailsModal, setShowFailedEmailsModal] = useState<boolean>(false);
  const [failedEmails, setFailedEmails] = useState<FailedEmailLog[]>([]);
  const [failedEmailsTotal, setFailedEmailsTotal] = useState<number>(0);
  const [failedEmailsLoading, setFailedEmailsLoading] = useState<boolean>(false);
  const [failedEmailsSearch, setFailedEmailsSearch] = useState<string>('');
  const [selectedEmailDetail, setSelectedEmailDetail] = useState<FailedEmailLog | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'active-users' | 'documents' | 'employees' | 'organizations' | 'projects' | 'health' | 'audit'>('overview');

  // Real-time Live Telemetry Auto-Polling (Default: ON, interval 10s)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Data States (Phase 6M)
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTotal, setDocTotal] = useState<number>(0);
  const [docSearch, setDocSearch] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [empTotal, setEmpTotal] = useState<number>(0);
  const [empSearch, setEmpSearch] = useState<string>('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgTotal, setOrgTotal] = useState<number>(0);
  const [orgSearch, setOrgSearch] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [prjTotal, setPrjTotal] = useState<number>(0);
  const [prjSearch, setPrjSearch] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState<number>(0);
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Global Search State
  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [globalResults, setGlobalResults] = useState<{ employees: any[]; organizations: any[]; projects: any[]; documents: any[] } | null>(null);
  const [globalSearching, setGlobalSearching] = useState<boolean>(false);

  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Check stored session pin verification
  useEffect(() => {
    const token = sessionStorage.getItem('sys_monitor_token');
    const expires = sessionStorage.getItem('sys_monitor_expires');
    if (token && expires && new Date(expires) > new Date()) {
      setIsVerified(true);
    }
  }, []);

  // Record user heartbeat on page load
  useEffect(() => {
    if (user) {
      apiRequest('/system-monitor/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ route: '/admin/system-monitor' }),
      }).catch(() => {});
    }
  }, [user]);

  // Security Gate PIN Verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinLoading(true);

    try {
      const res = await apiRequest<any>('/system-monitor/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin: pinInput }),
      });

      if (res.data?.verified) {
        setIsVerified(true);
        sessionStorage.setItem('sys_monitor_token', res.data.monitorToken);
        sessionStorage.setItem('sys_monitor_expires', res.data.expiresAt);
      } else {
        setPinError('Invalid Security PIN/Password.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Invalid Security PIN/Password.');
    } finally {
      setPinLoading(false);
    }
  };

  // Change Monitor Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);
    setSettingsLoading(true);

    try {
      const res = await apiRequest<any>('/system-monitor/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPin, newPin }),
      });
      setSettingsMessage({ type: 'success', text: res.data?.message || 'Password changed successfully!' });
      setOldPin('');
      setNewPin('');
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);
    setSettingsLoading(true);

    try {
      const res = await apiRequest<any>('/system-monitor/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setSettingsMessage({ type: 'success', text: res.data?.message || 'Recovery email dispatched!' });
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.message || 'Failed to send recovery email.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch Data based on active tab
  const loadTabData = useCallback(async (isSilent = false) => {
    if (!isVerified) return;
    if (!isSilent) setLoadingData(true);

    try {
      if (activeTab === 'overview') {
        const [metricsRes, activityRes, alertsRes] = await Promise.all([
          apiRequest<any>('/system-monitor/metrics'),
          apiRequest<any>('/system-monitor/recent-activity?limit=8'),
          apiRequest<any>('/system-monitor/alerts'),
        ]);
        setMetrics(metricsRes.data?.overview || null);
        setRecentActivity(activityRes.data || []);
        setSystemAlerts(alertsRes.data || []);
      } else if (activeTab === 'active-users') {
        const res = await apiRequest<any>('/system-monitor/active-users');
        setActiveUsers(res.data || []);
      } else if (activeTab === 'documents') {
        const res = await apiRequest<any>(`/system-monitor/documents?search=${encodeURIComponent(docSearch)}`);
        setDocuments(res.data?.items || []);
        setDocTotal(res.data?.total || 0);
      } else if (activeTab === 'employees') {
        const res = await apiRequest<any>(`/system-monitor/employees?search=${encodeURIComponent(empSearch)}`);
        setEmployees(res.data?.items || []);
        setEmpTotal(res.data?.total || 0);
      } else if (activeTab === 'organizations') {
        const res = await apiRequest<any>(`/system-monitor/organizations?search=${encodeURIComponent(orgSearch)}`);
        setOrganizations(res.data?.items || []);
        setOrgTotal(res.data?.total || 0);
      } else if (activeTab === 'projects') {
        const res = await apiRequest<any>(`/system-monitor/projects?search=${encodeURIComponent(prjSearch)}`);
        setProjects(res.data?.items || []);
        setPrjTotal(res.data?.total || 0);
      } else if (activeTab === 'health') {
        const res = await apiRequest<any>('/system-monitor/health');
        setHealth(res.data || null);
      } else if (activeTab === 'audit') {
        const res = await apiRequest<any>(`/system-monitor/audit?search=${encodeURIComponent(auditSearch)}`);
        setAuditLogs(res.data?.items || []);
        setAuditTotal(res.data?.total || 0);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading System Monitor data:', err);
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  }, [isVerified, activeTab, docSearch, empSearch, orgSearch, prjSearch, auditSearch]);

  // Initial tab load
  useEffect(() => {
    loadTabData(false);
  }, [loadTabData]);

  // Real-time Live Polling Effect (Every 10 seconds)
  useEffect(() => {
    if (!isVerified || !autoRefresh) return;
    const interval = setInterval(() => {
      loadTabData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isVerified, autoRefresh, loadTabData]);

  // Global Search Handler
  const handleGlobalSearch = async (query: string) => {
    setGlobalQuery(query);
    if (!query || query.trim().length < 2) {
      setGlobalResults(null);
      return;
    }
    setGlobalSearching(true);
    try {
      const res = await apiRequest<any>(`/system-monitor/global-search?q=${encodeURIComponent(query.trim())}`);
      setGlobalResults(res.data || null);
    } catch {
      setGlobalResults(null);
    } finally {
      setGlobalSearching(false);
    }
  };

  // Fetch Failed Email Diagnostics
  const fetchFailedEmailLogs = async (search = '') => {
    setFailedEmailsLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiRequest<{ success: boolean; data: { total: number; logs: FailedEmailLog[] } }>(
        `/system-monitor/failed-emails${query}`
      );
      if (res.data) {
        setFailedEmails(res.data.logs || []);
        setFailedEmailsTotal(res.data.total || 0);
      }
    } catch {
      setFailedEmails([]);
      setFailedEmailsTotal(0);
    } finally {
      setFailedEmailsLoading(false);
    }
  };

  // Clear / Dismiss Failed Email Logs
  const handleClearFailedEmailLogs = async () => {
    try {
      await apiRequest('/system-monitor/clear-failed-emails', { method: 'POST' });
      setShowFailedEmailsModal(false);
      fetchFailedEmailLogs('');
      loadTabData(true);
    } catch {
      // Fallback
    }
  };

  // Auth Guard check
  if (isInitializing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Non-Admin 403 Protection
  const isAdmin = user?.roles?.includes('ADMIN');
  if (!isAdmin) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">403 — Restricted System Access</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          The System Control Center & Telemetry Monitor is restricted strictly to authorized Administrator accounts.
        </p>
        <Link
          href="/employee/dashboard"
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-all"
        >
          Return to Employee Workspace
        </Link>
      </div>
    );
  }

  // Security Gate Verification Card (If not unlocked)
  if (!isVerified) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#151c2e] text-[#d49b38] shadow-md">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Admin Control Center Gate</h2>
            <p className="mt-1 text-xs text-slate-500">
              Secondary security verification required to view enterprise system metrics.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Security PIN / Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter monitor password..."
                  required
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {pinError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pinLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#151c2e] py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#1e293b] disabled:opacity-50 transition-all"
            >
              {pinLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4 text-[#d49b38]" />}
              Authenticate & Unlock Control Center
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              onClick={() => setShowForgotForm(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Forgot Monitor Security Password?
            </button>
          </div>

          {/* Forgot Password Modal */}
          {showForgotForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
                <h3 className="text-base font-bold text-slate-900">Forgot Security Password</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Password reset instructions will be sent to the administrator email address.
                </p>
                <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="anveshakhub26@gmail.com"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                  {settingsMessage && (
                    <div className={`text-xs font-medium ${settingsMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow"
                    >
                      Dispatch Reset Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotForm(false);
                        setSettingsMessage(null);
                      }}
                      className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Verified & Unlocked Admin Control Center UI
  return (
    <div className="space-y-6">
      {/* Page Title & Control Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#151c2e] text-[#d49b38] shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                System Monitor & Admin Control Center
              </h1>
              {/* Realtime Live Pulse Badge */}
              <div
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                  autoRefresh
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                }`}
                title={autoRefresh ? 'Live Polling Active (Every 10s). Click to pause.' : 'Live Polling Paused. Click to activate.'}
              >
                {autoRefresh ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span>Live Telemetry</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-3 w-3 text-amber-600" />
                    <span>Sync Paused</span>
                  </>
                )}
              </div>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Realtime database telemetry, workforce metrics, active user activity, and authoritative ERP routing.
              {lastUpdated && <span className="ml-2 font-mono text-[10px] text-slate-400">Updated: {lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Quick Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              placeholder="Search EMP, PRJ, Org, Docs..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            {globalSearching && <RefreshCw className="absolute right-3 top-2 h-3.5 w-3.5 animate-spin text-indigo-600" />}
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
          >
            <Key className="h-3.5 w-3.5 text-slate-500" />
            Security Settings
          </button>

          <button
            onClick={() => loadTabData(false)}
            disabled={loadingData}
            className="flex items-center gap-1.5 rounded-lg bg-[#151c2e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1e293b] disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#d49b38] ${loadingData ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Global Search Results Popup */}
      {globalResults && (
        <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Search Results for "{globalQuery}"</h3>
            <button onClick={() => setGlobalResults(null)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
              Clear Results
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Employees */}
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Employees ({globalResults.employees?.length || 0})</h4>
              {globalResults.employees?.length === 0 ? (
                <p className="text-xs text-slate-400">No matching employees</p>
              ) : (
                globalResults.employees?.map((emp) => (
                  <Link
                    key={emp.id}
                    href={`/hr/employees/${emp.id}`}
                    className="block rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 hover:bg-indigo-50/50 transition-all my-1"
                  >
                    <div className="font-semibold text-slate-900">{emp.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{emp.employeeCode} • {emp.department || 'N/A'}</div>
                  </Link>
                ))
              )}
            </div>

            {/* Organizations */}
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Organizations ({globalResults.organizations?.length || 0})</h4>
              {globalResults.organizations?.length === 0 ? (
                <p className="text-xs text-slate-400">No matching organizations</p>
              ) : (
                globalResults.organizations?.map((org) => (
                  <Link
                    key={org.id}
                    href="/organizations"
                    className="block rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 hover:bg-indigo-50/50 transition-all my-1"
                  >
                    <div className="font-semibold text-slate-900">{org.legalName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{org.orgNumber} • {org.status}</div>
                  </Link>
                ))
              )}
            </div>

            {/* Projects */}
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Projects ({globalResults.projects?.length || 0})</h4>
              {globalResults.projects?.length === 0 ? (
                <p className="text-xs text-slate-400">No matching projects</p>
              ) : (
                globalResults.projects?.map((prj) => (
                  <Link
                    key={prj.id}
                    href={`/projects/${prj.id}`}
                    className="block rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 hover:bg-indigo-50/50 transition-all my-1"
                  >
                    <div className="font-semibold text-slate-900">{prj.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{prj.projectCode} • {prj.status}</div>
                  </Link>
                ))
              )}
            </div>

            {/* Documents */}
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Documents ({globalResults.documents?.length || 0})</h4>
              {globalResults.documents?.length === 0 ? (
                <p className="text-xs text-slate-400">No matching documents</p>
              ) : (
                globalResults.documents?.map((doc) => (
                  <Link
                    key={doc.id}
                    href="/documents"
                    className="block rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 hover:bg-indigo-50/50 transition-all my-1"
                  >
                    <div className="font-semibold text-slate-900 truncate">{doc.storageKey}</div>
                    <div className="text-[11px] text-slate-500">{doc.type} • {doc.entityType}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Center Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-xl p-1 shadow-xs border border-slate-200">
        {[
          { id: 'overview', label: 'ERP Overview', icon: Activity },
          { id: 'active-users', label: 'Active Sessions', icon: Users },
          { id: 'documents', label: 'Global Documents', icon: FileSearch },
          { id: 'employees', label: 'Workforce', icon: UserCheck },
          { id: 'organizations', label: 'Organizations', icon: Building2 },
          { id: 'projects', label: 'Projects', icon: FolderGit2 },
          { id: 'health', label: 'System Health', icon: Server },
          { id: 'audit', label: 'Security & Audit', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#151c2e] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#d49b38]' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ERP OVERVIEW METRICS GRID, ALERTS, OPERATIONS & QUICK NAVIGATION */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Phase 6M: Real System Alerts Banner */}
          {systemAlerts.length > 0 && (
            <div className="space-y-2">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4 shadow-xs transition-all ${
                    alert.severity === 'critical'
                      ? 'border-rose-200 bg-rose-50/80 text-rose-900'
                      : alert.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50/80 text-amber-900'
                      : 'border-blue-200 bg-blue-50/80 text-blue-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'text-rose-600'
                          : alert.severity === 'warning'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs tracking-wide uppercase">{alert.title}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                            alert.severity === 'critical'
                              ? 'bg-rose-600 text-white'
                              : alert.severity === 'warning'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-700">{alert.description}</p>
                    </div>
                  </div>

                  {alert.actionType === 'MODAL' ? (
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => {
                          setShowFailedEmailsModal(true);
                          fetchFailedEmailLogs('');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-50 transition-all border border-slate-200"
                      >
                        {alert.actionText} ↗
                      </button>
                      <button
                        onClick={handleClearFailedEmailLogs}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 transition-all"
                      >
                        Dismiss Alert
                      </button>
                    </div>
                  ) : alert.actionRoute?.startsWith('http') ? (
                    <a
                      href={alert.actionRoute}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-50 transition-all border border-slate-200 self-start sm:self-auto"
                    >
                      {alert.actionText} ↗
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        if (alert.actionRoute === '#health') {
                          setActiveTab('health');
                        } else if (alert.actionRoute) {
                          router.push(alert.actionRoute);
                        }
                      }}
                      className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs hover:bg-slate-50 transition-all border border-slate-200 self-start sm:self-auto"
                    >
                      {alert.actionText} ↗
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Real Metrics Cards Grid (Clickable to Authoritative Pages) */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <MetricCard label="Total Employees" value={metrics?.totalEmployees ?? 0} icon={Users} iconBg="bg-indigo-50" iconColor="text-indigo-600" onClick={() => router.push('/hr')} />
            <MetricCard label="Active Employees" value={metrics?.activeEmployees ?? 0} icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" onClick={() => router.push('/hr')} />
            <MetricCard label="Exited Employees" value={metrics?.exitedEmployees ?? 0} icon={XCircle} iconBg="bg-slate-100" iconColor="text-slate-500" onClick={() => router.push('/hr')} />
            <MetricCard label="Total Organizations" value={metrics?.totalOrganizations ?? 0} icon={Building2} iconBg="bg-blue-50" iconColor="text-blue-600" onClick={() => router.push('/organizations')} />
            <MetricCard label="Total Projects" value={metrics?.totalProjects ?? 0} icon={FolderGit2} iconBg="bg-purple-50" iconColor="text-purple-600" onClick={() => router.push('/projects')} />
            <MetricCard label="Active Projects" value={metrics?.activeProjects ?? 0} icon={Zap} iconBg="bg-amber-50" iconColor="text-amber-600" onClick={() => router.push('/projects')} />
            <MetricCard label="Completed Projects" value={metrics?.completedProjects ?? 0} icon={CheckCircle2} iconBg="bg-teal-50" iconColor="text-teal-600" onClick={() => router.push('/projects')} />
            <MetricCard label="Projects On Hold" value={metrics?.projectsOnHold ?? 0} icon={Clock} iconBg="bg-rose-50" iconColor="text-rose-600" onClick={() => router.push('/projects')} />
            <MetricCard label="Total Documents" value={metrics?.totalDocuments ?? 0} icon={FileText} iconBg="bg-sky-50" iconColor="text-sky-600" onClick={() => router.push('/documents')} />
            <MetricCard label="Document Folders" value={metrics?.totalFolders ?? 0} icon={FileSearch} iconBg="bg-cyan-50" iconColor="text-cyan-600" onClick={() => router.push('/documents')} />
            <MetricCard label="Pending Leave" value={metrics?.pendingLeaveRequests ?? 0} icon={Calendar} iconBg="bg-orange-50" iconColor="text-orange-600" onClick={() => router.push('/hr/leave')} />
            <MetricCard label="Present Today" value={metrics?.attendancePresentToday ?? 0} icon={Clock} iconBg="bg-emerald-50" iconColor="text-emerald-600" onClick={() => router.push('/hr/attendance')} />
            <MetricCard label="Working Now" value={metrics?.currentlyWorking ?? 0} icon={Activity} iconBg="bg-indigo-50" iconColor="text-indigo-600" onClick={() => router.push('/hr/attendance')} />
            <MetricCard label="On Break" value={metrics?.currentlyOnBreak ?? 0} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" onClick={() => router.push('/hr/attendance')} />
            <MetricCard label="Attendance Done" value={metrics?.completedAttendance ?? 0} icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-600" onClick={() => router.push('/hr/attendance')} />
            <MetricCard label="System Users" value={metrics?.totalUsers ?? 0} icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600" onClick={() => router.push('/admin/approvals')} />
            <MetricCard label="Unread Alerts" value={metrics?.unreadNotifications ?? 0} icon={AlertCircle} iconBg="bg-rose-50" iconColor="text-rose-600" onClick={() => router.push('/notifications')} />
            <MetricCard
              label="Failed Email Logs"
              value={metrics?.failedEmailsCount ?? 0}
              icon={Mail}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              onClick={() => {
                setShowFailedEmailsModal(true);
                fetchFailedEmailLogs('');
              }}
            />
          </div>

          {/* Infrastructure & External Tools (Phase 6L) */}
          <InfrastructureLinksCard links={health?.infrastructureLinks} services={health?.infrastructureServices} />

          {/* Phase 6M: Operations & Recent Audit Activity Feed */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Recent Operations &amp; Audit Events
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Live administrative action trail from core ERP modules.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                View Full Audit Trail ↗
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No recent operations recorded yet.</div>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 ring-1 ring-indigo-200 uppercase tracking-wide shrink-0">
                        {act.action}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-900 font-medium">
                          <span className="font-semibold">{act.actorEmail}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-mono text-[11px]">{act.entityType}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{new Date(act.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    {act.targetRoute && (
                      <Link
                        href={act.targetRoute}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all self-start sm:self-auto shrink-0"
                      >
                        Open Record ↗
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Phase 6L: Read-Only Data Management Overview */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-600" />
                  Read-Only Enterprise Data Management Overview
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Real database entity record totals. Business modifications continue strictly through authoritative ERP modules.
                </p>
              </div>
              {health?.infrastructureLinks?.supabaseDatabase && (
                <a
                  href={health.infrastructureLinks.supabaseDatabase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all self-start sm:self-auto"
                >
                  <Server className="h-3.5 w-3.5 text-blue-400" />
                  Open Supabase Database ↗
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Employees</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalEmployees ?? 0}</div>
                <Link href="/hr" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Organizations</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalOrganizations ?? 0}</div>
                <Link href="/organizations" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Projects</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalProjects ?? 0}</div>
                <Link href="/projects" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Documents</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalDocuments ?? 0}</div>
                <Link href="/documents" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">System Users</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalUsers ?? 0}</div>
                <Link href="/admin/approvals" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Leave Requests</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalLeaveRequests ?? metrics?.pendingLeaveRequests ?? 0}</div>
                <Link href="/hr/leave" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Attendance Log</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalAttendanceRecords ?? metrics?.attendancePresentToday ?? 0}</div>
                <Link href="/hr/attendance" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Notifications</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalNotifications ?? metrics?.unreadNotifications ?? 0}</div>
                <Link href="/notifications" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Open Module ↗
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Audit Trails</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalAuditLogs ?? 0}</div>
                <button onClick={() => setActiveTab('audit')} className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 text-left">
                  Inspect Audit ↗
                </button>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white transition-all">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Email Logs</span>
                <div className="my-1.5 text-2xl font-extrabold text-slate-900">{metrics?.totalEmailLogs ?? 0}</div>
                <button
                  onClick={() => {
                    setShowFailedEmailsModal(true);
                    fetchFailedEmailLogs('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 text-left"
                >
                  Inspect Failed ↗
                </button>
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards to Authoritative ERP Pages */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Authoritative ERP Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <QuickNavCard label="Employees" href="/hr" icon={Users} description="Directory & profiles" />
              <QuickNavCard label="Organizations" href="/organizations" icon={Building2} description="Client onboarding" />
              <QuickNavCard label="Projects" href="/projects" icon={FolderGit2} description="Workspaces & tasks" />
              <QuickNavCard label="Documents" href="/documents" icon={FileText} description="Document repository" />
              <QuickNavCard label="Attendance" href="/hr/attendance" icon={Clock} description="Attendance logs" />
              <QuickNavCard label="Leave" href="/hr/leave" icon={Calendar} description="Leave approvals" />
              <QuickNavCard label="Users" href="/admin/approvals" icon={Users} description="Users & roles" />
              <QuickNavCard label="Audit Logs" href="/admin/system-monitor" icon={ShieldCheck} description="Action trails" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE USER MONITORING */}
      {activeTab === 'active-users' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active User Session Telemetry</h3>
              <p className="text-xs text-slate-500">
                Lightweight activity tracking (active within last 5 minutes). Zero Redis/Kafka polling overhead.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeUsers.length} Users Active Now
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">User Email</th>
                  <th className="p-3.5 font-bold">Role</th>
                  <th className="p-3.5 font-bold">Current Route</th>
                  <th className="p-3.5 font-bold">Last Activity</th>
                  <th className="p-3.5 font-bold">Login Time</th>
                  <th className="p-3.5 font-bold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No active sessions detected in the last 5 minutes.
                    </td>
                  </tr>
                ) : (
                  activeUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900">{u.email}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-mono text-[11px]">{u.currentRoute || '/dashboard'}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{new Date(u.lastActivity).toLocaleTimeString()}</td>
                      <td className="p-3.5 text-slate-500">{new Date(u.loginTime).toLocaleTimeString()}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{u.ipAddress || 'Internal'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Global Document Center</h3>
              <p className="text-xs text-slate-500">ADMIN global document search across all entities, folders, and uploaders ({docTotal} records).</p>
            </div>
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search filename or storage key..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">Storage Key / File</th>
                  <th className="p-3.5 font-bold">Type</th>
                  <th className="p-3.5 font-bold">Entity</th>
                  <th className="p-3.5 font-bold">Folder</th>
                  <th className="p-3.5 font-bold">Uploader</th>
                  <th className="p-3.5 font-bold">Scan Status</th>
                  <th className="p-3.5 font-bold">Visibility</th>
                  <th className="p-3.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900 max-w-xs truncate">{doc.storageKey}</td>
                      <td className="p-3.5 text-slate-700">{doc.type}</td>
                      <td className="p-3.5 text-slate-600">{doc.entityType}</td>
                      <td className="p-3.5 text-slate-600">{doc.folder?.name || 'Root'}</td>
                      <td className="p-3.5 text-slate-600">{doc.uploader?.email || 'System'}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          {doc.scanStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{doc.visibility}</td>
                      <td className="p-3.5 flex items-center gap-2">
                        {doc.entityType === 'EMPLOYEE' && doc.entityId ? (
                          <Link
                            href={`/hr/employees/${doc.entityId}`}
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                          >
                            Open Record ↗
                          </Link>
                        ) : doc.entityType === 'PROJECT' && doc.entityId ? (
                          <Link
                            href={`/projects/${doc.entityId}`}
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                          >
                            Open Record ↗
                          </Link>
                        ) : doc.entityType === 'ORGANIZATION' ? (
                          <Link
                            href="/organizations"
                            className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
                          >
                            Open Record ↗
                          </Link>
                        ) : null}
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WORKFORCE MONITOR */}
      {activeTab === 'employees' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Workforce & Employee Overview</h3>
              <p className="text-xs text-slate-500">Consolidated employee status and activity telemetry ({empTotal} records).</p>
            </div>
            <input
              type="text"
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              placeholder="Search code, name, dept..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">Code</th>
                  <th className="p-3.5 font-bold">Full Name</th>
                  <th className="p-3.5 font-bold">Work Email</th>
                  <th className="p-3.5 font-bold">Department</th>
                  <th className="p-3.5 font-bold">Designation</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Last Login</th>
                  <th className="p-3.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{emp.employeeCode}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{emp.fullName}</td>
                    <td className="p-3.5 text-slate-700">{emp.workEmail}</td>
                    <td className="p-3.5 text-slate-600">{emp.department || 'N/A'}</td>
                    <td className="p-3.5 text-slate-600">{emp.designation || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{emp.lastLogin ? new Date(emp.lastLogin).toLocaleString() : 'Never'}</td>
                    <td className="p-3.5">
                      <Link
                        href={`/hr/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all"
                      >
                        Open Employee
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ORGANIZATIONS MONITOR */}
      {activeTab === 'organizations' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Organization Telemetry</h3>
              <p className="text-xs text-slate-500">Enterprise client organizations summary ({orgTotal} registered).</p>
            </div>
            <input
              type="text"
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              placeholder="Search legal name, ORG number..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">Org Code</th>
                  <th className="p-3.5 font-bold">Legal Name</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Projects</th>
                  <th className="p-3.5 font-bold">User Count</th>
                  <th className="p-3.5 font-bold">Created Date</th>
                  <th className="p-3.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{org.orgNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{org.legalName}</td>
                    <td className="p-3.5">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
                        {org.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{org.projectCount}</td>
                    <td className="p-3.5 font-bold text-slate-900">{org.userCount}</td>
                    <td className="p-3.5 text-slate-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5">
                      <Link
                        href="/organizations"
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all"
                      >
                        Open Organization
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PROJECTS MONITOR */}
      {activeTab === 'projects' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Telemetry Overview</h3>
              <p className="text-xs text-slate-500">Consolidated project workspaces monitor ({prjTotal} active).</p>
            </div>
            <input
              type="text"
              value={prjSearch}
              onChange={(e) => setPrjSearch(e.target.value)}
              placeholder="Search code, title..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">Project Code</th>
                  <th className="p-3.5 font-bold">Title</th>
                  <th className="p-3.5 font-bold">Organization</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold">Team Size</th>
                  <th className="p-3.5 font-bold">Last Activity</th>
                  <th className="p-3.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{p.projectCode}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{p.title}</td>
                    <td className="p-3.5 text-slate-700">{p.organizationName}</td>
                    <td className="p-3.5">
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{p.teamSize} members</td>
                    <td className="p-3.5 text-slate-500">{new Date(p.lastActivity).toLocaleDateString()}</td>
                    <td className="p-3.5">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all"
                      >
                        Open Project
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM HEALTH & PERFORMANCE */}
      {activeTab === 'health' && health && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HealthServiceCard name="NestJS API Service" status={health.services.api.status} info={`Port ${health.services.api.port}`} />
            <HealthServiceCard name="PostgreSQL Database" status={health.services.database.status} info={`Latency: ${health.services.database.latencyMs}ms`} />
            <HealthServiceCard name="Prisma ORM Layer" status={health.services.prisma.status} info={`Version ${health.services.prisma.version}`} />
            <HealthServiceCard name="Supabase Auth Engine" status={health.services.supabaseAuth.status} info={health.services.supabaseAuth.endpoint} />
            <HealthServiceCard name="Supabase Cloud Storage" status={health.services.supabaseStorage.status} info={`Bucket: ${health.services.supabaseStorage.bucket}`} />
            <HealthServiceCard name="SMTP Email Provider" status={health.services.email.status} info={`Host: ${health.services.email.host}`} />
          </div>

          {/* Infrastructure & External Tools (Phase 6L) */}
          <InfrastructureLinksCard links={health.infrastructureLinks} services={health.infrastructureServices} />
        </div>
      )}

      {/* TAB 8: SECURITY & AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-500">Security event history and admin action logs ({auditTotal} events recorded).</p>
            </div>
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search action or entity..."
              className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">Timestamp</th>
                  <th className="p-3.5 font-bold">Action</th>
                  <th className="p-3.5 font-bold">Entity Type</th>
                  <th className="p-3.5 font-bold">Entity ID</th>
                  <th className="p-3.5 font-bold">Actor Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-indigo-700">{log.action}</td>
                    <td className="p-3.5 text-slate-700">{log.entityType}</td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">{log.entityId}</td>
                    <td className="p-3.5 text-slate-700 font-semibold">{log.actor?.email || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECURITY SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Security Settings</h3>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Current Monitor Password</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Enter current PIN..."
                  required
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">New Monitor Password (min 6 chars)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN..."
                  required
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              {settingsMessage && (
                <div className={`rounded-lg p-3 text-xs font-medium ${settingsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {settingsMessage.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSettingsMessage(null);
                  }}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAILED EMAIL LOGS DIAGNOSTIC MODAL (Phase 6K) */}
      {showFailedEmailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Failed Email Logs Diagnostics</h3>
                    <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/40 uppercase">
                      {failedEmailsTotal} Failed Records
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Realtime failure logs from system EmailLog model. Credentials &amp; SMTP secrets remain sanitized.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFailedEmailsModal(false);
                  setSelectedEmailDetail(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Search & Refresh Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={failedEmailsSearch}
                    onChange={(e) => {
                      setFailedEmailsSearch(e.target.value);
                      fetchFailedEmailLogs(e.target.value);
                    }}
                    placeholder="Search recipient, category, subject, error..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none"
                  />
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => fetchFailedEmailLogs(failedEmailsSearch)}
                    disabled={failedEmailsLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-rose-400 ${failedEmailsLoading ? 'animate-spin' : ''}`} />
                    Refresh Diagnostic Logs
                  </button>
                  {failedEmails.length > 0 && (
                    <button
                      onClick={handleClearFailedEmailLogs}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-all"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      Dismiss &amp; Clear All Failed Logs
                    </button>
                  )}
                </div>
              </div>

              {/* Records Table or Empty State */}
              {failedEmailsLoading ? (
                <div className="flex h-48 items-center justify-center text-slate-500 text-xs font-medium">
                  <RefreshCw className="h-5 w-5 animate-spin text-rose-500 mr-2" />
                  Fetching failed email logs...
                </div>
              ) : failedEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Failed Emails</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    All outbound email notifications have been dispatched cleanly without transmission failures.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <tr>
                        <th className="p-3 font-bold">Category</th>
                        <th className="p-3 font-bold">Recipient</th>
                        <th className="p-3 font-bold">Subject</th>
                        <th className="p-3 font-bold">Provider</th>
                        <th className="p-3 font-bold">Attempts</th>
                        <th className="p-3 font-bold">Error Message</th>
                        <th className="p-3 font-bold">Attempted At</th>
                        <th className="p-3 font-bold text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {failedEmails.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-mono text-rose-700 border border-rose-200 uppercase">
                              {log.category}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-800 font-mono">{log.recipient}</td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{log.subject || 'N/A'}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{log.provider}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {log.attempts}/{log.maxAttempts}
                          </td>
                          <td className="p-3 text-rose-600 max-w-xs truncate font-mono text-[11px]" title={log.lastError || ''}>
                            {log.lastError || 'Unknown delivery failure'}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedEmailDetail(log)}
                              className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition-all"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Selected Email Detailed Inspector Sub-modal */}
              {selectedEmailDetail && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-rose-200 pb-2">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <AlertCircle className="h-4 w-4" />
                      Detailed Diagnostic Record: {selectedEmailDetail.id}
                    </span>
                    <button
                      onClick={() => setSelectedEmailDetail(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Close Detail
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 font-mono pt-1">
                    <div><span className="font-bold text-slate-900">Event Category:</span> {selectedEmailDetail.category}</div>
                    <div><span className="font-bold text-slate-900">Recipient Email:</span> {selectedEmailDetail.recipient}</div>
                    <div><span className="font-bold text-slate-900">Subject Line:</span> {selectedEmailDetail.subject}</div>
                    <div><span className="font-bold text-slate-900">Email Provider:</span> {selectedEmailDetail.provider}</div>
                    <div><span className="font-bold text-slate-900">Retry Attempts:</span> {selectedEmailDetail.attempts} / {selectedEmailDetail.maxAttempts}</div>
                    <div><span className="font-bold text-slate-900">Message ID:</span> {selectedEmailDetail.messageId || 'N/A'}</div>
                    <div><span className="font-bold text-slate-900">Log Created:</span> {new Date(selectedEmailDetail.createdAt).toLocaleString()}</div>
                    {selectedEmailDetail.nextAttemptAt && (
                      <div><span className="font-bold text-slate-900">Next Scheduled Retry:</span> {new Date(selectedEmailDetail.nextAttemptAt).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 block mb-1">Full Error Diagnostic Trace:</span>
                    <pre className="p-3 bg-slate-900 text-rose-300 rounded-lg overflow-x-auto text-[10px] font-mono whitespace-pre-wrap">
                      {selectedEmailDetail.lastError || 'No error stack logged'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
              <button
                onClick={() => {
                  setShowFailedEmailsModal(false);
                  setSelectedEmailDetail(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-all"
              >
                Close Diagnostic Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents
function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all ${
        onClick
          ? 'cursor-pointer hover:border-rose-400 hover:shadow-md hover:ring-2 hover:ring-rose-400/20'
          : 'hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{value}</span>
        {onClick && (
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider group-hover:underline">
            Inspect ↗
          </span>
        )}
      </div>
    </div>
  );
}

function QuickNavCard({ label, href, icon: Icon, description }: { label: string; href: string; icon: any; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs transition-all hover:border-indigo-400 hover:bg-white hover:shadow-md"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <Icon className="h-4 w-4" />
        </div>
        <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-600" />
      </div>
      <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">{label}</div>
      <div className="mt-0.5 text-[10px] text-slate-500 line-clamp-1">{description}</div>
    </Link>
  );
}

function HealthServiceCard({ name, status, info }: { name: string; status: string; info: string }) {
  const isOk = status === 'OPERATIONAL';
  const isDegraded = status === 'DEGRADED';
  const isNotConfigured = status === 'NOT_CONFIGURED';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-slate-900">{name}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide ${
            isOk
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : isDegraded
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              : isNotConfigured
              ? 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
              : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="mt-2 text-xs text-slate-500 font-mono truncate">{info}</div>
    </div>
  );
}

function InfrastructureLinksCard({
  links,
  services,
}: {
  links?: HealthData['infrastructureLinks'];
  services?: HealthData['infrastructureServices'];
}) {
  const items = [
    {
      label: 'Supabase Project',
      url: links?.supabaseProject || services?.supabaseProject?.url,
      status: services?.supabaseProject?.status || (links?.supabaseProject ? 'CONNECTED' : 'NOT_CONFIGURED'),
      icon: Database,
      color: 'text-emerald-600',
    },
    {
      label: 'Supabase Database',
      url: links?.supabaseDatabase || services?.supabaseDatabase?.url,
      status: services?.supabaseDatabase?.status || (links?.supabaseDatabase ? 'CONNECTED' : 'NOT_CONFIGURED'),
      icon: Server,
      color: 'text-blue-600',
    },
    {
      label: 'Supabase Storage',
      url: links?.supabaseStorage || services?.supabaseStorage?.url,
      status: services?.supabaseStorage?.status || (links?.supabaseStorage ? 'CONNECTED' : 'NOT_CONFIGURED'),
      icon: FileSearch,
      color: 'text-cyan-600',
    },
    {
      label: 'Sentry',
      url: links?.sentry || services?.sentry?.url,
      status: services?.sentry?.status || (links?.sentry ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      icon: AlertCircle,
      color: 'text-rose-600',
    },
    {
      label: 'Grafana',
      url: links?.grafana || services?.grafana?.url,
      status: services?.grafana?.status || (links?.grafana ? 'CONFIGURED' : 'NOT_CONFIGURED'),
      icon: TrendingUp,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600" />
            Infrastructure &amp; External Tools
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Administrator-only direct links to external infrastructure dashboards. No credentials are hardcoded or embedded.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-200 self-start sm:self-auto">
          ADMIN ACCESS ONLY
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isConfigured = !!item.url;

          const badgeStyle =
            item.status === 'CONNECTED'
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : item.status === 'CONFIGURED'
              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
              : item.status === 'UNAVAILABLE'
              ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
              : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200';

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  <span className="font-bold text-xs text-slate-900 truncate">{item.label}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              {isConfigured ? (
                <a
                  href={item.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-indigo-50/80 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all group"
                >
                  <span>Open Dashboard</span>
                  <ExternalLink className="h-3 w-3 text-indigo-500 group-hover:text-white transition-colors" />
                </a>
              ) : (
                <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-center text-[11px] font-medium text-slate-400">
                  Not Configured
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
