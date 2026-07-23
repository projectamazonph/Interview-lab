'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { CoverLetter, ROLES } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Banner } from '@astryxdesign/core/Banner';
import { List, ListItem } from '@astryxdesign/core/List';
import { FileArrowDown, FileText, Clock, ArrowClockwise } from '@phosphor-icons/react';

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal Job Application', desc: 'Traditional corporate application letter' },
  { value: 'conversational', label: 'Conversational', desc: 'Warm, approachable tone' },
  { value: 'beginner_friendly', label: 'Beginner-Friendly', desc: 'Emphasizes learning and potential' },
  { value: 'agency', label: 'Agency Role', desc: 'Targets agency and multi-client positions' },
  { value: 'upwork', label: 'Upwork Proposal', desc: 'Optimized for freelance platforms' },
  { value: 'cold_email', label: 'Cold Email', desc: 'Direct outreach to hiring managers' },
  { value: 'linkedin', label: 'LinkedIn Message', desc: 'Professional networking message' },
  { value: 'professional', label: 'Professional / Corporate', desc: 'Polished and business-formal' },
];

const STRUCTURE_STEPS = [
  '1. Role-specific opening',
  '2. Relevant Amazon/VA skills',
  '3. Proof of process discipline',
  '4. Tool familiarity',
  '5. Practical value proposition',
  '6. Confident close',
];

type CoverLetterResult = {
  draftLetter?: string;
  shorterVersion?: string;
  subjectLine?: string;
  customizationTips?: string[];
  claimsToVerify?: string[];
};

