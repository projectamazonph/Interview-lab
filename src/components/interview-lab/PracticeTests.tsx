'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Assessment, ROLES } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Skeleton } from '@astryxdesign/core/Skeleton';

type BadgeVariant = 'success' | 'warning' | 'error';

type ScoreResult = {
  score?: number;
  correctDecisions?: string[];
  incorrectDecisions?: string[];
  missedOpportunities?: string[];
  modelAnswer?: string;
  recommendedNextStep?: string;
};

const DEFAULT_RUBRIC: [string, string][] = [
  ['Correct metric interpretation', '25'],
  ['Correct action recommendation', '25'],
  ['Data sufficiency judgment', '15'],
  ['Risk awareness', '15'],
  ['Clear explanation', '10'],
  ['Documentation quality', '10'],
];

export function PracticeTests() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [userAnswers, setUserAnswers] = useState('');
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    const params = filterRole !== 'all' ? `?role=${filterRole}` : '';
    fetch(`/api/assessments${params}`)
      .then(res => res.json())
      .then(data => { setAssessments(data.assessments || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterRole]);

  const handleSubmit = async () => {
    if (!selectedAssessment || !userAnswers.trim() || !user) return;

    setScoring(true);
    try {
      const res = await fetch('/api/ai/assessment-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentTitle: selectedAssessment.title,
          assessmentData: selectedAssessment.datasetInfo ? (() => { try { return JSON.parse(selectedAssessment.datasetInfo); } catch { return null; } })() : null,
          userAnswers,
        }),
      });
      const data = await res.json();
      setScore(data);

      await fetch(`/api/assessments/${selectedAssessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });
    } catch (error) {
      console.error('Assessment scoring error:', error);
    } finally {
      setScoring(false);
    }
  };

  const getDifficultyVariant = (d: string): BadgeVariant => {
    if (d === 'beginner') return 'success';
    if (d === 'intermediate') return 'warning';
    return 'error';
  };

  // Assessment Detail View
  if (selectedAssessment) {
    const dataset = (() => { try { return selectedAssessment.datasetInfo ? JSON.parse(selectedAssessment.datasetInfo) : null; } catch { return null; } })();

    let rubricEntries: [string, string][] = DEFAULT_RUBRIC;
    try {
      const rubricData = selectedAssessment.rubric ? JSON.parse(selectedAssessment.rubric) : null;
      if (rubricData && typeof rubricData === 'object') {
        rubricEntries = Object.entries(rubricData).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          String(value),
        ]);
      }
    } catch {
      // Malformed rubric JSON — fall back to the default rubric above.
    }

    return (
      <VStack gap={6}>
        <Button label="Back to Assessments" variant="secondary" onClick={() => { setSelectedAssessment(null); setScore(null); setUserAnswers(''); }} />

        <Card>
          <VStack gap={4}>
            <VStack gap={2}>
              <HStack gap={2} wrap="wrap">
                <Badge label={selectedAssessment.difficulty} variant={getDifficultyVariant(selectedAssessment.difficulty)} />
                <Badge label={selectedAssessment.role} variant="neutral" />
              </HStack>
              <Heading level={3}>{selectedAssessment.title}</Heading>
              <Text type="supporting" size="sm">{selectedAssessment.description}</Text>
            </VStack>

            {dataset && (
              <Card variant="muted">
                <VStack gap={2}>
                  <Text type="body" size="sm" weight="medium">Assessment Data:</Text>
                  <div style={{ overflowX: 'auto' }}>
                    <Text type="code" size="xsm">{JSON.stringify(dataset, null, 2)}</Text>
                  </div>
                </VStack>
              </Card>
            )}

            {!score ? (
              <VStack gap={4}>
                <TextArea
                  label="Your Analysis / Answers"
                  placeholder="Provide your analysis and answers based on the assessment data above..."
                  value={userAnswers}
                  onChange={setUserAnswers}
                  rows={8}
                />
                <Button
                  label={scoring ? 'Scoring...' : 'Submit for AI Scoring'}
                  variant="primary"
                  width="100%"
                  isLoading={scoring}
                  isDisabled={!userAnswers.trim()}
                  onClick={handleSubmit}
                />
              </VStack>
            ) : (
              <VStack gap={4}>
                <Card variant="orange">
                  <VStack gap={3}>
                    <HStack hAlign="center">
                      <Image
                        src="/images/illustrations/ai-feedback-score.svg"
                        alt="AI-powered scoring and feedback for your practice test"
                        width={300}
                        height={120}
                        style={{ width: '100%', maxWidth: 208, height: 'auto' }}
                      />
                    </HStack>
                    <VStack gap={0} hAlign="center">
                      <Text type="display-2" color="accent">{`${score.score ?? 0}/100`}</Text>
                      <Text type="supporting">Assessment Score</Text>
                    </VStack>
                    {Boolean(score.correctDecisions?.length) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold" color="accent">Correct Decisions:</Text>
                        {score.correctDecisions!.map((d, i) => <Text key={i} type="body" size="sm">{`✓ ${d}`}</Text>)}
                      </VStack>
                    )}
                    {Boolean(score.incorrectDecisions?.length) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold">Incorrect or Risky Decisions:</Text>
                        {score.incorrectDecisions!.map((d, i) => <Text key={i} type="body" size="sm">{`✗ ${d}`}</Text>)}
                      </VStack>
                    )}
                    {Boolean(score.missedOpportunities?.length) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold">Missed Opportunities:</Text>
                        {score.missedOpportunities!.map((o, i) => <Text key={i} type="body" size="sm">{`! ${o}`}</Text>)}
                      </VStack>
                    )}
                    {Boolean(score.modelAnswer) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold" color="accent">Model Answer:</Text>
                        <Text type="body" size="sm">{score.modelAnswer}</Text>
                      </VStack>
                    )}
                    {Boolean(score.recommendedNextStep) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold">Recommended Next Step:</Text>
                        <Text type="body" size="sm">{score.recommendedNextStep}</Text>
                      </VStack>
                    )}
                  </VStack>
                </Card>
                <Button label="Try Again" variant="secondary" width="100%" onClick={() => { setScore(null); setUserAnswers(''); }} />
              </VStack>
            )}
          </VStack>
        </Card>

        <Card>
          <VStack gap={4}>
            <Heading level={4}>Scoring Rubric</Heading>
            <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={2}>
              {rubricEntries.map(([label, weight]) => (
                <Card key={label} variant="muted" padding={2}>
                  <HStack hAlign="between">
                    <Text type="body" size="sm" maxLines={1}>{label}</Text>
                    <Text type="body" size="sm" weight="medium">{`${weight}%`}</Text>
                  </HStack>
                </Card>
              ))}
            </Grid>
          </VStack>
        </Card>
      </VStack>
    );
  }

  // Assessment List View
  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={2}>Practice Tests</Heading>
        <Text type="supporting">Test your Amazon VA skills with practical exercises across all roles</Text>
      </VStack>

      <HStack hAlign="center">
        <Image
          src="/images/illustrations/practice-test-analysis.svg"
          alt="Practice tests and assessments for Amazon VA skills"
          width={500}
          height={180}
          style={{ width: '100%', maxWidth: 512, height: 'auto' }}
        />
      </HStack>

      <Selector
        label="Filter by role"
        placeholder="Filter by role"
        value={filterRole}
        onChange={setFilterRole}
        options={[{ value: 'all', label: 'All Roles' }, ...ROLES.filter((r) => r !== 'General').map((r) => ({ value: r, label: r }))]}
      />

      {loading ? (
        <Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={4}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={128} index={i} />)}
        </Grid>
      ) : (
        <Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={4}>
          {assessments.map(a => (
            <ClickableCard key={a.id} label={`Start test: ${a.title}`} onClick={() => setSelectedAssessment(a)}>
              <VStack gap={3}>
                <VStack gap={1}>
                  <HStack gap={2} wrap="wrap">
                    <Badge label={a.difficulty} variant={getDifficultyVariant(a.difficulty)} />
                    <Badge label={a.role} variant="neutral" />
                  </HStack>
                  <Text type="body" weight="semibold" maxLines={1}>{a.title}</Text>
                  <Text type="supporting" size="sm" maxLines={2}>{a.description}</Text>
                </VStack>
                <Button label="Start Test" variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAssessment(a); }} />
              </VStack>
            </ClickableCard>
          ))}
        </Grid>
      )}
    </VStack>
  );
}
