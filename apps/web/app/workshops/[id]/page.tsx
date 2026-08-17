'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicShell } from '@/components/layout/public-shell';
import { apiRequest } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Globe,
  Building2,
  Users2,
  Wifi,
  Layers,
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Artificial Intelligence': { bg: 'bg-violet-100', text: 'text-violet-700', bar: 'bg-violet-500' },
  'Cloud Computing': { bg: 'bg-sky-100', text: 'text-sky-700', bar: 'bg-sky-500' },
  'Cybersecurity': { bg: 'bg-rose-100', text: 'text-rose-700', bar: 'bg-rose-500' },
  'Robotics & Automation': { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  'Data Science & Analytics': { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  'Software Engineering': { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
};
const getCat = (cat: string) =>
  CATEGORY_COLORS[cat] ?? { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-400' };

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const getSpeakerInitials = (name?: string) => {
  if (!name) return 'AH';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

export default function PublicWorkshopDetailPage() {
  const params = useParams();
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
      if (res.data) setWorkshop(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Workshop not found or is not publicly available.');
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /* ── LOADING ── */
  if (loading) {
    return (
      <PublicShell>
        <div className="bg-[#F7F9FC] min-h-screen">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  /* ── ERROR ── */
  if (!workshop || errorMsg) {
    return (
      <PublicShell>
        <div className="bg-[#F7F9FC] min-h-screen flex items-center justify-center">
          <div className="max-w-md text-center px-4 py-16 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Workshop Not Available</h1>
            <p className="text-sm text-slate-500">
              {errorMsg || 'The requested workshop could not be found or has not been published.'}
            </p>
            <Link
              href="/workshops"
              className="inline-flex items-center gap-2 mt-4 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Browse All Workshops
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  const isCancelled = workshop.status === 'CANCELLED';
  const isCompleted = workshop.status === 'COMPLETED' || new Date(workshop.date) < new Date();
  const catStyle = getCat(workshop.category);

  return (
    <PublicShell>
      {/* ─── HERO HEADER ─── */}
      <div
        style={{ background: 'linear-gradient(135deg, #0f1e3d 0%, #1a2f56 50%, #0f1e3d 100%)' }}
        className="relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-amber-500 opacity-10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/workshops" className="hover:text-white transition-colors">Workshops</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-200 font-medium line-clamp-1 max-w-[180px]">{workshop.title}</span>
          </nav>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${catStyle.bg} ${catStyle.text} border-current/20`}>
              <Layers className="h-3.5 w-3.5" />
              {workshop.category}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
              isCancelled ? 'bg-red-900/30 text-red-300 border-red-700/40' :
              isCompleted ? 'bg-purple-900/30 text-purple-300 border-purple-700/40' :
              'bg-emerald-900/30 text-emerald-300 border-emerald-700/40'
            }`}>
              {isCancelled ? <XCircle className="h-3.5 w-3.5" /> : isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
              {workshop.status}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/60 border border-slate-600/50 px-3 py-1 text-xs font-medium text-slate-200">
              {workshop.mode === 'ONLINE' ? <Wifi className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              {workshop.mode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
            {workshop.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            {workshop.shortDescription}
          </p>

          {/* Quick meta strip */}
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-white">{formatDate(workshop.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>{workshop.startTime} – {workshop.endTime}</span>
              <span className="text-slate-500">({workshop.timezone})</span>
            </div>
            {workshop.speakerName && (
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-amber-400" />
                <span>{workshop.speakerName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="bg-[#F7F9FC] min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── LEFT: Content ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* About / Agenda */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className={`h-1 w-full ${catStyle.bar}`} />
                <div className="p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${catStyle.bar}`} />
                    Workshop Agenda &amp; Overview
                  </h2>
                  <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {workshop.description || workshop.shortDescription}
                  </div>
                </div>
              </div>

              {/* Speaker Card */}
              {workshop.speakerName && (
                <div className="rounded-2xl bg-white border border-amber-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-amber-400" />
                  <div className="p-6 flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-lg font-extrabold shrink-0">
                      {getSpeakerInitials(workshop.speakerName)}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                        Session Speaker
                      </div>
                      <div className="text-base font-bold text-slate-900">{workshop.speakerName}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{workshop.speakerRole || workshop.organizer}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Back link */}
              <Link
                href="/workshops"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-amber-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Workshop Catalog
              </Link>
            </div>

            {/* ── RIGHT: Logistics + CTA ── */}
            <div>
              <div className="rounded-2xl bg-white border border-slate-100 shadow-md overflow-hidden sticky top-6">
                <div className={`h-1.5 w-full ${catStyle.bar}`} />
                <div className="p-6 space-y-5">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Session Logistics
                  </h3>

                  {/* Info rows */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium mb-0.5">Date</div>
                        <div className="text-sm font-bold text-slate-900">{formatDate(workshop.date)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium mb-0.5">Timing</div>
                        <div className="text-sm font-bold text-slate-900">
                          {workshop.startTime} – {workshop.endTime}
                        </div>
                        <div className="text-[11px] text-slate-400">{workshop.timezone}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        {workshop.mode === 'ONLINE' ? (
                          <Wifi className="h-4 w-4 text-amber-600" />
                        ) : (
                          <MapPin className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium mb-0.5">Delivery Mode</div>
                        <div className="text-sm font-bold text-slate-900">{workshop.mode}</div>
                        {workshop.location && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{workshop.location}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium mb-0.5">Organized By</div>
                        <div className="text-sm font-bold text-slate-900">{workshop.organizer}</div>
                      </div>
                    </div>

                    {workshop.capacity && (
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                          <Users2 className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium mb-0.5">Capacity</div>
                          <div className="text-sm font-bold text-slate-900">{workshop.capacity} seats</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registration deadline */}
                  {workshop.registrationDeadline && !isCancelled && !isCompleted && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                      <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                        Registration Deadline
                      </div>
                      <div className="text-sm font-bold text-amber-900 mt-0.5">
                        {formatDate(workshop.registrationDeadline)}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="pt-1 border-t border-slate-100 space-y-3">
                    {isCancelled ? (
                      <div className="rounded-xl bg-red-50 border border-red-200 py-3 px-4 text-center text-sm font-bold text-red-700">
                        <XCircle className="h-5 w-5 mx-auto mb-1.5 text-red-400" />
                        Workshop Cancelled
                      </div>
                    ) : isCompleted ? (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 py-3 px-4 text-center text-sm font-semibold text-slate-600">
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
                        Session Concluded
                      </div>
                    ) : workshop.registrationUrl ? (
                      <>
                        <a
                          href={workshop.registrationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all"
                        >
                          Register for Workshop
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <p className="text-center text-[11px] text-slate-400">
                          Opens the official Anveshak Hub registration form
                        </p>
                      </>
                    ) : (
                      <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 py-3 px-4 text-center text-sm font-semibold text-slate-500">
                        Registration opening soon
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
