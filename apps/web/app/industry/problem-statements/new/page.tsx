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
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Official AnveshakHub Business Verticals fallback list
const DEFAULT_BUSINESS_VERTICALS = [
  { id: 'bv-01', code: 'BV-01', name: 'Research-led Projects' },
  { id: 'bv-02', code: 'BV-02', name: 'IP and Knowledge Management' },
  { id: 'bv-03', code: 'BV-03', name: 'Startup Ecosystem' },
  { id: 'bv-04', code: 'BV-04', name: 'Consulting' },
  { id: 'bv-05', code: 'BV-05', name: 'Design and Development' },
  { id: 'bv-06', code: 'BV-06', name: 'Upskilling and Workshops' },
];

const STANDARD_DEPARTMENTS = [
  'Research & Development (R&D)',
  'Quality Assurance (QA)',
  'Operations & Production',
  'Technology & Engineering',
  'Product Development',
  'Strategy & Governance',
  'Supply Chain & Logistics',
];

const STANDARD_CATEGORIES = [
  'Computer Vision & AI',
  'Predictive Maintenance',
  'Process Automation',
  'Deep Tech & Hardware',
  'Data Analytics & Cloud Systems',
  'IP & Patent Strategy',
  'Quality & Defect Testing',
  'Workforce Upskilling',
];

