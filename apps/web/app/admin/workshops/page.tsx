'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Calendar,
  PlusCircle,
  Search,
  RefreshCw,
  Edit3,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  Video,
  MapPin,
  Users,
  AlertCircle,
  Clock,
  Globe,
  X,
  FileText,
} from 'lucide-react';

interface WorkshopItem {
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
  meetingProvider: 'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'ZOOM' | 'OTHER';
  meetingUrl?: string;
  registrationUrl?: string;
  location?: string;
  capacity?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isPublic: boolean;
  registrationDeadline?: string;
  bannerUrl?: string;
  createdAt: string;
  createdBy?: { id: string; email: string };
}

export default function AdminWorkshopsPage() {
  const router = useRouter();
  const { hasRole } = usePermissions();

  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formState, setFormState] = useState<{
    title: string;
    shortDescription: string;
    description: string;
    category: string;
    organizer: string;
    speakerName: string;
    speakerRole: string;
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
    mode: 'ONLINE' | 'PHYSICAL' | 'HYBRID';
    meetingProvider: 'GOOGLE_MEET' | 'MICROSOFT_TEAMS' | 'ZOOM' | 'OTHER';
    meetingUrl: string;
    registrationUrl: string;
    location: string;
    capacity: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    isPublic: boolean;
    registrationDeadline: string;
    bannerUrl: string;
  }>({
    title: '',
    shortDescription: '',
    description: '',
    category: 'Artificial Intelligence',
    organizer: 'AnveshakHub Technical Team',
    speakerName: '',
    speakerRole: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    timezone: 'IST (UTC+5:30)',
    mode: 'ONLINE',
    meetingProvider: 'GOOGLE_MEET',
    meetingUrl: '',
    registrationUrl: '',
    location: '',
    capacity: '',
    status: 'DRAFT',
    isPublic: true,
    registrationDeadline: '',
    bannerUrl: '',
  });

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      const res = await apiRequest<{ success: boolean; data: WorkshopItem[] }>(
        `/api/v1/workshops/admin?${params.toString()}`
      );
      if (res.data) {
        setWorkshops(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch workshops.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    if (!hasRole('ADMIN')) {
      router.push('/unauthorized');
      return;
    }
    const timer = setTimeout(() => {
      fetchWorkshops();
    }, 300);
    return () => clearTimeout(timer);
  }, [hasRole, router, fetchWorkshops]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormState({
      title: '',
      shortDescription: '',
      description: '',
      category: 'Artificial Intelligence',
      organizer: 'AnveshakHub Technical Team',
      speakerName: '',
      speakerRole: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      timezone: 'IST (UTC+5:30)',
      mode: 'ONLINE',
      meetingProvider: 'GOOGLE_MEET',
      meetingUrl: '',
      registrationUrl: '',
      location: '',
      capacity: '',
      status: 'DRAFT',
      isPublic: true,
      registrationDeadline: '',
      bannerUrl: '',
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (w: WorkshopItem) => {
    setEditingId(w.id);
    setFormState({
      title: w.title,
      shortDescription: w.shortDescription,
      description: w.description || '',
      category: w.category,
      organizer: w.organizer,
      speakerName: w.speakerName || '',
      speakerRole: w.speakerRole || '',
      date: w.date ? w.date.split('T')[0] : '',
      startTime: w.startTime,
      endTime: w.endTime,
      timezone: w.timezone || 'IST (UTC+5:30)',
      mode: w.mode,
      meetingProvider: w.meetingProvider,
      meetingUrl: w.meetingUrl || '',
      registrationUrl: w.registrationUrl || '',
      location: w.location || '',
      capacity: w.capacity ? String(w.capacity) : '',
      status: w.status,
      isPublic: w.isPublic,
      registrationDeadline: w.registrationDeadline ? w.registrationDeadline.split('T')[0] : '',
      bannerUrl: w.bannerUrl || '',
    });
    setShowModal(true);
  };

  // Submit Modal Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        ...formState,
        capacity: formState.capacity ? parseInt(formState.capacity, 10) : undefined,
      };

      if (editingId) {
        await apiRequest(`/api/v1/workshops/admin/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setActionSuccess('Workshop updated successfully.');
      } else {
        await apiRequest(`/api/v1/workshops/admin`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setActionSuccess('New workshop created successfully.');
      }

      setShowModal(false);
      fetchWorkshops();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save workshop.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Update
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await apiRequest(`/api/v1/workshops/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setActionSuccess(`Workshop status updated to ${newStatus}.`);
      fetchWorkshops();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update workshop status.');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-[#d49b38]" />
              <span>Enterprise Workshop Management</span>
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Create, publish, and manage technical workshops, guest lectures, and industry seminars.
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-[#d49b38] hover:bg-[#b8832a] text-[#0F172A] font-bold text-xs shadow-md flex items-center space-x-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Create Workshop</span>
          </Button>
        </div>

        {/* Global Alerts */}
        {actionSuccess && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </Alert>
        )}

        {errorMsg && (
          <Alert className="border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </Alert>
        )}

        {/* Filter Card */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search workshops by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
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
          </CardContent>
        </Card>

        {/* Master Table */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="py-3 px-5 border-b border-[#E2E8F0] flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Workshop Registry ({workshops.length})
            </CardTitle>
            <Button
              onClick={fetchWorkshops}
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2 border-slate-300 text-slate-700"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : workshops.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No workshops found"
                description="Get started by creating your first workshop or adjusting your search filters."
                actionLabel="+ Create Workshop"
                onAction={handleOpenCreate}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Workshop Title & Field</th>
                      <th className="px-4 py-3 font-semibold">Date & Time</th>
                      <th className="px-4 py-3 font-semibold">Speaker / Organizer</th>
                      <th className="px-4 py-3 font-semibold">Mode & Links</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                    {workshops.map((w) => (
                      <tr key={w.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Title & Field */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-bold text-[#0F172A] text-xs">{w.title}</div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">{w.shortDescription}</div>
                          <span className="inline-block mt-1.5 rounded bg-amber-50 text-[#8B5E14] border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                            {w.category}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-[#0F172A] flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-[#d49b38]" />
                            <span>{new Date(w.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] flex items-center space-x-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{w.startTime} - {w.endTime}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{w.timezone}</div>
                        </td>

                        {/* Speaker / Organizer */}
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#0F172A]">{w.speakerName || 'TBA'}</div>
                          <div className="text-[11px] text-[#64748B]">{w.speakerRole || w.organizer}</div>
                        </td>

                        {/* Mode & Links */}
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-700">
                            {w.mode === 'ONLINE' ? (
                              <Video className="h-3.5 w-3.5 text-blue-600 mr-1" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                            )}
                            <span>{w.mode}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {w.registrationUrl && (
                              <a
                                href={w.registrationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-[10px] font-medium text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3 mr-0.5" /> Google Form
                              </a>
                            )}
                            {w.meetingUrl && (
                              <a
                                href={w.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-[10px] font-medium text-emerald-600 hover:underline"
                              >
                                <Video className="h-3 w-3 mr-0.5" /> Meeting Link
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              w.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : w.status === 'ONGOING'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : w.status === 'COMPLETED'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : w.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Button
                              onClick={() => handleOpenEdit(w)}
                              variant="outline"
                              size="sm"
                              className="text-[11px] h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                              title="Edit workshop"
                            >
                              <Edit3 className="h-3 w-3 mr-1 text-amber-600" /> Edit
                            </Button>

                            {w.status === 'DRAFT' && (
                              <Button
                                onClick={() => handleStatusUpdate(w.id, 'PUBLISHED')}
                                size="sm"
                                className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                              >
                                Publish
                              </Button>
                            )}

                            {w.status === 'PUBLISHED' && (
                              <Button
                                onClick={() => handleStatusUpdate(w.id, 'COMPLETED')}
                                variant="outline"
                                size="sm"
                                className="text-[11px] h-7 px-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                Complete
                              </Button>
                            )}

                            {w.status !== 'CANCELLED' && w.status !== 'COMPLETED' && (
                              <Button
                                onClick={() => handleStatusUpdate(w.id, 'CANCELLED')}
                                variant="outline"
                                size="sm"
                                className="text-[11px] h-7 px-2 border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CREATE / EDIT MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-[#d49b38]" />
                  <span>{editingId ? 'Edit Workshop Configuration' : 'Create New Workshop'}</span>
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* SECTION 1: WORKSHOP CORE INFORMATION */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                    1. General Workshop Information
                  </h4>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Workshop Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI & Machine Learning in Industrial Automation"
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Field / Category *</label>
                      <select
                        value={formState.category}
                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      >
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Robotics & Automation">Robotics & Automation</option>
                        <option value="Data Science & Analytics">Data Science & Analytics</option>
                        <option value="Software Engineering">Software Engineering</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Organizer Name</label>
                      <input
                        type="text"
                        value={formState.organizer}
                        onChange={(e) => setFormState({ ...formState, organizer: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Short Summary / Teaser *</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      placeholder="Brief 1-2 sentence overview for cards & public discovery..."
                      value={formState.shortDescription}
                      onChange={(e) => setFormState({ ...formState, shortDescription: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Detailed Agenda & Overview</label>
                    <textarea
                      rows={3}
                      placeholder="Full description, key takeaways, speaker details, prerequisite topics..."
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Speaker Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={formState.speakerName}
                        onChange={(e) => setFormState({ ...formState, speakerName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Speaker Role & Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Principal AI Scientist, Anveshak Labs"
                        value={formState.speakerRole}
                        onChange={(e) => setFormState({ ...formState, speakerRole: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: SCHEDULE & TIMING */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                    2. Date, Time & Mode
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Event Date *</label>
                      <input
                        type="date"
                        required
                        value={formState.date}
                        onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Start Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10:00 AM"
                        value={formState.startTime}
                        onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">End Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 01:00 PM"
                        value={formState.endTime}
                        onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Event Mode</label>
                      <select
                        value={formState.mode}
                        onChange={(e) => setFormState({ ...formState, mode: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      >
                        <option value="ONLINE">ONLINE (Virtual Workshop)</option>
                        <option value="PHYSICAL">PHYSICAL (On-Premise Venue)</option>
                        <option value="HYBRID">HYBRID (Online & Venue)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Meeting Provider</label>
                      <select
                        value={formState.meetingProvider}
                        onChange={(e) => setFormState({ ...formState, meetingProvider: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      >
                        <option value="GOOGLE_MEET">Google Meet</option>
                        <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                        <option value="ZOOM">Zoom</option>
                        <option value="OTHER">Other / Custom</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: EXTERNAL LINKS & ACCESS */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                    3. External Registration & Meeting Links
                  </h4>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      External Registration URL (Google Form / Portal)
                    </label>
                    <input
                      type="url"
                      placeholder="https://forms.google.com/..."
                      value={formState.registrationUrl}
                      onChange={(e) => setFormState({ ...formState, registrationUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">
                      Visitors who click [Register] on the public portal will open this link.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Meeting Access Link (Google Meet / Teams / Zoom)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={formState.meetingUrl}
                      onChange={(e) => setFormState({ ...formState, meetingUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                      <select
                        value={formState.status}
                        onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT (Hidden from public)</option>
                        <option value="PUBLISHED">PUBLISHED (Visible on website)</option>
                        <option value="ONGOING">ONGOING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Public Visibility</label>
                      <select
                        value={formState.isPublic ? 'true' : 'false'}
                        onChange={(e) => setFormState({ ...formState, isPublic: e.target.value === 'true' })}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-xs focus:border-[#d49b38] focus:outline-none"
                      >
                        <option value="true">Publicly Listed</option>
                        <option value="false">Unlisted / Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="border-slate-300 text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#d49b38] hover:bg-[#b8832a] text-[#0F172A] font-bold"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Workshop' : 'Create Workshop'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
