'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  FolderGit2,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Building2,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IndustryProjectsListPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/industry/projects', { params });
      if (res.data?.success) {
        setItems(res.data.data.items || []);
        setTotal(res.data.data.total || 0);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
          <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
          <span>/</span>
          <span className="text-slate-900">Projects</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Project Workspaces</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live project status, milestone deliverables, meetings, and technical documentation.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects by title or project code (PRJ-2026-XXXXXX)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] text-xs bg-slate-50 border-slate-200">
                  <Filter className="mr-2 h-3.5 w-3.5 text-slate-500" />
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="INITIATED">Initiated</SelectItem>
                  <SelectItem value="RESOURCE_ASSIGNMENT">Resource Assignment</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" variant="secondary" className="text-xs font-bold bg-slate-100 hover:bg-slate-200">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Projects Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-xl border border-slate-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-slate-200/80 shadow-sm bg-white p-12 text-center space-y-3">
          <FolderGit2 className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No projects instantiated yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once your submitted problem statements are evaluated and approved by AnveshakHub, projects will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((prj) => (
            <Card key={prj.id} className="border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">{prj.projectCode}</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">
                    {prj.status}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-1 line-clamp-1">{prj.title}</CardTitle>
                <CardDescription className="text-xs text-slate-500">{prj.businessVertical?.name || 'General'}</CardDescription>
              </CardHeader>

              <CardContent className="py-4 space-y-3 text-xs">
                {prj.milestones && prj.milestones.length > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Current Milestone</span>
                    <div className="font-semibold text-slate-800">{prj.milestones[0].title}</div>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                  <span>Deliverables: {prj._count?.deliverables || 0}</span>
                  <span>Meetings: {prj._count?.meetings || 0}</span>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => router.push(`/industry/projects/${prj.id}`)}
                  className="bg-[#151c2e] text-white hover:bg-[#1e293b] text-xs font-bold"
                >
                  Enter Workspace <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
