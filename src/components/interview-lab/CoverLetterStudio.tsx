'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { CoverLetter, ROLES } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileArrowDown, FileText, Clock, ArrowClockwise } from '@phosphor-icons/react';
import { UpgradeModal } from '@/components/interview-lab/UpgradeModal';
import { checkCoverLetterAccess } from '@/lib/subscription-guard';
import { useSubscription } from '@/lib/use-subscription';

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal Job Application', desc: 'Traditional corporate application letter' },
  { value: 'conversational', label: 'Conversational', desc: 'Warm, approachable tone' },
  { value: 'beginner_friendly', label: 'Beginner-Friendly', desc: 'Emphasizes learning and potential' },
  { value: 'agency', label: 'Agency Role', desc: 'Targets agency and multi-client positions' },
  { value: 'upwork', label: 'Upwork Proposal', desc: 'Optimized for freelance platforms' },
  { value: 'cold_email', label: 'Cold Email', desc: 'Direct outreach to hiring managers' },
  { value: 'linkedin', label: 'LinkedIn Message', desc: 'Professional networking message' },
  { value: 'professional', label: 'Professional / Corporate', desc: 'Polished and business-formal' },
];

export function CoverLetterStudio() {
  const { user } = useAuth();
  const { usage, currentTier } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; reason: string; recommendedTier: string }>({ open: false, reason: '', recommendedTier: 'starter' });
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('formal');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetch('/api/cover-letter')
        .then(res => res.json())
        .then(data => setCoverLetters(data.coverLetters || []))
        .catch(console.error);
    }
  }, [user]);

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !user) return;

    // Check subscription limit
    const lettersThisMonth = usage?.coverLettersThisMonth ?? 0;
    const accessCheck = checkCoverLetterAccess(currentTier, lettersThisMonth);
    if (!accessCheck.allowed) {
      setUpgradeModal({
        open: true,
        reason: accessCheck.reason || 'Cover letter limit reached',
        recommendedTier: accessCheck.upgradeTo || 'starter',
      });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          tone,
          targetRole,
          userName: user.name,
        }),
      });
      const data = await res.json();

      await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ jobDescription, tone, generatedLetter: data.draftLetter, truthFlags: data.claimsToVerify }),
      });

      setResult(data);

      // Refresh history
      const histRes = await fetch('/api/cover-letter');
      const histData = await histRes.json();
      setCoverLetters(histData.coverLetters || []);
    } catch (error) {
      console.error('Cover letter generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!result || !(result as Record<string, unknown>).draftLetter || !user) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({
          type: format,
          content: (result as Record<string, unknown>).draftLetter as string,
          title: `Cover Letter - ${targetRole || 'Amazon VA'} - ${tone}`,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${tone}.${format}`;
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
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-heading">Cover Letter Studio</h2>
          <p className="text-text-muted mt-1 text-sm sm:text-base">Generate tailored cover letters with truthfulness guardrails</p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="shrink-0 whitespace-nowrap focus:ring-2 focus:ring-accent-violet focus:ring-offset-1" aria-label={showHistory ? 'Hide history' : 'Show history'}>
          <Clock weight="light" className="h-4 w-4 mr-2" aria-hidden="true" />
          {showHistory ? 'Hide History' : 'History'} ({coverLetters.length})
        </Button>
      </div>

      {/* Cover Letter History */}
      {showHistory && coverLetters.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Previous Cover Letters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coverLetters.map((cl) => (
                <div key={cl.id} className="flex items-center justify-between p-3 bg-glass/40 rounded-lg gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{cl.tone || 'Formal'} Cover Letter</p>
                    <p className="text-xs text-text-muted">{new Date(cl.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{cl.tone}</Badge>
                    <Button size="sm" variant="ghost" className="text-xs"
                      onClick={() => {
                        if (cl.generatedLetter) {
                          setResult({ draftLetter: cl.generatedLetter, claimsToVerify: cl.truthFlags ? (() => { try { return JSON.parse(cl.truthFlags); } catch { return []; } })() : [] });
                        }
                        if (cl.jobDescription) setJobDescription(cl.jobDescription);
                        if (cl.tone) setTone(cl.tone);
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
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>Paste the job description to generate a tailored cover letter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span>{opt.label}</span>
                      <span className="text-text-muted text-xs ml-1">— {opt.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-muted">{TONE_OPTIONS.find(o => o.value === tone)?.desc}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Job Description</Label>
                <span className="text-xs text-text-muted tabular-nums font-mono">{jobDescription.length} chars</span>
              </div>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-accent-violet hover:bg-accent-indigo whitespace-nowrap text-sm"
                onClick={handleGenerate}
                disabled={!jobDescription.trim() || loading}
              >
                {loading ? 'Generating...' : 'Generate Letter'}
              </Button>
              {result && (
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={!jobDescription.trim() || loading}
                  title="Regenerate with same settings"
                  aria-label="Regenerate cover letter"
                  className="shrink-0"
                >
                  <ArrowClockwise weight="light" className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="secondary" className="bg-accent-violet/15 text-accent-indigo">{tone}</Badge>
                    Generated Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-glass/40 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{(result as Record<string, unknown>).draftLetter as string}</p>
                  </div>
                </CardContent>
              </Card>

              {(result as Record<string, unknown>).shorterVersion && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Shorter Version</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{(result as Record<string, unknown>).shorterVersion as string}</p>
                  </CardContent>
                </Card>
              )}

              {(result as Record<string, unknown>).subjectLine && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Subject Line / Proposal Opener</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-secondary">{(result as Record<string, unknown>).subjectLine as string}</p>
                  </CardContent>
                </Card>
              )}

              {(result as Record<string, unknown>).customizationTips && ((result as Record<string, unknown>).customizationTips as string[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customization Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {((result as Record<string, unknown>).customizationTips as string[]).map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-text-secondary flex gap-2">
                          <span className="text-accent-indigo">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {(result as Record<string, unknown>).claimsToVerify && ((result as Record<string, unknown>).claimsToVerify as string[]).length > 0 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription>
                    <p className="font-medium text-amber-700 mb-1">Claims to Verify Before Sending</p>
                    {((result as Record<string, unknown>).claimsToVerify as string[]).map((c: string, i: number) => (
                      <p key={i} className="text-sm text-amber-600">{c}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Export Buttons */}
              {(result as Record<string, unknown>).draftLetter && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Export Cover Letter</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 whitespace-nowrap"
                        onClick={() => handleExport('docx')}
                        disabled={exporting}
                      >
                        <FileArrowDown weight="light" className="h-4 w-4 mr-2" aria-hidden="true" />
                        {exporting ? 'Exporting...' : 'Download DOCX'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 whitespace-nowrap"
                        onClick={() => handleExport('pdf')}
                        disabled={exporting}
                      >
                        <FileText weight="light" className="h-4 w-4 mr-2" aria-hidden="true" />
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
                  src="/images/illustrations/cover-letter-transformation.png"
                  alt="Transform your job applications with AI-generated cover letters"
                  width={300}
                  height={200}
                  className="w-full max-w-xs h-auto mx-auto mb-4"
                />
                <p>Paste a job description to generate a tailored cover letter</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cover Letter Structure Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cover Letter Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
            <div className="p-2 bg-glass/40 rounded">1. Role-specific opening</div>
            <div className="p-2 bg-glass/40 rounded">2. Relevant Amazon/VA skills</div>
            <div className="p-2 bg-glass/40 rounded">3. Proof of process discipline</div>
            <div className="p-2 bg-glass/40 rounded">4. Tool familiarity</div>
            <div className="p-2 bg-glass/40 rounded">5. Practical value proposition</div>
            <div className="p-2 bg-glass/40 rounded">6. Confident close</div>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false, reason: '', recommendedTier: 'starter' })}
        feature="Cover Letter Studio"
        reason={upgradeModal.reason}
        currentTier={currentTier}
        recommendedTier={upgradeModal.recommendedTier}
      />
    </div>
  );
}
