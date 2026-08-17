'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/layout/public-shell';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
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
      if (res.data) {
        setWorkshops(res.data);
      }
    } catch {
      // Keep empty array on error
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    fetchPublicWorkshops();
  }, [fetchPublicWorkshops]);

  const now = new Date();
  const upcomingList = workshops.filter((w) => new Date(w.date) >= now && w.status !== 'COMPLETED');
  const completedList = workshops.filter((w) => new Date(w.date) < now || w.status === 'COMPLETED');

  return (
    <PublicShell>
      {/* HERO BANNER */}
      <section className="bg-[#151c2e] text-white border-b border-[#182238] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 rounded-full border border-[#d49b38]/40 bg-[#d49b38]/10 px-3 py-1 text-xs font-semibold text-[#d49b38] uppercase tracking-wider mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Anveshak Hub Technical Skilling</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl tracking-tight">
              Enterprise Workshops &amp; Masterclasses
            </h1>
            <p className="mt-3 text-sm text-[#94a3b8] sm:text-base leading-relaxed">
              Explore hands-on technical workshops, industry masterclasses, and research seminars hosted by Anveshak Hub domain leaders.
            </p>
          </div>

          {/* SEARCH & CATEGORY FILTER */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl bg-[#182238] p-3 rounded-xl border border-[#d49b38]/30 shadow-lg">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search workshops by title, speaker, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#182238] bg-[#0b101b] text-xs text-white placeholder-[#94a3b8] focus:border-[#d49b38] focus:outline-none"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-xs text-white focus:border-[#d49b38] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Robotics & Automation">Robotics & Automation</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Software Engineering">Software Engineering</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CATALOG CONTENT */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {/* SECTION 1: UPCOMING WORKSHOPS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#d49b38]" />
                <span>Upcoming Workshops</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Register now for upcoming live interactive masterclasses and industry sessions.
              </p>
            </div>
            <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold text-[#d49b38]">
              {upcomingList.length} Sessions Available
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : upcomingList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center text-xs text-[#64748B]">
              <Calendar className="h-10 w-10 mx-auto text-[#94a3b8] mb-3" />
              <p className="font-semibold text-sm text-[#0F172A]">No Upcoming Workshops Scheduled</p>
              <p className="mt-1">Check back soon for new technical sessions and masterclass announcements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingList.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#d49b38] hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-amber-50 text-[#8B5E14] border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                        {w.category}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          w.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {w.status === 'CANCELLED' ? 'CANCELLED' : w.mode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] mb-2 line-clamp-2">{w.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-3">{w.shortDescription}</p>

                    <div className="space-y-2 text-[11px] text-[#475569] border-t border-[#F1F5F9] pt-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3.5 w-3.5 text-[#d49b38]" />
                        <span className="font-medium">{new Date(w.date).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{w.startTime} - {w.endTime} ({w.timezone})</span>
                      </div>

                      {w.speakerName && (
                        <div className="flex items-center space-x-2 text-slate-600 pt-0.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{w.speakerName} ({w.speakerRole || w.organizer})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    <Link
                      href={`/workshops/${w.id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-[#d49b38] transition-colors"
                    >
                      View Details →
                    </Link>

                    {w.status === 'CANCELLED' ? (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                        Event Cancelled
                      </span>
                    ) : w.registrationUrl ? (
                      <a
                        href={w.registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-3.5 py-1.5 text-xs font-bold text-[#151c2e] hover:opacity-95 shadow-xs transition-all"
                      >
                        Register <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <Link
                        href={`/workshops/${w.id}`}
                        className="inline-flex items-center rounded-lg bg-[#151c2e] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#182238] transition-all"
                      >
                        Learn More
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: COMPLETED WORKSHOPS */}
        {completedList.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <span>Past &amp; Completed Workshops</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Archived masterclasses and previous technical learning sessions.
                </p>
              </div>
              <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold text-purple-700">
                {completedList.length} Archived
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedList.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-xs opacity-90"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-slate-200 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold">
                        {w.category}
                      </span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        COMPLETED
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] mb-2">{w.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-4">{w.shortDescription}</p>

                    <div className="text-[11px] text-[#475569] border-t border-[#E2E8F0] pt-3">
                      Conducted on {new Date(w.date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <Link
                      href={`/workshops/${w.id}`}
                      className="text-xs font-semibold text-purple-700 hover:underline"
                    >
                      View Archive &amp; Summary →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicShell>
  );
}
