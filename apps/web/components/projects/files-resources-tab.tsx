'use client';

import { useState } from 'react';
import { ProjectResourceLink } from '@anveshak/types';

interface FilesResourcesTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  files: any[];
  links: ProjectResourceLink[];
  onRefresh: () => void;
}

const RESOURCE_TYPE_BADGES: Record<string, { label: string; bg: string; border: string; text: string }> = {
  GIT_REPOSITORY: { label: 'Git Repository', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  DESIGN: { label: 'Figma / Design', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  DOCUMENTATION: { label: 'Docs / Notion', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  DATASET: { label: 'Dataset', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  API: { label: 'API Endpoint', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  CLOUD_STORAGE: { label: 'Cloud Storage', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  OTHER: { label: 'External Resource', bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400' },
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Project Files & Shared Resources</h2>
          <p className="text-xs text-slate-400">
            {files.length} Project Documents · {links.length} External Links (Git, Figma, Documentation)
          </p>
        </div>
        {!isLocked && (
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-emerald-500/20 transition"
          >
            + Add Resource Link
          </button>
        )}
      </div>

      {/* EXTERNAL RESOURCE LINKS SECTION */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          External Shared Links & Repositories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: any) => {
            const badge = RESOURCE_TYPE_BADGES[link.resourceType] || RESOURCE_TYPE_BADGES.OTHER;
            return (
              <div
                key={link.id}
                className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${badge.bg} ${badge.border} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{link.title}</h4>
                  {link.description && <p className="text-xs text-slate-400 line-clamp-2 mt-1">{link.description}</p>}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition truncate max-w-[200px]"
                  >
                    Open Resource ↗
                  </a>
                  {!isLocked && (
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-[11px] text-rose-400 hover:bg-rose-500/10 px-2 py-0.5 rounded transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {links.length === 0 && (
            <div className="col-span-full p-6 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400">
              No external resource links added yet (e.g. GitHub repos, Figma designs, Notion docs).
            </div>
          )}
        </div>
      </div>

      {/* PROJECT DOCUMENTS SECTION */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Uploaded Technical & Deliverable Documents
        </h3>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          {files.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {files.map((file: any) => (
                  <tr key={file.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-medium text-slate-200">{file.title || file.fileName}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{file.entityType}</td>
                    <td className="px-4 py-3 text-slate-400">{file.uploader?.email || 'System'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/v1/documents/${file.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
                      >
                        Download ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No technical or deliverable documents attached to this project yet.
            </div>
          )}
        </div>
      </div>

      {/* ADD RESOURCE LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Add External Project Resource Link</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleAddLink} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Resource Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GitHub Monorepo Repository"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">URL</label>
                <input
                  required
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/company/project-repo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Resource Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
