'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Assessment, ROLES } from '@/lib/types';
import { FieldBadge } from '@/components/ui/glass-badge';
import { FieldButton } from '@/components/ui/glass-button';
import { FieldCard } from '@/components/ui/glass-card';
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
        <FieldButton variant="secondary" onClick={() => { setSelectedAssessment(null); setScore(null); setUserAnswers(''); }}>
          ← Back to Assessments
        </FieldButton>

        <FieldCard>
          <div className="p-4 pb-0 space-y-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <FieldBadge className={getDifficultyColor(selectedAssessment.difficulty)}>{selectedAssessment.difficulty}</FieldBadge>
              <FieldBadge variant="ghost">{selectedAssessment.role}</FieldBadge>
            </div>
            <h3 className="font-heading text-lg font-semibold">{selectedAssessment.title}</h3>
            <p className="text-[#737373] text-sm">{selectedAssessment.description}</p>
          </div>
          <div className="p-4 space-y-4">
            {dataset && (
              <div className="bg-[#F4F3EE]/40 p-4 rounded-lg">
                <p className="text-sm font-medium text-[#404040] mb-2">Assessment Data:</p>
                <pre className="text-xs text-[#404040] overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(dataset, null, 2)}</pre>
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
                <FieldButton
                  variant="primary"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!userAnswers.trim() || scoring}
                >
                  {scoring ? 'Scoring...' : 'Submit for AI Scoring'}
                </FieldButton>
              </>
            ) : (
              <>
                <FieldCard className="border-[#FF6B35]/20 bg-[#FF6B35]/8/50">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-center mb-2">
                      <Image
                        src="/images/illustrations/ai-feedback-score.svg"
                        alt="AI-powered scoring and feedback for your practice test"
                        width={300}
                        height={120}
                        className="w-full max-w-[250px] h-auto"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#FF6B35] font-mono">{(score as Record<string, unknown>).score as number}/100</p>
                      <p className="text-sm text-[#737373]">Assessment Score</p>
                    </div>
                    {Boolean((score as Record<string, unknown>).correctDecisions) && (
                      <div>
                        <p className="text-sm font-medium text-green-700">Correct Decisions:</p>
                        <ul className="text-sm text-[#404040]">
                          {((score as Record<string, unknown>).correctDecisions as string[]).map((d: string, i: number) => (
                            <li key={i}>✓ {d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).incorrectDecisions) && ((score as Record<string, unknown>).incorrectDecisions as string[]).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700">Incorrect or Risky Decisions:</p>
                        <ul className="text-sm text-[#404040]">
                          {((score as Record<string, unknown>).incorrectDecisions as string[]).map((d: string, i: number) => (
                            <li key={i}>✗ {d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).missedOpportunities) && (
                      <div>
                        <p className="text-sm font-medium text-amber-700">Missed Opportunities:</p>
                        <ul className="text-sm text-[#404040]">
                          {((score as Record<string, unknown>).missedOpportunities as string[]).map((o: string, i: number) => (
                            <li key={i}>! {o}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).modelAnswer) && (
                      <div>
                        <p className="text-sm font-medium text-[#FF6B35]">Model Answer:</p>
                        <p className="text-sm text-[#404040] whitespace-pre-wrap break-words">{(score as Record<string, unknown>).modelAnswer as string}</p>
                      </div>
                    )}
                    {Boolean((score as Record<string, unknown>).recommendedNextStep) && (
                      <div>
                        <p className="text-sm font-medium text-purple-700">Recommended Next Step:</p>
                        <p className="text-sm text-[#404040] break-words">{(score as Record<string, unknown>).recommendedNextStep as string}</p>
                      </div>
                    )}
                  </div>
                </FieldCard>
                <FieldButton
                  variant="secondary"
                  className="w-full border-[#FF6B35]/20 text-[#FF6B35]"
                  onClick={() => { setScore(null); setUserAnswers(''); }}
                >
                  Try Again
                </FieldButton>
              </>
            )}
          </div>
        </FieldCard>

        {/* Rubric */}
        <FieldCard>
          <div className="p-4 pb-0 space-y-1">
            <h3 className="text-lg font-heading font-semibold">Scoring Rubric</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
              {(() => {
                try {
                  const rubricData = selectedAssessment.rubric ? JSON.parse(selectedAssessment.rubric) : null;
                  if (rubricData && typeof rubricData === 'object') {
                    return Object.entries(rubricData).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2">
                        <span className="truncate">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                        <span className="font-medium shrink-0">{String(value)}%</span>
                      </div>
                    ));
                  }
                } catch {}
                // Fallback to default rubric
                return (
                  <>
                    <div className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2"><span className="truncate">Correct metric interpretation</span><span className="font-medium shrink-0">25%</span></div>
                    <div className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2"><span className="truncate">Correct action recommendation</span><span className="font-medium shrink-0">25%</span></div>
                    <div className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2"><span className="truncate">Data sufficiency judgment</span><span className="font-medium shrink-0">15%</span></div>
                    <div className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2"><span className="truncate">Risk awareness</span><span className="font-medium shrink-0">15%</span></div>
                    <div className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2"><span className="truncate">Clear explanation</span><span className="font-medium shrink-0">10%</span></div>
                    <div className="flex justify-between p-2 bg-[#F4F3EE]/40 rounded gap-2"><span className="truncate">Documentation quality</span><span className="font-medium shrink-0">10%</span></div>
                  </>
                );
              })()}
            </div>
          </div>
        </FieldCard>
      </div>
    );
  }

  // Assessment List View
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#171717] font-heading">Practice Tests</h2>
        <p className="text-[#737373] mt-1 text-sm sm:text-base">Test your Amazon VA skills with practical exercises across all roles</p>
      </div>

      <div className="flex justify-center">
        <Image
          src="/images/illustrations/practice-test-analysis.svg"
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
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[#E5E5E0]/30 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assessments.map(a => (
            <FieldCard key={a.id} variant="interactive" className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1" onClick={() => setSelectedAssessment(a)} tabIndex={0} role="button" aria-label={`Start test: ${a.title}`}>
              <div className="p-4 pb-0 space-y-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <FieldBadge className={getDifficultyColor(a.difficulty)}>{a.difficulty}</FieldBadge>
                  <FieldBadge variant="ghost">{a.role}</FieldBadge>
                </div>
                <h3 className="text-base leading-snug font-semibold">{a.title}</h3>
                <p className="text-[#737373] text-sm line-clamp-2">{a.description}</p>
              </div>
              <div className="p-4 pt-0">
                <FieldButton size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setSelectedAssessment(a); }}>Start Test</FieldButton>
              </div>
            </FieldCard>
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