export default function NewProblemStatementPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bvs, setBvs] = useState<any[]>(DEFAULT_BUSINESS_VERTICALS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    bvId: 'bv-01',
    customBvName: '',
    department: 'Research & Development (R&D)',
    customDepartment: '',
    category: 'Computer Vision & AI',
    customCategory: '',
    priority: 'MEDIUM',
    customPriority: '',
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
      const res = await api.get('/business-verticals');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setBvs(res.data.data);
        setFormData((prev) => ({ ...prev, bvId: res.data.data[0].id }));
      } else {
        setBvs(DEFAULT_BUSINESS_VERTICALS);
        setFormData((prev) => ({ ...prev, bvId: DEFAULT_BUSINESS_VERTICALS[0].id }));
      }
    } catch (err) {
      console.warn('Using default business verticals fallback', err);
      setBvs(DEFAULT_BUSINESS_VERTICALS);
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
      if (formData.bvId === 'OTHER' && !formData.customBvName.trim()) {
        setError('Please specify your custom Business Vertical name.');
        return false;
      }
      if (formData.department === 'OTHER' && !formData.customDepartment.trim()) {
        setError('Please specify your custom Department name.');
        return false;
      }
      if (formData.category === 'OTHER' && !formData.customCategory.trim()) {
        setError('Please specify your custom Problem Category name.');
        return false;
      }
      if (formData.priority === 'OTHER' && !formData.customPriority.trim()) {
        setError('Please specify your custom Priority Level.');
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

  const getEffectiveValue = (selected: string, customVal: string) => {
    return selected === 'OTHER' ? customVal.trim() : selected;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!isDraft && !validateStep(step)) return;

    try {
      setSubmitting(true);
      setError(null);

      // Determine effective business vertical, department, category, and priority
      const effectiveBvId = formData.bvId === 'OTHER' ? bvs[0]?.id : formData.bvId;
      const effectiveDepartment = getEffectiveValue(formData.department, formData.customDepartment);
      const effectiveCategory = getEffectiveValue(formData.category, formData.customCategory);
      const effectivePriority = getEffectiveValue(formData.priority, formData.customPriority);

      const payload = {
        title: formData.title,
        bvId: effectiveBvId,
        department: effectiveDepartment,
        category: effectiveCategory,
        priority: effectivePriority,
        currentSituation: formData.currentSituation,
        description: formData.description,
        existingProcess: formData.existingProcess,
        currentTechnology: formData.currentTechnology,
        businessImpact: formData.businessImpact,
        desiredSolution: formData.desiredSolution,
        expectedBenefits: formData.expectedBenefits,
        successCriteria: formData.successCriteria,
        expectedTimeline: formData.expectedTimeline,
        budgetEstimate: formData.budgetEstimate,
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

              {/* Business Vertical */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Business Vertical *</Label>
                  <Select
                    value={formData.bvId}
                    onValueChange={(val) => handleInputChange('bvId', val)}
                    placeholder="Select Vertical"
                  >
                    <SelectContent>
                      {bvs.map((bv) => (
                        <SelectItem key={bv.id} value={bv.id}>
                          {bv.name} {bv.code ? `(${bv.code})` : ''}
                        </SelectItem>
                      ))}
                      <SelectItem value="OTHER">✍️ Other / Write Your Own Vertical...</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Business Vertical Input */}
                  {formData.bvId === 'OTHER' && (
                    <div className="pt-2 animate-in fade-in-0">
                      <Label className="text-xs font-bold text-[#d49b38] flex items-center gap-1 mb-1">
                        <PenTool className="h-3 w-3" /> Specify Custom Business Vertical *
                      </Label>
                      <Input
                        placeholder="Type your custom Business Vertical name..."
                        value={formData.customBvName}
                        onChange={(e) => handleInputChange('customBvName', e.target.value)}
                        className="text-xs border-[#d49b38] focus:ring-[#d49b38]"
                      />
                    </div>
                  )}
                </div>

                {/* Department / Function */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Department / Function</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(val) => handleInputChange('department', val)}
                    placeholder="Select Department"
                  >
                    <SelectContent>
                      {STANDARD_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                      <SelectItem value="OTHER">✍️ Other / Write Your Own Department...</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Department Input */}
                  {formData.department === 'OTHER' && (
                    <div className="pt-2 animate-in fade-in-0">
                      <Label className="text-xs font-bold text-[#d49b38] flex items-center gap-1 mb-1">
                        <PenTool className="h-3 w-3" /> Specify Custom Department / Function *
                      </Label>
                      <Input
                        placeholder="e.g. Avionics R&D, Shopfloor Operations..."
                        value={formData.customDepartment}
                        onChange={(e) => handleInputChange('customDepartment', e.target.value)}
                        className="text-xs border-[#d49b38] focus:ring-[#d49b38]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Problem Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Problem Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleInputChange('category', val)}
                    placeholder="Select Category"
                  >
                    <SelectContent>
                      {STANDARD_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="OTHER">✍️ Other / Write Your Own Category...</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Category Input */}
                  {formData.category === 'OTHER' && (
                    <div className="pt-2 animate-in fade-in-0">
                      <Label className="text-xs font-bold text-[#d49b38] flex items-center gap-1 mb-1">
                        <PenTool className="h-3 w-3" /> Specify Custom Problem Category *
                      </Label>
                      <Input
                        placeholder="e.g. High-Voltage Power Grid Inspection..."
                        value={formData.customCategory}
                        onChange={(e) => handleInputChange('customCategory', e.target.value)}
                        className="text-xs border-[#d49b38] focus:ring-[#d49b38]"
                      />
                    </div>
                  )}
                </div>

                {/* Priority Level */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Priority Level</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) => handleInputChange('priority', val)}
                    placeholder="Select Priority"
                  >
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="OTHER">✍️ Other / Write Custom Priority...</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Priority Input */}
                  {formData.priority === 'OTHER' && (
                    <div className="pt-2 animate-in fade-in-0">
                      <Label className="text-xs font-bold text-[#d49b38] flex items-center gap-1 mb-1">
                        <PenTool className="h-3 w-3" /> Specify Custom Priority Level *
                      </Label>
                      <Input
                        placeholder="e.g. Urgent Board Mandate..."
                        value={formData.customPriority}
                        onChange={(e) => handleInputChange('customPriority', e.target.value)}
                        className="text-xs border-[#d49b38] focus:ring-[#d49b38]"
                      />
                    </div>
                  )}
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Business Vertical</span>
                    <div className="text-xs font-semibold text-slate-800">
                      {formData.bvId === 'OTHER'
                        ? formData.customBvName
                        : bvs.find((b) => b.id === formData.bvId)?.name || 'Default Vertical'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Department</span>
                    <div className="text-xs font-semibold text-slate-800">
                      {getEffectiveValue(formData.department, formData.customDepartment)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Category</span>
                    <div className="text-xs font-semibold text-slate-800">
                      {getEffectiveValue(formData.category, formData.customCategory)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Priority</span>
                    <div className="text-xs font-semibold text-slate-800">
                      {getEffectiveValue(formData.priority, formData.customPriority)}
                    </div>
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
