'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { DocumentBrowser } from '@/components/documents/document-browser';
import {
  UserCheck,
  Building2,
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Briefcase,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmployeeDocumentRepositoryPage() {
  const params = useParams();
  const router = useRouter();
  const empId = params.id as string;

  const [data, setData] = useState<{
    employee: any;
    documents: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmpData() {
      if (!empId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await apiRequest<{
          success: boolean;
          data: {
            employee: any;
            documents: any[];
          };
        }>(`/documents/overview/employees/${empId}`);
        if (res && res.data) {
          setData(res.data);
        } else {
          setErrorMsg('Failed to load employee document workspace details.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading employee document repository.');
      } finally {
        setLoading(false);
      }
    }
    loadEmpData();
  }, [empId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-800">Opening Employee Document Workspace...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Button variant="outline" onClick={() => router.push('/documents')} className="text-xs flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Document Management
        </Button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Employee Repository Access Error</h3>
          <p className="text-xs text-rose-700">{errorMsg || 'Employee record not found.'}</p>
        </div>
      </div>
    );
  }

  const emp = data.employee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Enterprise Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/documents" className="hover:text-indigo-600 transition-colors font-medium">
          Documents
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link href="/documents?tab=employees" className="hover:text-indigo-600 transition-colors font-medium">
          Employees
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-bold text-slate-900">{emp.fullName}</span>
      </nav>

      {/* Employee Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-md">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{emp.fullName}</h1>
                <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-700 ring-1 ring-cyan-200">
                  {emp.employeeCode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    emp.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  }`}
                >
                  {emp.status}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {emp.employmentType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                {emp.designation} • {emp.department}
                <span className="text-slate-300">•</span>
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {emp.workEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/documents?tab=employees')}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Employee Directory
            </Button>
          </div>
        </div>

        {/* Employee Metadata Quick Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Personal Docs</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
              <FileText className="h-4 w-4 text-cyan-600" />
              {data.documents.length} Files
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Workforce Category</span>
            <p className="font-bold text-slate-800 text-xs mt-0.5">
              {emp.category || 'STAFF'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Organization</span>
            <p className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {emp.organization?.legalName || 'Anveshak Corporate Office'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Date of Joining</span>
            <p className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {new Date(emp.joiningDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Document Workspace Browser */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-cyan-50/50 p-4 text-xs text-cyan-900 flex items-center justify-between">
          <div>
            <p className="font-bold">Employee Confidential Document Repository</p>
            <p className="text-slate-600 mt-0.5">
              Contains identity verifications (Aadhaar/PAN/Passport), educational marksheets, offer letters, NDA, and HR compliance files.
            </p>
          </div>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-bold text-cyan-700 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Role Isolated
          </span>
        </div>

        <DocumentBrowser
          entityType="Employee"
          entityId={emp.id}
          entityTitle={`${emp.fullName} Document Vault`}
        />
      </div>
    </div>
  );
}
