'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ArrowLeft,
  Calendar,
  Building2,
  User,
  ChevronRight,
  FileEdit,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ProblemStatementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resubmit Modal State
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitDescription, setResubmitDescription] = useState('');
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/industry/problem-statements/${id}`);
      if (res.data?.success) {
        setData(res.data.data);
        setResubmitDescription(res.data.data.description || '');
      } else {
        setError(res.data?.message || 'Failed to load problem statement detail.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    try {
      setResubmitting(true);
      const res = await api.patch(`/industry/problem-statements/${id}`, {
        description: resubmitDescription,
        isDraft: false,
      });
      if (res.data?.success) {
        setResubmitOpen(false);
        fetchDetail();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resubmit problem statement.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-20 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h2 className="text-base font-bold text-red-900">Unable to Load Detail</h2>
            <p className="text-xs text-red-700">{error || 'Problem Statement not found.'}</p>
            <Button variant="outline" onClick={() => router.push('/industry/problem-statements')} className="text-xs">
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { code, title, status, category, department, priority, currentSituation, description, existingProcess, currentTechnology, businessImpact, desiredSolution, expectedBenefits, successCriteria, budgetEstimate, expectedTimeline, createdAt, businessVertical, organization, project, auditTimeline } = data;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
            <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
            <span>/</span>
            <Link href="/industry/problem-statements" className="hover:text-slate-900">Statements</Link>
            <span>/</span>
            <span className="font-mono text-slate-900 font-bold">{code}</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <span className="font-mono text-sm font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
              {code}
            </span>
            <StatusBadge status={status} />
            {priority && (
              <Badge variant="outline" className="text-[10px] font-bold border-slate-300">
                Priority: {priority}
              </Badge>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 pt-1">{title}</h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => router.push('/industry/problem-statements')} className="text-xs font-semibold">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
          </Button>

          {(status === 'DRAFT' || status === 'CHANGES_REQUESTED') && (
            <Button
              size="sm"
              onClick={() => setResubmitOpen(true)}
              className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-md"
            >
              <FileEdit className="mr-1.5 h-3.5 w-3.5" /> Edit / Resubmit
            </Button>
          )}
        </div>
      </div>

      {/* Linked Project Card */}
      {project && (
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <FolderGit2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Instantiated Live Project</span>
                <h3 className="text-sm font-bold text-emerald-950">{project.title} ({project.projectCode})</h3>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => router.push(`/industry/projects/${project.id}`)}
              className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold shrink-0"
            >
              View Project Workspace <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Problem Definition</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <strong className="block text-slate-900 font-bold mb-1">Description</strong>
                <p className="whitespace-pre-wrap leading-relaxed">{description}</p>
              </div>

              {currentSituation && (
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Current Situation</strong>
                  <p className="whitespace-pre-wrap">{currentSituation}</p>
                </div>
              )}

              {currentTechnology && (
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Current Systems / Technology</strong>
                  <p>{currentTechnology}</p>
                </div>
              )}

              {businessImpact && (
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Business Impact</strong>
                  <p className="text-amber-900 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">{businessImpact}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expected Outcome */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Expected Outcome & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs text-slate-700">
              {desiredSolution && (
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Desired Solution Vision</strong>
                  <p>{desiredSolution}</p>
                </div>
              )}

              {expectedBenefits && (
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Expected Benefits & KPI Goals</strong>
                  <p>{expectedBenefits}</p>
                </div>
              )}

              {successCriteria && (
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Success Criteria</strong>
                  <p>{successCriteria}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-900">Status & Audit History Timeline</CardTitle>
              <CardDescription className="text-xs text-slate-500">Immutable governance record</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!auditTimeline || auditTimeline.length === 0 ? (
                <p className="text-xs text-slate-500">No transition history logged yet.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-4 space-y-6 ml-2">
                  {auditTimeline.map((item: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-[#151c2e] border-2 border-white" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{item.action.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {item.afterJson?.reason && (
                          <div className="mt-1 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900 font-medium">
                            <strong>Feedback / Rationale:</strong> {item.afterJson.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info (1 Col) */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Classification & Meta</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Business Vertical</span>
                <div className="font-bold text-slate-800">{businessVertical?.name || 'N/A'}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                <div className="font-semibold text-slate-800">{department || 'Not specified'}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                <div className="font-semibold text-slate-800">{category || 'General'}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Timeline</span>
                <div className="font-semibold text-slate-800">{expectedTimeline || 'TBD'}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted Date</span>
                <div className="font-mono text-slate-600">{new Date(createdAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resubmit Modal */}
      <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit & Resubmit Problem Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold">Updated Problem Description</Label>
            <Textarea
              rows={6}
              value={resubmitDescription}
              onChange={(e) => setResubmitDescription(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitOpen(false)} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleResubmit}
              disabled={resubmitting}
              className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold text-xs"
            >
              {resubmitting ? 'Resubmitting...' : 'Resubmit for Evaluation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
