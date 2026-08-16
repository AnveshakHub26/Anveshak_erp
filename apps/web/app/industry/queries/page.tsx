'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  HelpCircle,
  PlusCircle,
  MessageSquare,
  Clock,
  Filter,
  ChevronRight,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function IndustryQueriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Ticket Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, [statusFilter]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/industry/queries', { params });
      if (res.data?.success) {
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load support queries', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Please fill in Subject and Description.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/industry/queries', {
        subject,
        category,
        priority,
        description,
      });

      if (res.data?.success) {
        setCreateOpen(false);
        setSubject('');
        setDescription('');
        fetchQueries();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to log support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
            <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
            <span>/</span>
            <span className="text-slate-900">Queries & Support</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Support Communications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct communication channel with AnveshakHub support & domain governance team.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          + Log Support Ticket
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-700">Communication Tickets ({items.length})</div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] text-xs bg-slate-50 border-slate-200">
              <Filter className="mr-2 h-3.5 w-3.5 text-slate-500" />
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_FOR_CLIENT">Waiting for Client</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <HelpCircle className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need assistance with projects, deliverables, or technical specifications? Log a ticket below.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="mt-2 bg-[#151c2e] text-white text-xs font-bold">
                + Log Support Ticket
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((q) => (
                <div key={q.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{q.queryNumber}</span>
                      <StatusBadge status={q.status} />
                      <Badge variant="outline" className="text-[10px] font-bold border-slate-300">
                        {q.category}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{q.subject}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{q.description}</p>
                    <div className="text-xs text-slate-400 font-mono pt-1">
                      Logged {new Date(q.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/industry/queries/${q.id}`)}
                    className="text-xs font-semibold shrink-0"
                  >
                    View Conversation <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Log New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Subject / Summary *</Label>
              <Input
                placeholder="e.g. Clarification on Q3 Deliverable Inspection Specification"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Inquiry</SelectItem>
                    <SelectItem value="Project">Project & Deliverables</SelectItem>
                    <SelectItem value="Problem Statement">Problem Statement</SelectItem>
                    <SelectItem value="Technical">Technical Support</SelectItem>
                    <SelectItem value="Commercial">Commercial / Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Priority Level</Label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Detailed Description *</Label>
              <Textarea
                rows={5}
                placeholder="Provide full context or questions for AnveshakHub support..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={submitting} className="bg-[#151c2e] text-white text-xs font-bold">
              {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OPEN':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">OPEN</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">IN PROGRESS</Badge>;
    case 'WAITING_FOR_CLIENT':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">WAITING FOR CLIENT</Badge>;
    case 'RESOLVED':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">RESOLVED</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
  }
}
