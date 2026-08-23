'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { Search, Building2, User, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PublicShell } from '@/components/layout/public-shell';
import { useAuthStore } from '@/hooks/useAuth';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Organization' | 'User' | 'Document';
  type: string;
  url: string;
}

export default function Fnd08GlobalSearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';
  const { isAuthenticated } = useAuthStore();

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQ && initialQ !== query) {
      setQuery(initialQ);
    }
  }, [initialQ]);

  const executeSearch = useCallback(async (searchQuery: string, searchCat: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setServerError(null);
    try {
      const res = await apiRequest(
        `/admin/search?q=${encodeURIComponent(searchQuery.trim())}&category=${encodeURIComponent(searchCat)}`,
      );
      if (res && res.data) {
        setResults(res.data);
      }
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while executing global search.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query, category);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category, executeSearch]);

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Organizations', value: 'organizations' },
    { label: 'Users', value: 'users' },
    { label: 'Documents', value: 'documents' },
  ];

  const Shell = isAuthenticated ? AppShell : PublicShell;

  return (
    <Shell>
      <div className="min-h-[calc(100vh-128px)] bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">Global Search</h1>
                <p className="text-xs text-[#64748B]">Permission-Aware Enterprise Entity Search</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#94a3b8]" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search organizations, personnel accounts, or system documents..."
                className="pl-10 text-sm py-2.5"
                autoFocus
              />
              {loading && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#d49b38]" />
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8F0]">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    category === cat.value
                      ? 'bg-[#151c2e] text-white shadow-sm'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <Alert variant="error" className="bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]">
              {serverError}
            </Alert>
          )}

          {/* Search Results List */}
          {!loading && query.trim().length >= 2 && results.length === 0 && !serverError && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-[#94a3b8] mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No Matching Results Found</p>
              <p className="text-xs text-[#64748B] mt-1">
                No enterprise entity matched &quot;{query}&quot;. Try adjusting your search query or filters.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {results.map((item) => (
              <Link key={item.id} href={item.url || '#'} className="block group">
                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs hover:border-[#d49b38] hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#d49b38] border border-[#E2E8F0]">
                      {item.category === 'Organization' && <Building2 className="h-4 w-4" />}
                      {item.category === 'User' && <User className="h-4 w-4" />}
                      {item.category === 'Document' && <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#d49b38] transition-colors">
                          {item.title}
                        </span>
                        <span className="rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 text-[10px] font-semibold text-[#64748B] uppercase">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#64748B]">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#d49b38] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
