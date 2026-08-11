'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicShell } from '@/components/layout/public-shell';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const reasonParam = searchParams.get('reason') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token: tokenParam, newPassword: '', confirmPassword: '' },
  });

  React.useEffect(() => {
    if (tokenParam) setValue('token', tokenParam);
  }, [tokenParam, setValue]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: tokenParam || data.token, newPassword: data.newPassword }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      if (err.status === 400) {
        setServerError('Password reset token is invalid or has expired. Please request a new recovery link.');
      } else {
        setServerError(err.message || 'An error occurred while resetting your password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-extrabold text-[#151c2e] text-2xl shadow-md">
            AH
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            {reasonParam === 'bootstrap_mandatory_change' ? 'Mandatory Password Change' : 'Set New Password'}
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#d49b38] uppercase tracking-wider">
            {reasonParam === 'bootstrap_mandatory_change'
              ? 'Bootstrap Account Security Update'
              : 'Single-Use Password Reset'}
          </p>
        </div>

        {/* Mandatory change warning */}
        {reasonParam === 'bootstrap_mandatory_change' && (
          <div className="mb-5 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-4 py-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#92400E]" />
              <div>
                <p className="text-xs font-bold text-[#92400E]">Action Required</p>
                <p className="mt-0.5 text-xs text-[#92400E]/80">
                  Your initial bootstrap administrator password must be updated prior to platform access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div className="mb-5 rounded-lg border border-[#B42318]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#B42318]">
            {serverError}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#A3D9C0] bg-[#EBF5F0] p-5 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#2F6F52]" />
              <h2 className="text-base font-bold text-[#2F6F52]">Password Updated Successfully</h2>
              <p className="mt-2 text-xs text-[#1e293b] leading-relaxed">
                Your credentials have been securely updated using Argon2id encryption. You may now sign in.
              </p>
            </div>
            <Button variant="primary" className="w-full" onClick={() => router.push('/login')}>
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <input type="hidden" {...register('token')} value={tokenParam} />

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                New Password <span className="text-[#d49b38]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#94a3b8] hover:text-[#0F172A]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword?.message && (
                <p className="mt-1 text-xs text-[#B42318]">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                Confirm New Password <span className="text-[#d49b38]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pl-10"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword?.message && (
                <p className="mt-1 text-xs text-[#B42318]">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Update Password
            </Button>

            <div className="text-center">
              <Link href="/login" className="inline-flex items-center text-xs font-medium text-[#64748B] hover:text-[#d49b38] transition-colors">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>

      {/* Security Note */}
      <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-[#94a3b8]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#d49b38]" />
        <span>Anveshak Hub • Argon2id Encrypted Password Update</span>
      </div>
    </div>
  );
}

export default function Fnd05ResetPasswordPage() {
  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-center text-xs text-[#94a3b8]">Loading reset portal...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </PublicShell>
  );
}
