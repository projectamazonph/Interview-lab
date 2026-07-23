'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Resume, ROLES } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Banner } from '@astryxdesign/core/Banner';
import { List, ListItem } from '@astryxdesign/core/List';
import { FileArrowDown, FileText, Clock as ClockIcon, ArrowsLeftRight } from '@phosphor-icons/react';

type ResumeFeedback = {
  score?: number;
  missingKeywords?: string[];
  weakSections?: string[];
  improvedSummary?: string;
  improvedBullets?: string[];
  skillsRecommendations?: string[];
  truthWarnings?: string[];
  improvedVersion?: string;
};

const RUBRIC = [
  { label: 'Amazon relevance', weight: '25%' },
  { label: 'Role-specific keywords', weight: '20%' },
  { label: 'Proof of skills', weight: '20%' },
  { label: 'Clarity & formatting', weight: '15%' },
  { label: 'Metrics & specificity', weight: '10%' },
  { label: 'Truthfulness', weight: '10%' },
];

export function ResumeLab() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/resume')
        .then(res => res.json())
        .then(data => setResumes(data.resumes || []))
        .catch(console.error);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!resumeText.trim() || !user) return;

    setLoading(true);
    setFeedback(null);
    setError('');
    try {
      const createRes = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText: resumeText, targetRole }),
      });
      if (!createRes.ok) {
        setError('Failed to create resume record. Please try again.');
        return;
      }
      const resume = await createRes.json();

      const reviewRes = await fetch('/api/ai/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      if (!reviewRes.ok) {
        setError('Failed to get AI review. Please try again.');
        return;
      }
      const reviewData = await reviewRes.json();
      setFeedback(reviewData);

      const updateRes = await fetch(`/api/resume/${resume.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: reviewData.score,
          improvedVersion: reviewData.improvedVersion,
          truthFlags: reviewData.truthWarnings,
        }),
      });
      if (!updateRes.ok) {
        setError('AI review completed, but failed to save review data. Your feedback is still shown below.');
      }

      const histRes = await fetch('/api/resume');
      const histData = await histRes.json();
      setResumes(histData.resumes || []);
    } catch (error) {
      console.error('Resume review error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!feedback?.improvedVersion || !user) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: format,
          content: feedback.improvedVersion,
          title: `${targetRole || 'Amazon VA'} Resume - Improved`,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-improved.${format}`;
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
          <Heading level={2}>Resume Lab</Heading>
          <Text type="supporting">Get AI-powered resume review and improvement suggestions</Text>
        </VStack>
        <Button
          label={`${showHistory ? 'Hide History' : 'History'} (${resumes.length})`}
          variant="secondary"
          icon={<ClockIcon weight="light" />}
          onClick={() => setShowHistory(!showHistory)}
        />
      </HStack>

      {error && (
        <Banner status="error" title={error} />
      )}

      {showHistory && resumes.length > 0 && (
        <Card padding={0}>
          <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">Previous Reviews</Text></VStack>} hasDividers>
            {resumes.map((r) => (
              <ListItem
                key={r.id}
                label={`${r.targetRole || 'General'} Resume`}
                description={new Date(r.createdAt).toLocaleDateString()}
                endContent={
                  <HStack gap={2} vAlign="center">
                    {r.score !== null && r.score !== undefined && <Badge label={`${r.score}/100`} variant="orange" />}
                    <Button
                      label="Load"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (r.originalText) setResumeText(r.originalText);
                        if (r.improvedVersion) {
                          let parsedWarnings: string[] = [];
                          try {
                            parsedWarnings = r.truthFlags ? JSON.parse(r.truthFlags) : [];
                            if (!Array.isArray(parsedWarnings)) parsedWarnings = [];
                          } catch { parsedWarnings = []; }
                          setFeedback({ improvedVersion: r.improvedVersion, score: r.score ?? undefined, truthWarnings: parsedWarnings });
                        }
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
              <Heading level={4}>Submit Your Resume</Heading>
              <Text type="supporting" size="sm">Paste your resume text for AI review</Text>
            </VStack>
            <Selector
              label="Target Role"
              placeholder="Select target role"
              value={targetRole || null}
              onChange={(v) => setTargetRole(v || '')}
              hasClear
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />
            <TextArea
              label="Resume Text"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={setResumeText}
              rows={12}
            />
            <Button
              label={loading ? 'Analyzing Resume...' : 'Get AI Review'}
              variant="primary"
              width="100%"
              isLoading={loading}
              isDisabled={!resumeText.trim()}
              onClick={handleSubmit}
            />
          </VStack>
        </Card>

        <VStack gap={4}>
          {feedback ? (
            <>
              <Card>
                <VStack gap={3}>
                  <VStack gap={0} hAlign="center">
                    <Text type="display-2" color="accent">{`${feedback.score ?? 0}/100`}</Text>
                    <Text type="supporting">Resume Score</Text>
                  </VStack>
                  <ProgressBar label="Resume score" isLabelHidden value={feedback.score ?? 0} />
                </VStack>
              </Card>

              {feedback.missingKeywords && feedback.missingKeywords.length > 0 && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Missing Keywords</Text>
                    <HStack gap={2} wrap="wrap">
                      {feedback.missingKeywords.map((kw, i) => <Badge key={i} label={kw} variant="error" />)}
                    </HStack>
                  </VStack>
                </Card>
              )}

              {feedback.weakSections && feedback.weakSections.length > 0 && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Weak Sections</Text>
                    <HStack gap={2} wrap="wrap">
                      {feedback.weakSections.map((s, i) => <Badge key={i} label={s} variant="warning" />)}
                    </HStack>
                  </VStack>
                </Card>
              )}

              {feedback.improvedSummary && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Improved Professional Summary</Text>
                    <Text type="body" size="sm">{feedback.improvedSummary}</Text>
                  </VStack>
                </Card>
              )}

              {feedback.improvedBullets && feedback.improvedBullets.length > 0 && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Improved Bullet Points</Text>
                    <VStack gap={1.5}>
                      {feedback.improvedBullets.map((b, i) => (
                        <HStack key={i} gap={2}>
                          <Text type="body" size="sm" color="accent">•</Text>
                          <Text type="body" size="sm">{b}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}

              {feedback.skillsRecommendations && feedback.skillsRecommendations.length > 0 && (
                <Card>
                  <VStack gap={2}>
                    <Text type="body" weight="semibold" size="sm">Recommended Skills to Add</Text>
                    <HStack gap={2} wrap="wrap">
                      {feedback.skillsRecommendations.map((s, i) => <Badge key={i} label={s} variant="success" />)}
                    </HStack>
                  </VStack>
                </Card>
              )}

              {feedback.truthWarnings && feedback.truthWarnings.length > 0 && (
                <Banner
                  status="error"
                  title="Truthfulness Warnings"
                  description={
                    <VStack gap={1}>
                      {feedback.truthWarnings.map((w, i) => <Text key={i} type="inherit" size="sm">{w}</Text>)}
                    </VStack>
                  }
                />
              )}

              {feedback.improvedVersion && (
                <Card>
                  <VStack gap={3}>
                    <HStack hAlign="between" vAlign="center">
                      <Text type="body" weight="semibold" size="sm">Full Improved Resume</Text>
                      <Button
                        label={showComparison ? 'Hide' : 'Compare'}
                        variant="ghost"
                        size="sm"
                        icon={<ArrowsLeftRight weight="light" />}
                        onClick={() => setShowComparison(!showComparison)}
                      />
                    </HStack>
                    {showComparison ? (
                      <Grid columns={{ minWidth: 220, repeat: 'fit' }} gap={3}>
                        <VStack gap={1}>
                          <Text type="supporting" size="xsm" weight="medium">ORIGINAL</Text>
                          <Card variant="red">
                            <div style={{ maxHeight: 256, overflowY: 'auto' }}>
                              <Text type="body" size="xsm">{resumeText}</Text>
                            </div>
                          </Card>
                        </VStack>
                        <VStack gap={1}>
                          <Text type="supporting" size="xsm" weight="medium">IMPROVED</Text>
                          <Card variant="green">
                            <div style={{ maxHeight: 256, overflowY: 'auto' }}>
                              <Text type="body" size="xsm">{feedback.improvedVersion}</Text>
                            </div>
                          </Card>
                        </VStack>
                      </Grid>
                    ) : (
                      <Card variant="muted">
                        <div style={{ maxHeight: 256, overflowY: 'auto' }}>
                          <Text type="body" size="sm">{feedback.improvedVersion}</Text>
                        </div>
                      </Card>
                    )}
                  </VStack>
                </Card>
              )}

              {feedback.improvedVersion && (
                <Card>
                  <VStack gap={3}>
                    <Text type="body" weight="medium" size="sm">Export Improved Resume</Text>
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
                  src="/images/illustrations/resume-transformation.svg"
                  alt="See how your resume transforms with AI-powered review"
                  width={300}
                  height={200}
                  style={{ width: '100%', maxWidth: 288, height: 'auto' }}
                />
                <Text type="supporting" justify="center">Submit your resume to get AI-powered feedback</Text>
              </VStack>
            </Card>
          )}
        </VStack>
      </Grid>

      <Card>
        <VStack gap={4}>
          <Heading level={4}>Resume Scoring Rubric</Heading>
          <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={2}>
            {RUBRIC.map((item) => (
              <Card key={item.label} variant="muted" padding={2}>
                <HStack hAlign="between">
                  <Text type="body" size="sm" maxLines={1}>{item.label}</Text>
                  <Text type="body" size="sm" weight="medium">{item.weight}</Text>
                </HStack>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Card>
    </VStack>
  );
}
