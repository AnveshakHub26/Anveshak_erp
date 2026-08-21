'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  attendancePresentToday: number;
  currentlyWorking: number;
  currentlyOnBreak: number;
  completedAttendance: number;
  totalUsers: number;
  activeUsersCount: number;
  unreadNotifications: number;
  failedEmailsCount: number;
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
    supabase: string | null;
    grafana: string | null;
    sentry: string | null;
  };
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

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'active-users' | 'documents' | 'employees' | 'organizations' | 'projects' | 'health' | 'audit'>('overview');

  // Data States
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
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

  // Fetch Data based on tab
  const loadTabData = useCallback(async () => {
    if (!isVerified) return;
    setLoadingData(true);

    try {
      if (activeTab === 'overview') {
        const res = await apiRequest<any>('/system-monitor/metrics');
        setMetrics(res.data?.overview || null);
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
    } catch (err) {
      console.error('Error loading System Monitor data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [isVerified, activeTab, docSearch, empSearch, orgSearch, prjSearch, auditSearch]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

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

  // Auth Guard check
  if (isInitializing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Non-Admin 403 Protection
  const isAdmin = user?.roles?.includes('ADMIN');
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-rose-500" />
        <h1 className="text-2xl font-bold text-slate-100">403 — Unauthorized Access</h1>
        <p className="mt-2 max-w-md text-slate-400">
          The System Monitor & Admin Control Center is restricted strictly to Administrator role accounts.
        </p>
        <Link
          href="/employee/dashboard"
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white shadow hover:bg-indigo-500"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Security Gate Prompt (If PIN not verified)
  if (!isVerified) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">System Monitor Security Gate</h2>
            <p className="mt-1 text-sm text-slate-400">
              Secondary identity verification required to unlock enterprise control metrics.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Security PIN / Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter monitor password..."
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 pl-10 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            {pinError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pinLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50"
            >
              {pinLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              Unlock Control Center
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <button
              onClick={() => setShowForgotForm(true)}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Forgot Monitor Password?
            </button>
          </div>

          {/* Forgot Password Modal */}
          {showForgotForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-100">Forgot Monitor Password</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Password recovery instructions will be sent to the permanent administrator email address.
                </p>
                <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="anveshakhub26@gmail.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                  {settingsMessage && (
                    <div className={`text-xs ${settingsMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {settingsMessage.text}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={settingsLoading}
                      className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                      Send Recovery Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotForm(false);
                        setSettingsMessage(null);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
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

  // Verified Admin Control Center
  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">System Monitor & Admin Control Center</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Realtime enterprise telemetry, workforce health, active user sessions, and authoritative ERP access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              placeholder="Global search EMP, PRJ, Org..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            {globalSearching && <RefreshCw className="absolute right-2.5 top-2 h-3.5 w-3.5 animate-spin text-indigo-400" />}
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <Key className="h-3.5 w-3.5 text-slate-400" />
            Security Settings
          </button>

          <button
            onClick={loadTabData}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-indigo-500"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global Search Results Popup */}
      {globalResults && (
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Global Search Results for "{globalQuery}"</h3>
            <button onClick={() => setGlobalResults(null)} className="text-xs text-slate-400 hover:text-slate-200">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Employees */}
            <div>
              <h4 className="mb-1 text-xs font-semibold text-slate-300">Employees ({globalResults.employees?.length || 0})</h4>
              {globalResults.employees?.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/hr/employees/${emp.id}`}
                  className="block rounded-md p-2 text-xs hover:bg-slate-800"
                >
                  <div className="font-medium text-indigo-300">{emp.fullName}</div>
                  <div className="text-slate-400">{emp.employeeCode} • {emp.department || 'N/A'}</div>
                </Link>
              ))}
            </div>

            {/* Organizations */}
            <div>
              <h4 className="mb-1 text-xs font-semibold text-slate-300">Organizations ({globalResults.organizations?.length || 0})</h4>
              {globalResults.organizations?.map((org) => (
                <Link
                  key={org.id}
                  href="/organizations"
                  className="block rounded-md p-2 text-xs hover:bg-slate-800"
                >
                  <div className="font-medium text-indigo-300">{org.legalName}</div>
                  <div className="text-slate-400">{org.orgNumber} • {org.status}</div>
                </Link>
              ))}
            </div>

            {/* Projects */}
            <div>
              <h4 className="mb-1 text-xs font-semibold text-slate-300">Projects ({globalResults.projects?.length || 0})</h4>
              {globalResults.projects?.map((prj) => (
                <Link
                  key={prj.id}
                  href={`/projects/${prj.id}`}
                  className="block rounded-md p-2 text-xs hover:bg-slate-800"
                >
                  <div className="font-medium text-indigo-300">{prj.title}</div>
                  <div className="text-slate-400">{prj.projectCode} • {prj.status}</div>
                </Link>
              ))}
            </div>

            {/* Documents */}
            <div>
              <h4 className="mb-1 text-xs font-semibold text-slate-300">Documents ({globalResults.documents?.length || 0})</h4>
              {globalResults.documents?.map((doc) => (
                <div key={doc.id} className="rounded-md p-2 text-xs text-slate-300">
                  <div className="font-medium text-indigo-300">{doc.storageKey}</div>
                  <div className="text-slate-400">{doc.type} • {doc.entityType}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Center Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'ERP Overview', icon: Activity },
          { id: 'active-users', label: 'Active Users', icon: Users },
          { id: 'documents', label: 'Global Documents', icon: FileSearch },
          { id: 'employees', label: 'Workforce', icon: Users },
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
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* 1. ERP OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real Metrics Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <MetricCard label="Total Employees" value={metrics?.totalEmployees ?? 0} icon={Users} color="indigo" />
            <MetricCard label="Active Employees" value={metrics?.activeEmployees ?? 0} icon={CheckCircle2} color="emerald" />
            <MetricCard label="Exited Employees" value={metrics?.exitedEmployees ?? 0} icon={XCircle} color="slate" />
            <MetricCard label="Total Organizations" value={metrics?.totalOrganizations ?? 0} icon={Building2} color="blue" />
            <MetricCard label="Total Projects" value={metrics?.totalProjects ?? 0} icon={FolderGit2} color="purple" />
            <MetricCard label="Active Projects" value={metrics?.activeProjects ?? 0} icon={Zap} color="amber" />
            <MetricCard label="Completed Projects" value={metrics?.completedProjects ?? 0} icon={CheckCircle2} color="emerald" />
            <MetricCard label="Projects On Hold" value={metrics?.projectsOnHold ?? 0} icon={Clock} color="rose" />
            <MetricCard label="Total Documents" value={metrics?.totalDocuments ?? 0} icon={FileText} color="cyan" />
            <MetricCard label="Document Folders" value={metrics?.totalFolders ?? 0} icon={FileSearch} color="sky" />
            <MetricCard label="Pending Leave" value={metrics?.pendingLeaveRequests ?? 0} icon={Calendar} color="amber" />
            <MetricCard label="Present Today" value={metrics?.attendancePresentToday ?? 0} icon={Clock} color="emerald" />
            <MetricCard label="Working Now" value={metrics?.currentlyWorking ?? 0} icon={Activity} color="indigo" />
            <MetricCard label="On Break" value={metrics?.currentlyOnBreak ?? 0} icon={Clock} color="amber" />
            <MetricCard label="Attendance Done" value={metrics?.completedAttendance ?? 0} icon={CheckCircle2} color="blue" />
            <MetricCard label="Total System Users" value={metrics?.totalUsers ?? 0} icon={Users} color="teal" />
            <MetricCard label="Unread Alerts" value={metrics?.unreadNotifications ?? 0} icon={AlertCircle} color="rose" />
            <MetricCard label="Failed Emails" value={metrics?.failedEmailsCount ?? 0} icon={Mail} color="rose" />
          </div>

          {/* Quick Navigation Cards to Authoritative ERP Pages */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Authoritative ERP Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <QuickNavCard label="Employees" href="/hr" icon={Users} description="HR Directory & Profile Editing" />
              <QuickNavCard label="Organizations" href="/organizations" icon={Building2} description="Client Organizations & Onboarding" />
              <QuickNavCard label="Projects" href="/projects" icon={FolderGit2} description="Project Workspace & Deliverables" />
              <QuickNavCard label="Documents" href="/documents" icon={FileText} description="Document Repository & Scanning" />
              <QuickNavCard label="Attendance" href="/hr/attendance" icon={Clock} description="Workforce Time & Attendance Logs" />
              <QuickNavCard label="Leave" href="/hr/leave" icon={Calendar} description="Leave Request Approvals" />
              <QuickNavCard label="Users" href="/admin/approvals" icon={Users} description="System Users & RBAC Roles" />
              <QuickNavCard label="Audit Logs" href="/admin/system-monitor" icon={ShieldCheck} description="Immutable Action Trails" />
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE USER MONITORING TAB */}
      {activeTab === 'active-users' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Active Session Telemetry</h3>
              <p className="text-xs text-slate-400">
                Lightweight activity tracking (activity recorded within last 5 minutes). Zero Redis/Kafka polling overhead.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeUsers.length} Active Now
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">User Email</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Current Route</th>
                  <th className="p-3 font-semibold">Last Activity</th>
                  <th className="p-3 font-semibold">Login Time</th>
                  <th className="p-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500">
                      No active sessions in the last 5 minutes.
                    </td>
                  </tr>
                ) : (
                  activeUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-slate-200">{u.email}</td>
                      <td className="p-3">
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-mono text-[11px]">{u.currentRoute || '/dashboard'}</td>
                      <td className="p-3 text-slate-400">{new Date(u.lastActivity).toLocaleTimeString()}</td>
                      <td className="p-3 text-slate-400">{new Date(u.loginTime).toLocaleTimeString()}</td>
                      <td className="p-3 text-slate-500">{u.ipAddress || 'Internal'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GLOBAL DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Global Document Center</h3>
              <p className="text-xs text-slate-400">ADMIN global document search across all entities, folders, and uploaders ({docTotal} total).</p>
            </div>
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search filename or storage key..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Storage Key / File</th>
                  <th className="p-3 font-semibold">Document Type</th>
                  <th className="p-3 font-semibold">Entity Type</th>
                  <th className="p-3 font-semibold">Folder</th>
                  <th className="p-3 font-semibold">Uploader</th>
                  <th className="p-3 font-semibold">Scan Status</th>
                  <th className="p-3 font-semibold">Visibility</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500">
                      No documents found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-indigo-300 max-w-xs truncate">{doc.storageKey}</td>
                      <td className="p-3 text-slate-300">{doc.type}</td>
                      <td className="p-3 text-slate-400">{doc.entityType}</td>
                      <td className="p-3 text-slate-400">{doc.folder?.name || 'Root'}</td>
                      <td className="p-3 text-slate-400">{doc.uploader?.email || 'System'}</td>
                      <td className="p-3">
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {doc.scanStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{doc.visibility}</td>
                      <td className="p-3">
                        <Link
                          href="/documents"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Open Document
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

      {/* 4. WORKFORCE MONITOR TAB */}
      {activeTab === 'employees' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Workforce & Employee Overview</h3>
              <p className="text-xs text-slate-400">Consolidated employee status and activity monitor ({empTotal} records).</p>
            </div>
            <input
              type="text"
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              placeholder="Search code, name, dept..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Code</th>
                  <th className="p-3 font-semibold">Full Name</th>
                  <th className="p-3 font-semibold">Work Email</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Designation</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Last Login</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-semibold text-indigo-400">{emp.employeeCode}</td>
                    <td className="p-3 font-medium text-slate-200">{emp.fullName}</td>
                    <td className="p-3 text-slate-300">{emp.workEmail}</td>
                    <td className="p-3 text-slate-400">{emp.department || 'N/A'}</td>
                    <td className="p-3 text-slate-400">{emp.designation || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{emp.lastLogin ? new Date(emp.lastLogin).toLocaleString() : 'Never'}</td>
                    <td className="p-3">
                      <Link
                        href={`/hr/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
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

      {/* 5. ORGANIZATIONS MONITOR TAB */}
      {activeTab === 'organizations' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Organization Telemetry</h3>
              <p className="text-xs text-slate-400">Enterprise client organizations summary ({orgTotal} registered).</p>
            </div>
            <input
              type="text"
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              placeholder="Search legal name, ORG number..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Org Code</th>
                  <th className="p-3 font-semibold">Legal Name</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Projects</th>
                  <th className="p-3 font-semibold">User Count</th>
                  <th className="p-3 font-semibold">Created Date</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-semibold text-indigo-400">{org.orgNumber}</td>
                    <td className="p-3 font-medium text-slate-200">{org.legalName}</td>
                    <td className="p-3">
                      <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                        {org.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-300">{org.projectCount}</td>
                    <td className="p-3 font-semibold text-slate-300">{org.userCount}</td>
                    <td className="p-3 text-slate-400">{new Date(org.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link
                        href="/organizations"
                        className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
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

      {/* 6. PROJECTS MONITOR TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Project Telemetry Overview</h3>
              <p className="text-xs text-slate-400">Consolidated project workspaces monitor ({prjTotal} active).</p>
            </div>
            <input
              type="text"
              value={prjSearch}
              onChange={(e) => setPrjSearch(e.target.value)}
              placeholder="Search code, title..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Project Code</th>
                  <th className="p-3 font-semibold">Title</th>
                  <th className="p-3 font-semibold">Organization</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Team Size</th>
                  <th className="p-3 font-semibold">Last Activity</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-semibold text-indigo-400">{p.projectCode}</td>
                    <td className="p-3 font-medium text-slate-200">{p.title}</td>
                    <td className="p-3 text-slate-300">{p.organizationName}</td>
                    <td className="p-3">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-300">{p.teamSize} members</td>
                    <td className="p-3 text-slate-400">{new Date(p.lastActivity).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link
                        href={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
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

      {/* 7. SYSTEM HEALTH & PERFORMANCE TAB */}
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

          {/* Infrastructure Dashboard External Links */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">External Infrastructure Dashboards</h3>
            <div className="flex flex-wrap gap-3">
              {health.infrastructureLinks.supabase && (
                <a
                  href={health.infrastructureLinks.supabase}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-indigo-400"
                >
                  <Database className="h-4 w-4 text-emerald-400" />
                  Supabase Dashboard
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              )}
              {health.infrastructureLinks.grafana && (
                <a
                  href={health.infrastructureLinks.grafana}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-indigo-400"
                >
                  <Server className="h-4 w-4 text-amber-400" />
                  Grafana Monitoring
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              )}
              {health.infrastructureLinks.sentry && (
                <a
                  href={health.infrastructureLinks.sentry}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:text-indigo-400"
                >
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  Sentry Error Tracking
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. SECURITY & AUDIT TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-400">Security event history and admin action logs ({auditTotal} events).</p>
            </div>
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search action or entity..."
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Entity Type</th>
                  <th className="p-3 font-semibold">Entity ID</th>
                  <th className="p-3 font-semibold">Actor Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-indigo-400">{log.action}</td>
                    <td className="p-3 text-slate-300">{log.entityType}</td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">{log.entityId}</td>
                    <td className="p-3 text-slate-300">{log.actor?.email || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECURITY SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">System Monitor Security Settings</h3>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSettingsMessage(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Current Monitor Password</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Enter current PIN..."
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">New Monitor Password (min 6 chars)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN..."
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              {settingsMessage && (
                <div className={`rounded-lg p-3 text-xs ${settingsMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {settingsMessage.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setSettingsMessage(null);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents
function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 shadow backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-2 text-xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

function QuickNavCard({ label, href, icon: Icon, description }: { label: string; href: string; icon: any; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 shadow transition hover:border-indigo-500/50 hover:bg-slate-800/60"
    >
      <div className="mb-2 flex items-center justify-between">
        <Icon className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
        <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-indigo-300" />
      </div>
      <div className="font-semibold text-xs text-slate-200 group-hover:text-indigo-400">{label}</div>
      <div className="mt-1 text-[10px] text-slate-400 line-clamp-2">{description}</div>
    </Link>
  );
}

function HealthServiceCard({ name, status, info }: { name: string; status: string; info: string }) {
  const isOk = status === 'OPERATIONAL';
  const isDegraded = status === 'DEGRADED';
  const isNotConfigured = status === 'NOT_CONFIGURED';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-slate-200">{name}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            isOk
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
              : isDegraded
              ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
              : isNotConfigured
              ? 'bg-slate-800 text-slate-400'
              : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="mt-2 text-xs text-slate-400 font-mono truncate">{info}</div>
    </div>
  );
}
