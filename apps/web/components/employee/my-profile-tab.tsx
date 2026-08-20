'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserCheck,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  History,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface EmployeeProfileData {
  id: string;
  employeeCode: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  professionalRole: string;
  department: string;
  designation: string;
  category: string;
  employmentType: string;
  status: string;
  joiningDate: string;
  exitDate?: string | null;
  skills: string[];
  technologies: string[];
  history: Array<{
    id: string;
    changeType: string;
    previousStatus?: string | null;
    newStatus?: string | null;
    previousDesignation?: string | null;
    newDesignation?: string | null;
    effectiveDate: string;
    remarks?: string | null;
    createdAt: string;
  }>;
}

export function MyProfileTab() {
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: EmployeeProfileData }>(
        '/hr/employees/me',
      );
      if (res && res.data) {
        setProfile(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <Card className="border border-red-200 bg-red-50 p-6 text-center text-xs text-red-800">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="font-bold text-sm">{errorMsg || 'Employee profile unavailable.'}</p>
        <button
          onClick={fetchProfile}
          className="mt-3 inline-flex items-center text-red-700 font-semibold underline hover:text-red-900"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry Loading
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identity Banner */}
      <div className="bg-gradient-to-r from-[#151c2e] to-[#182238] p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#d49b38] px-3 py-1 bg-[#151c2e] rounded-lg border border-[#d49b38]/30 tracking-wider">
              {profile.employeeCode}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">{profile.fullName}</h1>
          </div>
          <p className="text-xs text-[#94a3b8] flex flex-wrap items-center gap-2 pt-1">
            <span>{profile.designation}</span>
            <span>•</span>
            <span>{profile.department}</span>
            <span>•</span>
            <span className="text-[#d49b38] font-semibold">{profile.professionalRole}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs rounded-full font-bold uppercase ${
              profile.status === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : profile.status === 'ONBOARDING' || profile.status === 'PROBATION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {profile.status}
          </span>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase">
            {profile.employmentType}
          </span>
        </div>
      </div>

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work & Organization Card */}
        <Card className="border border-[#E2E8F0] bg-white shadow-xs">
          <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-5">
            <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#d49b38]" />
              Work &amp; Position Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 text-xs space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#64748B] block">Permanent Employee ID</span>
                <strong className="font-mono text-[#0F172A] text-sm">{profile.employeeCode}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Department</span>
                <strong className="text-[#0F172A]">{profile.department}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Designation</span>
                <strong className="text-[#0F172A]">{profile.designation}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Professional Role</span>
                <strong className="text-[#0F172A]">{profile.professionalRole}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Employee Category</span>
                <strong className="text-[#0F172A] uppercase">{profile.category}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Joining Date</span>
                <strong className="text-[#0F172A]">{formatDate(profile.joiningDate)}</strong>
              </div>
            </div>

            {profile.skills.length > 0 && (
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold block mb-1.5">Core Competencies &amp; Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card className="border border-[#E2E8F0] bg-white shadow-xs">
          <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-5">
            <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#d49b38]" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 text-xs space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <Mail className="h-4 w-4 text-[#64748B] shrink-0" />
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Official Work Email</span>
                  <strong className="text-[#0F172A] text-xs font-mono">{profile.workEmail}</strong>
                </div>
              </div>

              {profile.personalEmail && (
                <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Mail className="h-4 w-4 text-[#64748B] shrink-0" />
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Personal Email</span>
                    <strong className="text-[#0F172A] text-xs font-mono">{profile.personalEmail}</strong>
                  </div>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Phone className="h-4 w-4 text-[#64748B] shrink-0" />
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Contact Phone</span>
                    <strong className="text-[#0F172A] text-xs">{profile.phone}</strong>
                  </div>
                </div>
              )}

              {profile.address && (
                <div className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <MapPin className="h-4 w-4 text-[#64748B] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Address</span>
                    <p className="text-[#0F172A] text-xs leading-relaxed">{profile.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employment History Record */}
      <Card className="border border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="border-b border-[#E2E8F0] p-4 sm:p-5">
          <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <History className="h-4 w-4 text-[#d49b38]" />
            Employment History Record ({profile.employeeCode})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {profile.history.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-4">No historical status transitions recorded yet.</p>
          ) : (
            <div className="relative border-l-2 border-[#E2E8F0] ml-3 pl-4 space-y-4 text-xs">
              {profile.history.map((h) => (
                <div key={h.id} className="relative group">
                  <div className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#d49b38] border-2 border-white shadow-xs" />
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] uppercase tracking-wide text-[11px]">
                        {h.changeType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-[#64748B]">{formatDate(h.effectiveDate)}</span>
                    </div>

                    {h.newDesignation && (
                      <p className="text-xs text-[#334155]">
                        Designation: <strong>{h.newDesignation}</strong>
                      </p>
                    )}

                    {h.remarks && <p className="text-[11px] text-[#64748B] italic">{h.remarks}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
