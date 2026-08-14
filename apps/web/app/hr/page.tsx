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
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  BadgeCheck,
  AlertCircle,
  FolderGit2,
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  PlusCircle,
  FileSpreadsheet,
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
  const { user, hasRole } = usePermissions();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
      const res = await apiRequest<{ success: boolean; data: DashboardMetrics }>('/api/v1/hr/dashboard');
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
      }>(`/api/v1/hr/employees?${query.toString()}`);

      if (res.data) {
        setEmployees(res.data.items || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch employee directory.');
    } finally {
      setLoadingDirectory(false);
    }
  }, [currentPage, pageSize, search, categoryFilter, typeFilter, statusFilter, assignmentFilter, skillsInput]);

  useEffect(() => {
    const isAllowed = hasRole('ADMIN') || hasRole('HR');
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchDashboard();
    fetchEmployees();
  }, [hasRole, router, fetchDashboard, fetchEmployees]);

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
    <AppShell>
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#182238] pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] flex items-center justify-center text-[#151c2e] font-bold shadow-lg shadow-[#d49b38]/10">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Human Resources Directory</h1>
                <p className="text-xs text-[#94a3b8]">
                  Canonical workforce master pool & enterprise identity management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/hr/onboard">
              <Button size="sm" className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs shadow-md">
                <PlusCircle className="h-4 w-4 mr-2" />
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
              className="border-[#182238] bg-[#151c2e] text-[#94a3b8] hover:text-white hover:bg-[#182238]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingDirectory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics Section */}
        {loadingMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-[#151c2e] border border-[#182238] animate-pulse p-4" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Workforce */}
            <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span>Total Workforce</span>
                <Users className="h-4 w-4 text-[#d49b38]" />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-white">{metrics.totalEmployees}</div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">Assigned: {metrics.allocationBreakdown.assigned}</span>
                <span className="text-[#94a3b8]">Unassigned: {metrics.allocationBreakdown.unassigned}</span>
              </div>
            </div>

            {/* Experts vs Interns */}
            <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span>Category Breakdown</span>
                <GraduationCap className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">{metrics.categoryBreakdown.experts}</span>
                <span className="text-xs text-blue-400 font-semibold">Experts</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span>Interns: {metrics.categoryBreakdown.interns}</span>
                <span>Staff: {metrics.categoryBreakdown.staffExecs}</span>
              </div>
            </div>

            {/* Permanent vs Temporary */}
            <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span>Employment Types</span>
                <Briefcase className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">{metrics.typeBreakdown.permanent}</span>
                <span className="text-xs text-purple-400 font-semibold">Permanent</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span>Temporary: {metrics.typeBreakdown.temporary}</span>
                <span>Probationary: {metrics.typeBreakdown.probationary}</span>
              </div>
            </div>

            {/* Employment Status */}
            <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                <span>Active Status</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">{metrics.statusBreakdown.active}</span>
                <span className="text-xs text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#94a3b8]">
                <span>Onboarding: {metrics.statusBreakdown.onboarding}</span>
                <span>Offboarded: {metrics.statusBreakdown.resigned + metrics.statusBreakdown.terminated}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Search & Filter Toolbar */}
        <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search by Employee Code, Name, Role, Department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] pl-9 pr-4 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#d49b38] focus:outline-none"
              />
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filter by Skills / Technologies (comma separated)..."
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#d49b38] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button type="submit" size="sm" className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="border-[#182238] bg-[#0b101b] text-[#94a3b8] hover:text-white text-xs"
              >
                Reset
              </Button>
            </div>
          </form>

          {/* Filter Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#182238]/60 text-xs">
            <div>
              <label className="block text-[11px] text-[#94a3b8] mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-2.5 py-1.5 text-xs text-white focus:border-[#d49b38] focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="EXPERT">EXPERT</option>
                <option value="INTERN">INTERN</option>
                <option value="STAFF">STAFF</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#94a3b8] mb-1">Employment Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-2.5 py-1.5 text-xs text-white focus:border-[#d49b38] focus:outline-none"
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
              <label className="block text-[11px] text-[#94a3b8] mb-1">Employment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-2.5 py-1.5 text-xs text-white focus:border-[#d49b38] focus:outline-none"
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
              <label className="block text-[11px] text-[#94a3b8] mb-1">Project Assignment</label>
              <select
                value={assignmentFilter}
                onChange={(e) => {
                  setAssignmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-2.5 py-1.5 text-xs text-white focus:border-[#d49b38] focus:outline-none"
              >
                <option value="">All Employees</option>
                <option value="ASSIGNED">ASSIGNED to Project</option>
                <option value="UNASSIGNED">UNASSIGNED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <Alert className="border-red-900/50 bg-red-950/30 text-red-400">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-xs">{errorMsg}</span>
          </Alert>
        )}

        {/* Directory Table */}
        <div className="rounded-xl border border-[#182238] bg-[#151c2e] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#182238] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>Employee Master Directory</span>
              <span className="rounded-full bg-[#182238] px-2 py-0.5 text-[11px] text-[#d49b38] font-mono">
                {totalItems} Records
              </span>
            </h2>
          </div>

          {loadingDirectory ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#0b101b] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center text-[#94a3b8]">
              <Users className="h-10 w-10 mx-auto text-[#64748b] mb-3" />
              <p className="text-sm font-semibold text-white">No employees found</p>
              <p className="text-xs text-[#64748b] mt-1">Try adjusting your search query or filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b101b] text-[#94a3b8] uppercase text-[10px] tracking-wider border-b border-[#182238]">
                  <tr>
                    <th className="px-5 py-3.5">Employee Code</th>
                    <th className="px-5 py-3.5">Name & Contact</th>
                    <th className="px-5 py-3.5">Professional Role</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Employment Type</th>
                    <th className="px-5 py-3.5">Dept & Designation</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Project Allocation</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182238] text-white">
                  {employees.map((emp) => {
                    const activeProjectsCount = emp.projectMemberships?.length || 0;
                    const isAssigned = activeProjectsCount > 0;

                    return (
                      <tr key={emp.id} className="hover:bg-[#182238]/40 transition-colors">
                        {/* Prominent Employee Code */}
                        <td className="px-5 py-4 font-mono font-bold">
                          <Link href={`/hr/employees/${emp.id}`} className="hover:underline">
                            <span className="rounded-md bg-gradient-to-r from-[#d49b38]/20 to-[#c48b28]/10 border border-[#d49b38]/40 px-2.5 py-1 text-[#d49b38] text-xs">
                              {emp.employeeCode}
                            </span>
                          </Link>
                        </td>

                        {/* Name & Email */}
                        <td className="px-5 py-4">
                          <Link href={`/hr/employees/${emp.id}`} className="hover:underline">
                            <div className="font-semibold text-white text-xs">{emp.fullName}</div>
                          </Link>
                          <div className="text-[11px] text-[#94a3b8] mt-0.5">{emp.workEmail}</div>
                        </td>

                        {/* Professional Role */}
                        <td className="px-5 py-4 font-medium text-[#e2e8f0]">
                          {emp.professionalRole}
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              emp.category === 'EXPERT'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : emp.category === 'INTERN'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : 'bg-gray-500/10 text-gray-300 border border-gray-500/30'
                            }`}
                          >
                            {emp.category}
                          </span>
                        </td>

                        {/* Employment Type */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
                              emp.employmentType === 'PERMANENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {emp.employmentType}
                          </span>
                        </td>

                        {/* Department & Designation */}
                        <td className="px-5 py-4">
                          <div className="text-white font-medium">{emp.designation}</div>
                          <div className="text-[11px] text-[#94a3b8]">{emp.department}</div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              emp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : emp.status === 'ONBOARDING'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : emp.status === 'ON_LEAVE'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>

                        {/* Allocation Status */}
                        <td className="px-5 py-4">
                          {isAssigned ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <FolderGit2 className="h-3 w-3" />
                              <span>Assigned ({activeProjectsCount})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[#94a3b8] text-[11px] bg-[#182238] px-2 py-0.5 rounded">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Action Link */}
                        <td className="px-5 py-4 text-right">
                          <Link href={`/hr/employees/${emp.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#182238] bg-[#0b101b] text-[#d49b38] hover:bg-[#182238] h-7 px-2.5 text-[11px]"
                            >
                              View Record
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-5 py-3.5 bg-[#0b101b] border-t border-[#182238] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94a3b8]">
            <div>
              Showing {employees.length} of {totalItems} records (Page {currentPage} of {totalPages})
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loadingDirectory}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="border-[#182238] bg-[#151c2e] text-[#94a3b8] hover:text-white h-8 px-2.5"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loadingDirectory}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="border-[#182238] bg-[#151c2e] text-[#94a3b8] hover:text-white h-8 px-2.5"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
