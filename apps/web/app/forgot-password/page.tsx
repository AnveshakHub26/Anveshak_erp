'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicShell } from '@/components/layout/public-shell';
import { Mail, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Fnd04ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email.trim() }),
      });
    } catch {
      // Non-leaking: always show success regardless
    } finally {
      setIsLoading(false);
      setSubmittedSuccess(true);
    }
  };

  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-extrabold text-[#151c2e] text-2xl shadow-md">
                AH
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
                Account Recovery
              </h1>
              <p className="mt-1 text-xs font-semibold text-[#d49b38] uppercase tracking-wider">
                Anveshak Hub Single-Use Password Reset
              </p>
            </div>

            {submittedSuccess ? (
              <div className="space-y-5">
                {/* Success State */}
                <div className="rounded-xl border border-[#A3D9C0] bg-[#EBF5F0] p-5 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#2F6F52]" />
                  <h2 className="text-base font-bold text-[#2F6F52]">Recovery Request Submitted</h2>
                  <p className="mt-2 text-xs text-[#1e293b] leading-relaxed">
                    If an account exists with that email address, password reset instructions have been dispatched.
                  </p>
                </div>
                <Link href="/login" className="block w-full">
                  <Button variant="primary" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {serverError && (
                  <div className="rounded-lg border border-[#B42318]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#B42318]">
                    {serverError}
                  </div>
                )}

                <p className="text-xs text-[#64748B] leading-relaxed">
                  Enter your registered primary email address. We will verify account eligibility and send single-use recovery instructions.
                </p>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#0F172A]">
                    Email Address <span className="text-[#d49b38]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="pl-10"
                      error={errors.email?.message}
                      {...register('email')}
                    />
                  </div>
                  {errors.email?.message && (
                    <p className="mt-1 text-xs text-[#B42318]">{errors.email.message}</p>
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
                  Send Password Recovery Link
                </Button>

                <div className="text-center">
                  <Link href="/login" className="inline-flex items-center text-xs font-medium text-[#64748B] hover:text-[#d49b38] transition-colors">
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Security Note */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-[#94a3b8]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#d49b38]" />
            <span>Anveshak Hub • Cryptographic Token Protection</span>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
