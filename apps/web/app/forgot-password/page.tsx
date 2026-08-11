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
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-label font-medium text-[#5B6673] hover:text-[#17202A] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] rounded px-1 py-0.5"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Login
          </Link>
        </div>

        {/* Card */}
        <div className="rounded border border-[#D7DEE6] bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded bg-[#17324D] font-bold text-white text-xl">
              AH
            </div>
            <h1 className="text-page-title font-semibold text-[#17324D]">
              Account Recovery
            </h1>
            <p className="mt-1 text-label text-[#5B6673]">
              FND-04 — Password Reset Request
            </p>
          </div>

          {submittedSuccess ? (
            <div className="space-y-4">
              <Alert variant="success" className="flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 text-[#2F6F52] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#2F6F52]">Recovery Request Submitted</h4>
                  <p className="mt-1 text-xs text-[#17202A]">
                    If an account exists with that email address, password reset instructions have been dispatched.
                  </p>
                </div>
              </Alert>
              <Link href="/login" className="block w-full">
                <Button variant="outline" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {serverError && (
                <Alert variant="error" className="mb-4">
                  {serverError}
                </Alert>
              )}

              <p className="text-label text-[#5B6673]">
                Enter your registered primary email address. We will verify account eligibility and send recovery instructions.
              </p>

              <div>
                <label htmlFor="email" className="mb-1 block text-label font-medium text-[#17202A]">
                  Email Address <span className="text-[#B42318]">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="pl-9"
                    error={errors.email?.message}
                    {...register('email')}
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
                Send Password Recovery Link
              </Button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[#5B6673]">
          AnveshakHub v3.0 Master • Cryptographic Account Protection
        </div>
      </div>
    </div>
  );
}
