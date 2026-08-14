'use client';

import { useState } from 'react';

interface MyDeliverablesTabProps {
  deliverables: any[];
  myProjects: any[];
  onRefresh: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  UNDER_REVIEW: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REVISION_REQUESTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export function MyDeliverablesTab({ deliverables, myProjects, onRefresh }: MyDeliverablesTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [projectId, setProjectId] = useState(myProjects[0]?.projectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create deliverable draft');

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeliverable = async (pId: string, dId: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${pId}/deliverables/${dId}/submit`, {
        method: 'POST',
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Failed to submit deliverable:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2e] p-4 rounded-xl border border-[#182238]">
        <div>
          <h3 className="text-sm font-semibold text-white">My Project Deliverables ({deliverables.length})</h3>
          <p className="text-xs text-[#94a3b8]">
            {deliverables.filter((d) => d.status === 'APPROVED').length} Approved · {deliverables.filter((d) => d.status === 'SUBMITTED').length} Pending Review
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition"
        >
          + Create Deliverable Draft
        </button>
      </div>

      {/* Deliverables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliverables.map((d: any) => (
          <div key={d.id} className="p-5 bg-[#151c2e] rounded-xl border border-[#182238] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] text-[#d49b38] block">{d.project?.projectCode}</span>
                <h4 className="text-sm font-semibold text-white">{d.title}</h4>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase ${STATUS_BADGES[d.status] || STATUS_BADGES.DRAFT}`}>
                {d.status}
              </span>
            </div>

            {d.description && <p className="text-xs text-[#94a3b8] line-clamp-2">{d.description}</p>}

            {d.reviewNotes && (
              <div className="p-3 bg-[#0b101b] border border-[#182238] rounded-lg text-xs space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#94a3b8]">Reviewer Notes:</span>
                <p className="text-white italic">"{d.reviewNotes}"</p>
              </div>
            )}

            <div className="pt-3 border-t border-[#182238] flex items-center justify-between text-xs text-[#94a3b8]">
              <span>Created: {new Date(d.createdAt).toLocaleDateString()}</span>
              {(d.status === 'DRAFT' || d.status === 'REVISION_REQUESTED') && (
                <button
                  onClick={() => handleSubmitDeliverable(d.projectId, d.id)}
                  className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded text-xs transition"
                >
                  Submit for Review
                </button>
              )}
            </div>
          </div>
        ))}

        {deliverables.length === 0 && (
          <div className="col-span-full p-8 text-center bg-[#151c2e] rounded-xl border border-[#182238] text-xs text-[#64748b]">
            No deliverables registered for your assigned projects yet.
          </div>
        )}
      </div>

      {/* CREATE DRAFT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151c2e] border border-[#182238] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Create Deliverable Draft</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleCreateDraft} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1">Select Project</label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Project</option>
                  {myProjects.map((p: any) => (
                    <option key={p.projectId || p.id} value={p.projectId || p.id}>
                      {p.projectCode}: {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1">Deliverable Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Simulation Model Final Code & Report"
                  className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of deliverables included..."
                  className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-[#94a3b8] text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
