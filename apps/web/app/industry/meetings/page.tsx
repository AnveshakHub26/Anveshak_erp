'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Calendar,
  Clock,
  Video,
  PlusCircle,
  FolderGit2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function IndustryMeetingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Request Meeting Modal State
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [preferredDateTime, setPreferredDateTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeetings();
    fetchProjects();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/industry/meetings');
      if (res.data?.success) {
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load meetings', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/industry/projects');
      if (res.data?.success) {
        setProjects(res.data.data.items || []);
        if (res.data.data.items.length > 0) {
          setSelectedProjectId(res.data.data.items[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects for meetings', err);
    }
  };

  const handleRequestSubmit = async () => {
    if (!selectedProjectId || !meetingTitle.trim() || !preferredDateTime) {
      alert('Please complete all required meeting details.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/industry/meetings/request', {
        projectId: selectedProjectId,
        title: meetingTitle,
        description: meetingDesc,
        preferredDateTime,
      });

      if (res.data?.success) {
        setRequestOpen(false);
        setMeetingTitle('');
        setMeetingDesc('');
        setPreferredDateTime('');
        fetchMeetings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request meeting.');
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
            <span className="text-slate-900">Meetings</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Meetings & Reviews</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Join scheduled video calls, view agendas, and request technical alignment sessions.
          </p>
        </div>

        <Button
          onClick={() => setRequestOpen(true)}
          className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          + Request Meeting
        </Button>
      </div>

      {/* Meetings List */}
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
              <Calendar className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No scheduled meetings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Request a technical alignment call or project review session with AnveshakHub coordinators.
              </p>
              <Button onClick={() => setRequestOpen(true)} className="mt-2 bg-[#151c2e] text-white text-xs font-bold">
                + Request Meeting
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((m) => (
                <div key={m.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{m.project?.projectCode}</span>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">{m.status}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                    <p className="text-xs text-slate-500">{m.description}</p>
                    <div className="text-xs text-slate-600 font-medium pt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(m.startDateTime).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.meetingUrl && m.meetingUrl.startsWith('http') ? (
                      <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                          <Video className="mr-1.5 h-3.5 w-3.5" /> Join Call
                        </Button>
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-xs font-semibold text-slate-500">
                        Link Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Meeting Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Request Project Alignment Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Related Project *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.projectCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Meeting Agenda / Subject *</Label>
              <Input
                placeholder="e.g. Q3 Technical Milestone Alignment Review"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Preferred Date & Time *</Label>
              <Input
                type="datetime-local"
                value={preferredDateTime}
                onChange={(e) => setPreferredDateTime(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Description / Topics to Discuss</Label>
              <Textarea
                rows={3}
                placeholder="Describe key topics or participants required..."
                value={meetingDesc}
                onChange={(e) => setMeetingDesc(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={handleRequestSubmit} disabled={submitting} className="bg-[#151c2e] text-white text-xs font-bold">
              {submitting ? 'Requesting...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
