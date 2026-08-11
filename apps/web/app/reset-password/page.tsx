'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

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
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: tokenParam,
      newPassword: '',
      confirmPassword: '',
    },
  });

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
          className="inline-flex items-center text-label font-medium text-[#5B6673] hover:text-[#17202A] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] rounded px-1 py-0.5"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Sign In
        </Link>
      </div>

      <div className="rounded border border-[#D7DEE6] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded bg-[#17324D] font-bold text-white text-xl">
            AH
          </div>
          <h1 className="text-page-title font-semibold text-[#17324D]">
            {reasonParam === 'bootstrap_mandatory_change'
              ? 'Mandatory Password Change'
              : 'Set New Password'}
          </h1>
          <p className="mt-1 text-label text-[#5B6673]">
            {reasonParam === 'bootstrap_mandatory_change'
              ? 'FND-05 — Bootstrap Account First-Login Security Update'
              : 'FND-05 — Single-Use Password Reset Fulfillment'}
          </p>
        </div>

        {reasonParam === 'bootstrap_mandatory_change' && (
          <Alert variant="warning" className="mb-6 flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-[#A56A00] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-[#A56A00]">Action Required</h4>
              <p className="mt-0.5 text-xs text-[#17202A]">
                Your initial bootstrap administrator password must be updated prior to platform access.
              </p>
            </div>
          </Alert>
        )}

        {serverError && (
          <Alert variant="error" className="mb-6">
            {serverError}
          </Alert>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <Alert variant="success" className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-[#2F6F52] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#2F6F52]">Password Updated Successfully</h4>
                <p className="mt-1 text-xs text-[#17202A]">
                  Your credentials have been securely updated using Argon2id encryption. You may now sign in.
                </p>
              </div>
            </Alert>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-label font-medium text-[#17202A]">
                New Password <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#5B6673] hover:text-[#17202A]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-label font-medium text-[#17202A]">
                Confirm New Password <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pl-9"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
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
          </form>
        )}
      </div>
    </div>
  );
}

export default function Fnd05ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <Suspense fallback={<div className="text-center text-label text-[#5B6673]">Loading reset portal...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
