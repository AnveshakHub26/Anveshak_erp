'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Lock,
  Building2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IndustryDocumentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter && typeFilter !== 'ALL') params.type = typeFilter;

      const res = await api.get('/industry/documents', { params });
      if (res.data?.success) {
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (key: string) => {
    if (!key) return;
    const url = `http://localhost:4000/api/v1/documents/file-stream?key=${encodeURIComponent(key)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
          <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
          <span>/</span>
          <span className="text-slate-900">Documents</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Document Vault</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Encrypted repository of contracts, registration documents, technical specifications, and project deliverables.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>Encrypted Organization Scope</span>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] text-xs bg-slate-50 border-slate-200">
              <Filter className="mr-2 h-3.5 w-3.5 text-slate-500" />
              <SelectValue placeholder="Filter Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Document Types</SelectItem>
              <SelectItem value="Registration">Registration Docs</SelectItem>
              <SelectItem value="TechnicalSpecification">Technical Specs</SelectItem>
              <SelectItem value="Proposal">Proposals & Contracts</SelectItem>
              <SelectItem value="DeliverableArtifact">Deliverable Artifacts</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FileSpreadsheet className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No documents found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Documents attached to your registration, problem statements, or projects will be securely listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Document Type</th>
                    <th className="py-3 px-6">Associated Entity</th>
                    <th className="py-3 px-6">Storage Key</th>
                    <th className="py-3 px-6">Uploaded Date</th>
                    <th className="py-3 px-6 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{doc.type}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {doc.entityType}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500 text-[11px] truncate max-w-xs">{doc.storageKey}</td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc.storageKey)}
                          className="text-xs font-semibold"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
