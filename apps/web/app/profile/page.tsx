'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { StatusBadge } from '@/components/ui/status-badge';
import { User, Mail, Shield, Lock, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';

export default function Fnd07ProfilePage() {
  const { user: authUser, setAuth } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiRequest('/auth/me');
        if (res && res.user) {
          setProfile(res.user);
          setEmail(res.user.email || '');
        }
      } catch (err: any) {
        setServerError(err.message || 'Failed to load user profile details.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);
    setIsUpdating(true);

    try {
      const res = await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res && res.data) {
        setProfile(res.data);
        if (authUser) {
          setAuth({ ...authUser, email: res.data.email });
        }
        setSuccessMsg('Your profile contact information was updated successfully.');
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-slate-500">
        <RefreshCw className="mr-2.5 h-5 w-5 animate-spin text-[#d49b38]" />
        <span>Loading user account profile...</span>
      </div>
    );
  }

  const currentUser = profile || authUser;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Profile Banner Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#151c2e] to-[#1e293b] text-[#d49b38] text-2xl font-extrabold shadow-md ring-2 ring-[#d49b38]/30">
              {currentUser?.email?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currentUser?.email}
                </h1>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                User Account Profile &amp; Enterprise System Authorization
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <StatusBadge status={currentUser?.status || 'ACTIVE'} />
          </div>
        </div>
      </div>

      {serverError && <Alert variant="error">{serverError}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Contact Information Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Mail className="h-5 w-5 text-[#d49b38]" />
          <h2 className="text-base font-bold text-slate-900">Contact Information</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <FormField label="Email Address" required htmlFor="profileEmail">
            <div className="relative flex items-center">
              <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 z-10" />
              <input
                id="profileEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d49b38]/20 transition-all"
              />
            </div>
          </FormField>

          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-6 py-2.5 text-xs font-bold text-[#151c2e] shadow-sm hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {isUpdating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Profile Changes
          </button>
        </form>
      </div>

      {/* Read-Only System Roles */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Shield className="h-5 w-5 text-[#d49b38]" />
          <h2 className="text-base font-bold text-slate-900">
            Assigned System Roles (Read-Only)
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          System roles control security authorization and module access boundaries. Roles are assigned by authorized administrators.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {(currentUser?.roles || ['USER']).map((role: string) => (
            <span
              key={role}
              className="rounded-lg bg-[#151c2e] px-3.5 py-1.5 text-xs font-extrabold uppercase text-[#d49b38] shadow-xs border border-[#182238]"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Security & Password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-[#d49b38]" />
            <h2 className="text-base font-bold text-slate-900">
              Account Password Security
            </h2>
          </div>
          <Link href="/reset-password">
            <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-all">
              <KeyRound className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Change Password
            </button>
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Update your account password via the single-use token password recovery workflow.
        </p>
      </div>
    </div>
  );
}
