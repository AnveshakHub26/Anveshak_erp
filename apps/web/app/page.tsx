'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  Users,
  Building2,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  Menu,
  X,
  Search,
  CheckCircle2,
  Target,
  Rocket,
  Compass,
  Cpu,
  FileCode2,
  ShieldCheck,
  Activity,
  BarChart3,
  Check,
  Calendar,
  Video,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { AnveshakLogo } from '@/components/ui/anveshak-logo';
import { BrandLoader } from '@/components/layout/brand-loader';

export default function Fnd01LandingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBvSearch, setSelectedBvSearch] = useState('');
  const [upcomingWorkshops, setUpcomingWorkshops] = useState<any[]>([]);

  React.useEffect(() => {
    apiRequest<{ success: boolean; data: any[] }>('/api/v1/workshops/public?type=UPCOMING')
      .then((res) => {
        if (res.data) setUpcomingWorkshops(res.data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const currentYear = new Date().getFullYear();

  // Official 6 Business Verticals from Anveshak Hub Corporate Deck & Master Blueprint
  const businessVerticals = [
    {
      code: 'BV-01',
      name: 'Research-led Projects',
      tag: 'Deep Tech & Engineering',
      icon: Cpu,
      description:
        'Domain-focused scientific research, advanced technical studies, and engineering-driven innovation initiatives.',
    },
    {
      code: 'BV-02',
      name: 'IP and Knowledge Management',
      tag: 'Patents & Literature',
      icon: FileCode2,
      description:
        'Intellectual property creation, patent-protected strategies, comprehensive literature review, and licensing frameworks.',
    },
    {
      code: 'BV-03',
      name: 'Startup Ecosystem',
      tag: 'Incubation & Acceleration',
      icon: Rocket,
      description:
        'Incubation support, startup acceleration, venture backing, and technology commercialization pathways.',
    },
    {
      code: 'BV-04',
      name: 'Consulting',
      tag: 'Strategy & Advisory',
      icon: Building2,
      description:
        'Strategic Advisory, technology roadmap formulation, industry transformation, and execution-ready consulting.',
    },
    {
      code: 'BV-05',
      name: 'Design and Development',
      tag: 'Prototypes & Systems',
      icon: Layers,
      description:
        'Full-stack product design, prototype development, hardware/software design, and system integration.',
    },
    {
      code: 'BV-06',
      name: 'Upskilling and Workshops',
      tag: 'Workforce & Certifications',
      icon: GraduationCap,
      description:
        'Corporate skilling programs, technical workshops, shop-floor trainings, and academic-industry certifications.',
    },
  ];

  const filteredBvs = businessVerticals.filter(
    (bv) =>
      bv.name.toLowerCase().includes(selectedBvSearch.toLowerCase()) ||
      bv.code.toLowerCase().includes(selectedBvSearch.toLowerCase()) ||
      bv.description.toLowerCase().includes(selectedBvSearch.toLowerCase()) ||
      bv.tag.toLowerCase().includes(selectedBvSearch.toLowerCase()),
  );

  // 3 Fundamental Pillars from Corporate Deck (People, Process, Product)
  const pillars = [
    {
      title: 'People',
      icon: Users,
      badge: 'Research Talent',
      description:
        'Fostering a scientific mindset with deep curiosity. We connect PhD researchers, academic experts, and industry leaders to build a collaborative innovation culture.',
    },
    {
      title: 'Process',
      icon: Compass,
      badge: 'TRL Framework',
      description:
        'Guided by Technology Readiness Levels (TRL 1-9), systematic literature search, global best practices, and rigorous validation frameworks that guarantee technical reliability.',
    },
    {
      title: 'Product',
      icon: Target,
      badge: 'IP Commercialization',
      description:
        'Delivering patent-protected, risk-mitigated technologies with market-ready commercialization support that drives long-term competitive advantage.',
    },
  ];

  // TRL Phases from Corporate Deck
  const trlPhases = [
    {
      phase: 'Ignite Phase',
      levels: 'TRL 1 - 3',
      title: 'Basic Research & Concept',
      items: [
        'Fundamental scientific principles identified',
        'Technology concept formulated & analyzed',
        'Experimental proof-of-concept demonstrated',
      ],
    },
    {
      phase: 'Innovate Phase',
      levels: 'TRL 4 - 5',
      title: 'Development & Validation',
      items: [
        'Component & lab-scale integration testing',
        'System validation in realistic environments',
        'Early functional prototyping & risk assessment',
      ],
    },
    {
      phase: 'Inspire Phase',
      levels: 'TRL 6 - 9',
      title: 'Deployment & Scaling',
      items: [
        'Engineering-scale prototype field demonstration',
        'Final technology system qualification & testing',
        'Mission-proven operational deployment in real environments',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#d49b38] selection:text-[#151c2e]">
      {/* Brand Splash Loading Transition */}
      {showSplash && (
        <BrandLoader
          onComplete={() => setShowSplash(false)}
          durationMs={850}
        />
      )}

      {/* 1. HEADER (Midnight Navy Header) */}
      <header className="sticky top-0 z-50 border-b border-[#182238] bg-[#151c2e] text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-lg p-1 transition-opacity hover:opacity-95"
          >
            <AnveshakLogo size="md" showText={true} />
          </Link>

          {/* Desktop Navigation CTAs */}
          <div className="hidden items-center space-x-3 md:flex">
            <Link
              href="/workshops"
              className="rounded-lg border border-[#d49b38]/40 bg-[#182238] px-3.5 py-2 text-xs font-semibold text-[#d49b38] hover:border-[#d49b38] hover:bg-[#182238]/90 transition-all flex items-center space-x-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Workshops</span>
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-[#d49b38]/40 bg-[#182238] px-4 py-2 text-xs font-semibold text-white hover:border-[#d49b38] transition-all"
            >
              Register Organization
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-5 py-2 text-xs font-bold text-[#151c2e] hover:opacity-95 shadow-sm transition-all"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#182238] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#d49b38]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#182238] bg-[#182238] px-4 py-4 md:hidden space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] py-2.5 text-center text-xs font-bold text-[#151c2e]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="block w-full rounded-lg border border-[#d49b38]/40 bg-[#151c2e] py-2.5 text-center text-xs font-semibold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Register Organization
            </Link>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {/* 2. TWO-COLUMN PRODUCT HERO SECTION */}
        <section className="border-b border-[#E2E8F0] bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Product Positioning & CTAs */}
              <div className="lg:col-span-7 space-y-6">
                {/* RaaS Badge */}
                <div className="inline-flex items-center space-x-2 rounded-full border border-[#d49b38]/30 bg-[#F5E8D0]/40 px-3.5 py-1 text-xs font-semibold text-[#8B5E14]">
                  <Sparkles className="h-3.5 w-3.5 text-[#d49b38]" />
                  <span>Research as a Service (RaaS) & Enterprise Platform</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl md:text-5xl leading-tight">
                  Bridging Innovation, <br className="hidden sm:inline" />
                  <span className="text-[#d49b38]">Enterprise & Academia</span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl">
                  Transforming how organizations leverage intellectual property and academic research to solve critical industry challenges and drive commercial success.
                </p>

                {/* E2E Compatibility Badge */}
                <div className="inline-block rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#475569]">
                  Integrated Enterprise Management Platform
                </div>

                {/* CTA Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-6 py-3 text-xs font-bold text-[#151c2e] shadow-sm hover:opacity-95 transition-all"
                  >
                    Login to Platform <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-6 py-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#d49b38] transition-all"
                  >
                    Register Organization
                  </Link>
                </div>
              </div>

              {/* Right Column: Executive Hand-Crafted Enterprise Showcase */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise OS Telemetry</span>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 ring-1 ring-amber-200">
                      LIVE SYSTEM
                    </span>
                  </div>

                  {/* 6 Business Verticals Direct Access Badges */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">6 Official Service Verticals</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 transition-all">
                        <div className="font-bold text-slate-900">Research &amp; Deep Tech</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">BV-01 • Research Projects</div>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 transition-all">
                        <div className="font-bold text-slate-900">IP &amp; Knowledge</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">BV-02 • Patents &amp; Lit</div>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 transition-all">
                        <div className="font-bold text-slate-900">Startup Incubation</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">BV-03 • Commercialize</div>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 transition-all">
                        <div className="font-bold text-slate-900">Consulting &amp; Advisory</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">BV-04 • Roadmaps</div>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 transition-all">
                        <div className="font-bold text-slate-900">Design &amp; Prototype</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">BV-05 • Full-Stack</div>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs hover:border-indigo-300 transition-all">
                        <div className="font-bold text-slate-900">Upskilling &amp; Training</div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">BV-06 • Workshops</div>
                      </div>
                    </div>
                  </div>

                  {/* Core Platform Capabilities */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>TRL 1 - 9 Innovation Framework</span>
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      End-to-end research governance with automated document scanning, multi-tenant industry organization portals, and immutable audit logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PEOPLE, PROCESS, PRODUCT PILLARS */}
        <section className="py-12 md:py-16 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                How Anveshak Bridges the Innovation Gap
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
                Integrating research talent, robust methodologies, and a sharp focus on intellectual property to deliver market-ready solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {pillars.map((pillar) => {
                const IconComp = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#d49b38] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#475569]">
                          {pillar.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A] mb-2">{pillar.title}</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3.5 FEATURED UPCOMING WORKSHOPS */}
        {upcomingWorkshops.length > 0 && (
          <section className="py-12 md:py-16 bg-[#F1F5F9] border-b border-[#E2E8F0]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex flex-col justify-between md:flex-row md:items-end border-b border-[#E2E8F0] pb-5">
                <div>
                  <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#d49b38] uppercase tracking-wider mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Technical Skilling & Learning</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                    Featured Upcoming Workshops
                  </h2>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Participate in industry-led technical sessions, hands-on masterclasses, and executive skilling.
                  </p>
                </div>

                <Link
                  href="/workshops"
                  className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-xs font-bold text-[#d49b38] hover:text-[#b8832a] transition-colors"
                >
                  <span>View All Workshops</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingWorkshops.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#d49b38] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full bg-amber-50 text-[#8B5E14] border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                          {w.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {w.mode}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#0F172A] mb-2 line-clamp-2">{w.title}</h3>
                      <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-2">{w.shortDescription}</p>

                      <div className="space-y-1.5 text-[11px] text-[#475569] border-t border-[#F1F5F9] pt-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3.5 w-3.5 text-[#d49b38]" />
                          <span>{new Date(w.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{w.startTime} - {w.endTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                      <Link
                        href={`/workshops/${w.id}`}
                        className="text-xs font-semibold text-slate-700 hover:text-[#d49b38] transition-colors"
                      >
                        View Details →
                      </Link>

                      {w.registrationUrl ? (
                        <a
                          href={w.registrationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-3 py-1.5 text-xs font-bold text-[#151c2e] hover:opacity-95 shadow-xs"
                        >
                          Register <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      ) : (
                        <Link
                          href={`/workshops/${w.id}`}
                          className="inline-flex items-center rounded-lg bg-[#151c2e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#182238]"
                        >
                          Learn More
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. CORE SERVICE OFFERINGS (RESEARCH AS A SERVICE) */}
        <section className="py-12 md:py-16 bg-white border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between md:flex-row md:items-end border-b border-[#E2E8F0] pb-5">
              <div>
                <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#d49b38] uppercase tracking-wider mb-1">
                  <Lightbulb className="h-4 w-4" />
                  <span>Research as a Service (RaaS)</span>
                </div>
                <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                  Official Service Verticals
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Six specialized corporate service classification dimensions.
                </p>
              </div>

              {/* Search Filter */}
              <div className="relative mt-4 md:mt-0 w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  value={selectedBvSearch}
                  onChange={(e) => setSelectedBvSearch(e.target.value)}
                  placeholder="Search service verticals..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#94a3b8] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
                />
              </div>
            </div>

            {/* Verticals Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBvs.length === 0 ? (
                <div className="col-span-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center text-xs text-[#64748B]">
                  No service verticals match &quot;{selectedBvSearch}&quot;.
                </div>
              ) : (
                filteredBvs.map((bv) => {
                  const IconComponent = bv.icon;
                  return (
                    <div
                      key={bv.code}
                      className="group flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm hover:border-[#d49b38] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="rounded-full bg-[#151c2e] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                            {bv.code}
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#d49b38] border border-[#E2E8F0]">
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#d49b38] transition-colors">
                          {bv.name}
                        </h3>
                        <p className="mt-1 text-[11px] font-semibold text-[#8B5E14]">{bv.tag}</p>
                        <p className="mt-2 text-xs text-[#64748B] leading-relaxed">{bv.description}</p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                        <span>Canonical Vertical</span>
                        <CheckCircle2 className="h-4 w-4 text-[#d49b38]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* 5. TRL FRAMEWORK SECTION */}
        <section className="py-12 md:py-16 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                The Technology Readiness Level (TRL) Journey
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#64748B] max-w-2xl mx-auto">
                Categorizing innovation from fundamental research to operational deployment through three distinct phases: Ignite, Innovate, and Inspire.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {trlPhases.map((phase) => (
                <div
                  key={phase.phase}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8B5E14]">
                        {phase.phase}
                      </span>
                      <span className="rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-2.5 py-0.5 text-[10px] font-semibold text-[#0F172A]">
                        {phase.levels}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mb-3">{phase.title}</h3>
                    <ul className="space-y-2">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start text-xs text-[#64748B]">
                          <CheckCircle2 className="mr-2 h-4 w-4 shrink-0 text-[#d49b38] mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. CALL TO ACTION BANNER */}
        <section className="py-12 md:py-16 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 sm:p-10 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Ready to Shape India&apos;s Innovation Future?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto">
                Connect with Anveshak Hub to bridge cutting-edge academic research with enterprise solution delivery.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-7 py-3 text-xs font-bold text-[#151c2e] shadow-sm hover:opacity-95 transition-all"
                >
                  Login to Platform
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto rounded-xl border border-[#E2E8F0] bg-white px-7 py-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#d49b38] transition-all"
                >
                  Register Organization
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER (Midnight Navy Footer) */}
      <footer className="border-t border-[#182238] bg-[#151c2e] py-8 text-xs text-[#94a3b8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-xs">
                AH
              </div>
              <span className="font-semibold text-white">Anveshak Hub Private Limited</span>
              <span>© {currentYear}</span>
            </div>

            <div className="flex items-center space-x-6 text-xs">
              <Link href="/privacy" className="hover:text-[#d49b38] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[#d49b38] transition-colors">
                Terms
              </Link>
              <Link href="/support" className="hover:text-[#d49b38] transition-colors">
                Contact & Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
