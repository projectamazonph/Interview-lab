import { entitlement, type Feature, type Usage } from './subscription/entitlement';

export interface SubscriptionCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number | null;
  upgradeTo?: never;
}

// Interview Lab is a free companion to Project Amazon PH Academy.
// All features are available to all users — no tier gating.
// These helpers keep the previous check*Access() signatures so existing callers
// keep working, but they now delegate to the explicit EntitlementService
// (see src/lib/subscription/entitlement.ts) instead of silently returning true.

const usage: Usage = {
  interviewsThisWeek: 0,
  resumeReviewsThisMonth: 0,
  coverLettersThisMonth: 0,
  practiceTestsThisMonth: 0,
};

function guard(feature: Feature): SubscriptionCheck {
  const allowed = entitlement.canAccess(feature) && entitlement.checkUsage(feature, usage).allowed;
  return allowed
    ? { allowed: true, remaining: null }
    : { allowed: false, reason: 'Not available on the free tier' };
}

export function checkInterviewAccess(_userTier: string, _interviewsThisWeek: number): SubscriptionCheck {
  return guard('interview');
}

export function checkResumeAccess(_userTier: string, _reviewsThisMonth: number): SubscriptionCheck {
  return guard('resume');
}

export function checkCoverLetterAccess(_userTier: string, _lettersThisMonth: number): SubscriptionCheck {
  return guard('coverLetter');
}

export function checkPracticeTestAccess(_userTier: string, _testsThisMonth: number): SubscriptionCheck {
  return guard('practiceTest');
}

export function checkQuestionBankAccess(_userTier: string, _questionDifficulty: string): SubscriptionCheck {
  return guard('questionBank');
}

export function checkDownloadAccess(_userTier: string, _requiredTier: string): SubscriptionCheck {
  return guard('download');
}

export function checkGuideAccess(_userTier: string, _guideLevel: string): SubscriptionCheck {
  return guard('guide');
}
