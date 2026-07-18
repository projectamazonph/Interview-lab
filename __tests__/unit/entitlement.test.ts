import { describe, it, expect } from 'vitest';
import {
  entitlement,
  FreeEntitlement,
  type Feature,
} from '@/lib/subscription/entitlement';

const FEATURES: Feature[] = [
  'interview',
  'resume',
  'coverLetter',
  'practiceTest',
  'questionBank',
  'download',
  'guide',
];

describe('FreeEntitlement', () => {
  const svc = new FreeEntitlement();

  it('reports the free tier', () => {
    expect(svc.tier).toBe('free');
  });

  it('allows every feature', () => {
    for (const f of FEATURES) {
      expect(svc.canAccess(f)).toBe(true);
    }
  });

  it('reports unlimited usage with null remaining', () => {
    const result = svc.checkUsage('interview', {
      interviewsThisWeek: 999,
      resumeReviewsThisMonth: 0,
      coverLettersThisMonth: 0,
      practiceTestsThisMonth: 0,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeNull();
  });

  it('exposes null (unlimited) limits, not magic -1', () => {
    expect(svc.limits.interviewsPerWeek).toBeNull();
    expect(svc.limits.resumeReviewsPerMonth).toBeNull();
    expect(svc.limits.coverLettersPerMonth).toBeNull();
    expect(svc.limits.practiceTestsPerMonth).toBeNull();
  });
});

describe('entitlement singleton', () => {
  it('is a FreeEntitlement instance', () => {
    expect(entitlement).toBeInstanceOf(FreeEntitlement);
    expect(entitlement.tier).toBe('free');
  });
});
