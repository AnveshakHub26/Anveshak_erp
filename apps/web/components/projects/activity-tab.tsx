'use client';

import { Activity, Clock } from 'lucide-react';

interface ActivityTabProps {
  activities: any[];
}

const ACTION_ICONS: Record<string, string> = {
  PROJECT_MEMBER_ASSIGNED: '👤',
  PROJECT_MEMBER_RELEASED: '🚪',
  MILESTONE_CREATED: '🚩',
  TASK_CREATED: '📝',
  TASK_ASSIGNED: '📌',
  TASK_PROGRESS_UPDATED: '⚡',
  DELIVERABLE_SUBMITTED: '📤',
  DELIVERABLE_APPROVED: '✅',
  DELIVERABLE_REJECTED: '❌',
  MEETING_CREATED: '📅',
  MEETING_CANCELLED: '🚫',
  PROJECT_RESOURCE_ADDED: '🔗',
};

export function ActivityTab({ activities }: ActivityTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Project Collaboration Activity Feed</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time audit log of team assignments, milestones, tasks, meetings, and deliverable reviews
          </p>
        </div>
      </div>

      {/* Activity Timeline Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs">
        {activities.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
            {activities.map((act: any) => {
              const icon = ACTION_ICONS[act.action] || '📌';
              return (
                <div key={act.id} className="relative flex items-start justify-between gap-4 text-xs">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] shadow-xs">
                    {icon}
                  </span>
                  <div>
                    <span className="font-bold text-[#0F172A] uppercase text-[10px] tracking-wider font-mono mr-2 px-2 py-0.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                      {act.action}
                    </span>
                    <span className="text-[#64748B]">
                      by <strong className="text-[#0F172A]">{act.actor?.email || 'System'}</strong>
                    </span>
                  </div>

                  <span className="text-[11px] text-[#64748B] font-mono font-medium">
                    {new Date(act.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#64748B]">
            No activity logged for this project yet.
          </div>
        )}
      </div>
    </div>
  );
}
