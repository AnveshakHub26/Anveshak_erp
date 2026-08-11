'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { HelpCircle, Mail, User, MessageSquare, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

const SupportSchema = z.object({
  category: z.string().min(1, 'Please select a support category'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message details must be at least 10 characters'),
});

type SupportFormData = z.infer<typeof SupportSchema>;

export default function Fnd11SupportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupportFormData>({
    resolver: zodResolver(SupportSchema),
    defaultValues: {
      category: 'General Support',
      contactName: '',
      contactEmail: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await apiRequest('/admin/support', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res && res.data) {
        setTicketResult(res.data);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-[#1F4E79] hover:underline"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Home Page
        </Link>

        {/* Header */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#17324D] text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-page-title font-semibold text-[#17324D]">
                Contact Administration & Technical Support
              </h1>
              <p className="text-label text-[#5B6673]">
                FND-11 Official Platform Support & Assistance Entry Point
              </p>
            </div>
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        {ticketResult ? (
          <div className="rounded border border-[#D7DEE6] bg-white p-8 text-center shadow-sm space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F8FA] text-[#2F6F52]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-section-title font-semibold text-[#17324D]">
              Support Request Submitted
            </h2>
            <p className="text-body text-[#17202A]">
              Your support ticket reference is{' '}
              <strong className="font-mono text-[#1F4E79]">{ticketResult.ticketId}</strong>.
            </p>
            <p className="text-xs text-[#5B6673]">
              An administrator will review your submission and respond to your registered contact email address.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button variant="primary" size="sm">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Support Category" required error={errors.category?.message} htmlFor="category">
                <select
                  id="category"
                  {...register('category')}
                  className="w-full rounded border border-[#D7DEE6] bg-white p-2 text-body text-[#17202A] focus:border-[#1F4E79] focus:outline-none"
                >
                  <option value="General Support">General Support</option>
                  <option value="Account Access">Account Access & Recovery</option>
                  <option value="Organization Onboarding">Organization Onboarding & BV Verification</option>
                  <option value="Technical Bug">Technical System Bug</option>
                  <option value="Billing / Invoicing">Billing / Invoicing Query</option>
                </select>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Your Full Name" required error={errors.contactName?.message} htmlFor="contactName">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                    <Input id="contactName" {...register('contactName')} className="pl-9" placeholder="John Doe" />
                  </div>
                </FormField>

                <FormField label="Contact Email" required error={errors.contactEmail?.message} htmlFor="contactEmail">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                    <Input id="contactEmail" type="email" {...register('contactEmail')} className="pl-9" placeholder="john@company.com" />
                  </div>
                </FormField>
              </div>

              <FormField label="Subject" required error={errors.subject?.message} htmlFor="subject">
                <Input id="subject" {...register('subject')} placeholder="Brief summary of request..." />
              </FormField>

              <FormField label="Detailed Message" required error={errors.message?.message} htmlFor="message">
                <textarea
                  id="message"
                  {...register('message')}
                  rows={5}
                  className="w-full rounded border border-[#D7DEE6] bg-white p-3 text-body text-[#17202A] focus:border-[#1F4E79] focus:outline-none"
                  placeholder="Describe your query or issue in detail..."
                />
              </FormField>

              <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting} className="w-full sm:w-auto">
                Submit Support Request
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
