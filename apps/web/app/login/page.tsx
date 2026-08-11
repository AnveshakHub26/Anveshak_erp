'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Eye, EyeOff, ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Fnd02LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
        }),
      });

      if (response && response.user) {
        // Update client auth store state (token is in HttpOnly cookie)
        setAuth(response.user);

        // Handle mandatory password change requirement or post-login role routing
        if (response.user.mustChangePassword) {
          router.push('/reset-password?reason=bootstrap_mandatory_change');
        } else {
          // Route according to user role policy
          const roles: string[] = response.user.roles || [];
          if (roles.includes('ADMIN')) {
            router.push('/admin');
          } else if (roles.includes('HR')) {
            router.push('/hr');
          } else if (roles.includes('FINANCE')) {
            router.push('/finance');
          } else if (roles.includes('SALES')) {
            router.push('/sales');
          } else if (roles.includes('PURCHASE')) {
            router.push('/purchase');
          } else if (roles.includes('CRM_STAFF')) {
            router.push('/crm');
          } else {
            router.push('/projects');
          }
        }
      }
    } catch (err: any) {
      if (err.status === 401) {
        setServerError('Invalid email or password. Please verify your credentials and try again.');
      } else if (err.status === 403) {
        setServerError('Your account is currently inactive or restricted. Please contact system administration.');
      } else {
        setServerError(err.message || 'An unexpected error occurred while connecting to the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#151c2e] px-4 py-12 text-[#f8fafc] selection:bg-[#d49b38] selection:text-[#151c2e] relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

      <div className="relative w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-[#94a3b8] hover:text-[#d49b38] focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-md px-2 py-1 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 text-[#d49b38]" /> Back to Home
          </Link>
        </div>

        {/* Login Card (Deep Navy Glassmorphism) */}
        <div className="rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-extrabold text-[#151c2e] text-2xl shadow-lg shadow-[#d49b38]/20">
              AH
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Sign In to AnveshakHub
            </h1>
            <p className="mt-2 text-xs font-medium text-[#d49b38] uppercase tracking-wider">
              Bridging Innovation, Enterprise & Academia
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <Alert variant="error" className="mb-6 border-[#B42318] bg-[#FDF2F2] text-[#B42318]">
              {serverError}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Email Field */}
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

            {/* Password Field */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-[#e2e8f0]">
                  Password <span className="text-[#d49b38]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#d49b38] hover:underline focus:outline-none focus:ring-1 focus:ring-[#d49b38] rounded px-1"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94a3b8]">
                  <Lock className="h-4 w-4 text-[#d49b38]" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-[#151c2e] border-[#d49b38]/25 text-white placeholder-[#64748b] focus:border-[#d49b38] focus:ring-[#d49b38]"
                  error={errors.password?.message}
                  {...register('password')}
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

            {/* Remember Me Option */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border-[#d49b38]/30 bg-[#151c2e] text-[#d49b38] focus:ring-[#d49b38]"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="ml-2.5 block text-xs font-medium text-[#94a3b8]">
                Remember this session
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold hover:opacity-95 shadow-md shadow-[#d49b38]/15"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 border-t border-[#d49b38]/20 pt-5 text-center text-xs text-[#94a3b8]">
            Need organization access?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#d49b38] hover:underline"
            >
              Register Organization
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[#64748b] flex items-center justify-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#d49b38]" />
          <span>Anveshak Hub • Secure HttpOnly Enterprise Authentication</span>
        </div>
      </div>
    </div>
  );
}
