'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  Building2,
  FolderGit2,
  CheckCircle2,
  Clock,
  TrendingUp,
  PackageCheck,
  Video,
  Bell,
  Search,
  RefreshCw,
  AlertCircle,
  Users,
  ChevronRight,
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
  INITIATED: 'bg-[#0b101b] text-blue-400 border border-blue-500/20',
  RESOURCE_ASSIGNMENT: 'bg-[#0b101b] text-purple-400 border border-purple-500/20',
  IN_PROGRESS: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  ON_HOLD: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  COMPLETED: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function IndustryDashboardPage() {
  const router = useRouter();
  const { hasAnyRole } = usePermissions();

  const [dashData, setDashData] = useState<IndustryDashboardData | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: IndustryDashboardData }>('/api/v1/industry/dashboard');
      if (res.data) setDashData(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load Industry Client Portal dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAllowed = hasAnyRole(['ORG_USER', 'ADMIN']);
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchDashboard();
  }, [hasAnyRole, router, fetchDashboard]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#d49b38]" />
        </div>
      </AppShell>
    );
  }

  const portfolio = dashData?.portfolio || [];
  const filteredPortfolio = portfolio.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.projectCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2e] p-6 rounded-2xl border border-[#182238] shadow-xl">
          <div>
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-[#d49b38]" />
              <h1 className="text-xl font-bold text-white">{dashData?.organizationName || 'Industry Portal'}</h1>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Multi-Project Executive Dashboard · Track progress, upcoming milestones, approved deliverables, and scheduled meetings.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
              {dashData?.activeProjects || 0} Active Projects
            </span>
          </div>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-[#151c2e] border border-[#182238] rounded-xl space-y-1">
            <span className="text-[11px] text-[#94a3b8] block font-medium">Total Projects</span>
            <span className="text-xl font-bold text-white">{dashData?.totalProjects || 0}</span>
          </div>

          <div className="p-4 bg-[#151c2e] border border-[#182238] rounded-xl space-y-1">
            <span className="text-[11px] text-[#94a3b8] block font-medium">Active Projects</span>
            <span className="text-xl font-bold text-emerald-400">{dashData?.activeProjects || 0}</span>
          </div>

          <div className="p-4 bg-[#151c2e] border border-[#182238] rounded-xl space-y-1">
            <span className="text-[11px] text-[#94a3b8] block font-medium">Avg Progress</span>
            <span className="text-xl font-bold text-cyan-400">{dashData?.avgProgressPct || 0}%</span>
          </div>

          <div className="p-4 bg-[#151c2e] border border-[#182238] rounded-xl space-y-1">
            <span className="text-[11px] text-[#94a3b8] block font-medium">Pending Deliverables</span>
            <span className="text-xl font-bold text-purple-400">{dashData?.pendingDeliverablesCount || 0}</span>
          </div>

          <div className="p-4 bg-[#151c2e] border border-[#182238] rounded-xl space-y-1">
            <span className="text-[11px] text-[#94a3b8] block font-medium">Upcoming Meetings</span>
            <span className="text-xl font-bold text-blue-400">{dashData?.upcomingMeetingsCount || 0}</span>
          </div>

          <div className="p-4 bg-[#151c2e] border border-[#182238] rounded-xl space-y-1">
            <span className="text-[11px] text-[#94a3b8] block font-medium">Projects At Risk</span>
            <span className="text-xl font-bold text-rose-400">{dashData?.projectsAtRiskCount || 0}</span>
          </div>
        </div>

        {/* Multi-Project Directory & Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#151c2e] p-4 rounded-xl border border-[#182238]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-[#d49b38]" />
              <span>Project Portfolio Directory ({filteredPortfolio.length})</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Search code or title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0b101b] border border-[#182238] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d49b38]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0b101b] border border-[#182238] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d49b38]"
              >
                <option value="ALL">All Statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOURCE_ASSIGNMENT">Resource Assignment</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
          </div>

          {/* Project Portfolio Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPortfolio.map((p) => {
              const isOverdue = p.nextMilestoneDueDate && new Date(p.nextMilestoneDueDate).getTime() < new Date().getTime();

              return (
                <div
                  key={p.id}
                  className="p-5 bg-[#151c2e] rounded-xl border border-[#182238] hover:border-[#d49b38]/40 transition space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#d49b38] block">{p.projectCode}</span>
                      <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded font-medium ${STATUS_BADGES[p.status] || STATUS_BADGES.IN_PROGRESS}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#94a3b8]">Overall Progress</span>
                      <span className="text-cyan-400 font-mono font-bold">{p.overallProgressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#0b101b] rounded-full overflow-hidden border border-[#182238]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${p.overallProgressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-[#182238] text-[#94a3b8]">
                    <div>
                      <span className="block text-[10px] text-[#64748b]">Milestones</span>
                      <span className="font-medium text-white">{p.completedMilestonesCount} / {p.milestonesCount} Completed</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#64748b]">Project Team</span>
                      <span className="font-medium text-white flex items-center gap-1">
                        <Users className="h-3 w-3 text-purple-400" />
                        {p.teamHeadcount} Members
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#64748b]">Next Milestone</span>
                      <span className={`font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                        {p.nextMilestoneTitle}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link href={`/industry/projects/${p.id}`}>
                      <Button size="sm" className="bg-[#d49b38] hover:bg-[#b8832a] text-slate-950 font-bold text-xs">
                        Open Project Workspace ↗
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {filteredPortfolio.length === 0 && (
              <div className="col-span-full p-8 text-center bg-[#151c2e] rounded-xl border border-[#182238] text-xs text-[#64748b]">
                No projects found matching search or filter parameters.
              </div>
            )}
          </div>
        </div>

        {/* Multi-Project Timeline / Recent Updates Feed */}
        <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-[#182238] pb-3">
            <Sparkles className="h-4 w-4 text-[#d49b38]" />
            <span>Recent Multi-Project Updates Feed</span>
          </h3>

          {dashData?.recentUpdates && dashData.recentUpdates.length > 0 ? (
            <div className="space-y-3 text-xs">
              {dashData.recentUpdates.map((act) => (
                <div key={act.id} className="p-3 bg-[#0b101b] border border-[#182238] rounded-lg flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">{act.action.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] text-[#94a3b8] block">Type: {act.entityType}</span>
                  </div>
                  <span className="text-[10px] text-[#64748b] whitespace-nowrap">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#64748b]">No recent activity logs available.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
