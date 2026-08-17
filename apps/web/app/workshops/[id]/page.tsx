'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  ChevronLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Building2,
} from 'lucide-react';

interface WorkshopDetail {
  id: string;
  title: string;
  shortDescription: string;
  description?: string;
  category: string;
  organizer: string;
  speakerName?: string;
  speakerRole?: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  mode: 'ONLINE' | 'PHYSICAL' | 'HYBRID';
  location?: string;
  capacity?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  registrationUrl?: string;
  registrationDeadline?: string;
  bannerUrl?: string;
}

export default function PublicWorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params?.id as string;

  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!workshopId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: WorkshopDetail }>(
        `/api/v1/workshops/public/${workshopId}`
      );
      if (res.data) {
        setWorkshop(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Workshop not found or is not publicly available.');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PublicShell>
    );
  }

  if (!workshop || errorMsg) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
          <h1 className="text-xl font-bold text-[#0F172A]">Workshop Not Available</h1>
          <p className="text-xs text-[#64748B]">
            {errorMsg || 'The requested workshop could not be found or has not been published.'}
          </p>
          <Link href="/workshops">
            <Button className="mt-4 bg-[#d49b38] text-[#151c2e] text-xs font-bold">
              Return to Workshop Catalog
            </Button>
          </Link>
        </div>
      </PublicShell>
    );
  }

  const isCancelled = workshop.status === 'CANCELLED';
  const isCompleted = workshop.status === 'COMPLETED';

  return (
    <PublicShell>
      {/* HEADER BREADCRUMB */}
      <div className="bg-[#151c2e] text-white border-b border-[#182238] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/workshops"
            className="inline-flex items-center text-xs text-[#94a3b8] hover:text-[#d49b38] transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Workshop Catalog
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-500/20 text-[#d49b38] border border-[#d49b38]/40 px-3 py-0.5 text-xs font-bold">
              {workshop.category}
            </span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                isCancelled
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : isCompleted
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {workshop.status}
            </span>
            <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-3 py-0.5 text-xs font-medium">
              {workshop.mode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {workshop.title}
          </h1>

          <p className="text-sm text-[#94a3b8] max-w-3xl leading-relaxed">
            {workshop.shortDescription}
          </p>
        </div>
      </div>

      {/* MAIN DETAIL GRID */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLS: OVERVIEW & DETAILED DESCRIPTION */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-[#d49b38]" />
                <span>Workshop Agenda &amp; Overview</span>
              </h2>

              <div className="prose prose-slate max-w-none text-xs text-[#334155] leading-relaxed whitespace-pre-line">
                {workshop.description || workshop.shortDescription}
              </div>

              {workshop.speakerName && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1 mt-6">
                  <span className="text-[11px] font-bold text-[#8B5E14] uppercase tracking-wider block">
                    Session Speaker
                  </span>
                  <div className="text-sm font-bold text-[#0F172A]">{workshop.speakerName}</div>
                  <div className="text-xs text-[#64748B]">{workshop.speakerRole || workshop.organizer}</div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COL: SESSION LOGISTICS CARD & CTA */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-md space-y-6 sticky top-20">
              <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 uppercase tracking-wider text-xs">
                Session Logistics &amp; Details
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 text-[#d49b38] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Date</span>
                    <span className="font-bold text-[#0F172A] text-sm">
                      {new Date(workshop.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-4 w-4 text-[#d49b38] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Timing</span>
                    <span className="font-semibold text-[#0F172A]">
                      {workshop.startTime} - {workshop.endTime}
                    </span>
                    <span className="text-[10px] text-[#64748B] block">{workshop.timezone}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Globe className="h-4 w-4 text-[#d49b38] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Delivery Mode</span>
                    <span className="font-semibold text-[#0F172A]">{workshop.mode}</span>
                    {workshop.location && (
                      <span className="text-[11px] text-[#64748B] block mt-0.5">{workshop.location}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building2 className="h-4 w-4 text-[#d49b38] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Host Organization</span>
                    <span className="font-semibold text-[#0F172A]">{workshop.organizer}</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY REGISTRATION CTA */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                {isCancelled ? (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center text-xs font-bold text-red-700">
                    This workshop has been cancelled.
                  </div>
                ) : isCompleted ? (
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center text-xs font-bold text-purple-700">
                    This session has concluded.
                  </div>
                ) : workshop.registrationUrl ? (
                  <a
                    href={workshop.registrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center rounded-xl bg-gradient-to-r from-[#d49b38] to-[#c48b28] py-3 text-xs font-extrabold text-[#151c2e] hover:opacity-95 shadow-md transition-all"
                  >
                    Register for Workshop ↗
                  </a>
                ) : (
                  <div className="rounded-lg bg-slate-100 p-3 text-center text-xs font-semibold text-slate-600">
                    Registration opening soon.
                  </div>
                )}

                <p className="text-[10px] text-center text-[#64748B]">
                  Clicking register will open the official Anveshak Hub Google Form application page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
