'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  FolderGit2,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Video,
  PackageCheck,
  Paperclip,
  Users,
  RefreshCw,
  AlertCircle,
  FileText,
  Plus,
} from 'lucide-react';

interface ProjectDetailData {
  project: {
    id: string;
    projectCode: string;
    title: string;
    description?: string;
    status: string;
    overallProgressPct: number;
    startDate: string;
    expectedEndDate?: string;
    clientOrganizationName: string;
    teamHeadcount: number;
  };
  milestones: any[];
  deliverables: any[];
  meetings: any[];
  resourceLinks: any[];
}

export default function IndustryProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { hasAnyRole } = usePermissions();

  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'deliverables' | 'meetings' | 'resources'>('overview');

  // Request Meeting Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqStart, setReqStart] = useState('');
  const [reqEnd, setReqEnd] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);

  const fetchProjectDetail = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: ProjectDetailData }>(`/api/v1/industry/projects/${projectId}`);
      if (res.data) setData(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load project workspace.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const isAllowed = hasAnyRole(['ORG_USER', 'ADMIN']);
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchProjectDetail();
  }, [hasAnyRole, router, fetchProjectDetail]);

  const handleRequestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSubmittingReq(true);
    setReqError(null);
    try {
      const res = await fetch(`/api/v1/industry/projects/${projectId}/meetings/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reqTitle,
          description: reqDesc || undefined,
          startDateTime: reqStart,
          endDateTime: reqEnd,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to submit meeting request');

      setShowRequestModal(false);
      setReqTitle('');
      setReqDesc('');
      setReqStart('');
      setReqEnd('');
      fetchProjectDetail();
    } catch (err: any) {
      setReqError(err.message);
    } finally {
      setSubmittingReq(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[#d49b38]" />
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="p-12 text-center text-[#94a3b8]">
        <AlertCircle className="h-10 w-10 mx-auto text-amber-400 mb-3" />
        <p className="font-semibold text-[#f8fafc]">Project Not Found or Access Restricted</p>
        <Link href="/industry">
          <Button size="sm" className="mt-4 bg-[#d49b38] text-slate-950 font-bold">Back to Industry Portal</Button>
        </Link>
      </div>
    );
  }

  const p = data.project;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {/* Workspace Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2e] p-6 rounded-2xl border border-[#182238] shadow-xl">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-[#d49b38] px-2.5 py-1 bg-[#0b101b] rounded border border-[#182238]">
                {p.projectCode}
              </span>
              <h1 className="text-xl font-bold text-white">{p.title}</h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-2">
              <span>Client: {p.clientOrganizationName}</span>
              <span>•</span>
              <span>Team: {p.teamHeadcount} Members</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono font-bold">{p.overallProgressPct}% Completed</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowRequestModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
            >
              + Request Meeting
            </Button>
          </div>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#182238] space-x-6 text-xs font-semibold overflow-x-auto">
          {['overview', 'milestones', 'deliverables', 'meetings', 'resources'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 border-b-2 uppercase tracking-wider transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-[#d49b38] text-[#d49b38] font-bold' : 'border-transparent text-[#94a3b8] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="p-5 bg-[#151c2e] rounded-xl border border-[#182238] space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-[#182238] pb-3">Project Executive Overview</h3>
              {p.description && <p className="text-xs text-[#94a3b8] leading-relaxed">{p.description}</p>}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#0b101b] rounded-lg border border-[#182238] space-y-1">
                  <span className="text-[10px] text-[#64748b] uppercase font-bold">Overall Progress</span>
                  <div className="text-xl font-bold text-cyan-400 font-mono">{p.overallProgressPct}%</div>
                </div>
                <div className="p-4 bg-[#0b101b] rounded-lg border border-[#182238] space-y-1">
                  <span className="text-[10px] text-[#64748b] uppercase font-bold">Milestones Progress</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {data.milestones.filter((m) => m.status === 'COMPLETED').length} / {data.milestones.length} Completed
                  </div>
                </div>
                <div className="p-4 bg-[#0b101b] rounded-lg border border-[#182238] space-y-1">
                  <span className="text-[10px] text-[#64748b] uppercase font-bold">Assigned Team Headcount</span>
                  <div className="text-xl font-bold text-purple-400 font-mono">{p.teamHeadcount} Members</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MILESTONES */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#151c2e] rounded-xl border border-[#182238]">
              <h3 className="text-sm font-semibold text-white">Client-Visible Milestones ({data.milestones.length})</h3>
            </div>

            <div className="space-y-3">
              {data.milestones.map((m) => {
                const isOverdue = m.dueDate && m.status !== 'COMPLETED' && new Date(m.dueDate).getTime() < new Date().getTime();
                return (
                  <div key={m.id} className="p-4 bg-[#151c2e] rounded-xl border border-[#182238] flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-[#d49b38] font-bold">#{m.sequence}</span>
                        <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                      </div>
                      {m.description && <p className="text-xs text-[#94a3b8]">{m.description}</p>}
                    </div>

                    <div className="text-right space-y-1 text-xs">
                      <span className={`px-2 py-0.5 rounded font-medium text-[10px] border uppercase ${m.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {m.status}
                      </span>
                      <div className={`font-mono text-[11px] ${isOverdue ? 'text-rose-400 font-bold' : 'text-[#94a3b8]'}`}>
                        Due: {new Date(m.dueDate).toLocaleDateString()} {isOverdue && '⚠️'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVED DELIVERABLES */}
        {activeTab === 'deliverables' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#151c2e] rounded-xl border border-[#182238]">
              <h3 className="text-sm font-semibold text-white">Approved Client Deliverables ({data.deliverables.length})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.deliverables.map((d) => (
                <div key={d.id} className="p-5 bg-[#151c2e] rounded-xl border border-[#182238] space-y-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">
                    APPROVED
                  </span>
                  <h4 className="text-sm font-semibold text-white">{d.title}</h4>
                  {d.description && <p className="text-xs text-[#94a3b8]">{d.description}</p>}
                </div>
              ))}
              {data.deliverables.length === 0 && (
                <div className="col-span-full p-8 text-center bg-[#151c2e] rounded-xl border border-[#182238] text-xs text-[#64748b]">
                  No approved client deliverables available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MEETINGS */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#151c2e] rounded-xl border border-[#182238] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Client Meetings ({data.meetings.length})</h3>
              <Button onClick={() => setShowRequestModal(true)} size="sm" className="bg-blue-600 text-white text-xs">
                + Request Meeting
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.meetings.map((m) => (
                <div key={m.id} className="p-5 bg-[#151c2e] rounded-xl border border-[#182238] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      {m.meetingProvider}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400">{m.status}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                  <div className="text-xs text-[#94a3b8] font-mono">
                    {new Date(m.startDateTime).toLocaleString()}
                  </div>
                  <div className="pt-2">
                    <a
                      href={m.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium inline-block"
                    >
                      Join Meeting ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SHARED RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#151c2e] rounded-xl border border-[#182238]">
              <h3 className="text-sm font-semibold text-white">Shared Project Resources ({data.resourceLinks.length})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.resourceLinks.map((link) => (
                <div key={link.id} className="p-4 bg-[#151c2e] rounded-xl border border-[#182238] space-y-2">
                  <h4 className="text-xs font-semibold text-white">{link.title}</h4>
                  {link.description && <p className="text-[11px] text-[#94a3b8]">{link.description}</p>}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition block pt-1"
                  >
                    Open Shared Resource ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REQUEST MEETING MODAL */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151c2e] border border-[#182238] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-semibold text-white">Request Client Meeting</h3>
              {reqError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">{reqError}</div>}

              <form onSubmit={handleRequestMeeting} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1">Meeting Title</label>
                  <input
                    required
                    type="text"
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="e.g. Milestone Validation Review"
                    className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1">Agenda / Description</label>
                  <textarea
                    rows={2}
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                    placeholder="Preferred discussion topics..."
                    className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1">Preferred Start Date &amp; Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={reqStart}
                    onChange={(e) => setReqStart(e.target.value)}
                    className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#94a3b8] block mb-1">Preferred End Date &amp; Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={reqEnd}
                    onChange={(e) => setReqEnd(e.target.value)}
                    className="w-full bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-slate-800 text-[#94a3b8] text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submittingReq}
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {submittingReq ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
