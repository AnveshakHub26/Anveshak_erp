'use client';

import { useState } from 'react';
import { ProjectMilestone, ProjectTask, ProjectMember } from '@anveshak/types';

interface ExecutionTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  members: ProjectMember[];
  onRefresh: () => void;
}

const TASK_STATUSES: Array<{ id: string; label: string; bg: string; border: string }> = [
  { id: 'TODO', label: 'To Do', bg: 'bg-slate-900/40', border: 'border-slate-800' },
  { id: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-blue-950/20', border: 'border-blue-900/40' },
  { id: 'IN_REVIEW', label: 'In Review', bg: 'bg-purple-950/20', border: 'border-purple-900/40' },
  { id: 'COMPLETED', label: 'Completed', bg: 'bg-emerald-950/20', border: 'border-emerald-900/40' },
  { id: 'BLOCKED', label: 'Blocked', bg: 'bg-rose-950/20', border: 'border-rose-900/40' },
];

const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function ExecutionTab({
  projectId,
  isLocked,
  isAdminOrPm,
  milestones,
  tasks,
  members,
  onRefresh,
}: ExecutionTabProps) {
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Milestone Form State
  const [mTitle, setMTitle] = useState('');
  const [mDescription, setMDescription] = useState('');
  const [mDueDate, setMDueDate] = useState('');
  const [mSequence, setMSequence] = useState(milestones.length + 1);

  // Task Form State
  const [tTitle, setTTitle] = useState('');
  const [tDescription, setTDescription] = useState('');
  const [tAssignee, setTAssignee] = useState('');
  const [tMilestoneId, setTMilestoneId] = useState('');
  const [tPriority, setTPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [tDueDate, setTDueDate] = useState('');
  const [tEstHours, setTEstHours] = useState('');

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mTitle,
          description: mDescription || undefined,
          dueDate: mDueDate,
          sequence: Number(mSequence),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create milestone');

      setShowMilestoneModal(false);
      setMTitle('');
      setMDescription('');
      setMDueDate('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tTitle,
          description: tDescription || undefined,
          assigneeEmployeeId: tAssignee,
          milestoneId: tMilestoneId || undefined,
          priority: tPriority,
          dueDate: tDueDate || undefined,
          estimatedHours: tEstHours ? Number(tEstHours) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');

      setShowTaskModal(false);
      setTTitle('');
      setTDescription('');
      setTAssignee('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    if (isLocked) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="space-[#1e293b] space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Project Execution Workspace</h2>
          <p className="text-xs text-slate-400">
            {milestones.length} Milestones · {tasks.length} Tasks ({tasks.filter((t) => t.status === 'COMPLETED').length} Completed)
          </p>
        </div>
        {isAdminOrPm && !isLocked && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              + Add Milestone
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-cyan-500/20 transition"
            >
              + Create Task
            </button>
          </div>
        )}
      </div>

      {/* MILESTONES SUMMARY CARDS */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Project Milestones</h3>
        {milestones.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400">
            No milestones created for this project yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => (
              <div key={m.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    M{m.sequence}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${m.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {m.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">{m.title}</h4>
                {m.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{m.description}</p>}
                
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Due: {new Date(m.dueDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-cyan-400">{m.progressPct ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500" style={{ width: `${m.progressPct ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KANBAN TASK BOARD */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Task Execution Board</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {TASK_STATUSES.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`p-3 rounded-xl ${col.bg} border ${col.border} min-h-[400px] flex flex-col`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300">{col.label}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full border border-slate-800">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.map((t: any) => (
                    <div key={t.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-medium ${PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM}`}>
                          {t.priority}
                        </span>
                        {t.dueDate && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      <h5 className="text-xs font-medium text-slate-200">{t.title}</h5>
                      
                      {t.assigneeEmployee && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                          <div className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[9px] font-bold text-cyan-300">
                            {t.assigneeEmployee.fullName.charAt(0)}
                          </div>
                          <span className="truncate">{t.assigneeEmployee.fullName}</span>
                        </div>
                      )}

                      {isAdminOrPm && !isLocked && (
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end gap-1">
                          <select
                            value={t.status}
                            onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                            className="bg-slate-950 text-[10px] text-slate-300 border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-cyan-500"
                          >
                            {TASK_STATUSES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move to {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800/50 rounded-lg">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE MILESTONE MODAL */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Add Project Milestone</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g. Phase 1 Architecture"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="Milestone scope and objectives..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Sequence</label>
                  <input
                    type="number"
                    min={1}
                    value={mSequence}
                    onChange={(e) => setMSequence(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Due Date</label>
                  <input
                    required
                    type="date"
                    value={mDueDate}
                    onChange={(e) => setMDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Create Project Task</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Task Title</label>
                <input
                  required
                  type="text"
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="e.g. Implement REST endpoints"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Assignee (Active Project Members Only)</label>
                <select
                  required
                  value={tAssignee}
                  onChange={(e) => setTAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select Assignee</option>
                  {activeMembers.map((m: any) => (
                    <option key={m.id} value={m.employeeId}>
                      {m.employee.fullName} ({m.employee.employeeCode}) — {m.projectRole}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Milestone (Optional)</label>
                  <select
                    value={tMilestoneId}
                    onChange={(e) => setTMilestoneId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">No Milestone</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        M{m.sequence}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Priority</label>
                  <select
                    value={tPriority}
                    onChange={(e: any) => setTPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={tDueDate}
                    onChange={(e) => setTDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min={0}
                    value={tEstHours}
                    onChange={(e) => setTEstHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
