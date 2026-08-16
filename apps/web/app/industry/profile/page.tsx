'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Building2,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IndustryProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/industry/profile');
      if (res.data?.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load organization profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const { organization, primaryContact, representatives, documents } = profile || {};

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
          <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
          <span>/</span>
          <span className="text-slate-900">Profile</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Profile & Representatives</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified corporate legal entity details, primary contact credentials, and registered business verticals.
        </p>
      </div>

      {/* Organization Meta Card */}
      <Card className="border-slate-200/80 shadow-md bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-500">{organization?.orgNumber}</span>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                {organization?.status}
              </Badge>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 mt-1">{organization?.legalName}</CardTitle>
          </div>
          <Building2 className="h-8 w-8 text-[#d49b38]" />
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Trade / Operating Name</span>
              <div className="font-semibold text-slate-800">{organization?.tradeName || 'N/A'}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Organization Type</span>
              <div className="font-semibold text-slate-800">{organization?.type} ({organization?.applicantType})</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Business Vertical</span>
              <div className="font-semibold text-slate-800">{organization?.primaryBv?.name || 'N/A'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-t border-slate-100 pt-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Corporate Address</span>
              <div className="font-medium text-slate-700">{organization?.address || 'Not specified'}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Website URL</span>
              <div className="font-medium text-slate-700">{organization?.website || 'Not specified'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Representatives */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-900">Authorized Organization Representatives</CardTitle>
          <CardDescription className="text-xs text-slate-500">Corporate accounts linked to this organization workspace</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!representatives || representatives.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">Primary contact: {primaryContact?.email}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {representatives.map((rep: any) => (
                <div key={rep.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{rep.user?.email}</div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Role: {rep.orgRole}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {rep.user?.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
