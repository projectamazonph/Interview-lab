'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Question, ROLES, DIFFICULTIES, QUESTION_TYPES, SKILL_AREAS } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Selector } from '@astryxdesign/core/Selector';
import { List, ListItem } from '@astryxdesign/core/List';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { lightIcon } from '@/lib/astryx-icon';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'orange' | 'purple' | 'neutral';

export function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: 'all', difficulty: 'all', type: 'all', skillArea: 'all', search: '' });
  const [practiceQuestion, setPracticeQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.role !== 'all') params.set('role', filters.role);
    if (filters.difficulty !== 'all') params.set('difficulty', filters.difficulty);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.skillArea !== 'all') params.set('skillArea', filters.skillArea);
    if (filters.search) params.set('search', filters.search);

    try {
      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handlePractice = async () => {
    if (!practiceQuestion || !userAnswer.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: practiceQuestion.question,
          userAnswer,
          questionContext: `Role: ${practiceQuestion.role}, Type: ${practiceQuestion.type}, Skill: ${practiceQuestion.skillArea}`,
        }),
      });
      const data = await res.json();
      setFeedback(data);
    } catch (error) {
      console.error('Failed to get feedback:', error);
      setFeedback({ score: 5, whatWorked: 'Error getting feedback', whatToImprove: 'Please try again', strongerSampleAnswer: '', followUpQuestion: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyVariant = (d: string): BadgeVariant => {
    if (d === 'beginner') return 'success';
    if (d === 'intermediate') return 'warning';
    return 'error';
  };

  const getTypeVariant = (t: string): BadgeVariant => {
    if (t === 'behavioral' || t === 'scenario') return 'orange';
    if (t === 'technical') return 'purple';
    if (t === 'trick') return 'error';
    return 'neutral';
  };

  const hasActiveFilters = filters.role !== 'all' || filters.difficulty !== 'all' || filters.type !== 'all' || filters.skillArea !== 'all' || !!filters.search;

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={2}>Question Bank</Heading>
        <Text type="supporting">{total} questions available</Text>
      </VStack>

      <HStack hAlign="center">
        <Image
          src="/images/illustrations/question-bank-library.svg"
          alt="Browse hundreds of Amazon VA interview questions organized by role and skill"
          width={500}
          height={180}
          style={{ width: '100%', maxWidth: 512, height: 'auto' }}
        />
      </HStack>

      <Card variant="muted">
        <VStack gap={3}>
          <Grid columns={{ minWidth: 180, repeat: 'fit' }} gap={3}>
            <Selector
              label="Role"
              value={filters.role}
              onChange={(v) => setFilters((f) => ({ ...f, role: v }))}
              options={[{ value: 'all', label: 'All Roles' }, ...ROLES.map((r) => ({ value: r, label: r }))]}
            />
            <Selector
              label="Difficulty"
              value={filters.difficulty}
              onChange={(v) => setFilters((f) => ({ ...f, difficulty: v }))}
              options={[{ value: 'all', label: 'All Levels' }, ...DIFFICULTIES.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))]}
            />
            <Selector
              label="Type"
              value={filters.type}
              onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
              options={[{ value: 'all', label: 'All Types' }, ...QUESTION_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))]}
            />
            <Selector
              label="Skill Area"
              value={filters.skillArea}
              onChange={(v) => setFilters((f) => ({ ...f, skillArea: v }))}
              options={[{ value: 'all', label: 'All Skills' }, ...SKILL_AREAS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]}
            />
            <TextInput
              label="Search questions"
              isLabelHidden
              placeholder="Search questions by keyword..."
              startIcon={lightIcon(MagnifyingGlass)}
              value={filters.search}
              onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
            />
          </Grid>
          {hasActiveFilters && (
            <Button
              label="Clear all filters"
              variant="ghost"
              size="sm"
              icon={<X weight="light" />}
              onClick={() => setFilters({ role: 'all', difficulty: 'all', type: 'all', skillArea: 'all', search: '' })}
            />
          )}
        </VStack>
      </Card>

      {loading ? (
        <VStack gap={3}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={80} index={i} />)}
        </VStack>
      ) : questions.length === 0 ? (
        <Card>
          <Text type="supporting" justify="center">No questions match your filters. Try adjusting your search criteria.</Text>
        </Card>
      ) : (
        <Card padding={0}>
          <List hasDividers>
            {questions.map((q) => (
              <ListItem
                key={q.id}
                label={q.question}
                onClick={() => { setPracticeQuestion(q); setUserAnswer(''); setFeedback(null); }}
                description={
                  <HStack gap={1.5} wrap="wrap">
                    <Badge label={q.difficulty} variant={getDifficultyVariant(q.difficulty)} />
                    <Badge label={q.type.replace(/_/g, ' ')} variant={getTypeVariant(q.type)} />
                    <Badge label={q.role} variant="neutral" />
                    <Badge label={q.skillArea.replace(/_/g, ' ')} variant="neutral" />
                  </HStack>
                }
                endContent={<Button label="Practice" variant="secondary" size="sm" />}
              />
            ))}
          </List>
        </Card>
      )}

      <Dialog
        isOpen={!!practiceQuestion}
        onOpenChange={(open) => { if (!open) setPracticeQuestion(null); }}
        purpose="form"
        width={640}
        maxHeight="90vh"
      >
        {practiceQuestion && (
          <Layout
            header={<DialogHeader title="Practice Question" onOpenChange={() => setPracticeQuestion(null)} />}
            content={
              <LayoutContent isScrollable>
                <VStack gap={4}>
                  <VStack gap={2}>
                    <HStack gap={1.5} wrap="wrap">
                      <Badge label={practiceQuestion.difficulty} variant={getDifficultyVariant(practiceQuestion.difficulty)} />
                      <Badge label={practiceQuestion.type.replace(/_/g, ' ')} variant={getTypeVariant(practiceQuestion.type)} />
                      <Badge label={practiceQuestion.role} variant="neutral" />
                    </HStack>
                    <Text type="large" weight="medium">{practiceQuestion.question}</Text>
                    {practiceQuestion.whyEmployersAsk && (
                      <Text type="supporting" size="sm">
                        <Text as="span" type="inherit" weight="semibold">Why employers ask: </Text>
                        {practiceQuestion.whyEmployersAsk}
                      </Text>
                    )}
                    {practiceQuestion.strongAnswerPoints && (
                      <VStack gap={1}>
                        <Text type="body" size="sm" weight="medium">Strong answer should include:</Text>
                        <List listStyle="disc" density="compact">
                          {(JSON.parse(practiceQuestion.strongAnswerPoints || '[]') as string[]).map((point, i) => (
                            <ListItem key={i} label={point} />
                          ))}
                        </List>
                      </VStack>
                    )}
                  </VStack>

                  <TextArea
                    label="Your answer"
                    isLabelHidden
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={setUserAnswer}
                    rows={5}
                  />

                  <Button
                    label={submitting ? 'Getting AI Feedback...' : 'Submit Answer for AI Feedback'}
                    variant="primary"
                    width="100%"
                    isLoading={submitting}
                    isDisabled={!userAnswer.trim()}
                    onClick={handlePractice}
                  />

                  {feedback && (
                    <Card variant="muted">
                      <VStack gap={3}>
                        <HStack gap={2} vAlign="center">
                          <Text type="display-3" color="accent">{(feedback.score as number)}/10</Text>
                          <Text type="supporting" size="sm">Overall Score</Text>
                        </HStack>
                        {Boolean(feedback.whatWorked) && (
                          <VStack gap={0.5}>
                            <Text type="body" size="sm" weight="semibold" color="accent">What worked:</Text>
                            <Text type="body" size="sm">{feedback.whatWorked as string}</Text>
                          </VStack>
                        )}
                        {Boolean(feedback.whatToImprove) && (
                          <VStack gap={0.5}>
                            <Text type="body" size="sm" weight="semibold">What to improve:</Text>
                            <Text type="body" size="sm">{feedback.whatToImprove as string}</Text>
                          </VStack>
                        )}
                        {Boolean(feedback.strongerSampleAnswer) && (
                          <VStack gap={0.5}>
                            <Text type="body" size="sm" weight="semibold" color="accent">Stronger sample answer:</Text>
                            <Text type="body" size="sm">{feedback.strongerSampleAnswer as string}</Text>
                          </VStack>
                        )}
                        {Boolean(feedback.followUpQuestion) && (
                          <VStack gap={0.5}>
                            <Text type="body" size="sm" weight="semibold">Follow-up question:</Text>
                            <Text type="body" size="sm">{feedback.followUpQuestion as string}</Text>
                          </VStack>
                        )}
                      </VStack>
                    </Card>
                  )}

                  {practiceQuestion.sampleAnswer && !feedback && (
                    <Collapsible trigger={<Text type="supporting" size="sm">Show sample answer</Text>} defaultIsOpen={false}>
                      <Text type="body" size="sm">{practiceQuestion.sampleAnswer}</Text>
                    </Collapsible>
                  )}
                </VStack>
              </LayoutContent>
            }
          />
        )}
      </Dialog>
    </VStack>
  );
}
