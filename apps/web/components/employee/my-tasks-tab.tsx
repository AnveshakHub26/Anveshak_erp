'use client';

import { useState } from 'react';
import { ProjectTask } from '@anveshak/types';

interface MyTasksTabProps {
  tasks: ProjectTask[];
  onRefresh: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  TODO: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_REVIEW: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  BLOCKED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function MyTasksTab({ tasks, onRefresh }: MyTasksTabProps) {
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task Progress Form State
  const [status, setStatus] = useState<string>('IN_PROGRESS');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [actualHours, setActualHours] = useState<string>('');

  const filteredTasks = tasks.filter((t: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'DUE_SOON') {
      if (!t.dueDate || t.status === 'COMPLETED') return false;
      const due = new Date(t.dueDate).getTime();
      const now = new Date().getTime();
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      return due >= now && due - now <= threeDays;
    }
    if (filter === 'OVERDUE') {
      if (!t.dueDate || t.status === 'COMPLETED') return false;
      return new Date(t.dueDate).getTime() < new Date().getTime();
    }
    return t.status === filter;
  });

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employee/tasks/${selectedTask.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          progressPct: Number(progressPct),
          actualHours: actualHours ? Number(actualHours) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task progress');

      setSelectedTask(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2e] p-4 rounded-xl border border-[#182238]">
        <div>
          <h3 className="text-sm font-semibold text-white">My Assigned Tasks ({tasks.length})</h3>
          <p className="text-xs text-[#94a3b8]">
            {tasks.filter((t) => t.status === 'COMPLETED').length} Completed · {tasks.filter((t) => t.status === 'IN_PROGRESS').length} In Progress
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED', 'DUE_SOON', 'OVERDUE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                filter === f ? 'bg-[#d49b38] text-slate-950 font-bold' : 'bg-[#0b101b] text-[#94a3b8] hover:text-white border border-[#182238]'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#151c2e] rounded-xl border border-[#182238] overflow-hidden">
        {filteredTasks.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b101b] text-[#94a3b8] text-[10px] uppercase border-b border-[#182238]">
              <tr>
                <th className="px-4 py-3">Task Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182238] text-white">
              {filteredTasks.map((t: any) => {
                const isOverdue = t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < new Date().getTime();

                return (
                  <tr key={t.id} className="hover:bg-[#182238]/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{t.title}</div>
                      {t.description && <div className="text-[11px] text-[#94a3b8] line-clamp-1">{t.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-medium ${PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-medium uppercase ${STATUS_BADGES[t.status] || STATUS_BADGES.TODO}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400 font-bold">
                      {t.progressPct ?? 0}%
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {t.dueDate ? (
                        <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-[#94a3b8]'}>
                          {new Date(t.dueDate).toLocaleDateString()} {isOverdue && '⚠️'}
                        </span>
                      ) : (
                        <span className="text-[#64748b]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTask(t);
                          setStatus(t.status);
                          setProgressPct(t.progressPct || 0);
                          setActualHours(t.actualHours ? String(t.actualHours) : '');
                        }}
                        className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded text-xs transition"
                      >
                        Update Progress
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-[#64748b]">
            No tasks found matching filter '{filter}'.
          </div>
        )}
      </div>

      {/* UPDATE TASK PROGRESS MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151c2e] border border-[#182238] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Update Task Progress: {selectedTask.title}</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleUpdateProgress} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed (Sets 100%)</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1">Progress Percentage ({progressPct}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-1">Actual Hours Spent (Optional)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-800 text-[#94a3b8] text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
