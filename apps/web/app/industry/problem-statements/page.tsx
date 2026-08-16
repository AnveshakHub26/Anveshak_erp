'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ArrowUpDown,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProblemStatementsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || 'ALL';

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatements();
  }, [page, statusFilter]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/industry/problem-statements', { params });
      if (res.data?.success) {
        setItems(res.data.data.items || []);
        setTotal(res.data.data.total || 0);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load problem statements', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStatements();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
            <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
            <span>/</span>
            <span className="text-slate-900">Problem Statements</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Problem Statements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage operational challenges submitted for AnveshakHub evaluation & project conversion.
          </p>
        </div>

        <Button
          onClick={() => router.push('/industry/problem-statements/new')}
          className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] hover:to-[#b37b18] font-bold text-xs shadow-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          + New Problem Statement
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by title, reference code (PS-2026-XXXX), or category..."
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
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Drafts</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" variant="secondary" className="text-xs font-bold bg-slate-100 hover:bg-slate-200">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Datatable */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 w-full bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FileText className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No problem statements found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {statusFilter !== 'ALL'
                  ? `No statements match status '${statusFilter}'. Try resetting your filter.`
                  : 'Submit a new operational challenge to initiate AnveshakHub evaluation.'}
              </p>
              <Button
                onClick={() => router.push('/industry/problem-statements/new')}
                className="mt-2 bg-[#151c2e] text-white text-xs font-bold"
              >
                + Submit Problem Statement
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Reference Code</th>
                    <th className="py-3 px-6">Title & Category</th>
                    <th className="py-3 px-6">Business Vertical</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Submitted Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((ps) => (
                    <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">{ps.code}</td>
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{ps.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{ps.category || 'General'}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{ps.businessVertical?.name || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={ps.status} />
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {new Date(ps.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/industry/problem-statements/${ps.id}`)}
                          className="text-xs font-semibold text-[#151c2e] hover:text-[#d49b38]"
                        >
                          View Details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing page {page} of {totalPages} ({total} items)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs font-semibold"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-semibold"
              >
                Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
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
