'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { ROLES, DIFFICULTIES, TOOLS_LIST } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { DateInput } from '@astryxdesign/core/DateInput';
import type { ISODateString } from '@astryxdesign/core/Calendar';
import { Selector } from '@astryxdesign/core/Selector';

interface OnboardingQuizProps {
  onComplete: () => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const { updateProfile } = useAuth();
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

  const roleDescriptions: Record<string, string> = {
    'PPC VA': 'Campaign setup, keyword research, ACoS/ROAS, bid adjustments, reporting',
    'Account VA': 'Seller Central tasks, catalog support, inventory checks, case logs',
    'Listing VA': 'Titles, bullets, A+ content, indexing, keyword placement',
    'Reporting VA': 'Search term reports, campaign reports, KPI summaries',
    'Agency VA': 'SOP execution, ClickUp tasks, client updates, changelogs',
    'Senior PPC Assistant': 'Account audits, launch sequencing, optimization logic, budget pacing',
    'General': 'General Amazon VA preparation across multiple areas',
  };

  const levelDescriptions: Record<string, string> = {
    beginner: 'New to Amazon operations, need foundational knowledge',
    intermediate: 'Know the basics, need structured practice and stronger answers',
    advanced: 'Experienced, need advanced case studies and optimization skills',
  };

  const progressPercent = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Card>
        <VStack gap={5}>
          <VStack gap={3}>
            <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge label={`Step ${step + 1} of ${steps.length}`} variant="neutral" />
              <Text type="supporting" size="sm">{progressPercent}% complete</Text>
            </HStack>
            <ProgressBar label="Onboarding progress" isLabelHidden value={progressPercent} />
            <VStack gap={1}>
              <Heading level={3}>{steps[step].title}</Heading>
              <Text type="supporting">{steps[step].description}</Text>
            </VStack>
          </VStack>

          {step === 0 && (
            <VStack gap={3}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Image
                  src="/images/illustrations/onboarding-role-selection.svg"
                  alt="Choose your target Amazon VA role for personalized interview prep"
                  width={400}
                  height={150}
                  style={{ width: '100%', maxWidth: 384, height: 'auto' }}
                />
              </div>
              {ROLES.map(role => (
                <SelectableCard
                  key={role}
                  label={role}
                  isSelected={formData.targetRole === role}
                  onChange={() => setFormData(prev => ({ ...prev, targetRole: role }))}
                >
                  <VStack gap={1}>
                    <Text type="body" weight="medium">{role}</Text>
                    <Text type="supporting" size="sm">{roleDescriptions[role]}</Text>
                  </VStack>
                </SelectableCard>
              ))}
            </VStack>
          )}

          {step === 1 && (
            <VStack gap={3}>
              {DIFFICULTIES.map(level => (
                <SelectableCard
                  key={level}
                  label={level}
                  isSelected={formData.experienceLevel === level}
                  onChange={() => setFormData(prev => ({ ...prev, experienceLevel: level }))}
                >
                  <VStack gap={1}>
                    <Text type="body" weight="medium" style={{ textTransform: 'capitalize' }}>{level}</Text>
                    <Text type="supporting" size="sm">{levelDescriptions[level]}</Text>
                  </VStack>
                </SelectableCard>
              ))}
            </VStack>
          )}

          {step === 2 && (
            <VStack gap={3}>
              <Text type="body" weight="medium">Select tools you are familiar with:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {TOOLS_LIST.map(tool => (
                  <SelectableCard
                    key={tool}
                    label={tool}
                    isSelected={formData.toolsKnown.includes(tool)}
                    onChange={() => toggleTool(tool)}
                    padding={2}
                  >
                    <Text type="body" size="sm">{tool}</Text>
                  </SelectableCard>
                ))}
              </div>
            </VStack>
          )}

          {step === 3 && (
            <VStack gap={3}>
              <Text type="body" weight="medium">Select areas you need the most practice in:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {weakAreaOptions.map(area => (
                  <SelectableCard
                    key={area}
                    label={area}
                    isSelected={formData.weakAreas.includes(area)}
                    onChange={() => toggleWeakArea(area)}
                    padding={2}
                  >
                    <Text type="body" size="sm">{area}</Text>
                  </SelectableCard>
                ))}
              </div>
            </VStack>
          )}

          {step === 4 && (
            <VStack gap={4}>
              <DateInput
                label="When is your interview?"
                value={formData.interviewDate ? (formData.interviewDate as ISODateString) : undefined}
                onChange={(value) => setFormData(prev => ({ ...prev, interviewDate: value || '' }))}
                hasClear
              />
              <Selector
                label="Confidence Level"
                placeholder="Select confidence level"
                value={formData.confidenceLevel || undefined}
                onChange={(v) => setFormData(prev => ({ ...prev, confidenceLevel: v }))}
                options={[
                  { value: 'low', label: 'Low - I need a lot of preparation' },
                  { value: 'medium', label: 'Medium - I know some basics' },
                  { value: 'high', label: 'High - I just need practice and polish' },
                ]}
              />
              <Selector
                label="Current Resume Status"
                placeholder="Select resume status"
                value={formData.resumeStatus || undefined}
                onChange={(v) => setFormData(prev => ({ ...prev, resumeStatus: v }))}
                options={[
                  { value: 'no_resume', label: 'No resume yet' },
                  { value: 'generic_va', label: 'Generic VA resume' },
                  { value: 'amazon_specific', label: 'Amazon-specific resume' },
                ]}
              />
              <TextInput
                label="Country"
                placeholder="e.g., Philippines, India, USA"
                value={formData.country}
                onChange={(v) => setFormData(prev => ({ ...prev, country: v }))}
              />
            </VStack>
          )}

          <HStack style={{ justifyContent: 'space-between', paddingTop: 16 }}>
            <Button
              label="Previous"
              variant="secondary"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              isDisabled={step === 0}
            />
            {step < steps.length - 1 ? (
              <Button
                label="Next"
                variant="primary"
                onClick={() => setStep(s => s + 1)}
                isDisabled={step === 0 && !formData.targetRole}
              />
            ) : (
              <Button
                label={submitting ? 'Saving...' : 'Complete Onboarding'}
                variant="primary"
                isLoading={submitting}
                onClick={handleSubmit}
              />
            )}
          </HStack>
          {error && <Text type="body" color="accent" style={{ textAlign: 'center' }}>{error}</Text>}
        </VStack>
      </Card>
    </div>
  );
}
