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
import { EmptyState } from '@/components/ui/empty-state';
import {
  Building2,
  FolderGit2,
  Users,
  Search,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface IndustryDashboardData {
  organizationName: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsAtRiskCount: number;
  avgProgressPct: number;
  pendingDeliverablesCount: number;
  upcomingMeetingsCount: number;
  portfolio: Array<{
    id: string;
    projectCode: string;
    title: string;
    status: string;
    overallProgressPct: number;
    teamHeadcount: number;
    milestonesCount: number;
    completedMilestonesCount: number;
    nextMilestoneTitle: string;
    nextMilestoneDueDate: string | null;
    expectedEndDate: string | null;
  }>;
  recentUpdates: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    details?: any;
  }>;
}

const STATUS_BADGES: Record<string, string> = {
  INITIATED: 'bg-blue-50 text-blue-700 border border-blue-200',
  RESOURCE_ASSIGNMENT: 'bg-purple-50 text-purple-700 border border-purple-200',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
};

export default function IndustryDashboardPage() {
  const router = useRouter();
  const { hasAnyRole, hasExactRole, isInitializing } = usePermissions();

  const [dashData, setDashData] = useState<IndustryDashboardData | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: IndustryDashboardData }>('/industry/dashboard');
      if (res.data) setDashData(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load Industry Client Portal dashboard.');
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
    if (hasExactRole('ADMIN') && !hasExactRole('ORG_USER')) {
      router.push('/admin/approvals');
      return;
    }
    const isAllowed = hasAnyRole(['ORG_USER']);
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchDashboard();
  }, [hasAnyRole, hasExactRole, isInitializing, isHydrated, router, fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const portfolio = dashData?.portfolio || [];
  const filteredPortfolio = portfolio.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.projectCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#151c2e] to-[#182238] p-6 rounded-2xl text-white shadow-md">
          <div>
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-[#d49b38]" />
              <h1 className="text-xl sm:text-2xl font-bold">{dashData?.organizationName || 'Industry Portal'}</h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Multi-Project Executive Dashboard · Track progress, upcoming milestones, approved deliverables, and scheduled meetings.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
              {dashData?.activeProjects || 0} Active Projects
            </span>
          </div>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[#64748B] block font-medium">Total Projects</span>
              <span className="text-xl font-bold text-[#0F172A]">{dashData?.totalProjects || 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[#64748B] block font-medium">Active Projects</span>
              <span className="text-xl font-bold text-emerald-600">{dashData?.activeProjects || 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[#64748B] block font-medium">Avg Progress</span>
              <span className="text-xl font-bold text-blue-600">{dashData?.avgProgressPct || 0}%</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[#64748B] block font-medium">Pending Deliverables</span>
              <span className="text-xl font-bold text-purple-600">{dashData?.pendingDeliverablesCount || 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[#64748B] block font-medium">Upcoming Meetings</span>
              <span className="text-xl font-bold text-emerald-600">{dashData?.upcomingMeetingsCount || 0}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[#64748B] block font-medium">Projects At Risk</span>
              <span className="text-xl font-bold text-rose-600">{dashData?.projectsAtRiskCount || 0}</span>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Project Directory & Search */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-[#d49b38]" />
                <span>Project Portfolio Directory ({filteredPortfolio.length})</span>
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94a3b8]" />
                  <input
                    type="text"
                    placeholder="Search code or title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#d49b38] focus:bg-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#d49b38]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOURCE_ASSIGNMENT">Resource Assignment</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Project Portfolio Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPortfolio.map((p) => {
              const isOverdue = p.nextMilestoneDueDate && new Date(p.nextMilestoneDueDate).getTime() < new Date().getTime();

              return (
                <Card key={p.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#8B5E14] bg-[#F5E8D0] px-2 py-0.5 rounded border border-[#d49b38]/30 inline-block mb-1">
                          {p.projectCode}
                        </span>
                        <h4 className="text-sm font-bold text-[#0F172A]">{p.title}</h4>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold ${STATUS_BADGES[p.status] || STATUS_BADGES.IN_PROGRESS}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#64748B]">Overall Progress</span>
                        <span className="text-blue-700 font-mono font-bold">{p.overallProgressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                          style={{ width: `${p.overallProgressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-[#E2E8F0] text-[#64748B]">
                      <div>
                        <span className="block text-[10px] font-medium text-[#94a3b8]">Milestones</span>
                        <span className="font-bold text-[#0F172A]">{p.completedMilestonesCount} / {p.milestonesCount} Completed</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-medium text-[#94a3b8]">Project Team</span>
                        <span className="font-bold text-[#0F172A] flex items-center gap-1">
                          <Users className="h-3 w-3 text-purple-600" />
                          {p.teamHeadcount} Members
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-medium text-[#94a3b8]">Next Milestone</span>
                        <span className={`font-bold ${isOverdue ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                          {p.nextMilestoneTitle}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link href={`/industry/projects/${p.id}`}>
                        <Button variant="primary" size="sm">
                          Open Project Workspace ↗
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredPortfolio.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={FolderGit2}
                  title="No projects found"
                  description="No projects match your search or filter parameters."
                />
              </div>
            )}
          </div>
        </div>

        {/* Multi-Project Timeline / Recent Updates Feed */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Sparkles className="h-4 w-4 text-[#d49b38]" />
              <span>Recent Multi-Project Updates Feed</span>
            </h3>

            {dashData?.recentUpdates && dashData.recentUpdates.length > 0 ? (
              <div className="space-y-2.5 text-xs">
                {dashData.recentUpdates.map((act) => (
                  <div key={act.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#0F172A] block">{act.action.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-[#64748B] block">Type: {act.entityType}</span>
                    </div>
                    <span className="text-[10px] text-[#94a3b8] whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#94a3b8]">No recent activity logs available.</div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
