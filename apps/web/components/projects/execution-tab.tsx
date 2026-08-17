'use client';

import { useState } from 'react';
import { ProjectMilestone, ProjectTask, ProjectMember } from '@anveshak/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, CheckCircle2, Clock, AlertCircle, Calendar, UserCheck } from 'lucide-react';

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
  { id: 'TODO', label: 'To Do', bg: 'bg-[#F8FAFC]', border: 'border-[#E2E8F0]' },
  { id: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-blue-50/50', border: 'border-blue-200/60' },
  { id: 'IN_REVIEW', label: 'In Review', bg: 'bg-purple-50/50', border: 'border-purple-200/60' },
  { id: 'COMPLETED', label: 'Completed', bg: 'bg-emerald-50/50', border: 'border-emerald-200/60' },
  { id: 'BLOCKED', label: 'Blocked', bg: 'bg-rose-50/50', border: 'border-rose-200/60' },
];

const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Project Execution Workspace</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {milestones.length} Milestones · {tasks.length} Tasks ({tasks.filter((t) => t.status === 'COMPLETED').length} Completed)
          </p>
        </div>
        {isAdminOrPm && !isLocked && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMilestoneModal(true)}
              className="text-xs font-semibold text-[#0F172A]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-[#d49b38]" /> Add Milestone
            </Button>
            <Button
              size="sm"
              onClick={() => setShowTaskModal(true)}
              className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-[#151c2e]" /> Create Task
            </Button>
          </div>
        )}
      </div>

      {/* MILESTONES SUMMARY CARDS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Project Milestones</h3>
        {milestones.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] shadow-xs">
            No milestones created for this project yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => (
              <div key={m.id} className="p-5 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#d49b38] transition-colors shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#F8FAFC] text-[#0F172A] rounded border border-[#E2E8F0]">
                    M{m.sequence}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                    {m.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] mb-1">{m.title}</h4>
                {m.description && <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{m.description}</p>}

                <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                  <span>Due: {new Date(m.dueDate).toLocaleDateString()}</span>
                  <span className="font-bold text-[#0F172A]">{m.progressPct ?? 0}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] h-full transition-all duration-500" style={{ width: `${m.progressPct ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KANBAN TASK BOARD */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Task Execution Board</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {TASK_STATUSES.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`p-3 rounded-xl ${col.bg} border ${col.border} min-h-[400px] flex flex-col shadow-xs`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E8F0]">
                  <span className="text-xs font-bold text-[#0F172A]">{col.label}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white text-[#0F172A] rounded-full border border-[#E2E8F0]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {colTasks.map((t: any) => (
                    <div key={t.id} className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#d49b38] transition-colors shadow-xs space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM}`}>
                          {t.priority}
                        </span>
                        {t.dueDate && (
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-[#0F172A]">{t.title}</h5>

                      {t.assigneeEmployee && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] pt-1">
                          <div className="w-4 h-4 rounded-full bg-[#d49b38]/20 border border-[#d49b38]/40 flex items-center justify-center text-[9px] font-bold text-[#151c2e]">
                            {t.assigneeEmployee.fullName.charAt(0)}
                          </div>
                          <span className="truncate font-semibold">{t.assigneeEmployee.fullName}</span>
                        </div>
                      )}

                      {isAdminOrPm && !isLocked && (
                        <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-1">
                          <select
                            value={t.status}
                            onChange={(e) => handleTaskStatusChange(t.id, e.target.value)}
                            className="bg-[#F8FAFC] text-[10px] font-semibold text-[#0F172A] border border-[#E2E8F0] rounded-md px-2 py-1 focus:outline-none focus:border-[#d49b38]"
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
                    <div className="h-24 flex items-center justify-center text-[11px] font-semibold text-[#94a3b8] border border-dashed border-[#CBD5E1] rounded-lg">
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
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Add Project Milestone</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Title *</label>
                <Input
                  required
                  type="text"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g. Phase 1 Architecture"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Description</label>
                <Textarea
                  rows={2}
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="Milestone scope and objectives..."
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Sequence</label>
                  <Input
                    type="number"
                    min={1}
                    value={mSequence}
                    onChange={(e) => setMSequence(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Due Date *</label>
                  <Input
                    required
                    type="date"
                    value={mDueDate}
                    onChange={(e) => setMDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMilestoneModal(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading}
                  type="submit"
                  size="sm"
                  className="bg-[#151c2e] text-white hover:bg-[#1e293b] text-xs font-bold"
                >
                  {loading ? 'Creating...' : 'Create Milestone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Create Project Task</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Task Title *</label>
                <Input
                  required
                  type="text"
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="e.g. Implement REST endpoints"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Assignee *</label>
                <select
                  required
                  value={tAssignee}
                  onChange={(e) => setTAssignee(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Milestone</label>
                  <select
                    value={tMilestoneId}
                    onChange={(e) => setTMilestoneId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  >
                    <option value="">No Milestone</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        M{m.sequence}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Priority</label>
                  <select
                    value={tPriority}
                    onChange={(e: any) => setTPriority(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Due Date</label>
                  <Input
                    type="date"
                    value={tDueDate}
                    onChange={(e) => setTDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Est. Hours</label>
                  <Input
                    type="number"
                    min={0}
                    value={tEstHours}
                    onChange={(e) => setTEstHours(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTaskModal(false)}
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
                  {loading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
