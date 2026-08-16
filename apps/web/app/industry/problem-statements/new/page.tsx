'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  UploadCloud,
  FileCode,
  AlertCircle,
  Building2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function NewProblemStatementPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bvs, setBvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    bvId: '',
    department: '',
    category: '',
    priority: 'MEDIUM',
    currentSituation: '',
    description: '',
    existingProcess: '',
    currentTechnology: '',
    businessImpact: '',
    desiredSolution: '',
    expectedBenefits: '',
    successCriteria: '',
    expectedTimeline: '',
    budgetEstimate: '',
  });

  useEffect(() => {
    fetchBusinessVerticals();
  }, []);

  const fetchBusinessVerticals = async () => {
    try {
      const res = await api.get('/organizations/business-verticals');
      if (res.data?.success) {
        setBvs(res.data.data || []);
        if (res.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, bvId: res.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load business verticals', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setError('Title is required.');
        return false;
      }
      if (!formData.bvId) {
        setError('Please select a Business Vertical.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.description.trim()) {
        setError('Problem Description is required.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 5));
    }
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!isDraft && !validateStep(step)) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        isDraft,
      };

      const res = await api.post('/industry/problem-statements', payload);
      if (res.data?.success) {
        const ps = res.data.data;
        router.push(`/industry/problem-statements/${ps.id}`);
      } else {
        setError(res.data?.message || 'Failed to submit problem statement.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
          <Link href="/industry" className="hover:text-slate-900">Industry Portal</Link>
          <span>/</span>
          <Link href="/industry/problem-statements" className="hover:text-slate-900">Problem Statements</Link>
          <span>/</span>
          <span className="text-slate-900">New Statement</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Submit New Problem Statement</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Multi-step evaluation request form. Reference numbers are generated server-side upon submission.
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-5 gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
        {[
          { num: 1, label: '1. Basic Info' },
          { num: 2, label: '2. Problem' },
          { num: 3, label: '3. Outcome' },
          { num: 4, label: '4. Supporting' },
          { num: 5, label: '5. Review' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => {
              if (s.num < step) setStep(s.num);
            }}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
              step === s.num
                ? 'bg-[#151c2e] text-white shadow-sm'
                : s.num < step
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Steps */}
      <Card className="border-slate-200/80 shadow-md bg-white">
        {step === 1 && (
          <>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Step 1: Basic Information</CardTitle>
              <CardDescription className="text-xs text-slate-500">Categorize your business requirement & domain vertical</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Problem Statement Title *</Label>
                <Input
                  placeholder="e.g. Automated High-Temperature Defect Inspection System"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Business Vertical *</Label>
                  <Select value={formData.bvId} onValueChange={(val) => handleInputChange('bvId', val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Vertical" />
                    </SelectTrigger>
                    <SelectContent>
                      {bvs.map((bv) => (
                        <SelectItem key={bv.id} value={bv.id}>
                          {bv.name} ({bv.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Department / Function</Label>
                  <Input
                    placeholder="e.g. Quality Assurance, R&D, Operations"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Problem Category</Label>
                  <Input
                    placeholder="e.g. Computer Vision, Predictive Maintenance, Process Automation"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(val) => handleInputChange('priority', val)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Step 2: Problem Definition</CardTitle>
              <CardDescription className="text-xs text-slate-500">Detail current challenges, existing technology, and business impact</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Detailed Problem Description *</Label>
                <Textarea
                  rows={4}
                  placeholder="Describe the operational challenge or bottleneck in detail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Current Situation / Pain Points</Label>
                  <Textarea
                    rows={3}
                    placeholder="What is currently happening in production/operations?"
                    value={formData.currentSituation}
                    onChange={(e) => handleInputChange('currentSituation', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Existing Process & Technology</Label>
                  <Textarea
                    rows={3}
                    placeholder="What systems or manual workflows are currently used?"
                    value={formData.currentTechnology}
                    onChange={(e) => handleInputChange('currentTechnology', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Business Impact</Label>
                <Input
                  placeholder="e.g. 15% downtime loss, manual inspection errors, high scrap rate"
                  value={formData.businessImpact}
                  onChange={(e) => handleInputChange('businessImpact', e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Step 3: Expected Outcome & Requirements</CardTitle>
              <CardDescription className="text-xs text-slate-500">Define expected benefits, timeline, and success criteria</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Desired Solution / Vision</Label>
                <Textarea
                  rows={3}
                  placeholder="Describe the expected system, software, hardware, or research outcome..."
                  value={formData.desiredSolution}
                  onChange={(e) => handleInputChange('desiredSolution', e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Expected Benefits & KPI Impact</Label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. 99.5% defect detection rate, 50% throughput increase"
                    value={formData.expectedBenefits}
                    onChange={(e) => handleInputChange('expectedBenefits', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Success Criteria</Label>
                  <Textarea
                    rows={3}
                    placeholder="How will success be measured upon project completion?"
                    value={formData.successCriteria}
                    onChange={(e) => handleInputChange('successCriteria', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Expected Timeline</Label>
                  <Input
                    placeholder="e.g. 3 Months, 6 Months, Q3 2026"
                    value={formData.expectedTimeline}
                    onChange={(e) => handleInputChange('expectedTimeline', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Estimated Budget (Optional)</Label>
                  <Input
                    placeholder="e.g. ₹ 5,00,000 - ₹ 10,00,000"
                    value={formData.budgetEstimate}
                    onChange={(e) => handleInputChange('budgetEstimate', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 4 && (
          <>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Step 4: Supporting Information & Files</CardTitle>
              <CardDescription className="text-xs text-slate-500">Provide technical documentation, specifications, or CAD/PDF references</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
                <UploadCloud className="h-10 w-10 text-slate-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Attach Technical Specifications / Drawings</p>
                  <p className="text-[11px] text-slate-500">PDF, PNG, JPG, ZIP up to 25MB (Optional)</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  Browse Files
                </Button>
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Confidentiality Protected</strong>
                  AnveshakHub operates under strict corporate NDA protocols. All uploaded specifications remain private to your organization.
                </div>
              </div>
            </CardContent>
          </>
        )}

        {step === 5 && (
          <>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900">Step 5: Review & Submit</CardTitle>
              <CardDescription className="text-xs text-slate-500">Verify details before submitting for AnveshakHub evaluation</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Title</span>
                  <div className="text-sm font-bold text-slate-900">{formData.title}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Category</span>
                    <div className="text-xs font-semibold text-slate-800">{formData.category || 'General'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Priority</span>
                    <div className="text-xs font-semibold text-slate-800">{formData.priority}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Problem Description</span>
                  <div className="text-xs text-slate-700 whitespace-pre-wrap">{formData.description}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <strong className="font-bold">What happens after submission?</strong>
                <p>
                  Your problem statement will be assigned a permanent reference number (e.g. <code>PS-2026-XXXX</code>) and queued for review by AnveshakHub domain experts.
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* Footer Controls */}
        <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" size="sm" onClick={prevStep} className="text-xs font-semibold">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              className="text-xs font-semibold text-slate-700"
            >
              <Save className="mr-1 h-3.5 w-3.5" /> Save Draft
            </Button>

            {step < 5 ? (
              <Button
                type="button"
                size="sm"
                onClick={nextStep}
                className="bg-[#151c2e] text-white hover:bg-[#1e293b] text-xs font-bold"
              >
                Next Step <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:from-[#c48b28] font-bold text-xs shadow-md"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
