'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ActivateAccountSchema, ActivateAccountInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { PublicShell } from '@/components/layout/public-shell';
import {
  ShieldCheck,
  Lock,
  Mail,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  KeyRound,
  ArrowRight,
  HelpCircle,
  Loader2,
} from 'lucide-react';

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenQuery = searchParams.get('token') || '';

  const [tokenInput, setTokenInput] = useState(tokenQuery);
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    valid: boolean;
    email: string;
    legalName: string;
    orgNumber: string;
    token: string;
  } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token with backend API
  const handleVerifyToken = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify || !tokenToVerify.trim()) {
      setVerifyError('Please enter an activation token.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerificationData(null);

    try {
      const response = await apiRequest('/invitations/verify', {
        method: 'POST',
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });

      if (response && response.data) {
        setVerificationData(response.data);
      }
    } catch (err: any) {
      setVerifyError(
        err.message || 'Invitation token is invalid, expired, used, or organization is not approved.',
      );
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Auto-verify on mount if query token present
  useEffect(() => {
    if (tokenQuery.trim()) {
      handleVerifyToken(tokenQuery);
    }
  }, [tokenQuery, handleVerifyToken]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ActivateAccountInput>({
    resolver: zodResolver(ActivateAccountSchema),
    defaultValues: {
      token: tokenQuery,
      newPassword: '',
      confirmPassword: '',
      termsConsent: false,
    },
  });

  // Keep form token in sync with verified token
  useEffect(() => {
    if (verificationData?.token) {
      setValue('token', verificationData.token);
    }
  }, [verificationData, setValue]);

  const onSubmit = async (data: ActivateAccountInput) => {
    setServerError(null);
    setIsActivating(true);

    try {
      const response = await apiRequest('/invitations/activate', {
        method: 'POST',
        body: JSON.stringify({
          token: data.token.trim(),
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
          termsConsent: data.termsConsent,
        }),
      });

      if (response && response.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?activated=true');
        }, 2000);
      }
    } catch (err: any) {
      setServerError(err.message || 'Account activation failed. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] px-4 py-12 text-[#0F172A]">
      <div className="mx-auto max-w-lg">

        {/* Card Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#151c2e] text-[#d49b38] shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            FND-04 Account Activation
          </h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Complete first-time authentication setup for your approved organization.
          </p>
        </div>

        {/* Mode 1: Activation Success Banner */}
        {isSuccess ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F4EA] text-[#137333]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Account Activated Successfully!</h2>
            <p className="text-xs text-[#64748B]">
              Your user credentials and organization account are now active. Redirecting to common login...
            </p>
            <div className="pt-2">
              <Button variant="primary" onClick={() => router.push('/login')} className="w-full">
                Sign In Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : !verificationData ? (
          /* Mode 2: Token Entry / Verification Input */
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#0F172A]">Enter Invitation Token</h2>
              <p className="text-xs text-[#64748B]">
                Enter the activation invitation token issued by Admin upon organization approval.
              </p>
            </div>

            {verifyError && <Alert variant="error">{verifyError}</Alert>}

            <div className="space-y-3">
              <FormField label="Activation Token" required htmlFor="tokenInput">
                <Input
                  id="tokenInput"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste activation token string..."
                  className="font-mono text-xs"
                />
              </FormField>

              <Button
                variant="primary"
                className="w-full"
                isLoading={isVerifying}
                disabled={isVerifying || !tokenInput.trim()}
                onClick={() => handleVerifyToken(tokenInput)}
              >
                Verify Invitation Token
              </Button>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#64748B]">
              Have questions?{' '}
              <Link href="/support" className="text-[#d49b38] underline font-semibold">
                Contact System Support
              </Link>
            </div>
          </div>
        ) : (
          /* Mode 3: Verified Token — Account Activation Form */
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-5">

            {/* Approved Organization Info Badge */}
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFBF0] p-4 text-xs space-y-1">
              <div className="flex items-center text-[#d49b38] font-bold">
                <Building2 className="h-4 w-4 mr-1.5 shrink-0" />
                Approved Organization
              </div>
              <p className="font-bold text-[#0F172A] text-sm">{verificationData.legalName}</p>
              <p className="text-[#64748B] font-mono text-[11px]">Ref: {verificationData.orgNumber}</p>
            </div>

            {serverError && <Alert variant="error">{serverError}</Alert>}

            <form method="POST" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Registered Email" htmlFor="registeredEmail">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                  <Input
                    id="registeredEmail"
                    value={verificationData.email}
                    disabled
                    readOnly
                    className="pl-9 bg-[#F8FAFC] text-[#64748B] font-semibold cursor-not-allowed"
                  />
                </div>
              </FormField>

              <FormField label="Create New Password" required htmlFor="newPassword" error={errors.newPassword?.message}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    error={errors.newPassword?.message}
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  Must be at least 8 characters long with uppercase letter & number.
                </p>
              </FormField>

              <FormField label="Confirm Password" required htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>
              </FormField>

              <div className="pt-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#d49b38] focus:ring-[#d49b38]"
                    {...register('termsConsent')}
                  />
                  <span className="text-xs text-[#64748B] leading-relaxed">
                    I accept the terms and conditions for account activation and confirm authorization to operate this organization user profile.
                  </span>
                </label>
                {errors.termsConsent && (
                  <p className="mt-1 text-xs text-[#EF4444]">{errors.termsConsent.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold"
                isLoading={isActivating}
                disabled={isActivating}
              >
                Activate Account & Enable Login
              </Button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#64748B]">
          AnveshakHub v4.0 Master • FND-04 Single-Use Activation Gate
        </div>
      </div>
    </div>
  );
}

export default function Fnd04ActivatePage() {
  return (
    <PublicShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#d49b38]" />
        </div>
      }>
        <ActivateContent />
      </Suspense>
    </PublicShell>
  );
}
