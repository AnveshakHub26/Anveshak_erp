'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { MyTasksTab } from '@/components/employee/my-tasks-tab';
import { MyDeliverablesTab } from '@/components/employee/my-deliverables-tab';
import { MyMeetingsTab } from '@/components/employee/my-meetings-tab';
import { MyResourcesTab } from '@/components/employee/my-resources-tab';
import { AttendanceWidget } from '@/components/employee/attendance-widget';
import { MyAttendanceTab } from '@/components/employee/my-attendance-tab';
import { MyLeaveTab } from '@/components/employee/my-leave-tab';
import { MyProfileTab } from '@/components/employee/my-profile-tab';
import {
  UserCheck,
  BadgeCheck,
  FolderGit2,
  AlertCircle,
  RefreshCw,
  Bell,
  ListTodo,
  PackageCheck,
  Video,
  Paperclip,
  Clock,
  Calendar,
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
  const { hasAnyRole, hasExactRole, isInitializing } = usePermissions();

  const [profile, setProfile] = useState<SelfEmployeeProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myDeliverables, setMyDeliverables] = useState<any[]>([]);
  const [myMeetings, setMyMeetings] = useState<any[]>([]);
  const [myResources, setMyResources] = useState<{ links: any[]; documents: any[] }>({ links: [], documents: [] });
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const fetchSelfData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [empRes, notifRes, projRes, taskRes, delivRes, meetRes, resRes, balRes, reqRes] = await Promise.allSettled([
        apiRequest<{ success: boolean; data: SelfEmployeeProfile }>('/hr/employees/me'),
        apiRequest<{ success: boolean; data: NotificationItem[] }>('/notifications'),
        apiRequest<{ success: boolean; data: any[] }>('/employee/projects'),
        apiRequest<{ success: boolean; data: any[] }>('/employee/tasks'),
        apiRequest<{ success: boolean; data: any[] }>('/employee/deliverables'),
        apiRequest<{ success: boolean; data: any[] }>('/employee/meetings'),
        apiRequest<{ success: boolean; data: any }>('/employee/resources'),
        apiRequest<{ success: boolean; data: any[] }>('/leave/balances/me'),
        apiRequest<{ success: boolean; data: { items: any[] } }>('/leave/requests/me'),
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
      if (balRes.status === 'fulfilled' && balRes.value?.data) setLeaveBalances(balRes.value.data);
      if (reqRes.status === 'fulfilled' && reqRes.value?.data?.items) {
        const pending = reqRes.value.data.items.filter((r: any) => r.status === 'PENDING');
        setPendingLeaveRequests(pending);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load employee self-service dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isInitializing || !isHydrated) return;
    if (hasExactRole('ADMIN')) {
      router.push('/projects');
      return;
    }
    const isAllowed = hasAnyRole(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'PM', 'HR']);
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchSelfData();
  }, [hasAnyRole, hasExactRole, isInitializing, isHydrated, router, fetchSelfData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center text-[#64748B]">
        <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
        <p className="font-semibold text-[#0F172A]">No Employee Profile Found</p>
        <p className="text-xs text-[#64748B] mt-1">Your user account is not linked to an active Employee record.</p>
      </div>
    );
  }

  const activeProjects = profile.projectMemberships
    ? profile.projectMemberships.filter((m) => m.status === 'ACTIVE')
    : [];

  const workspaceTabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: UserCheck },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    { id: 'attendance', label: 'My Attendance', icon: Clock },
    { id: 'leave', label: 'My Leave', icon: Calendar },
    { id: 'tasks', label: 'My Tasks', count: myTasks.length, icon: ListTodo },
    { id: 'deliverables', label: 'My Deliverables', count: myDeliverables.length, icon: PackageCheck },
    { id: 'meetings', label: 'Upcoming Meetings', count: myMeetings.length, icon: Video },
    { id: 'resources', label: 'Project Resources', icon: Paperclip },
  ];

  return (
    <div className="space-y-6">
        {/* Workspace Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#151c2e] to-[#182238] p-6 rounded-2xl text-white shadow-md">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-[#d49b38] px-2.5 py-1 bg-[#151c2e] rounded border border-[#d49b38]/30">
                {profile.employeeCode}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold">{profile.fullName}</h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1.5 flex flex-wrap items-center gap-2">
              <span>{profile.designation}</span>
              <span>•</span>
              <span>{profile.department}</span>
              <span>•</span>
              <span className="text-[#d49b38] font-semibold">{profile.professionalRole}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
              {profile.status}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-bold">
              {profile.category}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs tabs={workspaceTabs} activeTab={activeTab} onChange={setActiveTab} />

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {activeTab === 'profile' ? (
          <MyProfileTab />
        ) : activeTab === 'attendance' ? (
          <MyAttendanceTab />
        ) : activeTab === 'leave' ? (
          <MyLeaveTab />
        ) : activeTab === 'tasks' ? (
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
            {/* 1. Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mr-2">Quick Actions:</span>
              <Button
                size="sm"
                onClick={() => setActiveTab('leave')}
                className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold text-xs h-8"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Apply for Leave
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('attendance')}
                className="border-[#E2E8F0] text-[#0F172A] text-xs h-8"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5 text-[#d49b38]" />
                View Attendance
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/employee/documents')}
                className="border-[#E2E8F0] text-[#0F172A] text-xs h-8"
              >
                <Paperclip className="h-3.5 w-3.5 mr-1.5 text-[#d49b38]" />
                My Documents
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('profile')}
                className="border-[#E2E8F0] text-[#0F172A] text-xs h-8"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1.5 text-[#d49b38]" />
                My Profile
              </Button>
            </div>

            {/* 2. Today's Attendance Control Widget */}
            <AttendanceWidget />

            {/* 3. Leave Summary Section */}
            <Card className="border border-[#E2E8F0] bg-white shadow-xs">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-[#d49b38]" />
                    <span>My Leave Balances ({new Date().getFullYear()})</span>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('leave')}
                    className="text-xs h-7 border-[#E2E8F0]"
                  >
                    Manage Leave ↗
                  </Button>
                </div>

                {leaveBalances.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {leaveBalances.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#0F172A]">{b.leaveType.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.leaveType.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                            {b.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                        {b.isApplicationBased ? (
                          <div className="pt-0.5">
                            <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[10px] font-bold">
                              Application-Based
                            </span>
                            <p className="text-[10px] text-[#64748B] mt-1">Proof document required</p>
                          </div>
                        ) : b.isMonthly ? (
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-xl font-extrabold text-[#d49b38]">{b.availableDays}</span>
                              <span className="text-[11px] text-[#64748B]">Available this month</span>
                            </div>
                            <p className="text-[10px] text-[#64748B] border-t border-[#E2E8F0] pt-1 mt-1">
                              {b.usedThisMonth || 0}/1 used in current month
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-xl font-extrabold text-[#d49b38]">{b.availableDays}</span>
                              <span className="text-[11px] text-[#64748B]">Available</span>
                            </div>
                            <p className="text-[10px] text-[#64748B] border-t border-[#E2E8F0] pt-1 mt-1">
                              {b.allocatedDays} Allocated • {b.usedDays} Used • {b.pendingDays} Pending
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-[#64748B]">No active leave balances assigned.</div>
                )}
              </CardContent>
            </Card>

            {/* 4. My Work Metrics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <Card className="cursor-pointer hover:border-[#d49b38] transition" onClick={() => setActiveTab('tasks')}>
                <CardContent className="p-4 space-y-1">
                  <span className="text-[#64748B] flex items-center font-medium">
                    <ListTodo className="h-4 w-4 text-blue-600 mr-1.5" />
                    My Active Tasks
                  </span>
                  <p className="font-extrabold text-blue-600 text-2xl">
                    {myTasks.filter((t) => t.status !== 'COMPLETED').length} Tasks
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-[#d49b38] transition" onClick={() => setActiveTab('deliverables')}>
                <CardContent className="p-4 space-y-1">
                  <span className="text-[#64748B] flex items-center font-medium">
                    <PackageCheck className="h-4 w-4 text-purple-600 mr-1.5" />
                    Pending Deliverables
                  </span>
                  <p className="font-extrabold text-purple-600 text-2xl">
                    {myDeliverables.filter((d) => d.status === 'SUBMITTED' || d.status === 'DRAFT').length}
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-[#d49b38] transition" onClick={() => setActiveTab('meetings')}>
                <CardContent className="p-4 space-y-1">
                  <span className="text-[#64748B] flex items-center font-medium">
                    <Video className="h-4 w-4 text-emerald-600 mr-1.5" />
                    Upcoming Meetings
                  </span>
                  <p className="font-extrabold text-emerald-600 text-2xl">{myMeetings.length}</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-[#d49b38] transition" onClick={() => router.push('/employee/documents')}>
                <CardContent className="p-4 space-y-1">
                  <span className="text-[#64748B] flex items-center font-medium">
                    <Paperclip className="h-4 w-4 text-[#d49b38] mr-1.5" />
                    My Vault Documents
                  </span>
                  <p className="font-extrabold text-[#d49b38] text-2xl">{profile.documents?.length || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* 5. Needs Your Attention Section */}
            <Card className="border border-[#E2E8F0] bg-white shadow-xs">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Needs Your Attention</span>
                </h3>

                {pendingLeaveRequests.length > 0 || myDeliverables.some((d) => d.status === 'REJECTED') ? (
                  <div className="space-y-2 text-xs">
                    {pendingLeaveRequests.map((req) => (
                      <div key={req.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#0F172A]">{req.referenceCode} — Leave Application</span>
                          <p className="text-[11px] text-[#64748B]">
                            {req.leaveType.name} ({req.totalDays} day(s)) is pending HR approval.
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('leave')} className="text-xs h-7 border-amber-300">
                          View Leave Status
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-[#64748B]">You&apos;re all caught up! ✨</div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: My Projects & Skills */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Projects Cards */}
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
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
                            <div key={pId || code} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#d49b38] transition space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs font-bold text-[#8B5E14] bg-[#F5E8D0] px-2 py-0.5 rounded border border-[#d49b38]/30">{code}</span>
                                    <span className="text-[#94a3b8]">•</span>
                                    <h4 className="text-xs font-bold text-[#0F172A]">{title}</h4>
                                  </div>
                                  {proj.clientName && <p className="text-[11px] text-[#64748B] mt-1">Client: {proj.clientName}</p>}
                                </div>
                                <Link href={`/projects/${pId}`}>
                                  <Button size="sm" variant="outline">
                                    Open Workspace ↗
                                  </Button>
                                </Link>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2 border-t border-[#E2E8F0] text-[#64748B]">
                                <div>Role: <span className="text-[#0F172A] font-semibold">{role}</span></div>
                                <div>Allocation: <span className="text-emerald-700 font-bold">{alloc}%</span></div>
                                <div>Active Tasks: <span className="text-blue-700 font-bold">{proj.activeTasksCount ?? 0}</span></div>
                              </div>

                              {meetings.length > 0 && (
                                <div className="p-2.5 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                                  <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                                    📅 Upcoming Meeting: {meetings[0].title}
                                  </span>
                                  <a
                                    href={meetings[0].meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition"
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
                      <div className="p-6 text-center text-xs text-[#64748B]">No active project assignments.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills & Technologies Card */}
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
                      <BadgeCheck className="h-4 w-4 text-[#d49b38]" />
                      <span>My Verified Skills &amp; Technologies</span>
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[#64748B] block mb-2 font-semibold">Core Skills:</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills && profile.skills.length > 0 ? (
                            profile.skills.map((s) => (
                              <span key={s} className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-blue-700 font-semibold">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#94a3b8]">No skills recorded</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#64748B] block mb-2 font-semibold">Technologies &amp; Tools:</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.technologies && profile.technologies.length > 0 ? (
                            profile.technologies.map((t) => (
                              <span key={t} className="inline-flex items-center rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-purple-700 font-semibold">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#94a3b8]">No technologies recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Recent Notifications */}
              <div>
                <Card className="border border-[#E2E8F0] bg-white shadow-xs">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-[#d49b38]" />
                        <span>Recent Notifications ({notifications.length})</span>
                      </h3>
                      <Link href="/notifications" className="text-xs text-[#d49b38] hover:underline font-semibold">
                        View Inbox ↗
                      </Link>
                    </div>

                    {notifications.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        {notifications.slice(0, 5).map((notif) => (
                          <div key={notif.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
                            <div className="font-bold text-[#0F172A]">{notif.message}</div>
                            <div className="text-[10px] text-[#94a3b8]">{new Date(notif.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#94a3b8]">No notifications.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
