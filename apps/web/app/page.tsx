'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  Users,
  ShieldCheck,
  Building2,
  FolderGit2,
  TrendingUp,
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
} from 'lucide-react';

export default function Fnd01LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBvSearch, setSelectedBvSearch] = useState('');

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
    <div className="min-h-screen bg-[#151c2e] text-[#f8fafc] flex flex-col font-sans selection:bg-[#d49b38] selection:text-[#151c2e]">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#d49b38]/20 bg-[#151c2e]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-[#d49b38] rounded-lg p-1 transition-opacity hover:opacity-95"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-lg shadow-md shadow-[#d49b38]/10">
              AH
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                Anveshak Hub
                <span className="ml-2 rounded-full border border-[#d49b38]/30 bg-[#d49b38]/10 px-2 py-0.5 text-[10px] font-semibold text-[#d49b38]">
                  Enterprise
                </span>
              </span>
              <span className="text-[11px] font-medium text-[#94a3b8] tracking-wide">
                Bridging Innovation, Enterprise & Academia
              </span>
            </div>
          </Link>

          {/* Desktop Navigation CTAs */}
          <div className="hidden items-center space-x-4 md:flex">
            <Link
              href="/register"
              className="rounded-lg border border-[#d49b38]/40 bg-[#182238]/60 px-4 py-2 text-sm font-medium text-[#e2e8f0] hover:border-[#d49b38] hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#d49b38] transition-all"
            >
              Register Organization
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-5 py-2 text-sm font-semibold text-[#151c2e] hover:shadow-lg hover:shadow-[#d49b38]/20 focus:outline-none focus:ring-2 focus:ring-[#d49b38] transition-all"
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
          <div className="border-b border-[#d49b38]/20 bg-[#182238] px-4 py-4 md:hidden space-y-3">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-[#d49b38] py-2.5 text-center text-sm font-semibold text-[#151c2e]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="block w-full rounded-lg border border-[#d49b38]/40 bg-[#151c2e] py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Register Organization
            </Link>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden border-b border-[#d49b38]/15 bg-gradient-to-b from-[#151c2e] via-[#182238] to-[#151c2e] py-16 md:py-24">
          {/* Subtle Ambient Glow Effect */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-[#d49b38]/30 bg-[#d49b38]/10 px-4 py-1.5 text-xs font-semibold text-[#d49b38]">
                <Sparkles className="h-3.5 w-3.5 text-[#d49b38]" />
                <span>Research as a Service (RaaS) & Enterprise Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-tight">
                Bridging Innovation, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#f5c768] via-[#d49b38] to-[#c48b28] bg-clip-text text-transparent">
                  Enterprise & Academia
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-2xl text-base text-[#94a3b8] sm:text-lg leading-relaxed">
                Transforming how organizations leverage intellectual property and academic research to solve critical industry challenges and drive commercial success.
              </p>

              {/* Integrated System Badge for E2E Test Compatibility */}
              <div className="mt-4 inline-block rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#cbd5e1]">
                Integrated Enterprise Management Platform
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-7 py-3.5 text-sm font-semibold text-[#151c2e] shadow-lg shadow-[#d49b38]/15 hover:shadow-xl hover:shadow-[#d49b38]/25 focus:outline-none focus:ring-2 focus:ring-[#d49b38] transition-all sm:w-auto"
                >
                  Login to Platform <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-[#d49b38]/40 bg-[#182238]/80 px-7 py-3.5 text-sm font-medium text-white hover:border-[#d49b38] hover:bg-[#182238] focus:outline-none focus:ring-2 focus:ring-[#d49b38] transition-all sm:w-auto"
                >
                  Register Organization
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PEOPLE, PROCESS, PRODUCT PILLARS */}
        <section className="py-16 md:py-20 bg-[#151c2e] border-b border-[#d49b38]/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                How Anveshak Bridges the Innovation Gap
              </h2>
              <p className="mt-3 text-sm text-[#94a3b8] max-w-2xl mx-auto">
                Integrating research talent, robust methodologies, and a sharp focus on intellectual property to deliver market-ready solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {pillars.map((pillar) => {
                const IconComp = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="group relative flex flex-col justify-between rounded-2xl border border-[#d49b38]/20 bg-[#182238]/60 p-8 transition-all hover:border-[#d49b38]/50 hover:bg-[#182238]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d49b38]/10 text-[#d49b38] border border-[#d49b38]/20">
                          <IconComp className="h-6 w-6" />
                        </div>
                        <span className="rounded-full border border-[#d49b38]/30 bg-[#d49b38]/10 px-3 py-1 text-xs font-semibold text-[#d49b38]">
                          {pillar.badge}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                      <p className="text-sm text-[#94a3b8] leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. CORE SERVICE OFFERINGS (RESEARCH AS A SERVICE) */}
        <section className="py-16 md:py-24 bg-[#182238]/40 border-b border-[#d49b38]/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col justify-between md:flex-row md:items-end border-b border-[#d49b38]/15 pb-6">
              <div>
                <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#d49b38] uppercase tracking-wider mb-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Research as a Service (RaaS)</span>
                </div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Official Service Verticals
                </h2>
                <p className="mt-2 text-sm text-[#94a3b8]">
                  Six specialized corporate service classification dimensions.
                </p>
              </div>

              {/* Search Filter */}
              <div className="relative mt-4 md:mt-0 w-full md:w-80">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  value={selectedBvSearch}
                  onChange={(e) => setSelectedBvSearch(e.target.value)}
                  placeholder="Search service verticals..."
                  className="w-full rounded-xl border border-[#d49b38]/20 bg-[#151c2e] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#64748b] focus:border-[#d49b38] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Verticals Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBvs.length === 0 ? (
                <div className="col-span-full rounded-xl border border-[#d49b38]/20 bg-[#182238] p-8 text-center text-sm text-[#94a3b8]">
                  No service verticals match &quot;{selectedBvSearch}&quot;.
                </div>
              ) : (
                filteredBvs.map((bv) => {
                  const IconComponent = bv.icon;
                  return (
                    <div
                      key={bv.code}
                      className="group flex flex-col justify-between rounded-xl border border-[#d49b38]/20 bg-[#182238] p-6 transition-all hover:border-[#d49b38]/60 hover:shadow-lg hover:shadow-[#d49b38]/5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="rounded-lg border border-[#d49b38]/30 bg-[#d49b38]/10 px-2.5 py-1 text-xs font-bold text-[#d49b38]">
                            {bv.code}
                          </span>
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#151c2e] text-[#d49b38]">
                            <IconComponent className="h-4 w-4" />
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#f5c768] transition-colors">
                          {bv.name}
                        </h3>
                        <p className="mt-2 text-xs font-semibold text-[#d49b38]/80">{bv.tag}</p>
                        <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">{bv.description}</p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#64748b]">
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
        <section className="py-16 md:py-24 bg-[#151c2e] border-b border-[#d49b38]/15">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                The Technology Readiness Level (TRL) Journey
              </h2>
              <p className="mt-3 text-sm text-[#94a3b8] max-w-2xl mx-auto">
                Categorizing innovation from fundamental research to operational deployment through three distinct phases: Ignite, Innovate, and Inspire.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {trlPhases.map((phase) => (
                <div
                  key={phase.phase}
                  className="rounded-2xl border border-[#d49b38]/20 bg-[#182238]/80 p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#d49b38]">
                        {phase.phase}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                        {phase.levels}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">{phase.title}</h3>
                    <ul className="space-y-3">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start text-xs text-[#94a3b8]">
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
        <section className="py-16 md:py-20 bg-gradient-to-r from-[#151c2e] via-[#182238] to-[#151c2e]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-3xl border border-[#d49b38]/30 bg-[#182238]/90 p-8 sm:p-12 shadow-2xl">
              <h2 className="text-2xl font-bold text-white sm:text-4xl">
                Ready to Shape India&apos;s Innovation Future?
              </h2>
              <p className="mt-4 text-sm text-[#94a3b8] sm:text-base max-w-2xl mx-auto">
                Connect with Anveshak Hub to bridge cutting-edge academic research with enterprise solution delivery.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#d49b38] to-[#c48b28] px-8 py-3.5 text-sm font-semibold text-[#151c2e] shadow-lg shadow-[#d49b38]/20 hover:opacity-95 transition-all"
                >
                  Login to Platform
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto rounded-xl border border-[#d49b38]/40 bg-[#151c2e] px-8 py-3.5 text-sm font-medium text-white hover:border-[#d49b38] transition-all"
                >
                  Register Organization
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="border-t border-[#d49b38]/20 bg-[#151c2e] py-10 text-xs text-[#94a3b8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#d49b38] font-bold text-[#151c2e] text-xs">
                AH
              </div>
              <span className="font-semibold text-white">Anveshak Hub Private Limited</span>
              <span>© {currentYear}</span>
            </div>

            <div className="flex items-center space-x-6">
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
