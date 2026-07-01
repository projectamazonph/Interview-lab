'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Question, ROLES, DIFFICULTIES, QUESTION_TYPES, SKILL_AREAS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function QuestionBank() {
  const { user } = useAuth();
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
      const headers: Record<string, string> = {};
      if (user) headers['x-user-id'] = user.id;
      const res = await fetch(`/api/questions?${params.toString()}`, { headers });
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
        headers: { 'Content-Type': 'application/json', ...(user ? { 'x-user-id': user.id } : {}) },
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

  const getDifficultyColor = (d: string) => {
    if (d === 'beginner') return 'bg-green-100 text-green-700';
    if (d === 'intermediate') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getTypeColor = (t: string) => {
    if (t === 'behavioral') return 'bg-accent-violet/15 text-accent-indigo';
    if (t === 'technical') return 'bg-purple-100 text-purple-700';
    if (t === 'scenario') return 'bg-accent-violet/15 text-accent-indigo';
    if (t === 'trick') return 'bg-red-100 text-red-700';
    return 'bg-glass-border/20 text-text-secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-text-primary font-heading">Question Bank</h2>
          <p className="text-text-muted mt-1">{total} questions available</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Image
          src="/images/illustrations/question-bank-library.png"
          alt="Browse hundreds of Amazon VA interview questions organized by role and skill"
          width={500}
          height={180}
          className="w-full max-w-lg h-auto"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={filters.role} onValueChange={(v) => setFilters(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.difficulty} onValueChange={(v) => setFilters(f => ({ ...f, difficulty: v }))}>
                <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.type} onValueChange={(v) => setFilters(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {QUESTION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.skillArea} onValueChange={(v) => setFilters(f => ({ ...f, skillArea: v }))}>
                <SelectTrigger><SelectValue placeholder="Skill Area" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {SKILL_AREAS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search questions by keyword..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            {(filters.role !== 'all' || filters.difficulty !== 'all' || filters.type !== 'all' || filters.skillArea !== 'all' || filters.search) && (
              <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-primary self-start" onClick={() => setFilters({ role: 'all', difficulty: 'all', type: 'all', skillArea: 'all', search: '' })}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear all filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-glass-border/30 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <Card key={q.id} className="hover:shadow-sm transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1" onClick={() => { setPracticeQuestion(q); setUserAnswer(''); setFeedback(null); }} tabIndex={0} role="button" aria-label={`Practice: ${q.question.slice(0, 60)}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary line-clamp-2">{q.question}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge className={`${getDifficultyColor(q.difficulty)} whitespace-nowrap`}>{q.difficulty}</Badge>
                      <Badge className={`${getTypeColor(q.type)} whitespace-nowrap`}>{q.type.replace(/_/g, ' ')}</Badge>
                      <Badge variant="outline" className="whitespace-nowrap">{q.role}</Badge>
                      <Badge variant="outline" className="whitespace-nowrap">{q.skillArea.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap border-accent-violet/20 text-accent-indigo hover:bg-accent-violet/10">
                    Practice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {questions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-text-muted">
                No questions match your filters. Try adjusting your search criteria.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Practice Dialog */}
      <Dialog open={!!practiceQuestion} onOpenChange={() => setPracticeQuestion(null)}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {practiceQuestion && (
            <>
              <DialogHeader>
                <DialogTitle>Practice Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge className={`${getDifficultyColor(practiceQuestion.difficulty)} whitespace-nowrap`}>{practiceQuestion.difficulty}</Badge>
                    <Badge className={`${getTypeColor(practiceQuestion.type)} whitespace-nowrap`}>{practiceQuestion.type.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline" className="whitespace-nowrap">{practiceQuestion.role}</Badge>
                  </div>
                  <p className="text-lg font-medium text-text-primary">{practiceQuestion.question}</p>
                  {practiceQuestion.whyEmployersAsk && (
                    <p className="text-sm text-text-muted mt-2"><strong>Why employers ask:</strong> {practiceQuestion.whyEmployersAsk}</p>
                  )}
                  {practiceQuestion.strongAnswerPoints && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-text-secondary">Strong answer should include:</p>
                      <ul className="list-disc list-inside text-sm text-text-secondary">
                        {JSON.parse(practiceQuestion.strongAnswerPoints || '[]').map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Textarea
                  placeholder="Type your answer here..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={5}
                />
                <Button
                  className="w-full bg-accent-violet hover:bg-accent-indigo"
                  onClick={handlePractice}
                  disabled={!userAnswer.trim() || submitting}
                >
                  {submitting ? 'Getting AI Feedback...' : 'Submit Answer for AI Feedback'}
                </Button>

                {feedback && (
                  <Card className="border-accent-violet/20 bg-accent-violet/8/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-accent-indigo font-mono">{(feedback as Record<string, unknown>).score as number}/10</span>
                        <span className="text-sm text-text-muted">Overall Score</span>
                      </div>
                      {Boolean((feedback as Record<string, unknown>).whatWorked) && (
                        <div>
                          <p className="text-sm font-medium text-green-700">What worked:</p>
                          <p className="text-sm text-text-secondary break-words whitespace-pre-wrap">{(feedback as Record<string, unknown>).whatWorked as string}</p>
                        </div>
                      )}
                      {Boolean((feedback as Record<string, unknown>).whatToImprove) && (
                        <div>
                          <p className="text-sm font-medium text-amber-700">What to improve:</p>
                          <p className="text-sm text-text-secondary break-words whitespace-pre-wrap">{(feedback as Record<string, unknown>).whatToImprove as string}</p>
                        </div>
                      )}
                      {Boolean((feedback as Record<string, unknown>).strongerSampleAnswer) && (
                        <div>
                          <p className="text-sm font-medium text-accent-indigo">Stronger sample answer:</p>
                          <p className="text-sm text-text-secondary break-words whitespace-pre-wrap">{(feedback as Record<string, unknown>).strongerSampleAnswer as string}</p>
                        </div>
                      )}
                      {Boolean((feedback as Record<string, unknown>).followUpQuestion) && (
                        <div>
                          <p className="text-sm font-medium text-purple-700">Follow-up question:</p>
                          <p className="text-sm text-text-secondary break-words whitespace-pre-wrap">{(feedback as Record<string, unknown>).followUpQuestion as string}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {practiceQuestion.sampleAnswer && !feedback && (
                  <details className="mt-2">
                    <summary className="text-sm text-text-muted cursor-pointer hover:text-text-primary">Show sample answer</summary>
                    <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{practiceQuestion.sampleAnswer}</p>
                  </details>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
