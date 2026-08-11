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
import { Eye, EyeOff, ArrowLeft, Lock, Mail } from 'lucide-react';

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
        // Update client auth store state (token is in HttpOnly cookie, no JS-accessible token)
        setAuth(response.user);

        // Handle mandatory password change requirement or post-login role routing
        if (response.user.mustChangePassword) {
          router.push('/reset-password?reason=bootstrap_mandatory_change');
        } else {
          // Route according to user role policy
          const roles: string[] = response.user.roles || [];
          if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-label font-medium text-[#5B6673] hover:text-[#17202A] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] rounded px-1 py-0.5"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded border border-[#D7DEE6] bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded bg-[#17324D] font-bold text-white text-xl">
              AH
            </div>
            <h1 className="text-page-title font-semibold text-[#17324D]">
              Sign In to AnveshakHub
            </h1>
            <p className="mt-1 text-label text-[#5B6673]">
              Unified Enterprise Authentication
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <Alert variant="error" className="mb-6">
              {serverError}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="mb-1 block text-label font-medium text-[#17202A]">
                Email Address <span className="text-[#B42318]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#5B6673]">
                  <Mail className="h-4 w-4" />
                </div>
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

            {/* Password Field */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-label font-medium text-[#17202A]">
                  Password <span className="text-[#B42318]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#1F4E79] hover:underline focus:outline-none focus:ring-1 focus:ring-[#1F4E79] rounded px-1"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#5B6673]">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#5B6673] hover:text-[#17202A] focus:outline-none"
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
                className="h-4 w-4 rounded border-[#D7DEE6] text-[#1F4E79] focus:ring-[#1F4E79]"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-label text-[#5B6673]">
                Remember this session
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 border-t border-[#D7DEE6] pt-4 text-center text-xs text-[#5B6673]">
            Need organization access?{' '}
            <Link
              href="/register"
              className="font-medium text-[#1F4E79] hover:underline"
            >
              Register Organization
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-[#5B6673]">
          AnveshakHub v3.0 Master • Secure HttpOnly Authentication
        </div>
      </div>
    </div>
  );
}
