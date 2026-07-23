'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Question, InterviewSession, ROLES, INTERVIEW_MODES, ActiveView } from '@/lib/types';
import { FieldCard } from '@/components/ui/glass-card';
import { FieldButton } from '@/components/ui/glass-button';
import { FieldBadge } from '@/components/ui/glass-badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface QuestionWithMeta extends Question {
  isFollowUp?: boolean;
  originalQuestionId?: string;
}

export function MockInterview({ onViewChange }: { onViewChange?: (view: ActiveView) => void }) {
  const { user } = useAuth();
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
        headers: { 'Content-Type': 'application/json'},
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

      // Add to transcript
      setTranscript(prev => [...prev, {
        q: questions[currentIndex].question,
        a: userAnswer,
        score,
        feedback: coachData,
      }]);

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
        headers: { 'Content-Type': 'application/json'},
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
          <h2 className="text-2xl font-bold text-[#171717] font-heading">Mock Interview</h2>
          <p className="text-[#737373] mt-1">Practice with AI-powered interview coaching</p>
        </div>

        <div className="flex justify-center mb-2">
          <Image
            src="/images/illustrations/mock-interview-setup.svg"
            alt="Set up your mock interview with AI-powered coaching"
            width={500}
            height={200}
            className="w-full max-w-md h-auto"
          />
        </div>

        <FieldCard className="max-w-lg">
          <div>
            <div className="font-heading">Start Interview</div>
            <div>Choose your interview mode and target role</div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Mode</label>
              {INTERVIEW_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-1 ${
                    mode === m.value ? 'border-[#FF6B35] bg-[#FF6B35]/8' : 'border-[#E5E5E0] hover:border-[#D4D4D4]'
                  }`}
                  aria-pressed={mode === m.value}
                  aria-label={`Select ${m.label} mode`}
                >
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-[#737373] mt-0.5 break-words">{m.desc}</p>
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
            <FieldButton
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-1"
              onClick={startInterview}
              disabled={!mode || loading}
              aria-label="Start interview with selected mode"
            >
              {loading ? 'Starting...' : 'Start Interview'}
            </FieldButton>
          </div>
        </FieldCard>

        {sessions.length > 0 && (
          <FieldCard>
            <div>
              <div className="text-lg">Previous Sessions</div>
            </div>
            <div>
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-3 bg-[#F4F3EE]/40 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize truncate">{s.mode.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-[#737373]">{new Date(s.startedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {s.overallScore !== null && s.overallScore !== undefined && (
                        <FieldBadge variant={s.overallScore >= 7 ? 'accent' : 'default'}>
                          {s.overallScore.toFixed(1)}/10
                        </FieldBadge>
                      )}
                      <FieldBadge variant="ghost">{s.completedAt ? 'Completed' : 'In Progress'}</FieldBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FieldCard>
        )}
      </div>
    );
  }

  // Interview Complete Screen
  if (completed) {
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const recommendations = getRecommendations();

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <FieldCard>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/illustrations/interview-complete-celebration.svg"
                alt="Congratulations on completing your mock interview"
                width={300}
                height={150}
                className="w-full max-w-xs h-auto"
              />
            </div>
            <div className="w-16 h-16 bg-[#FF6B35]/15 rounded-md flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-2xl font-heading">Interview Complete!</div>
            <div>You answered {transcript.length} questions (including follow-ups)</div>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#FF6B35] font-mono">{avgScore.toFixed(1)}/10</p>
              <p className="text-[#737373]">Average Score</p>
            </div>
            <div className="space-y-2">
              {scores.map((score, i) => (
                <div key={`main-${i}`} className="flex items-center gap-3">
                  <span className="text-sm text-[#737373] w-8">Q{i + 1}</span>
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
            <FieldButton
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]"
              onClick={() => { setSession(null); setQuestions([]); setCurrentIndex(0); setScores([]); setCompleted(false); setTranscript([]); }}
            >
              Start New Interview
            </FieldButton>
          </div>
        </FieldCard>

        {/* Recommended Practice Plan */}
        <FieldCard>
          <div>
            <div className="text-lg font-heading">Recommended Practice Plan</div>
            <div>Based on your performance in this session</div>
          </div>
          <div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 p-3 bg-[#F4F3EE]/40 rounded-lg">
                  <span className="text-[#FF6B35] font-bold shrink-0">{i + 1}.</span>
                  <p className="text-sm text-[#404040]">{rec}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {avgScore < 7 && (
                  <FieldButton variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => { setSession(null); setMode('quick_drill'); }}>
                    Try Quick Drill
                  </FieldButton>
                )}
                <FieldButton variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => { setSession(null); setMode(''); if (onViewChange) onViewChange('questions'); }}>
                  Review Question Bank
                </FieldButton>
                <FieldButton variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => { setSession(null); setMode('role_interview'); }}>
                  Practice More
                </FieldButton>
              </div>
            </div>
          </div>
        </FieldCard>
      </div>
    );
  }

  // Active Interview Screen
  const currentQ = questions[currentIndex];
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-[#737373]">Question {currentIndex + 1} of {questions.length}</p>
          <p className="text-sm text-[#737373] capitalize truncate">{session.mode.replace(/_/g, ' ')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <FieldBadge variant="ghost" className="font-mono tabular-nums" aria-label={`Elapsed time: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`}>⏱ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</FieldBadge>
          <FieldBadge variant="ghost">{scores.length > 0 ? `Avg: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}` : 'No scores yet'}</FieldBadge>
          {followUpScores.length > 0 && (
            <FieldBadge variant="default" className="text-purple-600">{followUpScores.length} follow-up(s)</FieldBadge>
          )}
        </div>
      </div>
      <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />

      <FieldCard>
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <FieldBadge variant="default" className="whitespace-nowrap">{currentQ.difficulty}</FieldBadge>
            <FieldBadge variant="ghost" className="whitespace-nowrap">{currentQ.type.replace(/_/g, ' ')}</FieldBadge>
            <FieldBadge variant="ghost" className="whitespace-nowrap">{currentQ.role}</FieldBadge>
          </div>
          <div className="text-lg leading-snug">{currentQ.question}</div>
          {currentQ.whyEmployersAsk && (
            <div><strong>Why employers ask:</strong> {currentQ.whyEmployersAsk}</div>
          )}
        </div>
        <div className="space-y-4">
          {!feedback ? (
            <>
              <Textarea
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={6}
                autoFocus
              />
              <FieldButton
                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]"
                onClick={submitAnswer}
                disabled={!userAnswer.trim() || submitting}
              >
                {submitting ? 'Getting AI Feedback...' : 'Submit Answer'}
              </FieldButton>
            </>
          ) : (
            <>
              <div className="p-4 bg-[#F4F3EE]/40 rounded-lg overflow-hidden">
                <p className="text-sm text-[#737373] mb-1">Your answer:</p>
                <p className="text-sm text-[#171717] whitespace-pre-wrap break-words">{userAnswer}</p>
              </div>
              <FieldCard className="border-[#FF6B35]/20 bg-[#FF6B35]/8/50">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#FF6B35] font-mono">{(feedback as Record<string, unknown>).score as number}/10</span>
                    <span className="text-sm text-[#737373]">Score</span>
                  </div>
                  {Boolean((feedback as Record<string, unknown>).whatWorked) && (
                    <div>
                      <p className="text-sm font-medium text-green-700">What worked:</p>
                      <p className="text-sm text-[#404040] break-words">{(feedback as Record<string, unknown>).whatWorked as string}</p>
                    </div>
                  )}
                  {Boolean((feedback as Record<string, unknown>).whatToImprove) && (
                    <div>
                      <p className="text-sm font-medium text-amber-700">What to improve:</p>
                      <p className="text-sm text-[#404040] break-words">{(feedback as Record<string, unknown>).whatToImprove as string}</p>
                    </div>
                  )}
                  {Boolean((feedback as Record<string, unknown>).strongerSampleAnswer) && (
                    <div>
                      <p className="text-sm font-medium text-[#FF6B35]">Stronger sample answer:</p>
                      <p className="text-sm text-[#404040] whitespace-pre-wrap break-words">{(feedback as Record<string, unknown>).strongerSampleAnswer as string}</p>
                    </div>
                  )}
                </div>
              </FieldCard>

              {/* Adaptive Follow-up Section */}
              {followUpQuestion && !followUpFeedback && !answeringFollowUp && (
                <FieldCard className="border-purple-200 bg-purple-50/50 overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Follow-up Question:</p>
                      <p className="text-sm text-[#171717] mt-1 break-words">{followUpQuestion}</p>
                    </div>
                    <p className="text-xs text-[#737373]">Your score was below 7. Practicing this follow-up can help you improve.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <FieldButton
                        className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => setAnsweringFollowUp(true)}
                      >
                        Practice Follow-up
                      </FieldButton>
                      <FieldButton variant="secondary" onClick={handleSkipFollowUp}>
                        Skip
                      </FieldButton>
                    </div>
                  </div>
                </FieldCard>
              )}

              {answeringFollowUp && !followUpFeedback && (
                <FieldCard className="border-purple-200 bg-purple-50/50 overflow-hidden">
                  <div className="p-4 space-y-3">
                    <p className="text-sm font-medium text-purple-700">Answer the follow-up:</p>
                    <p className="text-sm text-[#171717] break-words">{followUpQuestion}</p>
                    <Textarea
                      placeholder="Type your answer to the follow-up..."
                      value={followUpAnswer}
                      onChange={(e) => setFollowUpAnswer(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <FieldButton
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={submitFollowUpAnswer}
                        disabled={!followUpAnswer.trim() || submitting}
                      >
                        {submitting ? 'Getting Feedback...' : 'Submit Follow-up'}
                      </FieldButton>
                      <FieldButton variant="secondary" onClick={handleSkipFollowUp}>Skip</FieldButton>
                    </div>
                  </div>
                </FieldCard>
              )}

              {followUpFeedback && (
                <FieldCard className="border-purple-200 bg-purple-50/50 overflow-hidden">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-600">{(followUpFeedback as Record<string, unknown>).score as number}/10</span>
                      <span className="text-sm text-[#737373]">Follow-up Score</span>
                    </div>
                    {Boolean((followUpFeedback as Record<string, unknown>).whatWorked) && (
                      <div>
                        <p className="text-sm font-medium text-green-700">What worked:</p>
                        <p className="text-sm text-[#404040] break-words">{(followUpFeedback as Record<string, unknown>).whatWorked as string}</p>
                      </div>
                    )}
                    {Boolean((followUpFeedback as Record<string, unknown>).whatToImprove) && (
                      <div>
                        <p className="text-sm font-medium text-amber-700">What to improve:</p>
                        <p className="text-sm text-[#404040] break-words">{(followUpFeedback as Record<string, unknown>).whatToImprove as string}</p>
                      </div>
                    )}
                  </div>
                </FieldCard>
              )}

              <FieldButton
                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]"
                onClick={nextQuestion}
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
              </FieldButton>
            </>
          )}
        </div>
      </FieldCard>
    </div>
  );
}
