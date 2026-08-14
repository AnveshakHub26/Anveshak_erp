'use client';

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
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-slate-100">Project Collaboration Activity Feed</h2>
        <p className="text-xs text-slate-400">
          Real-time audit log of team assignments, milestones, tasks, meetings, and deliverable reviews
        </p>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-4">
        {activities.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {activities.map((act: any) => {
              const icon = ACTION_ICONS[act.action] || '📌';
              return (
                <div key={act.id} className="relative flex items-start justify-between gap-4 text-xs">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px]">
                    {icon}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200 uppercase text-[10px] tracking-wider font-mono mr-2 px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
                      {act.action}
                    </span>
                    <span className="text-slate-300">
                      by <span className="text-cyan-400">{act.actor?.email || 'System'}</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
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
          <div className="p-8 text-center text-xs text-slate-400">
            No activity logged for this project yet.
          </div>
        )}
      </div>
    </div>
  );
}
