'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { ResourceManagementTab } from '@/components/projects/resource-management';
import { ExecutionTab } from '@/components/projects/execution-tab';
import { DeliverablesTab } from '@/components/projects/deliverables-tab';
import { MeetingsTab } from '@/components/projects/meetings-tab';
import { FilesResourcesTab } from '@/components/projects/files-resources-tab';
import { ActivityTab } from '@/components/projects/activity-tab';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Tag,
  Users,
  CheckCircle2,
  ListTodo,
  PackageCheck,
  Video,
  Paperclip,
  Activity,
  Layers,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { hasAnyRole, hasRole } = usePermissions();

  const [data, setData] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [resourceLinks, setResourceLinks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'resources' | 'execution' | 'deliverables' | 'meetings' | 'files' | 'activity'
  >('overview');

  const isInternalWorkforce = hasAnyRole(['ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL']);
  const isOrgUser = hasRole('ORG_USER') && !isInternalWorkforce;
  const isAdminOrPm = hasAnyRole(['ADMIN', 'PM']);

  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        projectRes,
        milestonesRes,
        tasksRes,
        deliverablesRes,
        meetingsRes,
        linksRes,
        filesRes,
        activityRes,
      ] = await Promise.all([
        apiRequest(`/projects/${id}`),
        apiRequest(`/projects/${id}/milestones`).catch(() => ({ data: [] })),
        apiRequest(`/projects/${id}/tasks`).catch(() => ({ data: [] })),
        apiRequest(`/projects/${id}/deliverables`).catch(() => ({ data: [] })),
        apiRequest(`/projects/${id}/meetings`).catch(() => ({ data: [] })),
        apiRequest(`/projects/${id}/resource-links`).catch(() => ({ data: [] })),
        apiRequest(`/projects/${id}/files`).catch(() => ({ data: [] })),
        apiRequest(`/projects/${id}/activity`).catch(() => ({ data: [] })),
      ]);

      if (projectRes && projectRes.data) {
        setData(projectRes.data);
      }
      if (milestonesRes?.data) setMilestones(milestonesRes.data);
      if (tasksRes?.data) setTasks(tasksRes.data);
      if (deliverablesRes?.data) setDeliverables(deliverablesRes.data);
      if (meetingsRes?.data) setMeetings(meetingsRes.data);
      if (linksRes?.data) setResourceLinks(linksRes.data);
      if (filesRes?.data) setFiles(filesRes.data);
      if (activityRes?.data) setActivities(activityRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project workspace details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (hasAnyRole(['ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'HR'])) {
      loadWorkspaceData();
    } else {
      router.push('/unauthorized');
    }
  }, [id, hasAnyRole, router, loadWorkspaceData]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'INITIATED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Initiated</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">In Progress</span>;
      case 'RESOURCE_ASSIGNMENT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Resource Assignment</span>;
      case 'ON_HOLD':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">On Hold</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  if (!hasAnyRole(['ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'HR'])) return null;

  const isLocked = data?.status === 'COMPLETED' || data?.status === 'CANCELLED';

  // Server-Derived Progress Math
  const overallProgressPct =
    milestones.length > 0
      ? Math.round(milestones.reduce((acc, m) => acc + (m.progressPct || 0), 0) / milestones.length)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Top Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <Link
            href="/projects"
            className="mt-1 rounded-lg border border-[#E2E8F0] p-2 hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-[#d49b38] bg-[#F5E8D0]/40 px-2.5 py-0.5 rounded-md border border-[#d49b38]/30">
                {data?.projectCode || 'PRJ-2026'}
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <h1 className="text-xl font-extrabold text-[#0F172A]">{data?.title || 'Project Workspace'}</h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#94a3b8]" />
              Client Organization: <strong className="text-[#0F172A]">{data?.organization?.legalName}</strong> ({data?.organization?.orgNumber})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server-derived overall progress pill */}
          <div className="bg-[#F8FAFC] px-4 py-2 rounded-xl border border-[#E2E8F0] text-center min-w-[120px]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Overall Progress</span>
            <span className="text-lg font-black text-[#0F172A]">{overallProgressPct}%</span>
          </div>
          {data?.status && statusBadge(data.status)}
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-6 text-xs font-semibold overflow-x-auto bg-white px-4 pt-2 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#d49b38] text-[#0F172A] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <FileText className="h-4 w-4 text-[#d49b38]" />
          <span>Overview</span>
        </button>

        {!isOrgUser && (
          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-[#d49b38] text-[#0F172A] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Users className="h-4 w-4 text-[#d49b38]" />
            <span>Team &amp; Resources</span>
            {data?.members && data.members.filter((m: any) => m.status === 'ACTIVE').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F8FAFC] text-[#0F172A] font-mono border border-[#E2E8F0]">
                {data.members.filter((m: any) => m.status === 'ACTIVE').length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('execution')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'execution'
              ? 'border-[#d49b38] text-[#0F172A] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <ListTodo className="h-4 w-4 text-[#d49b38]" />
          <span>Execution &amp; Tasks</span>
          {tasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F8FAFC] text-[#0F172A] font-mono border border-[#E2E8F0]">
              {tasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('deliverables')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'deliverables'
              ? 'border-[#d49b38] text-[#0F172A] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <PackageCheck className="h-4 w-4 text-[#d49b38]" />
          <span>Deliverables</span>
          {deliverables.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F8FAFC] text-[#0F172A] font-mono border border-[#E2E8F0]">
              {deliverables.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'meetings'
              ? 'border-[#d49b38] text-[#0F172A] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Video className="h-4 w-4 text-[#d49b38]" />
          <span>Online Meetings</span>
          {meetings.filter((m) => m.status === 'SCHEDULED').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-mono border border-emerald-200">
              {meetings.filter((m) => m.status === 'SCHEDULED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'files'
              ? 'border-[#d49b38] text-[#0F172A] font-bold'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Paperclip className="h-4 w-4 text-[#d49b38]" />
          <span>Files &amp; External Links</span>
        </button>

        {!isOrgUser && (
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-[#d49b38] text-[#0F172A] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Activity className="h-4 w-4 text-[#d49b38]" />
            <span>Activity Feed</span>
          </button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center text-xs text-[#64748B] shadow-xs">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#d49b38] border-t-transparent mb-2" />
          <p className="font-semibold text-[#0F172A]">Loading project collaboration workspace...</p>
        </div>
      ) : !data ? null : activeTab === 'resources' && !isOrgUser ? (
        <ResourceManagementTab
          projectId={data.id}
          projectCode={data.projectCode}
          projectStatus={data.status}
          members={data.members || []}
          onRefreshProject={loadWorkspaceData}
        />
      ) : activeTab === 'execution' ? (
        <ExecutionTab
          projectId={data.id}
          isLocked={isLocked}
          isAdminOrPm={isAdminOrPm}
          milestones={milestones}
          tasks={tasks}
          members={data.members || []}
          onRefresh={loadWorkspaceData}
        />
      ) : activeTab === 'deliverables' ? (
        <DeliverablesTab
          projectId={data.id}
          isLocked={isLocked}
          isAdminOrPm={isAdminOrPm}
          deliverables={deliverables}
          milestones={milestones}
          onRefresh={loadWorkspaceData}
        />
      ) : activeTab === 'meetings' ? (
        <MeetingsTab
          projectId={data.id}
          isLocked={isLocked}
          isAdminOrPm={isAdminOrPm}
          meetings={meetings}
          members={data.members || []}
          onRefresh={loadWorkspaceData}
        />
      ) : activeTab === 'files' ? (
        <FilesResourcesTab
          projectId={data.id}
          isLocked={isLocked}
          isAdminOrPm={isAdminOrPm}
          files={files}
          links={resourceLinks}
          onRefresh={loadWorkspaceData}
        />
      ) : activeTab === 'activity' && !isOrgUser ? (
        <ActivityTab activities={activities} />
      ) : (
        /* TAB 1: OVERVIEW WORKSPACE */
        <div className="space-y-6">
          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-1.5 shadow-xs hover:border-[#d49b38] transition-colors">
              <span className="text-[#64748B] flex items-center font-semibold text-[11px] uppercase tracking-wider">
                <Tag className="h-4 w-4 text-[#d49b38] mr-2" />
                Business Vertical
              </span>
              <p className="font-bold text-[#0F172A] text-sm">{data.businessVertical?.name || 'Research-led Projects'}</p>
              <p className="text-[#d49b38] font-mono text-[11px] font-bold">{data.businessVertical?.code || 'BV-01'}</p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-1.5 shadow-xs hover:border-[#d49b38] transition-colors">
              <span className="text-[#64748B] flex items-center font-semibold text-[11px] uppercase tracking-wider">
                <Layers className="h-4 w-4 text-purple-600 mr-2" />
                Milestones
              </span>
              <p className="font-bold text-[#0F172A] text-sm">{milestones.length} Milestones</p>
              <p className="text-[#64748B] text-[11px]">
                {milestones.filter((m) => m.status === 'COMPLETED').length} Completed
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-1.5 shadow-xs hover:border-[#d49b38] transition-colors">
              <span className="text-[#64748B] flex items-center font-semibold text-[11px] uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2" />
                Task Execution
              </span>
              <p className="font-bold text-[#0F172A] text-sm">{tasks.length} Total Tasks</p>
              <p className="text-[#64748B] text-[11px]">
                {tasks.filter((t) => t.status === 'COMPLETED').length} Completed · {tasks.filter((t) => t.status === 'BLOCKED').length} Blocked
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-1.5 shadow-xs hover:border-[#d49b38] transition-colors">
              <span className="text-[#64748B] flex items-center font-semibold text-[11px] uppercase tracking-wider">
                <Users className="h-4 w-4 text-blue-600 mr-2" />
                Team Staffing
              </span>
              <p className="font-bold text-[#0F172A] text-sm">
                {data.members ? data.members.filter((m: any) => m.status === 'ACTIVE').length : 0} Active Members
              </p>
              <p className="text-[#64748B] text-[11px]">
                {data.resourceRequirements?.length || 0} Requirements Defined
              </p>
            </div>
          </div>

          {/* Technical Scope & Description */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 flex items-center">
              <FileText className="h-4 w-4 text-[#d49b38] mr-2" />
              Project Technical Scope &amp; Core Objectives
            </h2>
            <div className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap font-medium">
              {data.description || 'No detailed technical scope defined.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
