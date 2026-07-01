'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Question, InterviewSession, ROLES, INTERVIEW_MODES, ActiveView } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { UpgradeModal } from '@/components/interview-lab/UpgradeModal';
import { checkInterviewAccess } from '@/lib/subscription-guard';
import { useSubscription } from '@/lib/use-subscription';

interface QuestionWithMeta extends Question {
  isFollowUp?: boolean;
  originalQuestionId?: string;
}

export function MockInterview({ onViewChange }: { onViewChange?: (view: ActiveView) => void }) {
  const { user } = useAuth();
  const { usage, currentTier } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: string; recommendedTier: string }>({ open: false, reason: '', recommendedTier: 'starter' });
  const [mode, setMode] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<QuestionWithMeta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
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
  const [followUpFeedback, setFollowUpFeedback] = useState<Record<string, unknown> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session || completed) return;
    const interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [session, completed]);

  useEffect(() => {
    if (user) {
      fetch('/api/interview', { headers: { 'x-user-id': user.id } })
        .then(res => res.json())
        .then(data => setSessions(data.sessions || []))
        .catch(console.error);
    }
  }, [user]);

  const startInterview = async () => {
    if (!mode || !user) return;

    // Check subscription limit
    const interviewsThisWeek = usage?.interviewsThisWeek ?? 0;
    const accessCheck = checkInterviewAccess(currentTier, interviewsThisWeek);
    if (!accessCheck.allowed) {
      setUpgradeModal({
        open: true,
        reason: accessCheck.reason || 'Interview limit reached',
        recommendedTier: accessCheck.upgradeTo || 'starter',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
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
      const coachRes = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(user ? { 'x-user-id': user.id } : {}) },
        body: JSON.stringify({
          question: questions[currentIndex].question,
          userAnswer,
          questionContext: `Role: ${questions[currentIndex].role}, Type: ${questions[currentIndex].type}, Skill: ${questions[currentIndex].skillArea}`,
        }),
      });
      const coachData = await coachRes.json();
      setFeedback(coachData);
      const score = coachData.score || 5;
      setScores(prev => [...prev, score]);

      // Add to transcript
      setTranscript(prev => [...prev, {
        q: questions[currentIndex].question,
        a: userAnswer,
        score,
        feedback: coachData,
      }]);

      // Save attempt
      await fetch(`/api/interview/${session.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          questionId: questions[currentIndex].id,
          userAnswer,
          aiFeedback: JSON.stringify(coachData),
          score,
          rubricBreakdown: coachData.rubricBreakdown,
        }),
      });

      // If there's a follow-up question and score < 7, offer adaptive follow-up
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
        headers: { 'Content-Type': 'application/json', ...(user ? { 'x-user-id': user.id } : {}) },
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
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ transcript }),
      });
      setCompleted(true);
    } catch (error) {
      console.error('Failed to complete interview:', error);
    }
  };

  // Generate recommended practice plan
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

    // Check for low-scoring areas
    const lowScores = transcript.filter(t => t.score < 6);
    if (lowScores.length > 0) {
      weakAreas.push(`Review ${lowScores.length} question(s) where you scored below 6/10`);
    }

    return weakAreas;
  };

  // Interview Setup Screen
  if (!session) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-heading">Mock Interview</h2>
          <p className="text-text-muted mt-1">Practice with AI-powered interview coaching</p>
        </div>

        <div className="flex justify-center mb-2">
          <Image
            src="/images/illustrations/mock-interview-setup.png"
            alt="Set up your mock interview with AI-powered coaching"
            width={500}
            height={200}
            className="w-full max-w-md h-auto"
          />
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="font-heading">Start Interview</CardTitle>
            <CardDescription>Choose your interview mode and target role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Mode</label>
              {INTERVIEW_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-violet focus:ring-offset-1 ${
                    mode === m.value ? 'border-accent-violet bg-accent-violet/8' : 'border-glass-border hover:border-glass-border-hover'
                  }`}
                  aria-pressed={mode === m.value}
                  aria-label={`Select ${m.label} mode`}
                >
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-text-muted mt-0.5 break-words">{m.desc}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger><SelectValue placeholder="Select role (optional)" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-accent-violet hover:bg-accent-indigo focus:ring-2 focus:ring-accent-violet focus:ring-offset-1"
              onClick={startInterview}
              disabled={!mode || loading}
              aria-label="Start interview with selected mode"
            >
              {loading ? 'Starting...' : 'Start Interview'}
            </Button>
          </CardContent>
        </Card>

        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Previous Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-3 bg-glass/40 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize truncate">{s.mode.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-muted">{new Date(s.startedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {s.overallScore !== null && s.overallScore !== undefined && (
                        <Badge variant={s.overallScore >= 7 ? 'default' : 'secondary'}>
                          {s.overallScore.toFixed(1)}/10
                        </Badge>
                      )}
                      <Badge variant="outline">{s.completedAt ? 'Completed' : 'In Progress'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <UpgradeModal
          open={upgradeModal.open}
          onClose={() => setUpgradeModal({ open: false, reason: '', recommendedTier: 'starter' })}
          feature="Mock Interviews"
          reason={upgradeModal.reason}
          currentTier={currentTier}
          recommendedTier={upgradeModal.recommendedTier}
        />
      </div>
    );
  }

  // Interview Complete Screen
  if (completed) {
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const recommendations = getRecommendations();

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/illustrations/interview-complete-celebration.png"
                alt="Congratulations on completing your mock interview"
                width={300}
                height={150}
                className="w-full max-w-xs h-auto"
              />
            </div>
            <div className="w-16 h-16 bg-accent-violet/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <CardTitle className="text-2xl font-heading">Interview Complete!</CardTitle>
            <CardDescription>You answered {transcript.length} questions (including follow-ups)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-accent-indigo font-mono">{avgScore.toFixed(1)}/10</p>
              <p className="text-text-muted">Average Score</p>
            </div>
            <div className="space-y-2">
              {scores.map((score, i) => (
                <div key={`main-${i}`} className="flex items-center gap-3">
                  <span className="text-sm text-text-muted w-8">Q{i + 1}</span>
                  <Progress value={score * 10} className="flex-1 min-w-0 h-2" />
                  <span className="text-sm font-medium w-12">{score}/10</span>
                </div>
              ))}
            </div>
            {followUpScores.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-purple-700 mb-2">Follow-up Scores (supplementary, not included in average)</p>
                <div className="space-y-2">
                  {followUpScores.map((score, i) => (
                    <div key={`followup-${i}`} className="flex items-center gap-3">
                      <span className="text-sm text-purple-500 w-8">F{i + 1}</span>
                      <Progress value={score * 10} className="flex-1 min-w-0 h-2" />
                      <span className="text-sm font-medium w-12">{score}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button
              className="w-full bg-accent-violet hover:bg-accent-indigo"
              onClick={() => { setSession(null); setQuestions([]); setCurrentIndex(0); setScores([]); setCompleted(false); setTranscript([]); }}
            >
              Start New Interview
            </Button>
          </CardContent>
        </Card>

        {/* Recommended Practice Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Recommended Practice Plan</CardTitle>
            <CardDescription>Based on your performance in this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 p-3 bg-glass/40 rounded-lg">
                  <span className="text-accent-indigo font-bold shrink-0">{i + 1}.</span>
                  <p className="text-sm text-text-secondary">{rec}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {avgScore < 7 && (
                  <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => { setSession(null); setMode('quick_drill'); }}>
                    Try Quick Drill
                  </Button>
                )}
                <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => { setSession(null); setMode(''); if (onViewChange) onViewChange('questions'); }}>
                  Review Question Bank
                </Button>
                <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => { setSession(null); setMode('role_interview'); }}>
                  Practice More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Interview Screen
  const currentQ = questions[currentIndex];
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-text-muted">Question {currentIndex + 1} of {questions.length}</p>
          <p className="text-sm text-text-muted capitalize truncate">{session.mode.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Badge variant="outline" className="font-mono tabular-nums" aria-label={`Elapsed time: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`}>⏱ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</Badge>
          <Badge variant="outline">{scores.length > 0 ? `Avg: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}` : 'No scores yet'}</Badge>
          {followUpScores.length > 0 && (
            <Badge variant="secondary" className="text-purple-600">{followUpScores.length} follow-up(s)</Badge>
          )}
        </div>
      </div>
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="whitespace-nowrap">{currentQ.difficulty}</Badge>
            <Badge variant="outline" className="whitespace-nowrap">{currentQ.type.replace(/_/g, ' ')}</Badge>
            <Badge variant="outline" className="whitespace-nowrap">{currentQ.role}</Badge>
          </div>
          <CardTitle className="text-lg leading-snug">{currentQ.question}</CardTitle>
          {currentQ.whyEmployersAsk && (
            <CardDescription><strong>Why employers ask:</strong> {currentQ.whyEmployersAsk}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!feedback ? (
            <>
              <Textarea
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={6}
                autoFocus
              />
              <Button
                className="w-full bg-accent-violet hover:bg-accent-indigo"
                onClick={submitAnswer}
                disabled={!userAnswer.trim() || submitting}
              >
                {submitting ? 'Getting AI Feedback...' : 'Submit Answer'}
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-glass/40 rounded-lg overflow-hidden">
                <p className="text-sm text-text-muted mb-1">Your answer:</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{userAnswer}</p>
              </div>
              <Card className="border-accent-violet/20 bg-accent-violet/8/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-accent-indigo font-mono">{(feedback as Record<string, unknown>).score as number}/10</span>
                    <span className="text-sm text-text-muted">Score</span>
                  </div>
                  {Boolean((feedback as Record<string, unknown>).whatWorked) && (
                    <div>
                      <p className="text-sm font-medium text-green-700">What worked:</p>
                      <p className="text-sm text-text-secondary break-words">{(feedback as Record<string, unknown>).whatWorked as string}</p>
                    </div>
                  )}
                  {Boolean((feedback as Record<string, unknown>).whatToImprove) && (
                    <div>
                      <p className="text-sm font-medium text-amber-700">What to improve:</p>
                      <p className="text-sm text-text-secondary break-words">{(feedback as Record<string, unknown>).whatToImprove as string}</p>
                    </div>
                  )}
                  {Boolean((feedback as Record<string, unknown>).strongerSampleAnswer) && (
                    <div>
                      <p className="text-sm font-medium text-accent-indigo">Stronger sample answer:</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{(feedback as Record<string, unknown>).strongerSampleAnswer as string}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Adaptive Follow-up Section */}
              {followUpQuestion && !followUpFeedback && !answeringFollowUp && (
                <Card className="border-purple-200 bg-purple-50/50 overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Follow-up Question:</p>
                      <p className="text-sm text-text-primary mt-1 break-words">{followUpQuestion}</p>
                    </div>
                    <p className="text-xs text-text-muted">Your score was below 7. Practicing this follow-up can help you improve.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => setAnsweringFollowUp(true)}
                      >
                        Practice Follow-up
                      </Button>
                      <Button variant="outline" onClick={handleSkipFollowUp}>
                        Skip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {answeringFollowUp && !followUpFeedback && (
                <Card className="border-purple-200 bg-purple-50/50 overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium text-purple-700">Answer the follow-up:</p>
                    <p className="text-sm text-text-primary break-words">{followUpQuestion}</p>
                    <Textarea
                      placeholder="Type your answer to the follow-up..."
                      value={followUpAnswer}
                      onChange={(e) => setFollowUpAnswer(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={submitFollowUpAnswer}
                        disabled={!followUpAnswer.trim() || submitting}
                      >
                        {submitting ? 'Getting Feedback...' : 'Submit Follow-up'}
                      </Button>
                      <Button variant="outline" onClick={handleSkipFollowUp}>Skip</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {followUpFeedback && (
                <Card className="border-purple-200 bg-purple-50/50 overflow-hidden">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-600">{(followUpFeedback as Record<string, unknown>).score as number}/10</span>
                      <span className="text-sm text-text-muted">Follow-up Score</span>
                    </div>
                    {Boolean((followUpFeedback as Record<string, unknown>).whatWorked) && (
                      <div>
                        <p className="text-sm font-medium text-green-700">What worked:</p>
                        <p className="text-sm text-text-secondary break-words">{(followUpFeedback as Record<string, unknown>).whatWorked as string}</p>
                      </div>
                    )}
                    {Boolean((followUpFeedback as Record<string, unknown>).whatToImprove) && (
                      <div>
                        <p className="text-sm font-medium text-amber-700">What to improve:</p>
                        <p className="text-sm text-text-secondary break-words">{(followUpFeedback as Record<string, unknown>).whatToImprove as string}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full bg-accent-violet hover:bg-accent-indigo"
                onClick={nextQuestion}
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
