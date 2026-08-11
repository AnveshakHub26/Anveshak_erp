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
import { Alert } from '@/components/ui/alert';
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
    defaultValues: {
      token: tokenParam,
      newPassword: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    if (tokenParam) {
      setValue('token', tokenParam);
    }
  }, [tokenParam, setValue]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: tokenParam || data.token,
          newPassword: data.newPassword,
        }),
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
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-medium text-[#94a3b8] hover:text-[#d49b38] focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-md px-2 py-1 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 text-[#d49b38]" /> Back to Sign In
        </Link>
      </div>

      <div className="rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-extrabold text-[#151c2e] text-2xl shadow-lg shadow-[#d49b38]/20">
            AH
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {reasonParam === 'bootstrap_mandatory_change'
              ? 'Mandatory Password Change'
              : 'Set New Password'}
          </h1>
          <p className="mt-2 text-xs font-medium text-[#d49b38] uppercase tracking-wider">
            {reasonParam === 'bootstrap_mandatory_change'
              ? 'Bootstrap Account Security Update'
              : 'Single-Use Password Reset Fulfillment'}
          </p>
        </div>

        {reasonParam === 'bootstrap_mandatory_change' && (
          <Alert variant="warning" className="mb-6 bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]">
            <AlertTriangle className="h-5 w-5 text-[#92400E] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#92400E]">Action Required</h4>
              <p className="mt-0.5 text-xs text-[#1e293b]">
                Your initial bootstrap administrator password must be updated prior to platform access.
              </p>
            </div>
          </Alert>
        )}

        {serverError && (
          <Alert variant="error" className="mb-6 border-[#B42318] bg-[#FDF2F2] text-[#B42318]">
            {serverError}
          </Alert>
        )}

        {isSuccess ? (
          <div className="space-y-6">
            <Alert variant="success" className="bg-[#EBF5F0] border-[#A3D9C0] text-[#2F6F52]">
              <CheckCircle2 className="h-5 w-5 text-[#2F6F52] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#2F6F52]">Password Updated Successfully</h4>
                <p className="mt-1 text-xs text-[#1e293b]">
                  Your credentials have been securely updated using Argon2id encryption. You may now sign in.
                </p>
              </div>
            </Alert>
            <Button
              variant="primary"
              className="w-full bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold shadow-md shadow-[#d49b38]/15 hover:opacity-95"
              onClick={() => router.push('/login')}
            >
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <input type="hidden" {...register('token')} value={tokenParam} />
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="mb-2 block text-xs font-semibold text-[#e2e8f0]">
                New Password <span className="text-[#d49b38]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94a3b8]">
                  <Lock className="h-4 w-4 text-[#d49b38]" />
                </div>
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-[#151c2e] border-[#d49b38]/25 text-white placeholder-[#64748b] focus:border-[#d49b38] focus:ring-[#d49b38]"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#94a3b8] hover:text-[#d49b38] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-xs font-semibold text-[#e2e8f0]">
                Confirm New Password <span className="text-[#d49b38]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94a3b8]">
                  <Lock className="h-4 w-4 text-[#d49b38]" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pl-10 bg-[#151c2e] border-[#d49b38]/25 text-white placeholder-[#64748b] focus:border-[#d49b38] focus:ring-[#d49b38]"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold hover:opacity-95 shadow-md shadow-[#d49b38]/15"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Fnd05ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#151c2e] px-4 py-12 text-[#f8fafc] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>
      <Suspense fallback={<div className="text-center text-xs text-[#94a3b8]">Loading reset portal...</div>}>
        <ResetPasswordForm />
      </Suspense>
      <div className="mt-6 text-center text-xs text-[#64748b] flex items-center justify-center space-x-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-[#d49b38]" />
        <span>Anveshak Hub • Argon2id Encrypted Password Update</span>
      </div>
    </div>
  );
}
