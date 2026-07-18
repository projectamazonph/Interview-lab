'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { ROLES, DIFFICULTIES, TOOLS_LIST } from '@/lib/types';
import { FieldCard, FieldCardContent, FieldCardDescription, FieldCardHeader, FieldCardTitle } from '@/components/ui/glass-card';
import { FieldButton } from '@/components/ui/glass-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldBadge } from '@/components/ui/glass-badge';

interface OnboardingQuizProps {
  onComplete: () => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    targetRole: '',
    experienceLevel: '',
    toolsKnown: [] as string[],
    weakAreas: [] as string[],
    interviewDate: '',
    confidenceLevel: '',
    resumeStatus: '',
    country: '',
  });

  const steps = [
    { title: 'Target Role', description: 'What Amazon VA role are you preparing for?' },
    { title: 'Experience Level', description: 'How experienced are you with Amazon operations?' },
    { title: 'Tools & Skills', description: 'Which tools are you familiar with?' },
    { title: 'Focus Areas', description: 'What areas do you need the most practice in?' },
    { title: 'Timeline & Details', description: 'When is your interview and other details?' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const success = await updateProfile({
      targetRole: formData.targetRole,
      experienceLevel: formData.experienceLevel,
      toolsKnown: JSON.stringify(formData.toolsKnown),
      weakAreas: JSON.stringify(formData.weakAreas),
      interviewDate: formData.interviewDate || null,
      confidenceLevel: formData.confidenceLevel,
      resumeStatus: formData.resumeStatus,
      country: formData.country || null,
      onboardingDone: true,
    });
    setSubmitting(false);
    if (success) {
      onComplete();
    } else {
      setError('Failed to save your profile. Please try again.');
    }
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      toolsKnown: prev.toolsKnown.includes(tool)
        ? prev.toolsKnown.filter(t => t !== tool)
        : [...prev.toolsKnown, tool],
    }));
  };

  const toggleWeakArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      weakAreas: prev.weakAreas.includes(area)
        ? prev.weakAreas.filter(a => a !== area)
        : [...prev.weakAreas, area],
    }));
  };

  const weakAreaOptions = ['PPC fundamentals', 'Search term reports', 'Keyword research', 'Client communication', 'Resume writing', 'Cover letters', 'Seller Central navigation', 'Listing optimization', 'ACoS/ROAS calculations', 'SOP discipline'];

  return (
    <div className="max-w-2xl mx-auto px-1 sm:px-0">
      <FieldCard>
        <FieldCardHeader>
          <div className="flex items-center justify-between mb-2">
            <FieldBadge variant="secondary">Step {step + 1} of {steps.length}</FieldBadge>
            <span className="text-sm text-[#737373] whitespace-nowrap">{Math.round(((step + 1) / steps.length) * 100)}% complete</span>
          </div>
          <FieldCardTitle className="text-xl sm:text-2xl font-heading">{steps[step].title}</FieldCardTitle>
          <FieldCardDescription>{steps[step].description}</FieldCardDescription>
        </FieldCardHeader>
        <FieldCardContent className="space-y-6">
          {step === 0 && (
            <div className="space-y-3">
              <div className="flex justify-center mb-2">
                <Image
                  src="/images/illustrations/onboarding-role-selection.svg"
                  alt="Choose your target Amazon VA role for personalized interview prep"
                  width={400}
                  height={150}
                  className="w-full max-w-sm h-auto"
                />
              </div>
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setFormData(prev => ({ ...prev, targetRole: role }))}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                    formData.targetRole === role
                      ? 'border-[#FF6B35] bg-[#FF6B35]/8'
                      : 'border-[#E5E5E0] hover:border-[#D4D4D4]'
                  }`}
                >
                  <p className="font-medium truncate">{role}</p>
                  <p className="text-xs sm:text-sm text-[#737373] mt-1">
                    {role === 'PPC VA' && 'Campaign setup, keyword research, ACoS/ROAS, bid adjustments, reporting'}
                    {role === 'Account VA' && 'Seller Central tasks, catalog support, inventory checks, case logs'}
                    {role === 'Listing VA' && 'Titles, bullets, A+ content, indexing, keyword placement'}
                    {role === 'Reporting VA' && 'Search term reports, campaign reports, KPI summaries'}
                    {role === 'Agency VA' && 'SOP execution, ClickUp tasks, client updates, changelogs'}
                    {role === 'Senior PPC Assistant' && 'Account audits, launch sequencing, optimization logic, budget pacing'}
                    {role === 'General' && 'General Amazon VA preparation across multiple areas'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {DIFFICULTIES.map(level => (
                <button
                  key={level}
                  onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level }))}
                  className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                    formData.experienceLevel === level
                      ? 'border-[#FF6B35] bg-[#FF6B35]/8'
                      : 'border-[#E5E5E0] hover:border-[#D4D4D4]'
                  }`}
                >
                  <p className="font-medium capitalize">{level}</p>
                  <p className="text-xs sm:text-sm text-[#737373] mt-1">
                    {level === 'beginner' && 'New to Amazon operations, need foundational knowledge'}
                    {level === 'intermediate' && 'Know the basics, need structured practice and stronger answers'}
                    {level === 'advanced' && 'Experienced, need advanced case studies and optimization skills'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <Label className="mb-3 block">Select tools you are familiar with:</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TOOLS_LIST.map(tool => (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm transition-colors min-h-[44px] ${
                      formData.toolsKnown.includes(tool)
                        ? 'border-[#FF6B35] bg-[#FF6B35]/8 text-[#FF6B35]'
                        : 'border-[#E5E5E0] text-[#404040] hover:border-[#D4D4D4]'
                    }`}
                  >
                    <span className="break-words">{tool}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Label className="mb-3 block">Select areas you need the most practice in:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weakAreaOptions.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleWeakArea(area)}
                    className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm text-left transition-colors min-h-[44px] ${
                      formData.weakAreas.includes(area)
                        ? 'border-[#FF6B35] bg-[#FF6B35]/8 text-[#FF6B35]'
                        : 'border-[#E5E5E0] text-[#404040] hover:border-[#D4D4D4]'
                    }`}
                  >
                    <span className="break-words">{area}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>When is your interview?</Label>
                <Input
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select value={formData.confidenceLevel} onValueChange={(v) => setFormData(prev => ({ ...prev, confidenceLevel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select confidence level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - I need a lot of preparation</SelectItem>
                    <SelectItem value="medium">Medium - I know some basics</SelectItem>
                    <SelectItem value="high">High - I just need practice and polish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Resume Status</Label>
                <Select value={formData.resumeStatus} onValueChange={(v) => setFormData(prev => ({ ...prev, resumeStatus: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select resume status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_resume">No resume yet</SelectItem>
                    <SelectItem value="generic_va">Generic VA resume</SelectItem>
                    <SelectItem value="amazon_specific">Amazon-specific resume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  placeholder="e.g., Philippines, India, USA"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <FieldButton
              variant="outline"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Previous
            </FieldButton>
            {step < steps.length - 1 ? (
              <FieldButton
                className="bg-[#FF6B35] hover:bg-[#FF6B35] min-w-[80px]"
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && !formData.targetRole}
              >
                Next
              </FieldButton>
            ) : (
              <FieldButton
                className="bg-[#FF6B35] hover:bg-[#FF6B35] min-w-[80px]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Complete Onboarding'}
              </FieldButton>
            )}
          </div>
          {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
        </FieldCardContent>
      </FieldCard>
    </div>
  );
}
