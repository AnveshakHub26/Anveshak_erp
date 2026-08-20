'use client';

import React, { useState, useMemo } from 'react';
import { ProjectResourceLink } from '@anveshak/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Folder,
  FileText,
  Download,
  Plus,
  ExternalLink,
  Search,
  ShieldCheck,
  Lock,
  UploadCloud,
  Layers,
  Sparkles,
  Tag,
  Clock,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface FilesResourcesTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  isOrgUser?: boolean;
  folders?: any[];
  documents?: any[];
  links: ProjectResourceLink[];
  onRefresh: () => void;
}

const DEFAULT_CATEGORIES = [
  { name: 'Requirements', desc: 'BRDs, functional specs & user stories', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50/80', border: 'border-blue-200' },
  { name: 'Technical', desc: 'Architecture, API specs & code docs', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50/80', border: 'border-indigo-200' },
  { name: 'Meetings', desc: 'Agendas, MoMs & meeting recordings', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50/80', border: 'border-purple-200' },
  { name: 'Deliverables', desc: 'Sign-off artifacts & milestone files', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50/80', border: 'border-amber-200' },
  { name: 'Client Shared', desc: 'Documents shared with Organization Client', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/80', border: 'border-emerald-200' },
  { name: 'Internal', desc: 'Internal project notes & restricted docs', icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50/80', border: 'border-slate-200' },
];

const RESOURCE_TYPE_BADGES: Record<string, { label: string; bg: string; border: string; text: string }> = {
  GIT_REPOSITORY: { label: 'Git Repository', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  DESIGN: { label: 'Figma / Design', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
  DOCUMENTATION: { label: 'Docs / Notion', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  DATASET: { label: 'Dataset', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  API: { label: 'API Endpoint', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800' },
  CLOUD_STORAGE: { label: 'Cloud Storage', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
  OTHER: { label: 'External Resource', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' },
};

export function FilesResourcesTab({
  projectId,
  isLocked,
  isAdminOrPm,
  isOrgUser = false,
  folders = [],
  documents = [],
  links = [],
  onRefresh,
}: FilesResourcesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [docVisibility, setDocVisibility] = useState<'PRIVATE' | 'SHARED'>('SHARED');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // External Link Form State
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [resourceType, setResourceType] = useState<string>('GIT_REPOSITORY');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Merge server folders with default categories
  const categoriesList = useMemo(() => {
    return DEFAULT_CATEGORIES.filter((cat) => !isOrgUser || cat.name !== 'Internal').map((cat) => {
      const folderRecord = folders.find((f) => f.name === cat.name);
      const count = documents.filter((d) => d.folder?.id === folderRecord?.id || d.folder?.name === cat.name).length;
      return {
        ...cat,
        id: folderRecord?.id || null,
        count,
      };
    });
  }, [folders, documents, isOrgUser]);

  // Filtered Documents Browser
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category Filter
      if (selectedCategory) {
        const matchesCategory = doc.folder?.name === selectedCategory || (selectedCategory === 'Deliverables' && doc.entityType === 'ProjectDeliverable');
        if (!matchesCategory) return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (doc.title || doc.fileName || '').toLowerCase().includes(q);
        const folderMatch = (doc.folder?.name || '').toLowerCase().includes(q);
        const uploaderMatch = (doc.uploader?.email || '').toLowerCase().includes(q);
        return titleMatch || folderMatch || uploaderMatch;
      }
      return true;
    });
  }, [documents, selectedCategory, searchQuery]);

  // Document Upload Submit Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Get Presigned Upload URL
      const uploadUrlRes = await apiRequest('/documents/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileSize: selectedFile.size,
          entityType: 'Project',
          entityId: projectId,
          folderId: selectedFolderId || undefined,
          visibility: docVisibility,
        }),
      });

      const { uploadUrl, storageKey } = uploadUrlRes.data || uploadUrlRes;

      // 2. Upload file to presigned storage adapter
      const fileUploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
        body: selectedFile,
      });

      if (!fileUploadRes.ok) {
        throw new Error('Failed to upload physical file object to storage adapter.');
      }

      // 3. Confirm Document metadata in database
      await apiRequest('/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: docTitle.trim() || selectedFile.name,
          fileName: selectedFile.name,
          storageKey,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileSize: selectedFile.size,
          entityType: 'Project',
          entityId: projectId,
          folderId: selectedFolderId || undefined,
          visibility: docVisibility,
        }),
      });

      setShowUploadModal(false);
      setDocTitle('');
      setSelectedFile(null);
      setSelectedFolderId('');
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload project document.');
    } finally {
      setUploading(false);
    }
  };

  // Signed Download Handler
  const handleDownload = async (docId: string) => {
    try {
      const res = await apiRequest(`/documents/${docId}/download-url`);
      const downloadUrl = res.data?.downloadUrl || res.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate document download link.');
    }
  };

  // Add Resource Link Handler
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkLoading(true);
    setLinkError(null);
    try {
      await apiRequest(`/projects/${projectId}/resource-links`, {
        method: 'POST',
        body: JSON.stringify({
          title: linkTitle,
          description: linkDescription || undefined,
          url: linkUrl,
          resourceType,
        }),
      });

      setShowLinkModal(false);
      setLinkTitle('');
      setLinkDescription('');
      setLinkUrl('');
      onRefresh();
    } catch (err: any) {
      setLinkError(err.message || 'Failed to add resource link');
    } finally {
      setLinkLoading(false);
    }
  };

  // Delete Resource Link Handler
  const handleDeleteLink = async (linkId: string) => {
    if (isLocked) return;
    try {
      await apiRequest(`/projects/${projectId}/resource-links/${linkId}`, {
        method: 'DELETE',
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource link');
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Folder className="h-5 w-5 text-[#d49b38]" />
            Project Documents Repository
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {documents.length} Project Documents · {links.length} Shared External Resources
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isLocked && !isOrgUser && (
            <Button
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
            >
              <UploadCloud className="mr-1.5 h-4 w-4 text-[#151c2e]" /> Upload Document
            </Button>
          )}
          {!isLocked && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLinkModal(true)}
              className="border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] font-bold text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-[#d49b38]" /> Add External Link
            </Button>
          )}
        </div>
      </div>

      {/* DOCUMENT CATEGORIES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Document Categories
          </h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-[#d49b38] hover:underline"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoriesList.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-[#d49b38] bg-[#F5E8D0]/30 shadow-xs ring-1 ring-[#d49b38]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#cbd5e1] hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${cat.bg} border ${cat.border}`}>
                    <IconComponent className={`h-4 w-4 ${cat.color}`} />
                  </div>
                  <span className="font-mono text-xs font-bold bg-[#F8FAFC] px-2 py-0.5 rounded-full border border-[#E2E8F0] text-[#0F172A]">
                    {cat.count}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{cat.name}</h4>
                  <p className="text-[10px] text-[#64748B] line-clamp-1 mt-0.5">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR & FILTER STATUS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name or keyword..."
            className="pl-9 text-xs border-[#E2E8F0]"
          />
        </div>
        <div className="text-xs text-[#64748B] font-medium flex items-center gap-2">
          {selectedCategory && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-semibold text-[11px]">
              Category: {selectedCategory}
            </span>
          )}
          <span>Showing {filteredDocuments.length} of {documents.length} project documents</span>
        </div>
      </div>

      {/* DOCUMENT BROWSER TABLE */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        {filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredDocuments.map((doc: any) => {
                  const isShared = doc.visibility === 'SHARED' || doc.visibility === 'PUBLIC' || doc.folder?.name === 'Client Shared';
                  return (
                    <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="h-4 w-4 text-[#d49b38] shrink-0" />
                          <div>
                            <span className="font-bold text-[#0F172A]">{doc.title || doc.fileName}</span>
                            {doc.fileName && doc.title !== doc.fileName && (
                              <p className="text-[10px] text-[#64748B] font-mono">{doc.fileName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]">
                          {doc.folder?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isShared ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="h-3 w-3 mr-1 text-emerald-600" /> Client Shared
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Lock className="h-3 w-3 mr-1 text-slate-500" /> Internal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">{doc.uploader?.email || 'System'}</td>
                      <td className="px-4 py-3 text-[#64748B]">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(doc.id)}
                          className="text-xs font-bold text-[#0F172A] hover:text-[#d49b38] hover:bg-amber-50/50"
                        >
                          <Download className="h-3.5 w-3.5 mr-1 text-[#d49b38]" /> Download
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <Folder className="h-8 w-8 text-[#cbd5e1] mx-auto mb-2" />
            <p className="font-bold text-[#0F172A]">No project documents found</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {selectedCategory
                ? `No documents available in category '${selectedCategory}'.`
                : 'Upload project requirements, technical specs, or meeting notes to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* EXTERNAL SHARED RESOURCES SECTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          External Shared Resources &amp; Repositories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: any) => {
            const badge = RESOURCE_TYPE_BADGES[link.resourceType] || RESOURCE_TYPE_BADGES.OTHER;
            return (
              <div
                key={link.id}
                className="p-5 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#d49b38] transition-colors shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">{link.title}</h4>
                  {link.description && <p className="text-xs text-[#64748B] line-clamp-2 mt-1">{link.description}</p>}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#0F172A] hover:text-[#d49b38] transition-colors inline-flex items-center gap-1 truncate max-w-[200px]"
                  >
                    Open Resource <ExternalLink className="h-3 w-3" />
                  </a>
                  {!isLocked && isAdminOrPm && (
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-[11px] text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded font-semibold transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {links.length === 0 && (
            <div className="col-span-full p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] shadow-xs">
              No external resource links added yet (e.g. GitHub repos, Figma designs, Notion docs).
            </div>
          )}
        </div>
      </div>

      {/* DOCUMENT UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Upload Project Document</h3>
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Document Title *</label>
                <Input
                  required
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Project Architecture Specification v1"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Category / Folder *</label>
                <select
                  required
                  value={selectedFolderId}
                  onChange={(e) => {
                    setSelectedFolderId(e.target.value);
                    const selCat = folders.find((f) => f.id === e.target.value);
                    if (selCat?.name === 'Client Shared') {
                      setDocVisibility('SHARED');
                    }
                  }}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">-- Select Category --</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Client Visibility *</label>
                <select
                  value={docVisibility}
                  onChange={(e) => setDocVisibility(e.target.value as any)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="PRIVATE">Internal Workforce Only (PRIVATE)</option>
                  <option value="SHARED">Client Shared (Visible to Organization Client)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Select File *</label>
                <Input
                  required
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  disabled={uploading}
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RESOURCE LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Add External Project Resource Link</h3>
            {linkError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {linkError}
              </div>
            )}

            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Resource Title *</label>
                <Input
                  required
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. GitHub Monorepo Repository"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">URL *</label>
                <Input
                  required
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://github.com/company/project-repo"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Resource Type *</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="GIT_REPOSITORY">Git Repository</option>
                  <option value="DESIGN">Figma / UI Design</option>
                  <option value="DOCUMENTATION">Technical Documentation</option>
                  <option value="DATASET">Dataset / ML Model</option>
                  <option value="API">API Endpoint Specs</option>
                  <option value="CLOUD_STORAGE">Cloud Drive</option>
                  <option value="PROJECT_MANAGEMENT">Project Board</option>
                  <option value="OTHER">Other External Resource</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Description (Optional)</label>
                <Textarea
                  rows={2}
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="Additional context or notes..."
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkModal(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  disabled={linkLoading}
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
                >
                  {linkLoading ? 'Adding...' : 'Add Link'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
