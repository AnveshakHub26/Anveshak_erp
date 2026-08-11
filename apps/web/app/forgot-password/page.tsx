'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

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
      // Non-leaking security policy: always display generic recovery dispatched message
    } finally {
      setIsLoading(false);
      setSubmittedSuccess(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#151c2e] px-4 py-12 text-[#f8fafc] relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-xs font-medium text-[#94a3b8] hover:text-[#d49b38] focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-md px-2 py-1 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 text-[#d49b38]" /> Back to Login
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-extrabold text-[#151c2e] text-2xl shadow-lg shadow-[#d49b38]/20">
              AH
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Account Recovery
            </h1>
            <p className="mt-2 text-xs font-medium text-[#d49b38] uppercase tracking-wider">
              Anveshak Hub Single-Use Password Reset
            </p>
          </div>

          {submittedSuccess ? (
            <div className="space-y-6">
              <Alert variant="success" title="Recovery Request Submitted" className="bg-[#EBF5F0] border-[#A3D9C0] text-[#2F6F52]">
                <p className="mt-1 text-xs text-[#1e293b]">
                  If an account exists with that email address, password reset instructions have been dispatched.
                </p>
              </Alert>
              <Link href="/login" className="block w-full">
                <Button variant="outline" className="w-full border-[#d49b38]/40 bg-[#151c2e] text-white hover:bg-[#182238]">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {serverError && (
                <Alert variant="error" className="mb-4">
                  {serverError}
                </Alert>
              )}

              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Enter your registered primary email address. We will verify account eligibility and send single-use recovery instructions.
              </p>

              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#e2e8f0]">
                  Email Address <span className="text-[#d49b38]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94a3b8]">
                    <Mail className="h-4 w-4 text-[#d49b38]" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="pl-10 bg-[#151c2e] border-[#d49b38]/25 text-white placeholder-[#64748b] focus:border-[#d49b38] focus:ring-[#d49b38]"
                    error={errors.email?.message}
                    {...register('email')}
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
                Send Password Recovery Link
              </Button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[#64748b] flex items-center justify-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#d49b38]" />
          <span>Anveshak Hub • Cryptographic Token Protection</span>
        </div>
      </div>
    </div>
  );
}
