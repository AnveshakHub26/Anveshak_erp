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
import { PublicShell } from '@/components/layout/public-shell';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

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
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: data.email.trim(), password: data.password }),
      });
      if (response && response.user) {
        setAuth(response.user, response.accessToken || null);
        const roles: string[] = response.user?.roles?.map((r: any) => r.name) || [];
        if (roles.includes('ADMIN')) router.push('/admin');
        else if (response.user?.mustChangePassword) router.push('/reset-password?reason=mandatory');
        else if (roles.includes('HR')) router.push('/hr');
        else if (roles.includes('FINANCE')) router.push('/finance');
        else if (roles.includes('CRM_STAFF')) router.push('/crm');
        else router.push('/projects');
      }
    } catch (err: any) {
      if (err.status === 403) {
        setServerError('Your account is currently inactive or restricted. Please contact system administration.');
      } else {
        setServerError('Invalid email or password. Please verify your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 sm:p-10 shadow-sm">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-extrabold text-[#151c2e] text-2xl shadow-md">
                AH
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
                Sign In to AnveshakHub
              </h1>
              <p className="mt-1 text-xs font-semibold text-[#d49b38] uppercase tracking-wider">
                Bridging Innovation, Enterprise &amp; Academia
              </p>
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="mb-6 rounded-lg border border-[#B42318]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#B42318]">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
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

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-semibold text-[#0F172A]">
                    Password <span className="text-[#d49b38]">*</span>
                  </label>
                  <Link href="/forgot-password" className="text-xs font-medium text-[#d49b38] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    error={errors.password?.message}
                    {...register('password')}
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
                {errors.password?.message && (
                  <p className="mt-1 text-xs text-[#B42318]">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#E2E8F0] accent-[#d49b38]"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="text-xs text-[#64748B]">
                  Remember this session
                </label>
              </div>

              {/* Submit */}
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

            <div className="mt-6 border-t border-[#E2E8F0] pt-6 text-center text-xs text-[#64748B]">
              Need organization access?{' '}
              <Link href="/register" className="font-semibold text-[#d49b38] hover:underline">
                Register Organization
              </Link>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-[#94a3b8]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#d49b38]" />
            <span>Anveshak Hub • Secure HttpOnly Enterprise Authentication</span>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
