'use client';

import { useState } from 'react';
import { ProjectDeliverable, ProjectMilestone } from '@anveshak/types';

interface DeliverablesTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  deliverables: ProjectDeliverable[];
  milestones: ProjectMilestone[];
  onRefresh: () => void;
}

const DELIVERABLE_STATUS_BADGES: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  UNDER_REVIEW: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REVISION_REQUESTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export function DeliverablesTab({
  projectId,
  isLocked,
  isAdminOrPm,
  deliverables,
  milestones,
  onRefresh,
}: DeliverablesTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewDeliverable, setReviewDeliverable] = useState<ProjectDeliverable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestoneId, setMilestoneId] = useState('');

  // Review Form State
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_REVISION'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          milestoneId: milestoneId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create deliverable');

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

  const handleSubmitDeliverable = async (deliverableId: string) => {
    if (isLocked) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/deliverables/${deliverableId}/submit`, {
        method: 'POST',
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Failed to submit deliverable:', err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDeliverable) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/deliverables/${reviewDeliverable.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to review deliverable');

      setReviewDeliverable(null);
      setReviewNotes('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Project Deliverables</h2>
          <p className="text-xs text-slate-400">
            {deliverables.length} Total · {deliverables.filter((d) => d.status === 'APPROVED').length} Approved · {deliverables.filter((d) => d.status === 'SUBMITTED').length} Pending Review
          </p>
        </div>
        {!isLocked && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-purple-500/20 transition"
          >
            + New Deliverable Draft
          </button>
        )}
      </div>

      {/* Deliverables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliverables.map((d: any) => (
          <div key={d.id} className="p-5 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-200">{d.title}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase ${DELIVERABLE_STATUS_BADGES[d.status] || DELIVERABLE_STATUS_BADGES.DRAFT}`}>
                {d.status}
              </span>
            </div>

            {d.description && <p className="text-xs text-slate-400 line-clamp-2">{d.description}</p>}

            {d.reviewNotes && (
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Review Notes:</span>
                <p className="text-slate-300 italic">"{d.reviewNotes}"</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Created: {new Date(d.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {(d.status === 'DRAFT' || d.status === 'REVISION_REQUESTED') && !isLocked && (
                  <button
                    onClick={() => handleSubmitDeliverable(d.id)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded text-xs transition"
                  >
                    Submit for Review
                  </button>
                )}

                {d.status === 'SUBMITTED' && isAdminOrPm && !isLocked && (
                  <button
                    onClick={() => {
                      setReviewDeliverable(d);
                      setDecision('APPROVE');
                      setReviewNotes('');
                    }}
                    className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded text-xs transition"
                  >
                    Review Deliverable
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {deliverables.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400">
            No deliverables registered for this project yet.
          </div>
        )}
      </div>

      {/* CREATE DELIVERABLE DRAFT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Create Deliverable Draft</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Thermal Simulation Final Technical Report"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of deliverables and scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Milestone (Optional)</label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">No Milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      M{m.sequence}: {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
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

      {/* REVIEW DELIVERABLE MODAL */}
      {reviewDeliverable && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Review Deliverable: {reviewDeliverable.title}</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Decision</label>
                <select
                  value={decision}
                  onChange={(e: any) => setDecision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="APPROVE">Approve Deliverable</option>
                  <option value="REQUEST_REVISION">Request Revision</option>
                  <option value="REJECT">Reject Deliverable</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Review Notes {decision !== 'APPROVE' && <span className="text-rose-400">*</span>}</label>
                <textarea
                  required={decision !== 'APPROVE'}
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={decision === 'APPROVE' ? 'Optional feedback...' : 'Explain required changes or reasons for rejection...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReviewDeliverable(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
