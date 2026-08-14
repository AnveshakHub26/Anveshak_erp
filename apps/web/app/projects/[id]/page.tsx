'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
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
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Initiated</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">In Progress</span>;
      case 'RESOURCE_ASSIGNMENT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Resource Assignment</span>;
      case 'ON_HOLD':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">On Hold</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
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
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
          <div className="flex items-start space-x-4">
            <Link href="/projects" className="mt-1 rounded-lg border border-slate-800 p-2 hover:bg-slate-800 text-slate-400 transition">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-bold text-cyan-400">{data?.projectCode}</span>
                <span className="text-slate-600">•</span>
                <h1 className="text-xl font-bold text-slate-100">{data?.title || 'Project Workspace'}</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Client Organization: <span className="font-semibold text-slate-200">{data?.organization?.legalName}</span> ({data?.organization?.orgNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Server derived overall progress pill */}
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">Overall Progress</span>
              <span className="text-base font-bold text-cyan-400">{overallProgressPct}%</span>
            </div>
            {data?.status && statusBadge(data.status)}
          </div>
        </div>

        {/* Tab Navigation Container */}
        <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </button>

          {!isOrgUser && (
            <button
              onClick={() => setActiveTab('resources')}
              className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'resources' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Team &amp; Resources</span>
              {data?.members && data.members.filter((m: any) => m.status === 'ACTIVE').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-400 font-mono">
                  {data.members.filter((m: any) => m.status === 'ACTIVE').length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('execution')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'execution' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Execution &amp; Tasks</span>
            {tasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {tasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'deliverables' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="h-4 w-4" />
            <span>Deliverables</span>
            {deliverables.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                {deliverables.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'meetings' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Online Meetings</span>
            {meetings.filter((m) => m.status === 'SCHEDULED').length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {meetings.filter((m) => m.status === 'SCHEDULED').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'files' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paperclip className="h-4 w-4" />
            <span>Files &amp; External Links</span>
          </button>

          {!isOrgUser && (
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'activity' ? 'border-cyan-400 text-cyan-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Activity Feed</span>
            </button>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
            Loading project collaboration workspace...
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
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1 shadow-sm">
                <span className="text-slate-400 flex items-center">
                  <Tag className="h-3.5 w-3.5 text-cyan-400 mr-1.5" />
                  Business Vertical
                </span>
                <p className="font-bold text-slate-100">{data.businessVertical?.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">{data.businessVertical?.code}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1 shadow-sm">
                <span className="text-slate-400 flex items-center">
                  <Layers className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
                  Milestones
                </span>
                <p className="font-bold text-slate-100">{milestones.length} Milestones</p>
                <p className="text-slate-400 text-[11px]">
                  {milestones.filter((m) => m.status === 'COMPLETED').length} Completed
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1 shadow-sm">
                <span className="text-slate-400 flex items-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                  Task Execution
                </span>
                <p className="font-bold text-slate-100">{tasks.length} Total Tasks</p>
                <p className="text-slate-400 text-[11px]">
                  {tasks.filter((t) => t.status === 'COMPLETED').length} Completed · {tasks.filter((t) => t.status === 'BLOCKED').length} Blocked
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1 shadow-sm">
                <span className="text-slate-400 flex items-center">
                  <Users className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                  Team Staffing
                </span>
                <p className="font-bold text-slate-100">
                  {data.members ? data.members.filter((m: any) => m.status === 'ACTIVE').length : 0} Active Members
                </p>
                <p className="text-slate-400 text-[11px]">
                  {data.resourceRequirements?.length || 0} Requirements Defined
                </p>
              </div>
            </div>

            {/* Technical Scope & Description */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3 shadow-sm">
              <h2 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 flex items-center">
                <FileText className="h-4 w-4 text-cyan-400 mr-2" />
                Project Technical Scope &amp; Core Objectives
              </h2>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {data.description}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
