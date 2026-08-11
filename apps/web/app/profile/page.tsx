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
import { User, Mail, Shield, Building, Lock, CheckCircle2 } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6 text-label text-[#5B6673]">
        Loading user profile...
      </div>
    );
  }

  const currentUser = profile || authUser;

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header Card */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#17324D] text-white text-xl font-bold">
                {currentUser?.email?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div>
                <h1 className="text-page-title font-semibold text-[#17324D]">
                  {currentUser?.email}
                </h1>
                <p className="mt-0.5 text-label text-[#5B6673]">FND-07 User Profile & Credentials</p>
              </div>
            </div>
            <StatusBadge status={currentUser?.status || 'ACTIVE'} />
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        {/* Profile Details & Form */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-section-title font-semibold text-[#17324D] border-b border-[#D7DEE6] pb-3">
            Contact Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <FormField label="Email Address" required htmlFor="profileEmail">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                <Input
                  id="profileEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </FormField>

            <Button type="submit" variant="primary" isLoading={isUpdating} disabled={isUpdating}>
              Save Profile Changes
            </Button>
          </form>
        </div>

        {/* Read-Only System Roles & Permissions */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#D7DEE6] pb-3">
            <Shield className="h-5 w-5 text-[#1F4E79]" />
            <h2 className="text-section-title font-semibold text-[#17324D]">
              Assigned System Roles (Read-Only)
            </h2>
          </div>
          <p className="text-xs text-[#5B6673]">
            System roles control security authorization and module access boundaries. Roles cannot be modified by user request.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {(currentUser?.roles || ['USER']).map((r: string) => (
              <span
                key={r}
                className="rounded border border-[#D7DEE6] bg-[#F7F8FA] px-3 py-1 text-xs font-semibold text-[#17324D]"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Security & Password Entry */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D7DEE6] pb-3">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-[#1F4E79]" />
              <h2 className="text-section-title font-semibold text-[#17324D]">
                Account Password Security
              </h2>
            </div>
            <Link href="/reset-password">
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </Link>
          </div>
          <p className="text-xs text-[#5B6673]">
            Update your account password via the single-use token password change workflow.
          </p>
        </div>
      </div>
    </div>
  );
}
