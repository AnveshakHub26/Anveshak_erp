'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/layout/public-shell';
import { apiRequest } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Search,
  ArrowRight,
  Layers,
  CheckCircle2,
  Filter,
  Wifi,
  Users2,
  ChevronRight,
} from 'lucide-react';

interface WorkshopItem {
  id: string;
  title: string;
  shortDescription: string;
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
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  registrationUrl?: string;
  registrationDeadline?: string;
  bannerUrl?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Artificial Intelligence': { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  'Cloud Computing': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  'Cybersecurity': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  'Robotics & Automation': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Data Science & Analytics': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Software Engineering': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_COLORS[cat] ?? { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getSpeakerInitials = (name?: string) => {
  if (!name) return 'AH';
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
};

export default function PublicWorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchPublicWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      const res = await apiRequest<{ success: boolean; data: WorkshopItem[] }>(
        `/api/v1/workshops/public?${params.toString()}`
      );
      if (res.data) setWorkshops(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPublicWorkshops(), 300);
    return () => clearTimeout(timer);
  }, [fetchPublicWorkshops]);

  const now = new Date();
  const upcomingList = workshops.filter(
    (w) => new Date(w.date) >= now && w.status !== 'COMPLETED' && w.status !== 'CANCELLED'
  );
  const completedList = workshops.filter(
    (w) => new Date(w.date) < now || w.status === 'COMPLETED' || w.status === 'CANCELLED'
  );

  return (
    <PublicShell>
      {/* ─────────────── HERO ─────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f1e3d 0%, #1a2f56 40%, #1e3660 70%, #0f1e3d 100%)',
        }}
        className="relative overflow-hidden"
      >
        {/* Subtle dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Warm amber glow top-right */}
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#c4831b] opacity-10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-200 font-medium">Workshops</span>
          </nav>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-[11px] font-semibold text-amber-300 tracking-wide uppercase mb-5">
              <Layers className="h-3.5 w-3.5" />
              AnveshakHub Technical Skilling
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white tracking-tight leading-tight">
              Enterprise Workshops &amp;<br className="hidden sm:block" /> Masterclasses
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Hands-on technical workshops, industry masterclasses, and research seminars hosted by
              AnveshakHub domain leaders and industry experts.
            </p>
          </div>

          {/* ── Search + Filter Bar ── */}
          <div className="mt-8 flex flex-col gap-2.5 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search workshops, speakers, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder-slate-400 focus:bg-white/15 focus:border-amber-400/60 focus:outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white focus:border-amber-400/60 focus:outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="ALL" className="text-slate-900">All Domains</option>
                <option value="Artificial Intelligence" className="text-slate-900">Artificial Intelligence</option>
                <option value="Cloud Computing" className="text-slate-900">Cloud Computing</option>
                <option value="Cybersecurity" className="text-slate-900">Cybersecurity</option>
                <option value="Robotics & Automation" className="text-slate-900">Robotics &amp; Automation</option>
                <option value="Data Science & Analytics" className="text-slate-900">Data Science &amp; Analytics</option>
                <option value="Software Engineering" className="text-slate-900">Software Engineering</option>
              </select>
            </div>
          </div>

          {/* ── Stats Strip ── */}
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span><span className="font-bold text-white">{upcomingList.length}</span> Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span><span className="font-bold text-white">{completedList.length}</span> Completed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── MAIN CONTENT ─────────────── */}
      <div className="bg-[#F7F9FC] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">

          {/* ── UPCOMING WORKSHOPS ── */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-5 w-1 rounded-full bg-amber-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Upcoming Workshops</h2>
                </div>
                <p className="text-sm text-slate-500 ml-3.5 pl-3.5">
                  Register now to secure your seat in our upcoming live sessions
                </p>
              </div>
              {upcomingList.length > 0 && (
                <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {upcomingList.length} Open for Registration
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm space-y-4">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-6 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4 w-4/6 rounded" />
                    <div className="pt-4 border-t border-slate-100 flex justify-between">
                      <Skeleton className="h-8 w-24 rounded-lg" />
                      <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">No Upcoming Workshops Scheduled</h3>
                <p className="mt-1.5 text-sm text-slate-400 max-w-sm mx-auto">
                  Check back soon. Our team regularly hosts technical sessions and industry masterclasses.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingList.map((w) => {
                  const catStyle = getCategoryStyle(w.category);
                  const initials = getSpeakerInitials(w.speakerName);
                  const isOnline = w.mode === 'ONLINE' || w.mode === 'HYBRID';
                  return (
                    <div
                      key={w.id}
                      className="group relative flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 overflow-hidden"
                    >
                      {/* Top accent bar */}
                      <div className={`h-1 w-full ${catStyle.dot}`} />

                      <div className="flex flex-col flex-1 p-5">
                        {/* Category + Mode */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
                            {w.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${isOnline ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {isOnline ? <Wifi className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {w.mode}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {w.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 flex-1">
                          {w.shortDescription}
                        </p>

                        {/* Speaker */}
                        {w.speakerName && (
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {initials.toUpperCase()}
                            </div>
                            <div>
                              <div className="text-[12px] font-semibold text-slate-800">{w.speakerName}</div>
                              <div className="text-[11px] text-slate-400">{w.speakerRole || w.organizer}</div>
                            </div>
                          </div>
                        )}

                        {/* Date & Time */}
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 space-y-1 mb-4">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {formatDate(w.date)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {w.startTime} – {w.endTime} ({w.timezone})
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                          <Link
                            href={`/workshops/${w.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-amber-700 transition-colors"
                          >
                            View Details <ArrowRight className="h-3.5 w-3.5" />
                          </Link>

                          {w.registrationUrl ? (
                            <a
                              href={w.registrationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm transition-all"
                            >
                              Register <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <Link
                              href={`/workshops/${w.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-700 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-all"
                            >
                              Learn More
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── COMPLETED WORKSHOPS ── */}
          {!loading && completedList.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="h-5 w-1 rounded-full bg-slate-400" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-700">Past & Completed Workshops</h2>
                  </div>
                  <p className="text-sm text-slate-400 ml-3.5 pl-3.5">Archived masterclasses and past learning sessions</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedList.length} Archived
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {completedList.map((w) => {
                  const catStyle = getCategoryStyle(w.category);
                  return (
                    <Link
                      key={w.id}
                      href={`/workshops/${w.id}`}
                      className="group flex items-start gap-4 rounded-xl bg-white border border-slate-100 p-4 shadow-xs hover:border-slate-200 hover:shadow-sm transition-all"
                    >
                      <div className={`h-10 w-10 rounded-xl ${catStyle.bg} flex items-center justify-center shrink-0`}>
                        <CheckCircle2 className={`h-5 w-5 ${catStyle.text}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {w.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${catStyle.bg} ${catStyle.text}`}>
                            {w.category}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatDate(w.date)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-600 group-hover:text-amber-700">
                          View Summary <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── EMPTY STATE ── */}
          {!loading && workshops.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <Users2 className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">No workshops match your search</h3>
              <p className="mt-1.5 text-sm text-slate-400">Try a different keyword or domain filter.</p>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
