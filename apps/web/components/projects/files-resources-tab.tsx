'use client';

import { useState } from 'react';
import { ProjectResourceLink } from '@anveshak/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Paperclip, ExternalLink, FileText, Download, Trash2 } from 'lucide-react';

interface FilesResourcesTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  files: any[];
  links: ProjectResourceLink[];
  onRefresh: () => void;
}

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
  files,
  links,
  onRefresh,
}: FilesResourcesTabProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [resourceType, setResourceType] = useState<string>('GIT_REPOSITORY');

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/resource-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          url,
          resourceType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add resource link');

      setShowLinkModal(false);
      setTitle('');
      setDescription('');
      setUrl('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (isLocked) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/resource-links/${linkId}`, {
        method: 'DELETE',
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Failed to delete resource link:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Project Files &amp; Shared Resources</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {files.length} Project Documents · {links.length} External Links (Git, Figma, Documentation)
          </p>
        </div>
        {!isLocked && (
          <Button
            size="sm"
            onClick={() => setShowLinkModal(true)}
            className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 text-[#151c2e]" /> Add Resource Link
          </Button>
        )}
      </div>

      {/* EXTERNAL RESOURCE LINKS SECTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          External Shared Links &amp; Repositories
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
                  {!isLocked && (
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

      {/* PROJECT DOCUMENTS SECTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          Uploaded Technical &amp; Deliverable Documents
        </h3>
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          {files.length > 0 ? (
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase font-semibold text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {files.map((file: any) => (
                  <tr key={file.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 font-bold text-[#0F172A]">{file.title || file.fileName}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-[#64748B] font-semibold">{file.entityType}</td>
                    <td className="px-4 py-3 text-[#64748B]">{file.uploader?.email || 'System'}</td>
                    <td className="px-4 py-3 text-[#64748B]">{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/v1/documents/${file.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#0F172A] hover:text-[#d49b38] transition-colors inline-flex items-center gap-1"
                      >
                        Download <Download className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No technical or deliverable documents attached to this project yet.
            </div>
          )}
        </div>
      </div>

      {/* ADD RESOURCE LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Add External Project Resource Link</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Resource Title *</label>
                <Input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GitHub Monorepo Repository"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">URL *</label>
                <Input
                  required
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  disabled={loading}
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
                >
                  {loading ? 'Adding...' : 'Add Link'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
