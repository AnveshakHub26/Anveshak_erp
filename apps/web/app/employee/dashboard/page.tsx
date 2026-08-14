'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { MyTasksTab } from '@/components/employee/my-tasks-tab';
import { MyDeliverablesTab } from '@/components/employee/my-deliverables-tab';
import { MyMeetingsTab } from '@/components/employee/my-meetings-tab';
import { MyResourcesTab } from '@/components/employee/my-resources-tab';
import {
  UserCheck,
  Building2,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Mail,
  ShieldCheck,
  FolderGit2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Bell,
  Layers,
  ListTodo,
  PackageCheck,
  Video,
  Paperclip,
} from 'lucide-react';

interface SelfEmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  professionalRole: string;
  department: string;
  designation: string;
  category: 'EXPERT' | 'INTERN' | 'STAFF' | 'EXECUTIVE';
  employmentType: 'PERMANENT' | 'PROBATIONARY' | 'TEMPORARY' | 'CONTRACT' | 'PART_TIME';
  status: 'ONBOARDING' | 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
  joiningDate: string;
  skills: string[];
  technologies: string[];
  ndaStatus: 'PENDING' | 'SIGNED_PHYSICAL' | 'SIGNED_ELECTRONIC' | 'EXPIRED';
  ndaSignedAt?: string;
  user: {
    id: string;
    email: string;
    status: string;
  };
  projectMemberships: Array<{
    id: string;
    role: string;
    allocation: number;
    startDate: string;
    endDate?: string;
    status: string;
    project: {
      id: string;
      projectCode: string;
      title: string;
      status: string;
    };
  }>;
  documents?: Array<{
    id: string;
    documentType: string;
    name: string;
    fileUrl: string;
    createdAt: string;
  }>;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { hasAnyRole } = usePermissions();

  const [profile, setProfile] = useState<SelfEmployeeProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myDeliverables, setMyDeliverables] = useState<any[]>([]);
  const [myMeetings, setMyMeetings] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<{ links: any[]; documents: any[] }>({ links: [], documents: [] });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'deliverables' | 'meetings' | 'resources'>('overview');

  const fetchSelfData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [empRes, notifRes, projRes, taskRes, delivRes, meetRes, resRes] = await Promise.allSettled([
        apiRequest<{ success: boolean; data: SelfEmployeeProfile }>('/api/v1/hr/employees/me'),
        apiRequest<{ success: boolean; data: NotificationItem[] }>('/api/v1/notifications'),
        apiRequest<{ success: boolean; data: any[] }>('/api/v1/employee/projects'),
        apiRequest<{ success: boolean; data: any[] }>('/api/v1/employee/tasks'),
        apiRequest<{ success: boolean; data: any[] }>('/api/v1/employee/deliverables'),
        apiRequest<{ success: boolean; data: any[] }>('/api/v1/employee/meetings'),
        apiRequest<{ success: boolean; data: any }>('/api/v1/employee/resources'),
      ]);

      if (empRes.status === 'fulfilled' && empRes.value.data) {
        setProfile(empRes.value.data);
      } else if (empRes.status === 'rejected') {
        setErrorMsg('Employee profile not found or access restricted.');
      }

      if (notifRes.status === 'fulfilled' && notifRes.value.data) {
        setNotifications(Array.isArray(notifRes.value.data) ? notifRes.value.data : []);
      }
      if (projRes.status === 'fulfilled' && projRes.value?.data) setMyProjects(projRes.value.data);
      if (taskRes.status === 'fulfilled' && taskRes.value?.data) setMyTasks(taskRes.value.data);
      if (delivRes.status === 'fulfilled' && delivRes.value?.data) setMyDeliverables(delivRes.value.data);
      if (meetRes.status === 'fulfilled' && meetRes.value?.data) setMyMeetings(meetRes.value.data);
      if (resRes.status === 'fulfilled' && resRes.value?.data) setMyResources(resRes.value.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load employee self-service dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAllowed = hasAnyRole(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'PM', 'ADMIN', 'HR']);
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchSelfData();
  }, [hasAnyRole, router, fetchSelfData]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#d49b38]" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="p-12 text-center text-[#94a3b8]">
          <AlertCircle className="h-10 w-10 mx-auto text-amber-400 mb-3" />
          <p className="font-semibold text-[#f8fafc]">No Employee Profile Found</p>
          <p className="text-xs text-[#64748b] mt-1">Your user account is not linked to an active Employee record.</p>
        </div>
      </AppShell>
    );
  }

  const activeProjects = profile.projectMemberships
    ? profile.projectMemberships.filter((m) => m.status === 'ACTIVE')
    : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Workspace Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2e] p-6 rounded-2xl border border-[#182238] shadow-xl">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-[#d49b38] px-2.5 py-1 bg-[#0b101b] rounded border border-[#182238]">
                {profile.employeeCode}
              </span>
              <h1 className="text-xl font-bold text-white">{profile.fullName}</h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1.5 flex items-center gap-2">
              <span>{profile.designation}</span>
              <span>•</span>
              <span>{profile.department}</span>
              <span>•</span>
              <span className="text-[#d49b38] font-medium">{profile.professionalRole}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
              {profile.status}
            </span>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-semibold">
              {profile.category}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#182238] space-x-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'border-[#d49b38] text-[#d49b38] font-bold' : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tasks' ? 'border-[#d49b38] text-[#d49b38] font-bold' : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>My Tasks</span>
            {myTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                {myTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'deliverables' ? 'border-[#d49b38] text-[#d49b38] font-bold' : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <PackageCheck className="h-4 w-4" />
            <span>My Deliverables</span>
            {myDeliverables.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                {myDeliverables.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('meetings')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'meetings' ? 'border-[#d49b38] text-[#d49b38] font-bold' : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Upcoming Meetings</span>
            {myMeetings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {myMeetings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'resources' ? 'border-[#d49b38] text-[#d49b38] font-bold' : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Paperclip className="h-4 w-4" />
            <span>Project Resources</span>
          </button>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {activeTab === 'tasks' ? (
          <MyTasksTab tasks={myTasks} onRefresh={fetchSelfData} />
        ) : activeTab === 'deliverables' ? (
          <MyDeliverablesTab deliverables={myDeliverables} myProjects={myProjects} onRefresh={fetchSelfData} />
        ) : activeTab === 'meetings' ? (
          <MyMeetingsTab meetings={myMeetings} />
        ) : activeTab === 'resources' ? (
          <MyResourcesTab resources={myResources} />
        ) : (
          /* OVERVIEW TAB */
          <div className="space-y-6">
            {/* Metrics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-4 shadow-sm space-y-1">
                <span className="text-[#94a3b8] flex items-center">
                  <FolderGit2 className="h-3.5 w-3.5 text-[#d49b38] mr-1.5" />
                  Active Projects
                </span>
                <p className="font-bold text-white text-lg">{myProjects.length || activeProjects.length}</p>
              </div>

              <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-4 shadow-sm space-y-1">
                <span className="text-[#94a3b8] flex items-center">
                  <ListTodo className="h-3.5 w-3.5 text-cyan-400 mr-1.5" />
                  My Active Tasks
                </span>
                <p className="font-bold text-cyan-400 text-lg">
                  {myTasks.filter((t) => t.status !== 'COMPLETED').length} Tasks
                </p>
              </div>

              <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-4 shadow-sm space-y-1">
                <span className="text-[#94a3b8] flex items-center">
                  <PackageCheck className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
                  Pending Deliverables
                </span>
                <p className="font-bold text-purple-400 text-lg">
                  {myDeliverables.filter((d) => d.status === 'SUBMITTED' || d.status === 'DRAFT').length}
                </p>
              </div>

              <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-4 shadow-sm space-y-1">
                <span className="text-[#94a3b8] flex items-center">
                  <Video className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                  Upcoming Meetings
                </span>
                <p className="font-bold text-emerald-400 text-lg">{myMeetings.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: My Projects & Skills */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Projects Cards */}
                <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#182238] pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <FolderGit2 className="h-4 w-4 text-[#d49b38]" />
                      <span>My Active Project Workspace ({myProjects.length || activeProjects.length})</span>
                    </h3>
                  </div>

                  {(myProjects.length > 0 ? myProjects : activeProjects).length > 0 ? (
                    <div className="space-y-3">
                      {(myProjects.length > 0 ? myProjects : activeProjects).map((proj: any) => {
                        const code = proj.projectCode || proj.project?.projectCode;
                        const title = proj.title || proj.project?.title;
                        const pId = proj.projectId || proj.project?.id;
                        const role = proj.projectRole || proj.role;
                        const alloc = proj.allocationPct ?? proj.allocation;
                        const meetings = proj.upcomingMeetings || [];

                        return (
                          <div key={pId || code} className="p-4 rounded-lg border border-[#182238] bg-[#0b101b] hover:border-[#d49b38]/40 transition space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-xs font-bold text-[#d49b38]">{code}</span>
                                  <span className="text-[#64748b]">•</span>
                                  <h4 className="text-xs font-semibold text-white">{title}</h4>
                                </div>
                                {proj.clientName && <p className="text-[11px] text-[#94a3b8]">Client: {proj.clientName}</p>}
                              </div>
                              <Link href={`/projects/${pId}`}>
                                <Button size="sm" variant="outline" className="h-7 border-[#182238] text-[11px] text-[#d49b38]">
                                  Open Workspace ↗
                                </Button>
                              </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2 border-t border-[#182238]/60 text-[#94a3b8]">
                              <div>Role: <span className="text-white font-medium">{role}</span></div>
                              <div>Allocation: <span className="text-emerald-400 font-bold">{alloc}%</span></div>
                              <div>Active Tasks: <span className="text-cyan-400 font-bold">{proj.activeTasksCount ?? 0}</span></div>
                            </div>

                            {meetings.length > 0 && (
                              <div className="p-2 bg-[#151c2e] rounded border border-[#182238] flex items-center justify-between text-xs">
                                <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                                  📅 Upcoming Meeting: {meetings[0].title}
                                </span>
                                <a
                                  href={meetings[0].meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition"
                                >
                                  Join ↗
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#64748b]">No active project assignments.</div>
                  )}
                </div>

                {/* Skills & Technologies Card */}
                <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
                    <BadgeCheck className="h-4 w-4 text-[#d49b38]" />
                    <span>My Verified Skills &amp; Technologies</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[#94a3b8] block mb-2 font-medium">Core Skills:</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills && profile.skills.length > 0 ? (
                          profile.skills.map((s) => (
                            <span key={s} className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-blue-400 font-medium">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#64748b]">No skills recorded</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[#94a3b8] block mb-2 font-medium">Technologies &amp; Tools:</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.technologies && profile.technologies.length > 0 ? (
                          profile.technologies.map((t) => (
                            <span key={t} className="inline-flex items-center rounded-md bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-purple-400 font-medium">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#64748b]">No technologies recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Documents & Notifications */}
              <div className="space-y-6">
                {/* My Notifications */}
                <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
                    <Bell className="h-4 w-4 text-[#d49b38]" />
                    <span>My Notifications ({notifications.length})</span>
                  </h3>

                  {notifications.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {notifications.slice(0, 5).map((notif) => (
                        <div key={notif.id} className="p-2.5 rounded-lg border border-[#182238] bg-[#0b101b] space-y-1">
                          <div className="font-semibold text-white">{notif.title}</div>
                          <div className="text-[11px] text-[#94a3b8]">{notif.message}</div>
                          <div className="text-[9px] text-[#64748b]">{new Date(notif.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#64748b]">No unread notifications.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
