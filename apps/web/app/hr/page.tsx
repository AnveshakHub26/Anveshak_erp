'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton, TableRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  GraduationCap,
  Briefcase,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FolderGit2,
  CheckCircle2,
  PlusCircle,
  History,
  UserPlus,
  Eye,
  Edit3,
  UserX,
} from 'lucide-react';

interface DashboardMetrics {
  totalEmployees: number;
  categoryBreakdown: {
    experts: number;
    interns: number;
    staffExecs: number;
  };
  typeBreakdown: {
    permanent: number;
    temporary: number;
    probationary: number;
  };
  statusBreakdown: {
    active: number;
    onboarding: number;
    onLeave: number;
    resigned: number;
    terminated: number;
  };
  allocationBreakdown: {
    assigned: number;
    unassigned: number;
  };
  departmentSummary: Array<{ department: string; count: number }>;
}

interface EmployeeItem {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  professionalRole: string;
  department: string;
  designation: string;
  category: 'EXPERT' | 'INTERN' | 'STAFF' | 'EXECUTIVE';
  employmentType: 'PERMANENT' | 'PROBATIONARY' | 'TEMPORARY' | 'CONTRACT' | 'PART_TIME';
  status: 'ONBOARDING' | 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
  joiningDate: string;
  skills: string[];
  technologies: string[];
  user: { id: string; email: string; status: string };
  projectMemberships: Array<{
    id: string;
    project: { id: string; projectCode: string; title: string };
  }>;
}

