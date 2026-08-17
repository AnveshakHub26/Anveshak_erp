'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface MyDeliverablesTabProps {
  deliverables: any[];
  myProjects: any[];
  onRefresh: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-blue-50 text-blue-800 border-blue-200',
  UNDER_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  REVISION_REQUESTED: 'bg-amber-50 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">My Project Deliverables ({deliverables.length})</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            {deliverables.filter((d) => d.status === 'APPROVED').length} Approved · {deliverables.filter((d) => d.status === 'SUBMITTED').length} Pending Review
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5 text-[#151c2e]" /> Create Deliverable Draft
        </Button>
      </div>

      {/* Deliverables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliverables.map((d: any) => (
          <div key={d.id} className="p-5 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#d49b38] transition-colors space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] text-[#d49b38] font-bold block">{d.project?.projectCode}</span>
                <h4 className="text-sm font-bold text-[#0F172A]">{d.title}</h4>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border uppercase ${STATUS_BADGES[d.status] || STATUS_BADGES.DRAFT}`}>
                {d.status}
              </span>
            </div>

            {d.description && <p className="text-xs text-[#64748B] line-clamp-2">{d.description}</p>}

            {d.reviewNotes && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Reviewer Notes:</span>
                <p className="text-[#0F172A] italic">&quot;{d.reviewNotes}&quot;</p>
              </div>
            )}

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>Created: {new Date(d.createdAt).toLocaleDateString()}</span>
              {(d.status === 'DRAFT' || d.status === 'REVISION_REQUESTED') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmitDeliverable(d.projectId, d.id)}
                  className="text-xs font-semibold text-[#0F172A]"
                >
                  Submit for Review
                </Button>
              )}
            </div>
          </div>
        ))}

        {deliverables.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] shadow-xs">
            No deliverables registered for your assigned projects yet.
          </div>
        )}
      </div>

      {/* CREATE DRAFT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Create Deliverable Draft</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Select Project *</label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="">Select Project</option>
                  {myProjects.map((p: any) => (
                    <option key={p.projectId || p.id} value={p.projectId || p.id}>
                      {p.projectCode}: {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Deliverable Title *</label>
                <Input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Simulation Model Final Code & Report"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Description</label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of deliverables included..."
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
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
                  {loading ? 'Creating...' : 'Create Draft'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
