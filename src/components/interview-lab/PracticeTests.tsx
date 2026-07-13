'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Assessment, ROLES } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UpgradeModal } from '@/components/interview-lab/UpgradeModal';
import { checkPracticeTestAccess } from '@/lib/subscription-guard';
import { useSubscription } from '@/lib/use-subscription';

export function PracticeTests() {
  const { user } = useAuth();
  const { usage, currentTier } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: string; recommendedTier: string }>({ open: false, reason: '', recommendedTier: 'starter' });
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [userAnswers, setUserAnswers] = useState('');
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<Record<string, unknown> | null>(null);
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

    // Check subscription limit
    const testsThisMonth = usage?.practiceTestsThisMonth ?? 0;
    const accessCheck = checkPracticeTestAccess(currentTier, testsThisMonth);
    if (!accessCheck.allowed) {
      setUpgradeModal({
        open: true,
        reason: accessCheck.reason || 'Practice test limit reached',
        recommendedTier: accessCheck.upgradeTo || 'starter',
      });
      return;
    }

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

      // Log the assessment attempt
      await fetch(`/api/assessments/${selectedAssessment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ answers: userAnswers }),
      });
    } catch (error) {
      console.error('Assessment scoring error:', error);
    } finally {
      setScoring(false);
    }
  };

  const getDifficultyColor = (d: string) => {
    if (d === 'beginner') return 'bg-green-100 text-green-700';
    if (d === 'intermediate') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Assessment Detail View
  if (selectedAssessment) {
    const dataset = (() => { try { return selectedAssessment.datasetInfo ? JSON.parse(selectedAssessment.datasetInfo) : null; } catch { return null; } })();

    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => { setSelectedAssessment(null); setScore(null); setUserAnswers(''); }}>
          ← Back to Assessments
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={getDifficultyColor(selectedAssessment.difficulty)}>{selectedAssessment.difficulty}</Badge>
              <Badge variant="outline">{selectedAssessment.role}</Badge>
            </div>
            <CardTitle className="font-heading">{selectedAssessment.title}</CardTitle>
            <CardDescription>{selectedAssessment.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataset && (
              <div className="bg-glass/40 p-4 rounded-lg">
                <p className="text-sm font-medium text-text-secondary mb-2">Assessment Data:</p>
                <pre className="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(dataset, null, 2)}</pre>
              </div>
            )}

            {!score ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Analysis / Answers</label>
                  <Textarea
                    placeholder="Provide your analysis and answers based on the assessment data above..."
                    value={userAnswers}
                    onChange={(e) => setUserAnswers(e.target.value)}
                    rows={8}
                  />
                </div>
                <Button
                  className="w-full bg-accent-violet hover:bg-accent-indigo"
                  onClick={handleSubmit}
                  disabled={!userAnswers.trim() || scoring}
                >
                  {scoring ? 'Scoring...' : 'Submit for AI Scoring'}
                </Button>
              </>
            ) : (
              <>
                <Card className="border-accent-violet/20 bg-accent-violet/8/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-center mb-2">
                      <Image
                        src="/images/illustrations/ai-feedback-score.png"
                        alt="AI-powered scoring and feedback for your practice test"
                        width={300}
                        height={120}
                        className="w-full max-w-[250px] h-auto"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-accent-indigo font-mono">{(score as Record<string, unknown>).score as number}/100</p>
                      <p className="text-sm text-text-muted">Assessment Score</p>
                    </div>
                    {Boolean((score as Record<string, unknown>).correctDecisions) && (
                      <div>
                        <p className="text-sm font-medium text-green-700">Correct Decisions:</p>
                        <ul className="text-sm text-text-secondary">
                          {((score as Record<string, unknown>).correctDecisions as string[]).map((d: string, i: number) => (
                            <li key={i}>✓ {d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).incorrectDecisions) && ((score as Record<string, unknown>).incorrectDecisions as string[]).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700">Incorrect or Risky Decisions:</p>
                        <ul className="text-sm text-text-secondary">
                          {((score as Record<string, unknown>).incorrectDecisions as string[]).map((d: string, i: number) => (
                            <li key={i}>✗ {d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).missedOpportunities) && (
                      <div>
                        <p className="text-sm font-medium text-amber-700">Missed Opportunities:</p>
                        <ul className="text-sm text-text-secondary">
                          {((score as Record<string, unknown>).missedOpportunities as string[]).map((o: string, i: number) => (
                            <li key={i}>! {o}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).modelAnswer) && (
                      <div>
                        <p className="text-sm font-medium text-accent-indigo">Model Answer:</p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{(score as Record<string, unknown>).modelAnswer as string}</p>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).recommendedNextStep) && (
                      <div>
                        <p className="text-sm font-medium text-purple-700">Recommended Next Step:</p>
                        <p className="text-sm text-text-secondary break-words">{(score as Record<string, unknown>).recommendedNextStep as string}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Button
                  variant="outline"
                  className="w-full border-accent-violet/20 text-accent-indigo"
                  onClick={() => { setScore(null); setUserAnswers(''); }}
                >
                  Try Again
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rubric */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Scoring Rubric</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
              {(() => {
                try {
                  const rubricData = selectedAssessment.rubric ? JSON.parse(selectedAssessment.rubric) : null;
                  if (rubricData && typeof rubricData === 'object') {
                    return Object.entries(rubricData).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-glass/40 rounded gap-2">
                        <span className="truncate">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                        <span className="font-medium shrink-0">{String(value)}%</span>
                      </div>
                    ));
                  }
                } catch {}
                // Fallback to default rubric
                return (
                  <>
                    <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Correct metric interpretation</span><span className="font-medium shrink-0">25%</span></div>
                    <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Correct action recommendation</span><span className="font-medium shrink-0">25%</span></div>
                    <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Data sufficiency judgment</span><span className="font-medium shrink-0">15%</span></div>
                    <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Risk awareness</span><span className="font-medium shrink-0">15%</span></div>
                    <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Clear explanation</span><span className="font-medium shrink-0">10%</span></div>
                    <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Documentation quality</span><span className="font-medium shrink-0">10%</span></div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment List View
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-heading">Practice Tests</h2>
        <p className="text-text-muted mt-1 text-sm sm:text-base">Test your Amazon VA skills with practical exercises across all roles</p>
      </div>

      <div className="flex justify-center">
        <Image
          src="/images/illustrations/practice-test-analysis.png"
          alt="Practice tests and assessments for Amazon VA skills"
          width={500}
          height={180}
          className="w-full max-w-lg h-auto"
        />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.filter(r => r !== 'General').map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-glass-border/30 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assessments.map(a => (
            <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1" onClick={() => setSelectedAssessment(a)} tabIndex={0} role="button" aria-label={`Start test: ${a.title}`}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={getDifficultyColor(a.difficulty)}>{a.difficulty}</Badge>
                  <Badge variant="outline">{a.role}</Badge>
                </div>
                <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                <CardDescription className="line-clamp-2">{a.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="bg-accent-violet hover:bg-accent-indigo" onClick={(e) => { e.stopPropagation(); setSelectedAssessment(a); }}>Start Test</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, reason: '', recommendedTier: 'starter' })}
        feature="Practice Tests"
        reason={upgradeModal.reason}
        currentTier={currentTier}
        recommendedTier={upgradeModal.recommendedTier}
      />
    </div>
  );
}