export function CoverLetterStudio() {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('formal');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/cover-letter')
        .then(res => res.json())
        .then(data => setCoverLetters(data.coverLetters || []))
        .catch(console.error);
    }
  }, [user]);

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !user) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          tone,
          targetRole,
          userName: user.name,
        }),
      });
      const data = await res.json();

      await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, tone, generatedLetter: data.draftLetter, truthFlags: data.claimsToVerify }),
      });

      setResult(data);

      const histRes = await fetch('/api/cover-letter');
      const histData = await histRes.json();
      setCoverLetters(histData.coverLetters || []);
    } catch (error) {
      console.error('Cover letter generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!result?.draftLetter || !user) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: format,
          content: result.draftLetter,
          title: `Cover Letter - ${targetRole || 'Amazon VA'} - ${tone}`,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${tone}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <VStack gap={6}>
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={2}>Cover Letter Studio</Heading>
          <Text type="supporting">Generate tailored cover letters with truthfulness guardrails</Text>
        </VStack>
        <Button
          label={`${showHistory ? 'Hide History' : 'History'} (${coverLetters.length})`}
          variant="secondary"
          icon={<Clock weight="light" />}
          onClick={() => setShowHistory(!showHistory)}
        />
      </HStack>

      {showHistory && coverLetters.length > 0 && (
        <Card padding={0}>
          <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">Previous Cover Letters</Text></VStack>} hasDividers>
            {coverLetters.map((cl) => (
              <ListItem
                key={cl.id}
                label={`${cl.tone || 'Formal'} Cover Letter`}
                description={new Date(cl.createdAt).toLocaleDateString()}
                endContent={
                  <HStack gap={2} vAlign="center">
                    <Badge label={cl.tone} variant="neutral" />
                    <Button
                      label="Load"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (cl.generatedLetter) {
                          setResult({
                            draftLetter: cl.generatedLetter,
                            claimsToVerify: cl.truthFlags ? (() => { try { return JSON.parse(cl.truthFlags); } catch { return []; } })() : [],
                          });
                        }
                        if (cl.jobDescription) setJobDescription(cl.jobDescription);
                        if (cl.tone) setTone(cl.tone);
                        setShowHistory(false);
                      }}
                    />
                  </HStack>
                }
              />
            ))}
          </List>
        </Card>
      )}

      <Grid columns={{ minWidth: 360, repeat: 'fit' }} gap={6}>
        <Card>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={4}>Job Description</Heading>
              <Text type="supporting" size="sm">Paste the job description to generate a tailored cover letter</Text>
            </VStack>
            <Selector
              label="Target Role"
              placeholder="Select target role"
              value={targetRole || null}
              onChange={(v) => setTargetRole(v || '')}
              hasClear
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />
            <Selector
              label="Tone"
              value={tone}
              onChange={setTone}
              description={TONE_OPTIONS.find((o) => o.value === tone)?.desc}
              options={TONE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            />
            <VStack gap={1}>
              <HStack hAlign="between">
                <Text type="body" size="sm" weight="medium">Job Description</Text>
                <Text type="supporting" size="xsm">{`${jobDescription.length} chars`}</Text>
              </HStack>
              <TextArea
                label="Job description"
                isLabelHidden
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={setJobDescription}
                rows={10}
              />
            </VStack>
            <HStack gap={3}>
              <Button
                label={loading ? 'Generating...' : 'Generate Letter'}
                variant="primary"
                width="100%"
                isLoading={loading}
                isDisabled={!jobDescription.trim()}
                onClick={handleGenerate}
              />
              {result && (
                <IconButton
                  label="Regenerate cover letter"
                  icon={<ArrowClockwise weight="light" />}
                  variant="secondary"
                  onClick={handleGenerate}
                  isDisabled={!jobDescription.trim() || loading}
                />
              )}
            </HStack>
          </VStack>
        </Card>

        <VStack gap={4}>
          {result ? (
            <>
              <Card>
                <VStack gap={3}>
                  <HStack gap={2} vAlign="center">
                    <Badge label={tone} variant="orange" />
                    <Text type="body" weight="semibold" size="sm">Generated Cover Letter</Text>
                  </HStack>
                  <Card variant="muted">
                    <div style={{ maxHeight: 384, overflowY: 'auto' }}>
                      <Text type="body" size="sm">{result.draftLetter}</Text>
                    </div>
                  </Card>
                </VStack>
              </Card>

              {result.shorterVersion && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Shorter Version</Text>
                    <Text type="body" size="sm">{result.shorterVersion}</Text>
                  </VStack>
                </Card>
              )}

              {result.subjectLine && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Subject Line / Proposal Opener</Text>
                    <Text type="body" size="sm">{result.subjectLine}</Text>
                  </VStack>
                </Card>
              )}

              {result.customizationTips && result.customizationTips.length > 0 && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Customization Tips</Text>
                    <VStack gap={1}>
                      {result.customizationTips.map((tip, i) => (
                        <HStack key={i} gap={2}>
                          <Text type="body" size="sm" color="accent">•</Text>
                          <Text type="body" size="sm">{tip}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}

              {result.claimsToVerify && result.claimsToVerify.length > 0 && (
                <Banner
                  status="warning"
                  title="Claims to Verify Before Sending"
                  description={
                    <VStack gap={1}>
                      {result.claimsToVerify.map((c, i) => <Text key={i} type="inherit" size="sm">{c}</Text>)}
                    </VStack>
                  }
                />
              )}

              {result.draftLetter && (
                <Card>
                  <VStack gap={3}>
                    <Text type="body" weight="medium" size="sm">Export Cover Letter</Text>
                    <HStack gap={3} wrap="wrap">
                      <Button
                        label={exporting ? 'Exporting...' : 'Download DOCX'}
                        variant="secondary"
                        icon={<FileArrowDown weight="light" />}
                        isLoading={exporting}
                        onClick={() => handleExport('docx')}
                      />
                      <Button
                        label={exporting ? 'Exporting...' : 'Download PDF'}
                        variant="secondary"
                        icon={<FileText weight="light" />}
                        isLoading={exporting}
                        onClick={() => handleExport('pdf')}
                      />
                    </HStack>
                  </VStack>
                </Card>
              )}
            </>
          ) : (
            <Card padding={8}>
              <VStack gap={3} hAlign="center">
                <Image
                  src="/images/illustrations/cover-letter-transformation.svg"
                  alt="Transform your job applications with AI-generated cover letters"
                  width={300}
                  height={200}
                  style={{ width: '100%', maxWidth: 288, height: 'auto' }}
                />
                <Text type="supporting" justify="center">Paste a job description to generate a tailored cover letter</Text>
              </VStack>
            </Card>
          )}
        </VStack>
      </Grid>

      <Card>
        <VStack gap={4}>
          <Heading level={4}>Cover Letter Structure</Heading>
          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={2}>
            {STRUCTURE_STEPS.map((step) => (
              <Card key={step} variant="muted" padding={2}>
                <Text type="body" size="sm">{step}</Text>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Card>
    </VStack>
  );
}
