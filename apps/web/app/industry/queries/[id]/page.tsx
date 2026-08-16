'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  HelpCircle,
  ArrowLeft,
  Send,
  User,
  ShieldCheck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function SupportQueryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [query, setQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchQuery();
  }, [id]);

  const fetchQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/industry/queries/${id}`);
      if (res.data?.success) {
        setQuery(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load ticket.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/industry/queries/${id}/messages`, {
        message: replyMessage,
      });

      if (res.data?.success) {
        setReplyMessage('');
        fetchQuery();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-20 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !query) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h2 className="text-base font-bold text-red-900">Support Ticket Error</h2>
            <p className="text-xs text-red-700">{error || 'Ticket not found.'}</p>
            <Button variant="outline" onClick={() => router.push('/industry/queries')} className="text-xs">
              Back to Queries
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { queryNumber, subject, category, priority, status, description, messages, createdAt } = query;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
            <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
            <span>/</span>
            <Link href="/industry/queries" className="hover:text-slate-900">Queries</Link>
            <span>/</span>
            <span className="font-mono text-slate-900 font-bold">{queryNumber}</span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded border border-slate-200">
              {queryNumber}
            </span>
            <StatusBadge status={status} />
            <Badge variant="outline" className="text-[10px] font-bold border-slate-300">
              Category: {category}
            </Badge>
          </div>
          <h1 className="text-xl font-black text-slate-900 pt-1">{subject}</h1>
        </div>

        <Button variant="outline" size="sm" onClick={() => router.push('/industry/queries')} className="text-xs font-semibold shrink-0">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Queries
        </Button>
      </div>

      {/* Conversation Thread Card */}
      <Card className="border-slate-200/80 shadow-md bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-900">Support Conversation History</CardTitle>
          <CardDescription className="text-xs text-slate-500">Logged on {new Date(createdAt).toLocaleString()}</CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Message List */}
          <div className="space-y-4">
            {messages && messages.map((msg: any) => {
              const isAdminMsg = msg.senderRole === 'ADMIN' || msg.senderRole === 'SUPPORT';
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl space-y-2 border ${
                    isAdminMsg
                      ? 'bg-blue-50/80 border-blue-200 md:mr-12'
                      : 'bg-slate-50 border-slate-200 md:ml-12'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isAdminMsg ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-blue-600 text-white rounded">
                          AnveshakHub Support Team
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-slate-200 text-slate-800 rounded">
                          Client Representative
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900">{msg.senderName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Post Reply Message</label>
              <Textarea
                rows={3}
                placeholder="Type your response to the support team..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                className="bg-[#151c2e] text-white hover:bg-[#1e293b] text-xs font-bold"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
