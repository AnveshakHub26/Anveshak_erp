'use client';

import { apiRequest } from '@/lib/api-client';
import { useState } from 'react';
import { ProjectTask } from '@anveshak/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MyTasksTabProps {
  tasks: ProjectTask[];
  onRefresh: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
  IN_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  BLOCKED: 'bg-rose-50 text-rose-800 border-rose-200',
};

const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
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
      await apiRequest(`/employee/tasks/${selectedTask.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          progressPct: Number(progressPct),
          actualHours: actualHours ? Number(actualHours) : undefined,
        }),
      });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">My Assigned Tasks ({tasks.length})</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            {tasks.filter((t) => t.status === 'COMPLETED').length} Completed · {tasks.filter((t) => t.status === 'IN_PROGRESS').length} In Progress
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED', 'DUE_SOON', 'OVERDUE'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap border ${
                filter === f
                  ? 'bg-[#d49b38] text-[#151c2e] border-[#d49b38]'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
        {filteredTasks.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] text-[10px] uppercase border-b border-[#E2E8F0] font-semibold">
              <tr>
                <th className="px-4 py-3">Task Title</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {filteredTasks.map((t: any) => {
                const isOverdue = t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < new Date().getTime();

                return (
                  <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#0F172A]">{t.title}</div>
                      {t.description && <div className="text-[11px] text-[#64748B] line-clamp-1">{t.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${STATUS_BADGES[t.status] || STATUS_BADGES.TODO}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#0F172A] font-bold">
                      {t.progressPct ?? 0}%
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {t.dueDate ? (
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-[#64748B]'}>
                          {new Date(t.dueDate).toLocaleDateString()} {isOverdue && '⚠️'}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTask(t);
                          setStatus(t.status);
                          setProgressPct(t.progressPct || 0);
                          setActualHours(t.actualHours ? String(t.actualHours) : '');
                        }}
                        className="bg-[#151c2e] hover:bg-[#1e293b] text-white text-xs font-bold"
                      >
                        Update Progress
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-xs text-[#64748B]">
            No tasks found matching filter &apos;{filter}&apos;.
          </div>
        )}
      </div>

      {/* UPDATE TASK PROGRESS MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Update Task Progress: {selectedTask.title}</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed (Sets 100%)</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Progress Percentage ({progressPct}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#d49b38]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Actual Hours Spent (Optional)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
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
                  {loading ? 'Saving...' : 'Save Progress'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
