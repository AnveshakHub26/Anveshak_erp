'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  ThumbsUp,
  RotateCcw,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function IndustryDeliverablesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVED' | 'CHANGES_REQUESTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliverables();
  }, []);

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/industry/deliverables');
      if (res.data?.success) {
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load deliverables', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedDeliverable) return;
    try {
      setSubmitting(true);
      const res = await api.patch(`/industry/deliverables/${selectedDeliverable.id}/review`, {
        decision,
        reviewNotes,
      });
      if (res.data?.success) {
        setReviewOpen(false);
        fetchDeliverables();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
          <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
          <span>/</span>
          <span className="text-slate-900">Deliverables</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Milestone Deliverables</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review, approve, or request revisions on project deliverables submitted by AnveshakHub engineering teams.
        </p>
      </div>

      {/* Deliverables List */}
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
              <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No deliverables available for review</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Deliverables will appear here once submitted by project teams.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((d) => (
                <div key={d.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{d.project?.projectCode}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{d.title}</h3>
                    <p className="text-xs text-slate-500">{d.description}</p>
                    {d.reviewNotes && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <strong>Client Comments:</strong> {d.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedDeliverable(d);
                        setReviewNotes(d.reviewNotes || '');
                        setReviewOpen(true);
                      }}
                      className="bg-[#151c2e] text-white hover:bg-[#1e293b] text-xs font-bold"
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Review Action
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Review Deliverable — {selectedDeliverable?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Review Decision *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={decision === 'APPROVED' ? 'primary' : 'outline'}
                  onClick={() => setDecision('APPROVED')}
                  className={decision === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold' : 'text-xs'}
                >
                  <ThumbsUp className="mr-1.5 h-3.5 w-3.5" /> Approve Deliverable
                </Button>
                <Button
                  type="button"
                  variant={decision === 'CHANGES_REQUESTED' ? 'primary' : 'outline'}
                  onClick={() => setDecision('CHANGES_REQUESTED')}
                  className={decision === 'CHANGES_REQUESTED' ? 'bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold' : 'text-xs'}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Request Revisions
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Feedback / Review Notes</Label>
              <Textarea
                rows={4}
                placeholder={decision === 'APPROVED' ? 'Add optional approval comments...' : 'Describe specific changes or revisions required...'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={handleReviewSubmit} disabled={submitting} className="bg-[#151c2e] text-white text-xs font-bold">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'SUBMITTED':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">SUBMITTED</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">UNDER REVIEW</Badge>;
    case 'REVISION_REQUESTED':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold">REVISION REQUESTED</Badge>;
    case 'APPROVED':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">APPROVED</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
  }
}
