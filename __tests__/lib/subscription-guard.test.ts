/**
 * Covers src/lib/subscription-guard.ts. Per CLAUDE.md, subscriptions are
 * dormant — every check*Access() helper must be a no-op that always allows,
 * regardless of the tier/usage args passed in. This locks that contract in
 * so a future edit can't silently reintroduce tier gating (or leave it
 * half-wired) without a test failing.
 */
import { describe, it, expect } from 'vitest';
import {
  checkInterviewAccess,
  checkResumeAccess,
  checkCoverLetterAccess,
  checkPracticeTestAccess,
  checkQuestionBankAccess,
  checkDownloadAccess,
  checkGuideAccess,
} from '@/lib/subscription-guard';

describe('subscription-guard (dormant — always allow)', () => {
  it.each([
    ['checkInterviewAccess', () => checkInterviewAccess('free', 999)],
    ['checkResumeAccess', () => checkResumeAccess('free', 999)],
    ['checkCoverLetterAccess', () => checkCoverLetterAccess('free', 999)],
    ['checkPracticeTestAccess', () => checkPracticeTestAccess('free', 999)],
    ['checkQuestionBankAccess', () => checkQuestionBankAccess('free', 'advanced')],
    ['checkDownloadAccess', () => checkDownloadAccess('free', 'pro')],
    ['checkGuideAccess', () => checkGuideAccess('free', 'advanced')],
  ])('%s allows regardless of tier/usage args', (_name, run) => {
    const result = run();
    expect(result).toEqual({ allowed: true, remaining: null });
  });

  it('is indifferent to the tier argument (e.g. an unrecognized tier string)', () => {
    expect(checkInterviewAccess('nonexistent-tier', 0)).toEqual({ allowed: true, remaining: null });
  });

  it('is indifferent to extreme usage values', () => {
    expect(checkResumeAccess('free', Number.MAX_SAFE_INTEGER)).toEqual({ allowed: true, remaining: null });
  });
});
