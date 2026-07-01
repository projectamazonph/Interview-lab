'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { Resume, ROLES } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
      fetch('/api/resume', { headers: { 'x-user-id': user.id } })
        .then(res => res.json())
        .then(data => setResumes(data.resumes || []))
        .catch(console.error);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!resumeText.trim() || !user) return;

    // Check subscription limit
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
      // Step 1: Create resume record
      const createRes = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ originalText: resumeText, targetRole }),
      });
      if (!createRes.ok) {
        setError('Failed to create resume record. Please try again.');
        return;
      }
      const resume = await createRes.json();

      // Step 2: AI review
      const reviewRes = await fetch('/api/ai/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(user ? { 'x-user-id': user.id } : {}) },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      if (!reviewRes.ok) {
        setError('Failed to get AI review. Please try again.');
        return;
      }
      const reviewData = await reviewRes.json();
      setFeedback(reviewData);

      // Step 3: Update resume with review data
      const updateRes = await fetch(`/api/resume/${resume.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          score: reviewData.score,
          improvedVersion: reviewData.improvedVersion,
          truthFlags: reviewData.truthWarnings,
        }),
      });
      if (!updateRes.ok) {
        setError('AI review completed, but failed to save review data. Your feedback is still shown below.');
        // Don't return here - the feedback is still useful to the user
      }

      // Refresh resume history
      const histRes = await fetch('/api/resume', { headers: { 'x-user-id': user.id } });
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
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
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
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-heading">Resume Lab</h2>
          <p className="text-text-muted mt-1 text-sm sm:text-base">Get AI-powered resume review and improvement suggestions</p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="shrink-0 whitespace-nowrap focus:ring-2 focus:ring-accent-violet focus:ring-offset-1" aria-label={showHistory ? 'Hide history' : 'Show history'}>
          <ClockIcon className="h-4 w-4 mr-2" aria-hidden="true" />
          {showHistory ? 'Hide History' : 'History'} ({resumes.length})
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Resume History */}
      {showHistory && resumes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Previous Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resumes.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-glass/40 rounded-lg gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.targetRole || 'General'} Resume</p>
                    <p className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.score !== null && r.score !== undefined && (
                      <Badge variant="outline" className="text-accent-indigo">{r.score}/100</Badge>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs"
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
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Resume</CardTitle>
            <CardDescription>Paste your resume text for AI review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume Text</label>
              <Textarea
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={12}
              />
            </div>
            <Button
              className="w-full bg-accent-violet hover:bg-accent-indigo"
              onClick={handleSubmit}
              disabled={!resumeText.trim() || loading}
            >
              {loading ? 'Analyzing Resume...' : 'Get AI Review'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {feedback ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-accent-indigo font-mono">{(feedback as Record<string, unknown>).score as number}/100</p>
                    <p className="text-sm text-text-muted">Resume Score</p>
                  </div>
                  <Progress value={(feedback as Record<string, unknown>).score as number} className="h-2" />
                </CardContent>
              </Card>

              {(feedback as Record<string, unknown>).missingKeywords && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Missing Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {((feedback as Record<string, unknown>).missingKeywords as string[]).map((kw: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-red-50 text-red-700">{kw}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(feedback as Record<string, unknown>).weakSections && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Weak Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {((feedback as Record<string, unknown>).weakSections as string[]).map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-700">{s}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(feedback as Record<string, unknown>).improvedSummary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Improved Professional Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{(feedback as Record<string, unknown>).improvedSummary as string}</p>
                  </CardContent>
                </Card>
              )}

              {(feedback as Record<string, unknown>).improvedBullets && ((feedback as Record<string, unknown>).improvedBullets as string[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Improved Bullet Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {((feedback as Record<string, unknown>).improvedBullets as string[]).map((b: string, i: number) => (
                        <li key={i} className="text-sm text-text-secondary flex gap-2">
                          <span className="text-accent-indigo mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {(feedback as Record<string, unknown>).skillsRecommendations && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recommended Skills to Add</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {((feedback as Record<string, unknown>).skillsRecommendations as string[]).map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-green-200 text-green-700">{s}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Full Improved Resume</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowComparison(!showComparison)} aria-label={showComparison ? 'Hide comparison' : 'Show comparison'}>
                        <ArrowsLeftRight className="h-3 w-3 mr-1" aria-hidden="true" />
                        {showComparison ? 'Hide' : 'Compare'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showComparison ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs font-medium text-text-muted mb-2">ORIGINAL</p>
                          <div className="bg-red-50 p-3 rounded-lg max-h-64 overflow-y-auto text-xs text-text-secondary whitespace-pre-wrap break-words">{resumeText}</div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-muted mb-2">IMPROVED</p>
                          <div className="bg-green-50 p-3 rounded-lg max-h-64 overflow-y-auto text-xs text-text-secondary whitespace-pre-wrap">{(feedback as Record<string, unknown>).improvedVersion as string}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-glass/40 p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{(feedback as Record<string, unknown>).improvedVersion as string}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Export Buttons */}
              {(feedback as Record<string, unknown>).improvedVersion && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Export Improved Resume</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 whitespace-nowrap"
                        onClick={() => handleExport('docx')}
                        disabled={exporting}
                      >
                        <FileArrowDown className="h-4 w-4 mr-2" aria-hidden="true" />
                        {exporting ? 'Exporting...' : 'Download DOCX'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 whitespace-nowrap"
                        onClick={() => handleExport('pdf')}
                        disabled={exporting}
                      >
                        <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                        {exporting ? 'Exporting...' : 'Download PDF'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-text-muted">
                <Image
                  src="/images/illustrations/resume-transformation.png"
                  alt="See how your resume transforms with AI-powered review"
                  width={300}
                  height={200}
                  className="w-full max-w-xs h-auto mx-auto mb-4"
                />
                <p>Submit your resume to get AI-powered feedback</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scoring Rubric */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resume Scoring Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
            <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Amazon relevance</span><span className="font-medium shrink-0">25%</span></div>
            <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Role-specific keywords</span><span className="font-medium shrink-0">20%</span></div>
            <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Proof of skills</span><span className="font-medium shrink-0">20%</span></div>
            <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Clarity & formatting</span><span className="font-medium shrink-0">15%</span></div>
            <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Metrics & specificity</span><span className="font-medium shrink-0">10%</span></div>
            <div className="flex justify-between p-2 bg-glass/40 rounded gap-2"><span className="truncate">Truthfulness</span><span className="font-medium shrink-0">10%</span></div>
          </div>
        </CardContent>
      </Card>

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
