'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { DocumentBrowser } from '@/components/documents/document-browser';
import {
  FolderGit2,
  Building2,
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectDocumentRepositoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [data, setData] = useState<{
    project: any;
    documents: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjectData() {
      if (!projectId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await apiRequest<{
          success: boolean;
          data: {
            project: any;
            documents: any[];
          };
        }>(`/documents/overview/projects/${projectId}`);
        if (res && res.data) {
          setData(res.data);
        } else {
          setErrorMsg('Failed to load project repository details.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading project document repository.');
      } finally {
        setLoading(false);
      }
    }
    loadProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-800">Opening Project Document Workspace...</p>
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
          <h3 className="text-base font-bold text-rose-900">Project Repository Access Error</h3>
          <p className="text-xs text-rose-700">{errorMsg || 'Project record not found.'}</p>
        </div>
      </div>
    );
  }

  const proj = data.project;
  const org = proj.organization;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Enterprise Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        <Link href="/documents" className="hover:text-indigo-600 transition-colors font-medium">
          Documents
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link href="/documents?tab=organizations" className="hover:text-indigo-600 transition-colors font-medium">
          Organizations
        </Link>
        {org && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={`/documents/organizations/${org.id}`}
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              {org.legalName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-bold text-slate-900">{proj.title}</span>
      </nav>

      {/* Project Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{proj.title}</h1>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-mono font-bold text-purple-700 ring-1 ring-purple-200">
                  {proj.projectCode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    proj.status === 'IN_PROGRESS'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : proj.status === 'COMPLETED'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  }`}
                >
                  {proj.status}
                </span>
              </div>
              {org && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  Client Organization:
                  <Link
                    href={`/documents/organizations/${org.id}`}
                    className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Building2 className="h-3.5 w-3.5" /> {org.legalName} ({org.orgNumber})
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {org && (
              <Button
                variant="outline"
                onClick={() => router.push(`/documents/organizations/${org.id}`)}
                className="text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to {org.legalName}
              </Button>
            )}
          </div>
        </div>

        {/* Project Metadata Quick Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Project Documents</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
              <FileText className="h-4 w-4 text-indigo-600" />
              {data.documents.length} Files
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Category / Vertical</span>
            <p className="font-bold text-slate-800 text-xs mt-0.5">
              {proj.category || 'Enterprise Development'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Timeline / Budget</span>
            <p className="font-medium text-slate-800 text-xs mt-0.5">
              {proj.timeline || 'Q1 - Q4'} • {proj.budget || 'Confidential'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Initiated On</span>
            <p className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {new Date(proj.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Document Browser for Project Scope */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-purple-50/50 p-4 text-xs text-purple-900 flex items-center justify-between">
          <div>
            <p className="font-bold">Project Document Repository Scope</p>
            <p className="text-slate-600 mt-0.5">
              Includes project requirements, technical architecture, meeting notes, deliverables, and financial reports.
            </p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-purple-700">
            Project Scope Active
          </span>
        </div>

        <DocumentBrowser
          entityType="Project"
          entityId={proj.id}
          entityTitle={`${proj.title} Document Vault`}
        />
      </div>
    </div>
  );
}
