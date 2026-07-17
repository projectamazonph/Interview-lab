import { TierKey } from './pricing';

export interface SubscriptionCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  upgradeTo?: TierKey;
}

// Interview Lab is a free companion to Project Amazon PH Academy.
// All features are available to all users — no tier gating.

export function checkInterviewAccess(userTier: string, interviewsThisWeek: number): SubscriptionCheck {
  void userTier; void interviewsThisWeek;
  return { allowed: true };
}

export function checkResumeAccess(userTier: string, reviewsThisMonth: number): SubscriptionCheck {
  void userTier; void reviewsThisMonth;
  return { allowed: true };
}

export function checkCoverLetterAccess(userTier: string, lettersThisMonth: number): SubscriptionCheck {
  void userTier; void lettersThisMonth;
  return { allowed: true };
}

export function checkPracticeTestAccess(userTier: string, testsThisMonth: number): SubscriptionCheck {
  void userTier; void testsThisMonth;
  return { allowed: true };
}

export function checkQuestionBankAccess(userTier: string, questionDifficulty: string): SubscriptionCheck {
  void userTier; void questionDifficulty;
  return { allowed: true };
}

export function checkDownloadAccess(userTier: string, requiredTier: string): SubscriptionCheck {
  void userTier; void requiredTier;
  return { allowed: true };
}

export function checkGuideAccess(userTier: string, guideLevel: string): SubscriptionCheck {
  void userTier; void guideLevel;
  return { allowed: true };
}
