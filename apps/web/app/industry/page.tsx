'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  Building2,
  FolderGit2,
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  ArrowRight,
  PhoneCall,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IndustryDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/industry/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load dashboard.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-24 w-full bg-[#1e293b]/20 animate-pulse rounded-2xl border border-slate-200/80" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-[#1e293b]/10 animate-pulse rounded-xl border border-slate-200/60" />
          ))}
        </div>
        <div className="h-96 bg-[#1e293b]/10 animate-pulse rounded-2xl border border-slate-200/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900">Dashboard Access Notice</h2>
              <p className="text-sm text-red-700 mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="outline" onClick={fetchDashboard} className="border-red-300 text-red-800 hover:bg-red-100">
                Retry Connection
              </Button>
              <Button onClick={() => router.push('/industry/contact')} className="bg-[#151c2e] text-white hover:bg-[#1e293b]">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, organization, recentProblemStatements, activeProjects, upcomingMeetings, recentDeliverables, openQueries } =
    data || {};

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Organization Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#151c2e] via-[#1e293b] to-[#2a364f] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-[#d49b38]/20 text-[#d49b38] border border-[#d49b38]/40 rounded-full">
                {organization?.applicantType || 'Client Organization'} Workspace
              </span>
              <span className="text-xs text-slate-400 font-mono">Ref: {organization?.orgNumber || 'ORG-000000'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {organization?.legalName || 'Organization Workspace'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Centralized Enterprise Collaboration Portal. Monitor problem statement evaluations, project milestones, deliverables, and communications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => router.push('/industry/problem-statements/new')}
              className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] hover:to-[#b37b18] font-bold text-xs shadow-lg hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit Problem Statement
            </Button>
            <Button
              onClick={() => router.push('/industry/projects')}
              variant="outline"
              className="border-slate-700 bg-slate-800/60 text-white hover:bg-slate-700/80 text-xs font-semibold"
            >
              View Projects
            </Button>
            <Button
              onClick={() => router.push('/industry/contact')}
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold"
            >
              <PhoneCall className="mr-2 h-4 w-4 text-[#d49b38]" />
              Support
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
              <FolderGit2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics?.activeProjects || 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">In progress & active</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Statements</span>
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics?.totalProblemStatements || 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">{metrics?.approvedCount || 0} approved</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Reviews</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">{metrics?.pendingReviews || 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">Action required / review</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Deliverables</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics?.pendingDeliverables || 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">Pending client review</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meetings</span>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics?.upcomingMeetings || 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">Scheduled & requested</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Queries</span>
              <HelpCircle className="h-4 w-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics?.openQueries || 0}</div>
            <p className="text-[10px] text-slate-500 mt-1">Support communications</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace Tabs */}
      <Tabs defaultValue="statements" className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="statements" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Problem Statements ({recentProblemStatements?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Active Projects ({activeProjects?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="meetings" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Meetings ({upcomingMeetings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Deliverables ({recentDeliverables?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="queries" className="text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Queries ({openQueries?.length || 0})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Problem Statements */}
        <TabsContent value="statements">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Recent Problem Statements</CardTitle>
                <CardDescription className="text-xs text-slate-500">Business challenges submitted for evaluation</CardDescription>
              </div>
              <Link
                href="/industry/problem-statements"
                className="text-xs font-bold text-[#151c2e] hover:text-[#d49b38] flex items-center gap-1 transition-colors"
              >
                View All Statements <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {!recentProblemStatements || recentProblemStatements.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No problem statements submitted yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Describe a operational challenge or technical requirement to initiate an enterprise evaluation.
                  </p>
                  <Button
                    onClick={() => router.push('/industry/problem-statements/new')}
                    className="mt-2 bg-[#151c2e] text-white text-xs font-bold"
                  >
                    + Submit Problem Statement
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentProblemStatements.map((ps: any) => (
                    <div key={ps.id} className="p-4 md:p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{ps.code}</span>
                          <StatusBadge status={ps.status} />
                          {ps.businessVertical && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {ps.businessVertical.name}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{ps.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{ps.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/industry/problem-statements/${ps.id}`)}
                        className="text-xs font-semibold shrink-0"
                      >
                        View Details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Active Projects */}
        <TabsContent value="projects">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Active Organization Projects</CardTitle>
                <CardDescription className="text-xs text-slate-500">Live projects executed by AnveshakHub engineering teams</CardDescription>
              </div>
              <Link href="/industry/projects" className="text-xs font-bold text-[#151c2e] hover:text-[#d49b38] flex items-center gap-1">
                View All Projects <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {!activeProjects || activeProjects.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FolderGit2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No active projects</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Approved problem statements will appear here once converted into formal projects.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeProjects.map((prj: any) => (
                    <div key={prj.id} className="p-4 md:p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{prj.projectCode}</span>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">{prj.status}</Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{prj.title}</h4>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/industry/projects/${prj.id}`)} className="text-xs font-semibold shrink-0">
                        Project Workspace <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Meetings */}
        <TabsContent value="meetings">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Scheduled & Requested Meetings</CardTitle>
                <CardDescription className="text-xs text-slate-500">Upcoming alignment calls and project reviews</CardDescription>
              </div>
              <Link href="/industry/meetings" className="text-xs font-bold text-[#151c2e] hover:text-[#d49b38] flex items-center gap-1">
                View All Meetings <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {!upcomingMeetings || upcomingMeetings.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No upcoming meetings scheduled</p>
                  <Button onClick={() => router.push('/industry/meetings')} className="mt-2 bg-[#151c2e] text-white text-xs font-bold">
                    + Request Meeting
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingMeetings.map((m: any) => (
                    <div key={m.id} className="p-4 md:p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(m.startDateTime).toLocaleDateString()} at {new Date(m.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push('/industry/meetings')} className="text-xs font-semibold">
                        Meeting Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Deliverables */}
        <TabsContent value="deliverables">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Project Deliverables</CardTitle>
                <CardDescription className="text-xs text-slate-500">Milestone artifacts submitted for client review</CardDescription>
              </div>
              <Link href="/industry/deliverables" className="text-xs font-bold text-[#151c2e] hover:text-[#d49b38] flex items-center gap-1">
                View All Deliverables <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {!recentDeliverables || recentDeliverables.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No pending deliverables</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentDeliverables.map((d: any) => (
                    <div key={d.id} className="p-4 md:p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                        <p className="text-xs text-slate-500">{d.project?.title}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push('/industry/deliverables')} className="text-xs font-semibold">
                        Review Deliverable
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Queries */}
        <TabsContent value="queries">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Support Communications</CardTitle>
                <CardDescription className="text-xs text-slate-500">Direct communication channel with AnveshakHub team</CardDescription>
              </div>
              <Link href="/industry/queries" className="text-xs font-bold text-[#151c2e] hover:text-[#d49b38] flex items-center gap-1">
                View All Queries <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {!openQueries || openQueries.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No open support queries</p>
                  <Button onClick={() => router.push('/industry/queries')} className="mt-2 bg-[#151c2e] text-white text-xs font-bold">
                    + Log Support Ticket
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {openQueries.map((q: any) => (
                    <div key={q.id} className="p-4 md:p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{q.queryNumber}</span>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">{q.status}</Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{q.subject}</h4>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/industry/queries/${q.id}`)} className="text-xs font-semibold">
                        View Thread
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-bold">DRAFT</Badge>;
    case 'SUBMITTED':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">SUBMITTED</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">UNDER REVIEW</Badge>;
    case 'CHANGES_REQUESTED':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold">CHANGES REQUESTED</Badge>;
    case 'APPROVED':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">APPROVED</Badge>;
    case 'REJECTED':
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">REJECTED</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
  }
}
