'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { DocumentBrowser } from '@/components/documents/document-browser';
import {
  Building2,
  FolderGit2,
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Plus,
  ShieldCheck,
  Zap,
  Globe,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrganizationDocumentRepositoryPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [data, setData] = useState<{
    organization: any;
    directDocuments: any[];
    projects: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'projects'>('documents');

  useEffect(() => {
    async function loadOrgData() {
      if (!orgId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await apiRequest<{
          success: boolean;
          data: {
            organization: any;
            directDocuments: any[];
            projects: any[];
          };
        }>(`/documents/overview/organizations/${orgId}`);
        if (res && res.data) {
          setData(res.data);
        } else {
          setErrorMsg('Failed to load organization repository details.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading organization document repository.');
      } finally {
        setLoading(false);
      }
    }
    loadOrgData();
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-800">Opening Organization Document Repository...</p>
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
          <h3 className="text-base font-bold text-rose-900">Repository Access Error</h3>
          <p className="text-xs text-rose-700">{errorMsg || 'Organization record not found.'}</p>
        </div>
      </div>
    );
  }

  const org = data.organization;
  const projects = data.projects || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Enterprise Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/documents" className="hover:text-indigo-600 transition-colors font-medium">
          Documents
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link href="/documents?tab=organizations" className="hover:text-indigo-600 transition-colors font-medium">
          Organizations
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-bold text-slate-900">{org.legalName}</span>
      </nav>

      {/* Organization Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{org.legalName}</h1>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-700 ring-1 ring-indigo-200">
                  {org.orgNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    org.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  }`}
                >
                  {org.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {org.type || 'Enterprise Client'} {org.tradeName ? `• ${org.tradeName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/documents')}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Organization Metadata Quick Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Projects</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
              <FolderGit2 className="h-4 w-4 text-purple-600" />
              {projects.length} Projects
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Direct Organization Docs</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
              <FileText className="h-4 w-4 text-blue-600" />
              {data.directDocuments.length} Documents
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Website / Address</span>
            <p className="font-medium text-slate-800 text-xs mt-0.5 truncate">
              {org.website ? (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> {org.website}
                </a>
              ) : (
                org.address || 'Registered Enterprise'
              )}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Onboarded On</span>
            <p className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {new Date(org.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Section Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'documents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Organization Documents ({data.directDocuments.length})
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'projects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          Associated Projects ({projects.length})
        </button>
      </div>

      {/* TAB 1: ORGANIZATION DIRECT DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-indigo-50/50 p-4 text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <p className="font-bold">Organization-Level Document Vault</p>
              <p className="text-slate-600 mt-0.5">
                Contains master contracts, registration, MoUs, legal agreements, compliance, and corporate financial documents.
              </p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700">
              AES-256 Protected
            </span>
          </div>

          <DocumentBrowser
            entityType="Organization"
            entityId={org.id}
            entityTitle={`${org.legalName} Repository`}
          />
        </div>
      )}

      {/* TAB 2: PROJECTS REPOSITORY LIST */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Projects Belonging to {org.legalName}
              </h2>
              <p className="text-xs text-slate-500">
                Drill down into project-specific requirement documents, technical specifications, and deliverables.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <FolderGit2 className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No Projects Onboarded Yet</p>
              <p className="text-[11px] text-slate-400">
                This organization does not currently have any active projects linked to it.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ring-1 ring-indigo-200">
                        {proj.projectCode}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{proj.title}</h3>
                    <p className="text-xs text-slate-500">{proj.category || 'General Project Workspace'}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-indigo-500" />
                      {proj.documentCount} Documents
                    </span>

                    <Button
                      onClick={() => router.push(`/documents/projects/${proj.id}`)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      Open Project Docs <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
