'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Resume, ROLES } from '@/lib/types';
import { FieldCard } from '@/components/ui/glass-card';
import { FieldButton } from '@/components/ui/glass-button';
import { FieldBadge } from '@/components/ui/glass-badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileArrowDown, FileText, Clock as ClockIcon, ArrowsLeftRight } from '@phosphor-icons/react';
import { UpgradeModal } from '@/components/interview-lab/UpgradeModal';
import { checkResumeAccess } from '@/lib/subscription-guard';
import { useSubscription } from '@/lib/use-subscription';

export function ResumeLab() {
  const { user } = useAuth();
  const { usage, currentTier } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: string; recommendedTier: string }>({ open: false, reason: '', recommendedTier: 'starter' });
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
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

    const reviewsThisMonth = usage?.resumeReviewsThisMonth ?? 0;
    const accessCheck = checkResumeAccess(currentTier, reviewsThisMonth);
    if (!accessCheck.allowed) {
      setUpgradeModal({
        open: true,
        reason: accessCheck.reason || 'Resume review limit reached',
        recommendedTier: accessCheck.upgradeTo || 'starter',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    setError('');
    try {
      const createRes = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
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
        headers: { 'Content-Type': 'application/json'},
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
    if (!feedback || !(feedback as Record<string, unknown>).improvedVersion || !user) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          type: format,
          content: (feedback as Record<string, unknown>).improvedVersion as string,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171717] font-heading">Resume Lab</h2>
          <p className="text-[#737373] mt-1 text-sm sm:text-base">Get AI-powered resume review and improvement suggestions</p>
        </div>
        <FieldButton variant="secondary" onClick={() => setShowHistory(!showHistory)} className="shrink-0 whitespace-nowrap" aria-label={showHistory ? 'Hide history' : 'Show history'}>
          <ClockIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          {showHistory ? 'Hide History' : 'History'} ({resumes.length})
        </FieldButton>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showHistory && resumes.length > 0 && (
        <FieldCard className="p-4">
          <h3 className="text-sm font-semibold text-[#171717] mb-3">Previous Reviews</h3>
          <div className="space-y-2">
            {resumes.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-[#F4F3EE] rounded-md gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.targetRole || 'General'} Resume</p>
                  <p className="text-xs text-[#737373]">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {r.score !== null && r.score !== undefined && (
                    <FieldBadge variant="accent">{r.score}/100</FieldBadge>
                  )}
                  <FieldButton variant="ghost" size="sm" className="text-xs"
                    onClick={() => {
                      if (r.originalText) setResumeText(r.originalText);
                      if (r.improvedVersion) {
                        let parsedWarnings: string[] = [];
                        try {
                          parsedWarnings = r.truthFlags ? JSON.parse(r.truthFlags) : [];
                          if (!Array.isArray(parsedWarnings)) parsedWarnings = [];
                        } catch { parsedWarnings = []; }
                        setFeedback({ improvedVersion: r.improvedVersion, score: r.score, truthWarnings: parsedWarnings });
                      }
                      setShowHistory(false);
                    }}>
                    Load
                  </FieldButton>
                </div>
              </div>
            ))}
          </div>
        </FieldCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <FieldCard className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-[#171717] mb-1">Submit Your Resume</h3>
          <p className="text-sm text-[#737373] mb-4">Paste your resume text for AI review</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#171717]">Target Role</label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#171717]">Resume Text</label>
              <Textarea
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={12}
              />
            </div>
            <FieldButton
              variant="primary"
              className="w-full"
              onClick={handleSubmit}
              disabled={!resumeText.trim() || loading}
            >
              {loading ? 'Analyzing Resume...' : 'Get AI Review'}
            </FieldButton>
          </div>
        </FieldCard>

        <div className="space-y-4">
          {feedback ? (
            <>
              <FieldCard className="p-4">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-[#FF6B35] font-mono">{(feedback as Record<string, unknown>).score as number}/100</p>
                  <p className="text-sm text-[#737373]">Resume Score</p>
                </div>
                <Progress value={(feedback as Record<string, unknown>).score as number} className="h-2" />
              </FieldCard>

              {(feedback as Record<string, unknown>).missingKeywords && (
                <FieldCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {((feedback as Record<string, unknown>).missingKeywords as string[]).map((kw: string, i: number) => (
                      <FieldBadge key={i} variant="danger">{kw}</FieldBadge>
                    ))}
                  </div>
                </FieldCard>
              )}

              {(feedback as Record<string, unknown>).weakSections && (
                <FieldCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">Weak Sections</h3>
                  <div className="flex flex-wrap gap-2">
                    {((feedback as Record<string, unknown>).weakSections as string[]).map((s: string, i: number) => (
                      <FieldBadge key={i} variant="warning">{s}</FieldBadge>
                    ))}
                  </div>
                </FieldCard>
              )}

              {(feedback as Record<string, unknown>).improvedSummary && (
                <FieldCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">Improved Professional Summary</h3>
                  <p className="text-sm text-[#404040] whitespace-pre-wrap break-words">{(feedback as Record<string, unknown>).improvedSummary as string}</p>
                </FieldCard>
              )}

              {(feedback as Record<string, unknown>).improvedBullets && ((feedback as Record<string, unknown>).improvedBullets as string[]).length > 0 && (
                <FieldCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">Improved Bullet Points</h3>
                  <ul className="space-y-2">
                    {((feedback as Record<string, unknown>).improvedBullets as string[]).map((b: string, i: number) => (
                      <li key={i} className="text-sm text-[#404040] flex gap-2">
                        <span className="text-[#FF6B35] mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </FieldCard>
              )}

              {(feedback as Record<string, unknown>).skillsRecommendations && (
                <FieldCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#171717] mb-3">Recommended Skills to Add</h3>
                  <div className="flex flex-wrap gap-2">
                    {((feedback as Record<string, unknown>).skillsRecommendations as string[]).map((s: string, i: number) => (
                      <FieldBadge key={i} variant="success">{s}</FieldBadge>
                    ))}
                  </div>
                </FieldCard>
              )}

              {(feedback as Record<string, unknown>).truthWarnings && ((feedback as Record<string, unknown>).truthWarnings as string[]).length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription>
                    <p className="font-medium text-red-700 mb-1">Truthfulness Warnings</p>
                    {((feedback as Record<string, unknown>).truthWarnings as string[]).map((w: string, i: number) => (
                      <p key={i} className="text-sm text-red-600">{w}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {(feedback as Record<string, unknown>).improvedVersion && (
                <FieldCard className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#171717]">Full Improved Resume</h3>
                    <FieldButton variant="ghost" size="sm" onClick={() => setShowComparison(!showComparison)} aria-label={showComparison ? 'Hide comparison' : 'Show comparison'}>
                      <ArrowsLeftRight className="h-3 w-3 mr-1" aria-hidden="true" />
                      {showComparison ? 'Hide' : 'Compare'}
                    </FieldButton>
                  </div>
                  {showComparison ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs font-medium text-[#737373] mb-2">ORIGINAL</p>
                        <div className="bg-red-50 p-3 rounded-md max-h-64 overflow-y-auto text-xs text-[#404040] whitespace-pre-wrap break-words">{resumeText}</div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#737373] mb-2">IMPROVED</p>
                        <div className="bg-green-50 p-3 rounded-md max-h-64 overflow-y-auto text-xs text-[#404040] whitespace-pre-wrap">{(feedback as Record<string, unknown>).improvedVersion as string}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F4F3EE] p-4 rounded-md max-h-64 overflow-y-auto">
                      <p className="text-sm text-[#404040] whitespace-pre-wrap">{(feedback as Record<string, unknown>).improvedVersion as string}</p>
                    </div>
                  )}
                </FieldCard>
              )}

              {(feedback as Record<string, unknown>).improvedVersion && (
                <FieldCard className="p-4">
                  <p className="text-sm font-medium text-[#171717] mb-3">Export Improved Resume</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <FieldButton
                      variant="secondary"
                      className="flex-1 whitespace-nowrap"
                      onClick={() => handleExport('docx')}
                      disabled={exporting}
                    >
                      <FileArrowDown className="h-4 w-4 mr-2" aria-hidden="true" />
                      {exporting ? 'Exporting...' : 'Download DOCX'}
                    </FieldButton>
                    <FieldButton
                      variant="secondary"
                      className="flex-1 whitespace-nowrap"
                      onClick={() => handleExport('pdf')}
                      disabled={exporting}
                    >
                      <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                      {exporting ? 'Exporting...' : 'Download PDF'}
                    </FieldButton>
                  </div>
                </FieldCard>
              )}
            </>
          ) : (
            <FieldCard className="p-8 text-center">
              <Image
                src="/images/illustrations/resume-transformation.png"
                alt="See how your resume transforms with AI-powered review"
                width={300}
                height={200}
                className="w-full max-w-xs h-auto mx-auto mb-4"
              />
              <p className="text-[#737373]">Submit your resume to get AI-powered feedback</p>
            </FieldCard>
          )}
        </div>
      </div>

      <FieldCard className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[#171717] mb-4">Resume Scoring Rubric</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
          <div className="flex justify-between p-2 bg-[#F4F3EE] rounded gap-2"><span className="truncate text-[#404040]">Amazon relevance</span><span className="font-medium shrink-0 text-[#171717]">25%</span></div>
          <div className="flex justify-between p-2 bg-[#F4F3EE] rounded gap-2"><span className="truncate text-[#404040]">Role-specific keywords</span><span className="font-medium shrink-0 text-[#171717]">20%</span></div>
          <div className="flex justify-between p-2 bg-[#F4F3EE] rounded gap-2"><span className="truncate text-[#404040]">Proof of skills</span><span className="font-medium shrink-0 text-[#171717]">20%</span></div>
          <div className="flex justify-between p-2 bg-[#F4F3EE] rounded gap-2"><span className="truncate text-[#404040]">Clarity & formatting</span><span className="font-medium shrink-0 text-[#171717]">15%</span></div>
          <div className="flex justify-between p-2 bg-[#F4F3EE] rounded gap-2"><span className="truncate text-[#404040]">Metrics & specificity</span><span className="font-medium shrink-0 text-[#171717]">10%</span></div>
          <div className="flex justify-between p-2 bg-[#F4F3EE] rounded gap-2"><span className="truncate text-[#404040]">Truthfulness</span><span className="font-medium shrink-0 text-[#171717]">10%</span></div>
        </div>
      </FieldCard>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, reason: '', recommendedTier: 'starter' })}
        feature="Resume Review"
        reason={upgradeModal.reason}
        currentTier={currentTier}
        recommendedTier={upgradeModal.recommendedTier}
      />
    </div>
  );
}
