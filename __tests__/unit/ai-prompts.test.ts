/**
 * Covers the per-feature AI configs in src/lib/ai/{coach,resume,cover-letter,
 * assessment}.ts — previously only the generic createAIHandler factory was
 * tested, not these prompt-building/validation/fallback modules themselves.
 *
 * Per CLAUDE.md / docs/07-guardrails.md, AI-generated content must carry
 * truthfulness warnings and must not fabricate experience or guarantee
 * outcomes — this file asserts that language is actually present in the
 * system prompts, so an edit that silently drops a guardrail fails a test.
 */
import { describe, it, expect } from 'vitest';
import { coachConfig, errorFeedback } from '@/lib/ai/coach';
import { resumeReviewConfig } from '@/lib/ai/resume';
import { coverLetterConfig } from '@/lib/ai/cover-letter';
import { assessmentScoreConfig } from '@/lib/ai/assessment';

describe('coachConfig', () => {
  it('system prompt forbids fabricating experience and guaranteeing outcomes', () => {
    expect(coachConfig.systemPrompt).toMatch(/must not claim the user has experience/i);
    expect(coachConfig.systemPrompt).toMatch(/never guarantee job placement/i);
  });

  it('validate rejects a body missing question/userAnswer', () => {
    const result = coachConfig.validate({ question: 'Q' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it('validate accepts a complete body', () => {
    const result = coachConfig.validate({ question: 'Q', userAnswer: 'A' });
    expect(result.ok).toBe(true);
  });

  it('buildUserPrompt includes the question, context, and answer', () => {
    const prompt = coachConfig.buildUserPrompt({ question: 'What is ACoS?', userAnswer: 'A ratio', questionContext: 'PPC basics' });
    expect(prompt).toContain('What is ACoS?');
    expect(prompt).toContain('PPC basics');
    expect(prompt).toContain('A ratio');
  });

  it('buildUserPrompt falls back to a generic context when none is given', () => {
    const prompt = coachConfig.buildUserPrompt({ question: 'Q', userAnswer: 'A' });
    expect(prompt).toContain('General Amazon VA interview question');
  });

  it('onParseFailure degrades gracefully to a fallback score (200, not an error)', () => {
    const outcome = coachConfig.onParseFailure({ question: 'Q', userAnswer: 'A' });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.score).toBe(5);
      expect(outcome.value.rubricBreakdown).toBeDefined();
    }
  });

  it('onProviderError returns the same shape as errorFeedback()', () => {
    const outcome = coachConfig.onProviderError!({ question: 'Q', userAnswer: 'A' });
    expect(outcome).toEqual({ ok: true, value: errorFeedback() });
  });

  it('normalize fills in a weakness-targeted follow-up when score < 7 and none was given', () => {
    const result = coachConfig.normalize!({
      score: 4, whatWorked: 'x', whatToImprove: 'y', strongerSampleAnswer: 'z', rubricBreakdown: {},
    }, { question: 'How do you calculate ACoS?', userAnswer: 'A' });
    expect(result.followUpQuestion).toMatch(/How do you calculate ACoS\?/);
    expect(result.followUpQuestion).toMatch(/more detail/i);
  });

  it('normalize fills in a deepening follow-up when score >= 7 and none was given', () => {
    const result = coachConfig.normalize!({
      score: 9, whatWorked: 'x', whatToImprove: 'y', strongerSampleAnswer: 'z', rubricBreakdown: {},
    }, { question: 'Q', userAnswer: 'A' });
    expect(result.followUpQuestion).toMatch(/Good answer/i);
  });

  it('normalize leaves an existing followUpQuestion untouched', () => {
    const result = coachConfig.normalize!({
      score: 2, whatWorked: 'x', whatToImprove: 'y', strongerSampleAnswer: 'z', rubricBreakdown: {},
      followUpQuestion: 'Already set',
    }, { question: 'Q', userAnswer: 'A' });
    expect(result.followUpQuestion).toBe('Already set');
  });
});

describe('resumeReviewConfig', () => {
  it('system prompt warns against inventing certifications and guaranteeing placement', () => {
    expect(resumeReviewConfig.systemPrompt).toMatch(/do not suggest the user has certifications/i);
    expect(resumeReviewConfig.systemPrompt).toMatch(/never guarantee job placement/i);
  });

  it('validate rejects a body missing resumeText', () => {
    expect(resumeReviewConfig.validate({}).ok).toBe(false);
  });

  it('validate rejects resumeText over 20,000 chars', () => {
    const result = resumeReviewConfig.validate({ resumeText: 'a'.repeat(20001) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('too long');
  });

  it('validate accepts a normal-length resumeText', () => {
    expect(resumeReviewConfig.validate({ resumeText: 'My resume' }).ok).toBe(true);
  });

  it('buildUserPrompt defaults targetRole to "Amazon VA"', () => {
    const prompt = resumeReviewConfig.buildUserPrompt({ resumeText: 'My resume' });
    expect(prompt).toContain('Amazon VA');
    expect(prompt).toContain('My resume');
  });

  it('onParseFailure surfaces a 500 error (no silent fabricated review)', () => {
    const outcome = resumeReviewConfig.onParseFailure({ resumeText: 'x' });
    expect(outcome).toEqual({ ok: false, status: 500, error: 'Failed to parse resume review' });
  });

  it('onProviderError degrades gracefully with an empty/zero-score result', () => {
    const outcome = resumeReviewConfig.onProviderError!({ resumeText: 'x' });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value.score).toBe(0);
      expect(outcome.value.truthWarnings).toEqual([]);
    }
  });
});

describe('coverLetterConfig', () => {
  it('system prompt forbids fabricating experience/certifications/metrics', () => {
    expect(coverLetterConfig.systemPrompt).toMatch(/do not fabricate specific experience/i);
    expect(coverLetterConfig.systemPrompt).toMatch(/never guarantee job placement/i);
  });

  it('validate rejects a body missing jobDescription', () => {
    expect(coverLetterConfig.validate({}).ok).toBe(false);
  });

  it('validate rejects jobDescription over 10,000 chars', () => {
    const result = coverLetterConfig.validate({ jobDescription: 'a'.repeat(10001) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('too long');
  });

  it('buildUserPrompt defaults tone to "formal" and name to a placeholder', () => {
    const prompt = coverLetterConfig.buildUserPrompt({ jobDescription: 'We need a PPC VA' });
    expect(prompt).toContain('Tone: formal');
    expect(prompt).toContain('[Your Name]');
    expect(prompt).toContain('We need a PPC VA');
  });

  it('buildUserPrompt honors an explicit tone/name/targetRole', () => {
    const prompt = coverLetterConfig.buildUserPrompt({
      jobDescription: 'desc', tone: 'upwork', targetRole: 'Listing VA', userName: 'Jane',
    });
    expect(prompt).toContain('Tone: upwork');
    expect(prompt).toContain('Listing VA');
    expect(prompt).toContain('Jane');
  });

  it('onParseFailure and onProviderError both degrade gracefully with the same placeholder letter', () => {
    const parseFailure = coverLetterConfig.onParseFailure({ jobDescription: 'x' });
    const providerError = coverLetterConfig.onProviderError!({ jobDescription: 'x' });
    expect(parseFailure).toEqual(providerError);
    expect(parseFailure.ok).toBe(true);
    if (parseFailure.ok) {
      expect(parseFailure.value.draftLetter).toMatch(/unable to generate/i);
    }
  });
});

describe('assessmentScoreConfig', () => {
  it('system prompt avoids guaranteeing test performance or job placement', () => {
    expect(assessmentScoreConfig.systemPrompt).toMatch(/never guarantee job placement or test performance/i);
  });

  it('validate rejects a body missing assessmentTitle/userAnswers', () => {
    expect(assessmentScoreConfig.validate({ assessmentTitle: 'T' }).ok).toBe(false);
  });

  it('validate rejects answers over 50,000 chars (string form)', () => {
    const result = assessmentScoreConfig.validate({ assessmentTitle: 'T', userAnswers: 'a'.repeat(50001) });
    expect(result.ok).toBe(false);
  });

  it('validate rejects answers over 50,000 chars (object form, measured via JSON.stringify)', () => {
    const result = assessmentScoreConfig.validate({ assessmentTitle: 'T', userAnswers: { blob: 'a'.repeat(50001) } });
    expect(result.ok).toBe(false);
  });

  it('validate accepts answers within the length limit', () => {
    expect(assessmentScoreConfig.validate({ assessmentTitle: 'T', userAnswers: 'short answer' }).ok).toBe(true);
  });

  it('buildUserPrompt truncates assessmentData to 5000 chars and defaults to "N/A"', () => {
    const withData = assessmentScoreConfig.buildUserPrompt({ assessmentTitle: 'T', userAnswers: 'A', assessmentData: { big: 'x'.repeat(6000) } });
    expect(withData).toContain('T');
    // Assessment Data section should be capped at 5000 chars of JSON.
    const dataSection = withData.split('Assessment Data: ')[1].split('\n\nUser')[0];
    expect(dataSection.length).toBeLessThanOrEqual(5000);

    const withoutData = assessmentScoreConfig.buildUserPrompt({ assessmentTitle: 'T', userAnswers: 'A' });
    expect(withoutData).toContain('Assessment Data: N/A');
  });

  it('onParseFailure surfaces a 500 (no fabricated score)', () => {
    const outcome = assessmentScoreConfig.onParseFailure({ assessmentTitle: 'T', userAnswers: 'A' });
    expect(outcome).toEqual({ ok: false, status: 500, error: 'Failed to score assessment' });
  });

  it('onProviderError degrades gracefully with a zero score, not a fabricated one', () => {
    const outcome = assessmentScoreConfig.onProviderError!({ assessmentTitle: 'T', userAnswers: 'A' });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.value.score).toBe(0);
  });
});
