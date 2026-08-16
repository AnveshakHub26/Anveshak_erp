'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  FolderGit2,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  Download,
  AlertCircle,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IndustryProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/industry/projects/${id}`);
      if (res.data?.success) {
        setProject(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load project.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h2 className="text-base font-bold text-red-900">Project Workspace Error</h2>
            <p className="text-xs text-red-700">{error || 'Project not found.'}</p>
            <Button variant="outline" onClick={() => router.push('/industry/projects')} className="text-xs">
              Back to Projects List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { projectCode, title, description, status, timeline, budget, businessVertical, problemStatement, milestones, deliverables, meetings, documents } = project;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#151c2e] via-[#1e293b] to-[#2a364f] p-6 md:p-8 rounded-2xl text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
            <Link href="/industry" className="hover:text-white">Industry Portal</Link>
            <span>/</span>
            <Link href="/industry/projects" className="hover:text-white">Projects</Link>
            <span>/</span>
            <span className="font-mono text-white font-bold">{projectCode}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/industry/projects')} className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Projects
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-[#d49b38] bg-[#d49b38]/20 px-2.5 py-0.5 rounded border border-[#d49b38]/30">
                {projectCode}
              </span>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] font-bold">
                {status}
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-white">{title}</h1>
            <p className="text-xs text-slate-300 max-w-3xl line-clamp-2">{description}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs font-bold px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="milestones" className="text-xs font-bold px-4 py-2">Milestones ({milestones?.length || 0})</TabsTrigger>
          <TabsTrigger value="deliverables" className="text-xs font-bold px-4 py-2">Deliverables ({deliverables?.length || 0})</TabsTrigger>
          <TabsTrigger value="meetings" className="text-xs font-bold px-4 py-2">Meetings ({meetings?.length || 0})</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-bold px-4 py-2">Documents ({documents?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-200/80 bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-sm font-bold text-slate-900">Project Scope & Objectives</CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-xs text-slate-700 space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed">{description}</p>

                  {problemStatement && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Derived Problem Statement</span>
                      <div className="font-bold text-slate-900 mt-1">{problemStatement.title} ({problemStatement.code})</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Meta Card */}
            <div className="space-y-6">
              <Card className="border-slate-200/80 bg-white">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-xs font-bold uppercase text-slate-500">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Vertical</span>
                    <div className="font-bold text-slate-800">{businessVertical?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Timeline</span>
                    <div className="font-semibold text-slate-800">{timeline || 'TBD'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Budget</span>
                    <div className="font-semibold text-slate-800">{budget || 'TBD'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Milestones */}
        <TabsContent value="milestones">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Client Milestone Roadmap</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!milestones || milestones.length === 0 ? (
                <p className="text-xs text-slate-500">No client milestones defined yet.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m: any) => (
                    <div key={m.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-400">Milestone #{m.sequence}</span>
                        <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                      </div>
                      <Badge className="text-[10px] font-bold">{m.status || 'PLANNED'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Deliverables */}
        <TabsContent value="deliverables">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Project Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!deliverables || deliverables.length === 0 ? (
                <p className="text-xs text-slate-500">No deliverables uploaded for review yet.</p>
              ) : (
                <div className="space-y-3">
                  {deliverables.map((d: any) => (
                    <div key={d.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                        <p className="text-xs text-slate-500">{d.description}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push('/industry/deliverables')} className="text-xs font-semibold">
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Meetings */}
        <TabsContent value="meetings">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Project Meetings & Alignment Calls</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!meetings || meetings.length === 0 ? (
                <p className="text-xs text-slate-500">No meetings scheduled for this project.</p>
              ) : (
                <div className="space-y-3">
                  {meetings.map((m: any) => (
                    <div key={m.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-slate-500">{new Date(m.startDateTime).toLocaleString()}</span>
                        <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                      </div>
                      {m.meetingUrl && m.meetingUrl.startsWith('http') && (
                        <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-blue-600 text-white text-xs font-bold">
                            <Video className="mr-1.5 h-3.5 w-3.5" /> Join Call
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Documents */}
        <TabsContent value="documents">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Project Technical Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!documents || documents.length === 0 ? (
                <p className="text-xs text-slate-500">No project documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doc.type || 'Document'}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{doc.storageKey}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`http://localhost:4000/api/v1/documents/file-stream?key=${encodeURIComponent(doc.storageKey)}`, '_blank')}
                        className="text-xs font-semibold"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Download
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
