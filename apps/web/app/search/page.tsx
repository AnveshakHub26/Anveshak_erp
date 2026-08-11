'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { Search, Building2, User, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Organization' | 'User' | 'Document';
  type: string;
  url: string;
}

export default function Fnd08GlobalSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  // Debounced search trigger
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

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#17324D] text-white">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-page-title font-semibold text-[#17324D]">Global Search</h1>
              <p className="text-label text-[#5B6673]">
                FND-08 Permission-Aware Enterprise Entity Search
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-[#5B6673]" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search organizations, personnel accounts, or system documents..."
              className="pl-10 text-body py-2.5"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-[#1F4E79]" />
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#D7DEE6]">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-[#17324D] text-white'
                    : 'border border-[#D7DEE6] bg-[#F7F8FA] text-[#5B6673] hover:bg-white hover:text-[#17202A]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        {/* Results Container */}
        <div className="space-y-3">
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className="rounded border border-[#D7DEE6] bg-white p-8 text-center text-label text-[#5B6673]">
              Please enter at least 2 characters to search...
            </div>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="rounded border border-[#D7DEE6] bg-white p-8 text-center text-label text-[#5B6673]">
              No authorized records found matching &quot;{query}&quot;.
            </div>
          )}

          {results.map((item) => (
            <Link
              key={`${item.category}-${item.id}`}
              href={item.url}
              className="group block rounded border border-[#D7DEE6] bg-white p-4 shadow-sm hover:border-[#1F4E79] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded border border-[#D7DEE6] bg-[#F7F8FA] text-[#1F4E79]">
                    {item.category === 'Organization' && <Building2 className="h-4 w-4" />}
                    {item.category === 'User' && <User className="h-4 w-4" />}
                    {item.category === 'Document' && <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-table font-semibold text-[#17202A] group-hover:text-[#1F4E79]">
                        {item.title}
                      </h3>
                      <span className="rounded border border-[#D7DEE6] bg-[#F7F8FA] px-2 py-0.5 text-xs font-medium text-[#5B6673]">
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5B6673]">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#5B6673] group-hover:text-[#1F4E79]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
