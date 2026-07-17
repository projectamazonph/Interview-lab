'use client';

// Interview Lab is free — all features available to all users.

export function useSubscription() {
  return {
    usage: {
      interviewsThisWeek: 0,
      resumeReviewsThisMonth: 0,
      coverLettersThisMonth: 0,
      practiceTestsThisMonth: 0,
    },
    limits: {
      interviewsPerWeek: -1,
      resumeReviewsPerMonth: -1,
      coverLettersPerMonth: -1,
      practiceTestsPerMonth: -1,
    },
    currentTier: 'free' as const,
    loading: false,
  };
}
