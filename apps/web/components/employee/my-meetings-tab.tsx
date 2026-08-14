'use client';

interface MyMeetingsTabProps {
  meetings: any[];
}

export function MyMeetingsTab({ meetings }: MyMeetingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#151c2e] p-4 rounded-xl border border-[#182238]">
        <h3 className="text-sm font-semibold text-white">My Upcoming Project Meetings ({meetings.length})</h3>
        <p className="text-xs text-[#94a3b8]">
          Online video meetings scheduled for projects you are an active participant of
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetings.map((m: any) => {
          const isCancelled = m.status === 'CANCELLED';
          return (
            <div
              key={m.id}
              className={`p-5 rounded-xl border transition ${isCancelled ? 'bg-[#0b101b] border-[#182238] opacity-60' : 'bg-[#151c2e] border-[#182238] hover:border-[#d49b38]/40'} space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] text-[#d49b38] block">{m.project?.projectCode}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase ${isCancelled ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {m.status}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white">{m.title}</h4>
              {m.description && <p className="text-xs text-[#94a3b8] line-clamp-2">{m.description}</p>}

              <div className="p-3 bg-[#0b101b] border border-[#182238] rounded-lg text-xs space-y-1 text-[#94a3b8]">
                <div className="flex items-center justify-between">
                  <span>Provider:</span>
                  <span className="font-medium text-white">{m.meetingProvider}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Start Time:</span>
                  <span className="font-mono text-cyan-400">
                    {new Date(m.startDateTime).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#182238] flex items-center justify-between">
                {!isCancelled ? (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                  >
                    Join Meeting ↗
                  </a>
                ) : (
                  <span className="text-xs text-rose-400">Cancelled</span>
                )}
              </div>
            </div>
          );
        })}

        {meetings.length === 0 && (
          <div className="col-span-full p-8 text-center bg-[#151c2e] rounded-xl border border-[#182238] text-xs text-[#64748b]">
            No upcoming meetings scheduled for your projects.
          </div>
        )}
      </div>
    </div>
  );
}
