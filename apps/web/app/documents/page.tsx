'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { DocumentBrowser } from '@/components/documents/document-browser';
import { apiRequest } from '@/lib/api-client';
import { Loader2, AlertCircle, FileText, FolderCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootDocumentsPage() {
  const [identity, setIdentity] = useState<{
    entityType: string;
    entityId: string;
    title: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspaceIdentity() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await apiRequest<{
          success: boolean;
          data: {
            employeeId?: string;
            employeeCode?: string;
            firstName?: string;
            lastName?: string;
            organizationId?: string;
            orgName?: string;
          };
        }>('/documents/employee/me');

        if (res && res.data && res.data.employeeId) {
          setIdentity({
            entityType: 'Employee',
            entityId: res.data.employeeId,
            title: `${res.data.firstName || ''} ${res.data.lastName || ''} (${res.data.employeeCode || 'EMP'}) Document Repository`,
          });
        } else if (res && res.data && res.data.organizationId) {
          setIdentity({
            entityType: 'Organization',
            entityId: res.data.organizationId,
            title: `${res.data.orgName || 'Organization'} Document Vault`,
          });
        } else {
          setErrorMsg('Unable to locate your document workspace identity.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to authorize document repository access.');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceIdentity();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Document Management Repository</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#B45309] border border-[#FDE68A]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B45309]" />
                AES-256 Encrypted Storage
              </span>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Secure enterprise document repository with presigned upload URLs, automatic MIME validation, and folder hierarchy controls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#475569] border border-[#E2E8F0]">
              <FolderCheck className="h-4 w-4 text-[#d49b38]" />
              Role Isolation Active
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-[#d49b38] mb-3" />
            <p className="text-sm font-semibold text-[#0F172A]">Authorizing Document Workspace...</p>
            <p className="text-xs text-[#64748B] mt-1">Fetching your secure role identity &amp; folder permissions.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#991B1B]">Workspace Authorization Error</h3>
            <p className="text-xs text-[#B91C1C] max-w-md mx-auto">{errorMsg}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-2 text-xs">
              Retry Connection
            </Button>
          </div>
        )}

        {/* Document Browser Component */}
        {!loading && identity && (
          <DocumentBrowser
            entityType={identity.entityType}
            entityId={identity.entityId}
            entityTitle={identity.title}
          />
        )}
      </div>
    </AppShell>
  );
}
