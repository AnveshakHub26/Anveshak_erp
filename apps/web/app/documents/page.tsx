'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import {
  Building2,
  Users,
  Search,
  FolderGit2,
  FileText,
  ShieldCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DocumentManagementLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'employees' ? 'employees' : 'organizations';

  const [activeTab, setActiveTab] = useState<'organizations' | 'employees'>(initialTab);

  // Global Search
  const [globalQuery, setGlobalQuery] = useState('');

  // ORGANIZATIONS STATE
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgTotal, setOrgTotal] = useState(0);
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatus, setOrgStatus] = useState('ALL');
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // EMPLOYEES STATE
  const [emps, setEmps] = useState<any[]>([]);
  const [empTotal, setEmpTotal] = useState(0);
  const [empPage, setEmpPage] = useState(1);
  const [empTotalPages, setEmpTotalPages] = useState(1);
  const [empSearch, setEmpSearch] = useState('');
  const [empDept, setEmpDept] = useState('ALL');
  const [empType, setEmpType] = useState('ALL');
  const [empStatus, setEmpStatus] = useState('ALL');
  const [loadingEmps, setLoadingEmps] = useState(true);

  // Fetch Organizations Overview
  const fetchOrganizations = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const q = globalQuery || orgSearch;
      const res = await apiRequest<{
        success: boolean;
        data: {
          items: any[];
          total: number;
          page: number;
          totalPages: number;
        };
      }>(
        `/documents/overview/organizations?search=${encodeURIComponent(
          q,
        )}&status=${orgStatus}&page=${orgPage}&limit=12`,
      );
      if (res && res.data) {
        setOrgs(res.data.items || []);
        setOrgTotal(res.data.total || 0);
        setOrgTotalPages(res.data.totalPages || 1);
      }
    } catch {
      setOrgs([]);
    } finally {
      setLoadingOrgs(false);
    }
  }, [globalQuery, orgSearch, orgStatus, orgPage]);

  // Fetch Employees Overview
  const fetchEmployees = useCallback(async () => {
    setLoadingEmps(true);
    try {
      const q = globalQuery || empSearch;
      const res = await apiRequest<{
        success: boolean;
        data: {
          items: any[];
          total: number;
          page: number;
          totalPages: number;
        };
      }>(
        `/documents/overview/employees?search=${encodeURIComponent(
          q,
        )}&department=${empDept}&employmentType=${empType}&status=${empStatus}&page=${empPage}&limit=12`,
      );
      if (res && res.data) {
        setEmps(res.data.items || []);
        setEmpTotal(res.data.total || 0);
        setEmpTotalPages(res.data.totalPages || 1);
      }
    } catch {
      setEmps([]);
    } finally {
      setLoadingEmps(false);
    }
  }, [globalQuery, empSearch, empDept, empType, empStatus, empPage]);

  useEffect(() => {
    if (activeTab === 'organizations') {
      fetchOrganizations();
    } else {
      fetchEmployees();
    }
  }, [activeTab, fetchOrganizations, fetchEmployees]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Enterprise Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Document Management Repository</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              Entity-Centric Vault
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise document repository organized by Organizations, Projects, and Workforce Employees.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Search documents, orgs, employees..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          {globalQuery && (
            <button
              onClick={() => setGlobalQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Primary Segmented Controls / View Switcher */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => {
            setActiveTab('organizations');
            router.replace('/documents?tab=organizations');
          }}
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'organizations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Organizations ({orgTotal})
        </button>

        <button
          onClick={() => {
            setActiveTab('employees');
            router.replace('/documents?tab=employees');
          }}
          className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'employees'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          Employees ({empTotal})
        </button>
      </div>

      {/* SECTION A: ORGANIZATIONS VIEW */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          {/* Organization Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Filter className="h-3.5 w-3.5 text-slate-400" /> Status Filter:
              </span>
              {['ALL', 'APPROVED', 'UNDER_REVIEW', 'SUBMITTED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setOrgStatus(st);
                    setOrgPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    orgStatus === st
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrganizations}
              className="text-xs flex items-center gap-1 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingOrgs ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {/* Organizations Enterprise Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Organization ID</th>
                    <th className="p-3.5">Legal Name</th>
                    <th className="p-3.5">Applicant Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Projects</th>
                    <th className="p-3.5 text-center">Documents</th>
                    <th className="p-3.5">Last Updated</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingOrgs ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
                        Loading organization repositories...
                      </td>
                    </tr>
                  ) : orgs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No organizations found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    orgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-600">{org.orgNumber}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {org.legalName}
                          {org.tradeName && <span className="block text-[11px] font-normal text-slate-400">{org.tradeName}</span>}
                        </td>
                        <td className="p-3.5 text-slate-600">{org.type || 'Company'}</td>
                        <td className="p-3.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              org.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            }`}
                          >
                            {org.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                            <FolderGit2 className="h-3 w-3 text-purple-600" />
                            {org.projectCount}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                            <FileText className="h-3 w-3 text-blue-600" />
                            {org.documentCount}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {new Date(org.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            onClick={() => router.push(`/documents/organizations/${org.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1 rounded-md transition-all shadow-2xs"
                          >
                            Open Repository <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {orgTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
                <span>
                  Showing page <strong>{orgPage}</strong> of <strong>{orgTotalPages}</strong> ({orgTotal} total)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={orgPage <= 1}
                    onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={orgPage >= orgTotalPages}
                    onClick={() => setOrgPage((p) => p + 1)}
                    className="text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B: EMPLOYEES VIEW */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Employee Filters Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-slate-400" /> Type:
                </span>
                {['ALL', 'PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT'].map((tp) => (
                  <button
                    key={tp}
                    onClick={() => {
                      setEmpType(tp);
                      setEmpPage(1);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      empType === tp
                        ? 'bg-cyan-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {tp}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchEmployees}
                className="text-xs flex items-center gap-1 self-start sm:self-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingEmps ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs border-t border-slate-100 pt-2.5">
              <span className="font-bold text-slate-600">Status:</span>
              {['ALL', 'ACTIVE', 'ONBOARDING', 'ON_LEAVE', 'INACTIVE'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setEmpStatus(st);
                    setEmpPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-all ${
                    empStatus === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Employees Enterprise Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Employee ID</th>
                    <th className="p-3.5">Employee Name</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">Employment Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Documents</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingEmps ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-600 mx-auto mb-2" />
                        Loading employee document vaults...
                      </td>
                    </tr>
                  ) : emps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No employee document records found.
                      </td>
                    </tr>
                  ) : (
                    emps.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-cyan-700">{emp.employeeCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {emp.fullName}
                          <span className="block text-[11px] font-mono text-slate-400">{emp.workEmail}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{emp.department}</td>
                        <td className="p-3.5 text-slate-600">{emp.designation}</td>
                        <td className="p-3.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {emp.employmentType}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              emp.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-700">
                            <FileText className="h-3 w-3 text-cyan-600" />
                            {emp.documentCount} Files
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            onClick={() => router.push(`/documents/employees/${emp.id}`)}
                            className="bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-semibold px-3 py-1 rounded-md transition-all shadow-2xs"
                          >
                            Open Repository <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {empTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
                <span>
                  Showing page <strong>{empPage}</strong> of <strong>{empTotalPages}</strong> ({empTotal} total)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={empPage <= 1}
                    onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                    className="text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={empPage >= empTotalPages}
                    onClick={() => setEmpPage((p) => p + 1)}
                    className="text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