export default function HRPage() {
  const router = useRouter();
  const { hasRole, isInitializing } = usePermissions();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await apiRequest<{ success: boolean; data: DashboardMetrics }>('/hr/dashboard');
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load HR dashboard metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoadingDirectory(true);
    setErrorMsg(null);
    try {
      const query = new URLSearchParams();
      query.set('page', currentPage.toString());
      query.set('limit', pageSize.toString());
      if (search.trim()) query.set('search', search.trim());
      if (categoryFilter) query.set('category', categoryFilter);
      if (typeFilter) query.set('employmentType', typeFilter);
      if (statusFilter) query.set('employmentStatus', statusFilter);
      if (assignmentFilter) query.set('assignment', assignmentFilter);
      if (skillsInput.trim()) query.set('skills', skillsInput.trim());

      const res = await apiRequest<{
        success: boolean;
        data: {
          items: EmployeeItem[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`/hr/employees?${query.toString()}`);

      if (res.data) {
        const list = res.data.items || (Array.isArray((res.data as any).data) ? (res.data as any).data : []);
        const total = res.data.total ?? (res.data as any).meta?.total ?? list.length;
        const totalPages = res.data.totalPages ?? (res.data as any).meta?.totalPages ?? 1;
        setEmployees(list);
        setTotalItems(total);
        setTotalPages(totalPages);
      }
    } catch (err: any) {
      if (err.status === 0 || err.code === 'NETWORK_ERROR') {
        setErrorMsg('Unable to connect to HR service. Please verify server connectivity and try again.');
      } else {
        setErrorMsg(err.message || 'Failed to fetch employee directory.');
      }
    } finally {
      setLoadingDirectory(false);
    }
  }, [currentPage, pageSize, search, categoryFilter, typeFilter, statusFilter, assignmentFilter, skillsInput]);

  useEffect(() => {
    if (isInitializing) return;
    const isAllowed = hasRole('ADMIN') || hasRole('HR');
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchDashboard();
  }, [isInitializing, hasRole, router, fetchDashboard]);

  useEffect(() => {
    if (isInitializing) return;
    const isAllowed = hasRole('ADMIN') || hasRole('HR');
    if (isAllowed) {
      fetchEmployees();
    }
  }, [isInitializing, hasRole, fetchEmployees]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setAssignmentFilter('');
    setSkillsInput('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold shadow-sm shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                Human Resources Directory
              </h1>
              <p className="text-xs text-[#64748B]">
                Canonical workforce master pool & enterprise identity management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link href="/hr/onboard">
              <Button variant="primary" size="sm">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Onboard Employee
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchDashboard();
                fetchEmployees();
              }}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingDirectory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics Section */}
        {loadingMetrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Workforce */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[110px]">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold uppercase tracking-wider truncate">Total Workforce</span>
                  <Users className="h-4 w-4 text-[#d49b38] shrink-0 ml-1" />
                </div>
                <div className="my-1.5 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">{metrics.totalEmployees ?? 0}</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F1F5F9]">
                  <span className="text-[#2F6F52] font-semibold">Assigned: {metrics.allocationBreakdown?.assigned ?? 0}</span>
                  <span className="text-[#64748B]">Unassigned: {metrics.allocationBreakdown?.unassigned ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[110px]">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold uppercase tracking-wider truncate">Category Breakdown</span>
                  <GraduationCap className="h-4 w-4 text-blue-600 shrink-0 ml-1" />
                </div>
                <div className="my-1.5 flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">{metrics.categoryBreakdown?.experts ?? 0}</span>
                  <span className="text-xs text-blue-600 font-bold uppercase">Experts</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                  <span>Interns: {metrics.categoryBreakdown?.interns ?? 0}</span>
                  <span>Staff: {metrics.categoryBreakdown?.staffExecs ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Employment Types */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[110px]">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold uppercase tracking-wider truncate">Employment Types</span>
                  <Briefcase className="h-4 w-4 text-purple-600 shrink-0 ml-1" />
                </div>
                <div className="my-1.5 flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">{metrics.typeBreakdown?.permanent ?? 0}</span>
                  <span className="text-xs text-purple-600 font-bold uppercase">Permanent</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                  <span>Temp: {metrics.typeBreakdown?.temporary ?? 0}</span>
                  <span>Probation: {metrics.typeBreakdown?.probationary ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Status */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full min-h-[110px]">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold uppercase tracking-wider truncate">Active Status</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
                </div>
                <div className="my-1.5 flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">{metrics.statusBreakdown?.active ?? 0}</span>
                  <span className="text-xs text-emerald-600 font-bold uppercase">Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                  <span>Onboarding: {metrics.statusBreakdown?.onboarding ?? 0}</span>
                  <span>Offboarded: {(metrics.statusBreakdown?.resigned ?? 0) + (metrics.statusBreakdown?.terminated ?? 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Search & Filter Toolbar */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search by Employee Code, Name, Role, Department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 py-2 text-xs text-[#0F172A] placeholder-[#94a3b8] focus:border-[#d49b38] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Filter by Skills / Technologies (comma separated)..."
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] placeholder-[#94a3b8] focus:border-[#d49b38] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button type="submit" variant="primary" size="sm">
                  Search
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                  Reset
                </Button>
              </div>
            </form>

            {/* Filter Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="EXPERT">EXPERT</option>
                  <option value="INTERN">INTERN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="EXECUTIVE">EXECUTIVE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">Employment Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="TEMPORARY">TEMPORARY</option>
                  <option value="PROBATIONARY">PROBATIONARY</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="PART_TIME">PART TIME</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">Employment Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ONBOARDING">ONBOARDING</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="RESIGNED">RESIGNED</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#64748B] mb-1">Project Assignment</label>
                <select
                  value={assignmentFilter}
                  onChange={(e) => {
                    setAssignmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">All Employees</option>
                  <option value="ASSIGNED">ASSIGNED to Project</option>
                  <option value="UNASSIGNED">UNASSIGNED</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <Alert className="border-[#B42318]/30 bg-[#FDF2F2] text-[#B42318]">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-xs font-medium">{errorMsg}</span>
          </Alert>
        )}

        {/* Directory Card & Table */}
        <Card>
          <CardHeader className="py-4 px-5 flex flex-row items-center justify-between border-b border-[#E2E8F0]">
            <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
              <span>Employee Master Directory</span>
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] text-[#d49b38] font-bold">
                {totalItems} Records
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loadingDirectory ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : employees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employees found"
                description="Try adjusting your search query or filter criteria."
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Employee Code</th>
                      <th className="px-4 py-3 font-semibold">Name & Contact</th>
                      <th className="px-4 py-3 font-semibold">Professional Role</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Employment Type</th>
                      <th className="px-4 py-3 font-semibold">Dept & Designation</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Project Allocation</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                    {employees.map((emp) => {
                      const activeProjectsCount = emp.projectMemberships?.length || 0;
                      const isAssigned = activeProjectsCount > 0;

                      return (
                        <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                          {/* Employee Code */}
                          <td className="px-4 py-3 font-mono font-bold">
                            <Link href={`/hr/employees/${emp.id}`} className="hover:underline">
                              <span className="rounded-md bg-[#F5E8D0]/60 border border-[#d49b38]/40 px-2 py-0.5 text-[#8B5E14] text-xs">
                                {emp.employeeCode}
                              </span>
                            </Link>
                          </td>

                          {/* Name & Contact */}
                          <td className="px-4 py-3">
                            <Link href={`/hr/employees/${emp.id}`} className="hover:underline">
                              <div className="font-semibold text-[#0F172A] text-xs">{emp.fullName}</div>
                            </Link>
                            <div className="text-[11px] text-[#64748B] mt-0.5">{emp.workEmail}</div>
                          </td>

                          {/* Professional Role */}
                          <td className="px-4 py-3 font-medium text-[#334155]">
                            {emp.professionalRole}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                emp.category === 'EXPERT'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : emp.category === 'INTERN'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {emp.category}
                            </span>
                          </td>

                          {/* Employment Type */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                emp.employmentType === 'PERMANENT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {emp.employmentType}
                            </span>
                          </td>

                          {/* Department & Designation */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#0F172A]">{emp.designation}</div>
                            <div className="text-[11px] text-[#64748B]">{emp.department}</div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                emp.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : emp.status === 'ONBOARDING'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : emp.status === 'ON_LEAVE'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>

                          {/* Allocation Status */}
                          <td className="px-4 py-3">
                            {isAssigned ? (
                              <span className="inline-flex items-center space-x-1 text-[#2F6F52] text-[11px] font-semibold bg-[#EBF5F0] px-2 py-0.5 rounded border border-[#A3D9C0]">
                                <FolderGit2 className="h-3 w-3" />
                                <span>Assigned ({activeProjectsCount})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[#64748B] text-[11px] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Status-Aware Action Links */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {emp.status === 'RESIGNED' || emp.status === 'TERMINATED' ? (
                                <>
                                  <Link href={`/hr/employees/${emp.id}?tab=history`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                                      title="View employment & rehire history"
                                    >
                                      <History className="h-3 w-3 mr-1 text-slate-500" />
                                      View History
                                    </Button>
                                  </Link>
                                  <Link href={`/hr/employees/${emp.id}?modal=rehire`}>
                                    <Button
                                      size="sm"
                                      className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                                      title="Rehire employee into active service"
                                    >
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      Rehire
                                    </Button>
                                  </Link>
                                </>
                              ) : (
                                <>
                                  <Link href={`/hr/employees/${emp.id}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                                      title="View employee profile"
                                    >
                                      <Eye className="h-3 w-3 mr-1 text-slate-500" />
                                      View
                                    </Button>
                                  </Link>
                                  <Link href={`/hr/employees/${emp.id}?modal=edit`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                                      title="Edit employee profile"
                                    >
                                      <Edit3 className="h-3 w-3 mr-1 text-amber-600" />
                                      Edit
                                    </Button>
                                  </Link>
                                  <Link href={`/hr/employees/${emp.id}?modal=offboard`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] h-7 px-2 border-red-200 text-red-700 hover:bg-red-50"
                                      title="Deactivate or mark employee exit"
                                    >
                                      <UserX className="h-3 w-3 mr-1 text-red-600" />
                                      Deactivate
                                    </Button>
                                  </Link>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
              <div>
                Showing {employees.length} of {totalItems} records (Page {currentPage} of {totalPages})
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || loadingDirectory}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || loadingDirectory}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
