'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { DocumentBrowser } from '@/components/documents/document-browser';
import { apiRequest } from '@/lib/api-client';
import { Loader2, AlertCircle, FileText, FolderCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmployeeDocumentsPage() {
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployeeIdentity() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await apiRequest<{
          success: boolean;
          data: {
            employeeId: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
          };
        }>('/documents/employee/me');

        if (res && res.data) {
          setEmployeeInfo(res.data);
        } else {
          setErrorMsg('Failed to load employee document workspace identity.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to authorize employee document workspace.');
      } finally {
        setLoading(false);
      }
    }

    loadEmployeeIdentity();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-[#d49b38] rounded-lg border border-amber-200">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-[#0F172A]">Employee Self-Service Documents</h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Personal identity, education, employment, and certification document vault
            </p>
          </div>

          {employeeInfo && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
              <FolderCheck className="h-4 w-4 mr-1.5 text-[#d49b38]" />
              {employeeInfo.employeeCode} · {employeeInfo.firstName} {employeeInfo.lastName}
            </div>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-16 text-center text-[#64748B] bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#d49b38]" />
            Initializing personal document repository...
          </div>
        ) : errorMsg || !employeeInfo ? (
          <div className="p-8 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center space-y-3">
            <AlertCircle className="h-6 w-6 mx-auto text-red-500" />
            <p className="font-semibold text-sm">{errorMsg || 'Employee profile identity missing.'}</p>
            <p className="text-xs text-red-600">
              Ensure your user account is linked to an active employee profile.
            </p>
          </div>
        ) : (
          <DocumentBrowser
            entityType="Employee"
            entityId={employeeInfo.employeeId}
            entityTitle={`${employeeInfo.firstName} ${employeeInfo.lastName}'s Personal`}
          />
        )}
      </div>
    </AppShell>
  );
}
