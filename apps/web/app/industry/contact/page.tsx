'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  PhoneCall,
  Mail,
  Building2,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ContactAnveshakHubPage() {
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State for Sending Email / Quick Query
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [subject, setSubject] = useState('General Support Request');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/industry/contact-info');
      if (res.data?.success) {
        setContactInfo(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load contact info', err);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (tpl: any) => {
    setSelectedCategory(tpl.category);
    setSubject(tpl.subject);
    setMessage(
      `Dear ${contactInfo?.adminName || 'AnveshakHub Team'},\n\nI am writing regarding ${tpl.label}.\n\n[Please detail your request or operational requirements here]\n\nBest regards,\n[Your Name]`,
    );
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please enter a subject and message.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/industry/queries', {
        subject,
        category: selectedCategory,
        priority: 'MEDIUM',
        description: message,
      });

      if (res.data?.success) {
        setSuccess(true);
        setSubject('');
        setMessage('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch email inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#151c2e] via-[#1e293b] to-[#2a364f] p-6 md:p-8 rounded-2xl text-white shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-xs text-[#d49b38] font-semibold">
          <Link href="/industry" className="hover:text-white">Industry Portal</Link>
          <span>/</span>
          <span className="text-white">Contact AnveshakHub</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Official AnveshakHub Corporate Support</h1>
        <p className="text-xs text-slate-300 max-w-2xl">
          Connect directly with AnveshakHub enterprise coordinators, domain governance leads, and technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Cards (1 Col) */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Corporate Support Desk</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-[#d49b38] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Support Unit</span>
                  <div className="font-bold text-slate-900">{contactInfo?.adminName || 'AnveshakHub Support Desk'}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <PhoneCall className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Telephone Support</span>
                  <div className="font-mono font-bold text-slate-900">{contactInfo?.phone || '+91 (080) 2838-2345'}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Official Support Email</span>
                  <div className="font-mono font-bold text-slate-900">{contactInfo?.email || 'support@anveshakhub.com'}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{contactInfo?.escalationEmail || 'escalations@anveshakhub.com'}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2 border-t border-slate-100">
                <Clock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Hours</span>
                  <div className="font-medium text-slate-700">{contactInfo?.officeHours || 'Mon-Fri (09:00 AM - 06:00 PM IST)'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Template Launcher Selection */}
          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Ready-Made Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {contactInfo?.templates?.map((tpl: any) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#d49b38] hover:bg-amber-50/50 text-xs font-semibold text-slate-800 transition-all flex items-center justify-between group"
                >
                  <span>{tpl.label}</span>
                  <Sparkles className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#d49b38]" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Email Inquiry Form (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200/80 bg-white shadow-md">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Send an Official Email / Support Request</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Dispatches an asynchronous inquiry directly to the AnveshakHub support queue via EmailService.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {success && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900">
                  🎉 Email inquiry enqueued successfully! Support ticket created and notification sent.
                </div>
              )}

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Subject *</Label>
                  <Input
                    placeholder="e.g. Technical Support Request for Project PRJ-2026-000001"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Message / Email Body *</Label>
                  <Textarea
                    rows={8}
                    placeholder="Write your email message here or select a ready-made template..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="text-xs font-sans leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-md"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {submitting ? 'Sending Email...' : 'Send Email Inquiry'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
