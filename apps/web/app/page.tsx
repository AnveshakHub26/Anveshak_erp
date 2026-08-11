'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FolderGit2,
  Users,
  CircleDollarSign,
  TrendingUp,
  ShoppingBag,
  UserCheck,
  ArrowRight,
  Menu,
  X,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function Fnd01LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBvSearch, setSelectedBvSearch] = useState('');

  const currentYear = new Date().getFullYear();

  // Official 6 Business Verticals from PDS v3.0 Master Build Blueprint
  const businessVerticals = [
    { code: 'BV-01', name: 'Research-led Projects', description: 'Domain-focused research, technical studies, and advanced engineering initiatives.' },
    { code: 'BV-02', name: 'IP and Knowledge Management', description: 'Intellectual property assets, patent workflows, research publication, and licensing.' },
    { code: 'BV-03', name: 'Startup Ecosystem', description: 'Incubation, startup acceleration, venture support, and ecosystem partnership management.' },
    { code: 'BV-04', name: 'Consulting', description: 'Advisory services, strategy formulation, technical consulting, and industry engagements.' },
    { code: 'BV-05', name: 'Design and Development', description: 'Product design, prototype development, software engineering, and system integration.' },
    { code: 'BV-06', name: 'Upskilling and Workshops', description: 'Corporate training programs, technical workshops, skill development, and certifications.' },
  ];

  const filteredBvs = businessVerticals.filter(
    (bv) =>
      bv.name.toLowerCase().includes(selectedBvSearch.toLowerCase()) ||
      bv.code.toLowerCase().includes(selectedBvSearch.toLowerCase()) ||
      bv.description.toLowerCase().includes(selectedBvSearch.toLowerCase()),
  );

  // Platform capabilities overview
  const capabilities = [
    {
      title: 'CRM',
      icon: Building2,
      description: 'Manage client organizations, leads, RFPs, proposals, and client relationship lifecycles.',
    },
    {
      title: 'Project Operations',
      icon: FolderGit2,
      description: 'Project planning, resource allocation, task tracking, timesheets, deliverables, and project closure.',
    },
    {
      title: 'HR',
      icon: Users,
      description: 'Personnel master records, Expert/Intern categories, employment type tracking, and compensation history.',
    },
    {
      title: 'Finance',
      icon: CircleDollarSign,
      description: 'Central operational financial ledger, P&L, balance sheet, cash flow, GST, and project-wise profitability.',
    },
    {
      title: 'Sales',
      icon: TrendingUp,
      description: 'Customer orders, revenue tracking, customer invoicing, and receivables collection status.',
    },
    {
      title: 'Purchase',
      icon: ShoppingBag,
      description: 'Vendor master records, purchase orders, vendor invoices, fulfillment receipts, and payables.',
    },
    {
      title: 'External Interface',
      icon: UserCheck,
      description: 'Capture, qualify, and convert conference, partner, and referral contacts prior to CRM entry.',
    },
  ];

  // High-level business flow steps
  const workflowSteps = [
    'External Interface / CRM',
    'RFP',
    'Project',
    'Execution',
    'Deliverable',
    'Client Acceptance',
    'Invoice',
    'Payment',
    'Finance / Profitability',
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17202A] flex flex-col font-sans">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#D7DEE6] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-[#1F4E79] rounded">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#17324D] font-bold text-white text-base">
              AH
            </div>
            <span className="text-section-title font-semibold tracking-tight text-[#17324D]">
              AnveshakHub <span className="text-xs font-normal text-[#5B6673] ml-1">Enterprise</span>
            </span>
          </Link>

          {/* Desktop Navigation CTAs */}
          <div className="hidden items-center space-x-3 md:flex">
            <Link
              href="/register"
              className="rounded border border-[#D7DEE6] bg-white px-4 py-2 text-body font-medium text-[#17202A] hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] transition-colors"
            >
              Register Organization
            </Link>
            <Link
              href="/login"
              className="rounded bg-[#1F4E79] px-4 py-2 text-body font-medium text-white hover:bg-[#17324D] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded p-2 text-[#5B6673] hover:bg-[#F7F8FA] hover:text-[#17202A] focus:outline-none focus:ring-2 focus:ring-[#1F4E79]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#D7DEE6] bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              <Link
                href="/login"
                className="w-full rounded bg-[#1F4E79] py-2.5 text-center text-body font-medium text-white hover:bg-[#17324D]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="w-full rounded border border-[#D7DEE6] bg-white py-2.5 text-center text-body font-medium text-[#17202A] hover:bg-[#F7F8FA]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register Organization
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="border-b border-[#D7DEE6] bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded border border-[#D7DEE6] bg-[#F7F8FA] px-3 py-1 text-label font-medium text-[#1F4E79]">
                Operational & Financial System of Record
              </div>
              <h1 className="text-page-title font-bold text-[#17324D] sm:text-3xl md:text-4xl">
                Integrated Enterprise Management Platform
              </h1>
              <p className="mt-4 text-body text-[#5B6673] leading-relaxed md:text-lg">
                AnveshakHub unifies organizational relationships, project delivery operations, personnel management, sales, procurement, and financial control into a single connected operational platform.
              </p>
              <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded bg-[#1F4E79] px-6 py-3 text-body font-medium text-white hover:bg-[#17324D] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] transition-colors"
                >
                  Login to Platform <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded border border-[#D7DEE6] bg-white px-6 py-3 text-body font-medium text-[#17202A] hover:bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[#1F4E79] transition-colors"
                >
                  Register Organization
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PLATFORM OVERVIEW */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 border-b border-[#D7DEE6] pb-3">
              <h2 className="text-section-title font-semibold text-[#17324D]">
                Platform Capabilities
              </h2>
              <p className="mt-1 text-label text-[#5B6673]">
                Core operational modules providing end-to-end organizational management.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((cap) => {
                const IconComponent = cap.icon;
                return (
                  <div
                    key={cap.title}
                    className="flex flex-col justify-between rounded border border-[#D7DEE6] bg-white p-6 shadow-sm"
                  >
                    <div>
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#D7DEE6] bg-[#F7F8FA] text-[#1F4E79]">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h3 className="text-section-title font-semibold text-[#17202A]">
                        {cap.title}
                      </h3>
                      <p className="mt-2 text-body text-[#5B6673] leading-normal">
                        {cap.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#D7DEE6] text-xs font-medium text-[#5B6673]">
                      Integrated Module
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. WORKFLOW OVERVIEW */}
        <section className="border-t border-b border-[#D7DEE6] bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 border-b border-[#D7DEE6] pb-3">
              <h2 className="text-section-title font-semibold text-[#17324D]">
                Unified Business Flow
              </h2>
              <p className="mt-1 text-label text-[#5B6673]">
                End-to-end lifecycle connecting initial contact intake through financial reconciliation.
              </p>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="flex min-w-max items-center space-x-2">
                {workflowSteps.map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="flex items-center rounded border border-[#D7DEE6] bg-[#F7F8FA] px-4 py-3 text-table font-medium text-[#17202A]">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-[#2F6F52]" />
                      <span>{step}</span>
                    </div>
                    {idx < workflowSteps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-[#5B6673] shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. BUSINESS VERTICALS */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between border-b border-[#D7DEE6] pb-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-section-title font-semibold text-[#17324D]">
                  Official Business Verticals
                </h2>
                <p className="mt-1 text-label text-[#5B6673]">
                  Six corporate service classification dimensions.
                </p>
              </div>

              {/* Compact Search Filter */}
              <div className="relative mt-3 sm:mt-0 w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6673]" />
                <input
                  type="text"
                  value={selectedBvSearch}
                  onChange={(e) => setSelectedBvSearch(e.target.value)}
                  placeholder="Filter Business Verticals..."
                  className="w-full rounded border border-[#D7DEE6] bg-white pl-9 pr-3 py-1.5 text-table text-[#17202A] placeholder-[#5B6673] focus:border-[#1F4E79] focus:outline-none"
                />
              </div>
            </div>

            {/* Restrained Business Vertical List */}
            <div className="rounded border border-[#D7DEE6] bg-white divide-y divide-[#D7DEE6]">
              {filteredBvs.length === 0 ? (
                <div className="p-6 text-center text-label text-[#5B6673]">
                  No Business Verticals match your search criteria.
                </div>
              ) : (
                filteredBvs.map((bv) => (
                  <div key={bv.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#F7F8FA]">
                    <div className="flex items-start space-x-3">
                      <span className="rounded border border-[#D7DEE6] bg-[#F7F8FA] px-2 py-0.5 text-xs font-semibold text-[#1F4E79]">
                        {bv.code}
                      </span>
                      <div>
                        <h4 className="text-table font-semibold text-[#17202A]">{bv.name}</h4>
                        <p className="mt-0.5 text-xs text-[#5B6673]">{bv.description}</p>
                      </div>
                    </div>
                    <span className="mt-2 sm:mt-0 text-xs text-[#2F6F52] font-medium self-start sm:self-center">
                      System Master Data
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="border-t border-[#D7DEE6] bg-white py-8 text-label text-[#5B6673]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#17324D]">AnveshakHub Enterprise Application</span>
              <span>© {currentYear}</span>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="hover:text-[#17202A] hover:underline focus:outline-none">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[#17202A] hover:underline focus:outline-none">
                Terms
              </Link>
              <Link href="/support" className="hover:text-[#17202A] hover:underline focus:outline-none">
                Contact & Admin Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
