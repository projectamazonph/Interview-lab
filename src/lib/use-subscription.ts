'use client';

import { entitlement } from './subscription/entitlement';

// Interview Lab is free — all features available to all users.
// Usage/limits are sourced from the explicit EntitlementService so the values
// are honest (null = unlimited) rather than magic -1 sentinels.

export function useSubscription() {
  return {
    usage: {
      interviewsThisWeek: 0,
      resumeReviewsThisMonth: 0,
      coverLettersThisMonth: 0,
      practiceTestsThisMonth: 0,
    },
    limits: {
      interviewsPerWeek: entitlement.limits.interviewsPerWeek,
      resumeReviewsPerMonth: entitlement.limits.resumeReviewsPerMonth,
      coverLettersPerMonth: entitlement.limits.coverLettersPerMonth,
      practiceTestsPerMonth: entitlement.limits.practiceTestsPerMonth,
    },
    currentTier: entitlement.tier,
    loading: false,
  };
}
