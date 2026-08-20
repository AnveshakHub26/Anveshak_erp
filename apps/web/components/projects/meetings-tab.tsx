'use client';

import { apiRequest } from '@/lib/api-client';
import { useState } from 'react';
import { ProjectMeeting, ProjectMember } from '@anveshak/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Video, Calendar, Clock, ExternalLink } from 'lucide-react';

interface MeetingsTabProps {
  projectId: string;
  isLocked: boolean;
  isAdminOrPm: boolean;
  meetings: ProjectMeeting[];
  members: ProjectMember[];
  onRefresh: () => void;
}

const PROVIDER_BADGES: Record<string, { label: string; bg: string; border: string; text: string }> = {
  GOOGLE_MEET: { label: 'Google Meet', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  MICROSOFT_TEAMS: { label: 'MS Teams', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
  ZOOM: { label: 'Zoom', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  OTHER: { label: 'Custom Video Link', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' },
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
      await apiRequest(`/projects/${projectId}/meetings`, {
        method: 'POST',
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
      await apiRequest(`/projects/${projectId}/meetings/${meetingId}/cancel`, {
        method: 'POST',
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">Project Online Meetings</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {meetings.length} Meetings Scheduled · Instant video link access for project members
          </p>
        </div>
        {isAdminOrPm && !isLocked && (
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 text-[#151c2e]" /> Schedule Online Meeting
          </Button>
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
              className={`p-5 rounded-xl border transition-all shadow-xs ${
                isCancelled
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-[#E2E8F0] hover:border-[#d49b38]'
              } space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${prov.bg} ${prov.border} ${prov.text}`}>
                  {prov.label}
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded font-bold border uppercase ${
                    isCancelled
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#0F172A]">{m.title}</h4>
              {m.description && <p className="text-xs text-[#64748B] line-clamp-2">{m.description}</p>}

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs space-y-1.5 text-[#0F172A]">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] font-semibold">Date &amp; Time:</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {new Date(m.startDateTime).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {m.participants && m.participants.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#E2E8F0]">
                    <span className="text-[#64748B] font-semibold">Participants:</span>
                    <span className="text-[#0F172A] font-medium">{m.participants.length} Team Members</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                {!isCancelled ? (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-[#151c2e] hover:bg-[#1e293b] text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                  >
                    Join Meeting <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-rose-600 font-bold">Meeting Cancelled</span>
                )}

                {isAdminOrPm && !isCancelled && !isLocked && (
                  <button
                    onClick={() => handleCancelMeeting(m.id)}
                    className="px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 font-semibold rounded-md transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {meetings.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] shadow-xs">
            No meetings scheduled for this project yet.
          </div>
        )}
      </div>

      {/* SCHEDULE MEETING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0F172A]">Schedule Online Project Meeting</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Meeting Title *</label>
                <Input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Technical Sync & Architecture Review"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Agenda / Description</label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key topics to discuss..."
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Provider *</label>
                  <select
                    value={provider}
                    onChange={(e: any) => setProvider(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="MICROSOFT_TEAMS">MS Teams</option>
                    <option value="ZOOM">Zoom</option>
                    <option value="OTHER">Custom Video Link</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Meeting URL *</label>
                  <Input
                    required
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">Start Time *</label>
                  <Input
                    required
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0F172A]">End Time *</label>
                  <Input
                    required
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F172A]">Select Participants</label>
                <div className="max-h-32 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 space-y-1">
                  {activeMembers.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs text-[#0F172A] hover:bg-white p-1 rounded cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(m.employeeId)}
                        onChange={() => handleToggleParticipant(m.employeeId)}
                        className="rounded border-[#E2E8F0] text-[#d49b38] focus:ring-0"
                      />
                      <span>{m.employee.fullName} ({m.projectRole})</span>
                    </label>
                  ))}
                  {activeMembers.length === 0 && <div className="text-[11px] text-[#64748B]">No active team members assigned</div>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
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
                  {loading ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
