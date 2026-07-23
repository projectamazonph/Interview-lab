'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Question, InterviewSession, ROLES, INTERVIEW_MODES, ActiveView } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextArea } from '@astryxdesign/core/TextArea';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { List, ListItem } from '@astryxdesign/core/List';
import { Icon } from '@astryxdesign/core/Icon';
import { Clock, CheckCircle } from '@phosphor-icons/react';

interface QuestionWithMeta extends Question {
  isFollowUp?: boolean;
  originalQuestionId?: string;
}

type FeedbackData = {
  score?: number;
  whatWorked?: string;
  whatToImprove?: string;
  strongerSampleAnswer?: string;
  followUpQuestion?: string;
};

export function MockInterview({ onViewChange }: { onViewChange?: (view: ActiveView) => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<QuestionWithMeta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [followUpScores, setFollowUpScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [transcript, setTranscript] = useState<Array<{ q: string; a: string; score: number; feedback: string }>>([]);
  const [answeringFollowUp, setAnsweringFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpFeedback, setFollowUpFeedback] = useState<FeedbackData | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session || completed) return;
    const interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [session, completed]);

  useEffect(() => {
    if (user) {
      fetch('/api/interview')
        .then(res => res.json())
        .then(data => setSessions(data.sessions || []))
        .catch(console.error);
    }
  }, [user]);

  const startInterview = async () => {
    if (!mode || !user) return;

    setLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, targetRole: targetRole || undefined }),
      });
      const data = await res.json();
      setSession(data.session);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setScores([]);
      setCompleted(false);
      setFeedback(null);
      setTranscript([]);
      setFollowUpScores([]);
      setAnsweringFollowUp(false);
      setFollowUpQuestion(null);
      setElapsedSeconds(0);
    } catch (error) {
      console.error('Failed to start interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !questions[currentIndex] || !session || !user) return;
    setSubmitting(true);
    try {
      // The score/feedback here are computed and persisted server-side in
      // one step — the client never gets to supply its own score.
      const attemptRes = await fetch(`/api/interview/${session.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: questions[currentIndex].id,
          userAnswer,
        }),
      });
      const coachData = await attemptRes.json();
      setFeedback(coachData);
      const score = coachData.score || 5;
      setScores(prev => [...prev, score]);

      setTranscript(prev => [...prev, {
        q: questions[currentIndex].question,
        a: userAnswer,
        score,
        feedback: coachData,
      }]);

      if (coachData.followUpQuestion && score < 7) {
        setFollowUpQuestion(coachData.followUpQuestion as string);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const submitFollowUpAnswer = async () => {
    if (!followUpAnswer.trim() || !followUpQuestion || !session || !user) return;
    setSubmitting(true);
    try {
      const coachRes = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: followUpQuestion,
          userAnswer: followUpAnswer,
          questionContext: `Follow-up question. Original context: Role: ${questions[currentIndex]?.role}, Type: ${questions[currentIndex]?.type}`,
        }),
      });
      const coachData = await coachRes.json();
      setFollowUpFeedback(coachData);
      const score = coachData.score || 5;
      setFollowUpScores(prev => [...prev, score]);

      setTranscript(prev => [...prev, {
        q: followUpQuestion,
        a: followUpAnswer,
        score,
        feedback: coachData,
      }]);
    } catch (error) {
      console.error('Failed to submit follow-up:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
      setAnsweringFollowUp(false);
      setFollowUpQuestion(null);
      setFollowUpAnswer('');
      setFollowUpFeedback(null);
    } else {
      finishInterview();
    }
  };

  const handleSkipFollowUp = () => {
    setAnsweringFollowUp(false);
    setFollowUpQuestion(null);
    setFollowUpAnswer('');
    setFollowUpFeedback(null);
  };

  const finishInterview = async () => {
    if (!session || !user) return;
    try {
      await fetch(`/api/interview/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      setCompleted(true);
    } catch (error) {
      console.error('Failed to complete interview:', error);
    }
  };

  const getRecommendations = () => {
    if (transcript.length === 0) return [];
    const weakAreas: string[] = [];
    const mainScores = scores.length > 0 ? scores : [];
    const avgScore = mainScores.length > 0 ? mainScores.reduce((a, b) => a + b, 0) / mainScores.length : 0;

    if (avgScore < 5) {
      weakAreas.push('Focus on fundamentals: Review Amazon VA basics, PPC terms, and Seller Central navigation');
      weakAreas.push('Practice STAR method for behavioral questions before your next interview');
    }
    if (avgScore >= 5 && avgScore < 7) {
      weakAreas.push('Add more specificity to your answers: Include metrics, tool names, and process details');
      weakAreas.push('Study campaign naming conventions and search term report analysis');
    }
    if (avgScore >= 7 && avgScore < 9) {
      weakAreas.push('Refine your answers with ACoS/ROAS calculations and real-world context');
      weakAreas.push('Practice explaining optimization decisions to clients');
    }
    if (avgScore >= 9) {
      weakAreas.push('Excellent performance! Focus on maintaining confidence and clarity in real interviews');
      weakAreas.push('Consider practicing with harder scenario questions');
    }

    const lowScores = transcript.filter(t => t.score < 6);
    if (lowScores.length > 0) {
      weakAreas.push(`Review ${lowScores.length} question(s) where you scored below 6/10`);
    }

    return weakAreas;
  };

  // Interview Setup Screen
  if (!session) {
    return (
      <VStack gap={6}>
        <VStack gap={1}>
          <Heading level={2}>Mock Interview</Heading>
          <Text type="supporting">Practice with AI-powered interview coaching</Text>
        </VStack>

        <HStack hAlign="center">
          <Image
            src="/images/illustrations/mock-interview-setup.svg"
            alt="Set up your mock interview with AI-powered coaching"
            width={500}
            height={200}
            style={{ width: '100%', maxWidth: 400, height: 'auto' }}
          />
        </HStack>

        <Card maxWidth={512}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={4}>Start Interview</Heading>
              <Text type="supporting" size="sm">Choose your interview mode and target role</Text>
            </VStack>
            <VStack gap={2}>
              <Text type="body" size="sm" weight="medium">Interview Mode</Text>
              <VStack gap={2}>
                {INTERVIEW_MODES.map(m => (
                  <SelectableCard key={m.value} label={m.label} isSelected={mode === m.value} onChange={() => setMode(m.value)}>
                    <VStack gap={0.5}>
                      <Text type="body" size="sm" weight="medium">{m.label}</Text>
                      <Text type="supporting" size="sm">{m.desc}</Text>
                    </VStack>
                  </SelectableCard>
                ))}
              </VStack>
            </VStack>
            <Selector
              label="Target Role"
              placeholder="Select role (optional)"
              value={targetRole || null}
              onChange={(v) => setTargetRole(v || '')}
              hasClear
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />
            <Button
              label={loading ? 'Starting...' : 'Start Interview'}
              variant="primary"
              width="100%"
              isLoading={loading}
              isDisabled={!mode}
              onClick={startInterview}
            />
          </VStack>
        </Card>

        {sessions.length > 0 && (
          <Card padding={0}>
            <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">Previous Sessions</Text></VStack>} hasDividers>
              {sessions.map(s => (
                <ListItem
                  key={s.id}
                  label={s.mode.replace(/_/g, ' ')}
                  description={new Date(s.startedAt).toLocaleDateString()}
                  endContent={
                    <HStack gap={2} vAlign="center">
                      {s.overallScore !== null && s.overallScore !== undefined && (
                        <Badge label={`${s.overallScore.toFixed(1)}/10`} variant={s.overallScore >= 7 ? 'orange' : 'neutral'} />
                      )}
                      <Badge label={s.completedAt ? 'Completed' : 'In Progress'} variant="neutral" />
                    </HStack>
                  }
                />
              ))}
            </List>
          </Card>
        )}
      </VStack>
    );
  }

  // Interview Complete Screen
  if (completed) {
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const recommendations = getRecommendations();

    return (
      <HStack hAlign="center">
      <VStack gap={6} maxWidth={640} width="100%">
        <Card>
          <VStack gap={5}>
            <VStack gap={3} hAlign="center">
              <Image
                src="/images/illustrations/interview-complete-celebration.svg"
                alt="Congratulations on completing your mock interview"
                width={300}
                height={150}
                style={{ width: '100%', maxWidth: 240, height: 'auto' }}
              />
              <Card variant="orange" width={64} height={64} padding={0}>
                <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                  <Icon icon={CheckCircle} size="lg" color="accent" />
                </VStack>
              </Card>
              <Heading level={2} justify="center">Interview Complete!</Heading>
              <Text type="supporting" justify="center">You answered {transcript.length} questions (including follow-ups)</Text>
            </VStack>

            <VStack gap={4}>
              <VStack gap={0} hAlign="center">
                <Text type="display-2" color="accent">{avgScore.toFixed(1)}/10</Text>
                <Text type="supporting">Average Score</Text>
              </VStack>
              <VStack gap={2}>
                {scores.map((score, i) => (
                  <HStack key={`main-${i}`} gap={3} vAlign="center">
                    <Text type="supporting" size="sm">{`Q${i + 1}`}</Text>
                    <ProgressBar label={`Question ${i + 1} score`} isLabelHidden value={score * 10} />
                    <Text type="body" size="sm" weight="medium">{`${score}/10`}</Text>
                  </HStack>
                ))}
              </VStack>
              {followUpScores.length > 0 && (
                <VStack gap={2}>
                  <Text type="body" size="sm" weight="medium" color="accent">Follow-up Scores (supplementary, not included in average)</Text>
                  {followUpScores.map((score, i) => (
                    <HStack key={`followup-${i}`} gap={3} vAlign="center">
                      <Text type="supporting" size="sm">{`F${i + 1}`}</Text>
                      <ProgressBar label={`Follow-up ${i + 1} score`} isLabelHidden value={score * 10} />
                      <Text type="body" size="sm" weight="medium">{`${score}/10`}</Text>
                    </HStack>
                  ))}
                </VStack>
              )}
              <Button
                label="Start New Interview"
                variant="primary"
                width="100%"
                onClick={() => { setSession(null); setQuestions([]); setCurrentIndex(0); setScores([]); setCompleted(false); setTranscript([]); }}
              />
            </VStack>
          </VStack>
        </Card>

        <Card>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={4}>Recommended Practice Plan</Heading>
              <Text type="supporting" size="sm">Based on your performance in this session</Text>
            </VStack>
            <VStack gap={2}>
              {recommendations.map((rec, i) => (
                <Card key={i} variant="muted">
                  <HStack gap={3}>
                    <Text type="body" weight="bold" color="accent">{`${i + 1}.`}</Text>
                    <Text type="body" size="sm">{rec}</Text>
                  </HStack>
                </Card>
              ))}
            </VStack>
            <VStack gap={2}>
              <Text type="body" size="sm" weight="medium">Quick Actions</Text>
              <HStack gap={2} wrap="wrap">
                {avgScore < 7 && (
                  <Button label="Try Quick Drill" variant="secondary" size="sm" onClick={() => { setSession(null); setMode('quick_drill'); }} />
                )}
                <Button label="Review Question Bank" variant="secondary" size="sm" onClick={() => { setSession(null); setMode(''); if (onViewChange) onViewChange('questions'); }} />
                <Button label="Practice More" variant="secondary" size="sm" onClick={() => { setSession(null); setMode('role_interview'); }} />
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </VStack>
      </HStack>
    );
  }

  // Active Interview Screen
  const currentQ = questions[currentIndex];
  const avgSoFar = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

  return (
    <HStack hAlign="center">
    <VStack gap={6} maxWidth={768} width="100%">
      <VStack gap={3}>
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
          <VStack gap={0}>
            <Text type="supporting" size="sm">{`Question ${currentIndex + 1} of ${questions.length}`}</Text>
            <Text type="supporting" size="sm">{session.mode.replace(/_/g, ' ')}</Text>
          </VStack>
          <HStack gap={2} wrap="wrap" vAlign="center">
            <Badge
              label={`${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`}
              variant="neutral"
              icon={<Clock weight="light" />}
            />
            <Badge label={avgSoFar ? `Avg: ${avgSoFar}` : 'No scores yet'} variant="neutral" />
            {followUpScores.length > 0 && <Badge label={`${followUpScores.length} follow-up(s)`} variant="purple" />}
          </HStack>
        </HStack>
        <ProgressBar label="Interview progress" isLabelHidden value={((currentIndex + 1) / questions.length) * 100} />
      </VStack>

      <Card>
        <VStack gap={4}>
          <VStack gap={2}>
            <HStack gap={2} wrap="wrap">
              <Badge label={currentQ.difficulty} variant="neutral" />
              <Badge label={currentQ.type.replace(/_/g, ' ')} variant="neutral" />
              <Badge label={currentQ.role} variant="neutral" />
            </HStack>
            <Text type="large">{currentQ.question}</Text>
            {currentQ.whyEmployersAsk && (
              <Text type="supporting" size="sm">
                <Text as="span" type="inherit" weight="semibold">Why employers ask: </Text>
                {currentQ.whyEmployersAsk}
              </Text>
            )}
          </VStack>

          {!feedback ? (
            <VStack gap={4}>
              <TextArea
                label="Your answer"
                isLabelHidden
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={setUserAnswer}
                rows={6}
                hasAutoFocus
              />
              <Button
                label={submitting ? 'Getting AI Feedback...' : 'Submit Answer'}
                variant="primary"
                width="100%"
                isLoading={submitting}
                isDisabled={!userAnswer.trim()}
                onClick={submitAnswer}
              />
            </VStack>
          ) : (
            <VStack gap={4}>
              <Card variant="muted">
                <VStack gap={1}>
                  <Text type="supporting" size="sm">Your answer:</Text>
                  <Text type="body" size="sm">{userAnswer}</Text>
                </VStack>
              </Card>

              <Card variant="orange">
                <VStack gap={3}>
                  <HStack gap={2} vAlign="center">
                    <Text type="display-3" color="accent">{`${feedback.score ?? 0}/10`}</Text>
                    <Text type="supporting" size="sm">Score</Text>
                  </HStack>
                  {Boolean(feedback.whatWorked) && (
                    <VStack gap={0.5}>
                      <Text type="body" size="sm" weight="semibold" color="accent">What worked:</Text>
                      <Text type="body" size="sm">{feedback.whatWorked}</Text>
                    </VStack>
                  )}
                  {Boolean(feedback.whatToImprove) && (
                    <VStack gap={0.5}>
                      <Text type="body" size="sm" weight="semibold">What to improve:</Text>
                      <Text type="body" size="sm">{feedback.whatToImprove}</Text>
                    </VStack>
                  )}
                  {Boolean(feedback.strongerSampleAnswer) && (
                    <VStack gap={0.5}>
                      <Text type="body" size="sm" weight="semibold" color="accent">Stronger sample answer:</Text>
                      <Text type="body" size="sm">{feedback.strongerSampleAnswer}</Text>
                    </VStack>
                  )}
                </VStack>
              </Card>

              {followUpQuestion && !followUpFeedback && !answeringFollowUp && (
                <Card variant="purple">
                  <VStack gap={3}>
                    <VStack gap={0.5}>
                      <Text type="body" size="sm" weight="semibold">Follow-up Question:</Text>
                      <Text type="body" size="sm">{followUpQuestion}</Text>
                    </VStack>
                    <Text type="supporting" size="xsm">Your score was below 7. Practicing this follow-up can help you improve.</Text>
                    <HStack gap={3} wrap="wrap">
                      <Button label="Practice Follow-up" variant="primary" onClick={() => setAnsweringFollowUp(true)} />
                      <Button label="Skip" variant="secondary" onClick={handleSkipFollowUp} />
                    </HStack>
                  </VStack>
                </Card>
              )}

              {answeringFollowUp && !followUpFeedback && (
                <Card variant="purple">
                  <VStack gap={3}>
                    <Text type="body" size="sm" weight="semibold">Answer the follow-up:</Text>
                    <Text type="body" size="sm">{followUpQuestion}</Text>
                    <TextArea
                      label="Follow-up answer"
                      isLabelHidden
                      placeholder="Type your answer to the follow-up..."
                      value={followUpAnswer}
                      onChange={setFollowUpAnswer}
                      rows={4}
                      hasAutoFocus
                    />
                    <HStack gap={3}>
                      <Button
                        label={submitting ? 'Getting Feedback...' : 'Submit Follow-up'}
                        variant="primary"
                        isLoading={submitting}
                        isDisabled={!followUpAnswer.trim()}
                        onClick={submitFollowUpAnswer}
                      />
                      <Button label="Skip" variant="secondary" onClick={handleSkipFollowUp} />
                    </HStack>
                  </VStack>
                </Card>
              )}

              {followUpFeedback && (
                <Card variant="purple">
                  <VStack gap={2}>
                    <HStack gap={2} vAlign="center">
                      <Text type="display-3" color="accent">{`${followUpFeedback.score ?? 0}/10`}</Text>
                      <Text type="supporting" size="sm">Follow-up Score</Text>
                    </HStack>
                    {Boolean(followUpFeedback.whatWorked) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold" color="accent">What worked:</Text>
                        <Text type="body" size="sm">{followUpFeedback.whatWorked}</Text>
                      </VStack>
                    )}
                    {Boolean(followUpFeedback.whatToImprove) && (
                      <VStack gap={0.5}>
                        <Text type="body" size="sm" weight="semibold">What to improve:</Text>
                        <Text type="body" size="sm">{followUpFeedback.whatToImprove}</Text>
                      </VStack>
                    )}
                  </VStack>
                </Card>
              )}

              <Button
                label={currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                variant="primary"
                width="100%"
                onClick={nextQuestion}
              />
            </VStack>
          )}
        </VStack>
      </Card>
    </VStack>
    </HStack>
  );
}
