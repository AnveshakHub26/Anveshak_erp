'use client';

import { useState } from 'react';
import { ProjectMeeting, ProjectMember } from '@anveshak/types';

interface MeetingsTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  meetings: ProjectMeeting[];
  members: ProjectMember[];
  onRefresh: () => void;
}

const PROVIDER_BADGES: Record<string, { label: string; bg: string; border: string; text: string }> = {
  GOOGLE_MEET: { label: 'Google Meet', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  MICROSOFT_TEAMS: { label: 'MS Teams', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  ZOOM: { label: 'Zoom', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  OTHER: { label: 'Custom Video Link', bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400' },
};

export function MeetingsTab({
  projectId,
  isLocked,
  isAdminOrPm,
  meetings,
  members,
  onRefresh,
}: MeetingsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Meeting Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [provider, setProvider] = useState<'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'ZOOM' | 'OTHER'>('GOOGLE_MEET');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');

  const handleToggleParticipant = (empId: string) => {
    if (selectedParticipants.includes(empId)) {
      setSelectedParticipants(selectedParticipants.filter((id) => id !== empId));
    } else {
      setSelectedParticipants([...selectedParticipants, empId]);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          meetingUrl,
          meetingProvider: provider,
          startDateTime,
          endDateTime,
          participantEmployeeIds: selectedParticipants,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to schedule meeting');

      setShowModal(false);
      setTitle('');
      setDescription('');
      setMeetingUrl('');
      setSelectedParticipants([]);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (isLocked) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/meetings/${meetingId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Project Online Meetings</h2>
          <p className="text-xs text-slate-400">
            {meetings.length} Meetings Scheduled · Instant video link access for project members
          </p>
        </div>
        {isAdminOrPm && !isLocked && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-blue-500/20 transition"
          >
            + Schedule Online Meeting
          </button>
        )}
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetings.map((m: any) => {
          const prov = PROVIDER_BADGES[m.meetingProvider] || PROVIDER_BADGES.OTHER;
          const isCancelled = m.status === 'CANCELLED';

          return (
            <div
              key={m.id}
              className={`p-5 rounded-xl border transition ${isCancelled ? 'bg-slate-950/40 border-slate-800/60 opacity-60' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'} space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${prov.bg} ${prov.border} ${prov.text}`}>
                  {prov.label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase ${isCancelled ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {m.status}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-200">{m.title}</h4>
              {m.description && <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>}

              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs space-y-1 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-mono text-cyan-400">
                    {new Date(m.startDateTime).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {m.participants && m.participants.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/50">
                    <span className="text-slate-500">Participants:</span>
                    <span className="text-slate-400">{m.participants.length} Team Members</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                {!isCancelled ? (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    Join Meeting ↗
                  </a>
                ) : (
                  <span className="text-xs text-rose-400 font-medium">Meeting Cancelled</span>
                )}

                {isAdminOrPm && !isCancelled && !isLocked && (
                  <button
                    onClick={() => handleCancelMeeting(m.id)}
                    className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {meetings.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400">
            No meetings scheduled for this project yet.
          </div>
        )}
      </div>

      {/* SCHEDULE MEETING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Schedule Online Project Meeting</h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{error}</div>}

            <form onSubmit={handleScheduleMeeting} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Meeting Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Technical Sync & Architecture Review"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Agenda / Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key topics to discuss..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e: any) => setProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="MICROSOFT_TEAMS">MS Teams</option>
                    <option value="ZOOM">Zoom</option>
                    <option value="OTHER">Custom Video Link</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Meeting URL</label>
                  <input
                    required
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Start Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">End Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Select Participants (Project Team)</label>
                <div className="max-h-32 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-2 space-y-1">
                  {activeMembers.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-slate-300 hover:bg-slate-900 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(m.employeeId)}
                        onChange={() => handleToggleParticipant(m.employeeId)}
                        className="rounded border-slate-800 text-blue-600 focus:ring-0"
                      />
                      <span>{m.employee.fullName} ({m.projectRole})</span>
                    </label>
                  ))}
                  {activeMembers.length === 0 && <div className="text-[11px] text-slate-600">No active team members assigned</div>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
