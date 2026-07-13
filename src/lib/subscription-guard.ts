import { PRICING_TIERS, TierKey, canAccessTier } from './pricing';

export interface SubscriptionCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  upgradeTo?: TierKey;
}

export function checkInterviewAccess(userTier: string, interviewsThisWeek: number): SubscriptionCheck {
  const tier = PRICING_TIERS[userTier as TierKey] ?? PRICING_TIERS.free;
  const limit = tier.limits.interviewsPerWeek;
  if (limit === -1) return { allowed: true };
  if (interviewsThisWeek < limit) return { allowed: true, remaining: limit - interviewsThisWeek };
  return {
    allowed: false,
    reason: `You've used all ${limit} interviews this week on the ${tier.name} plan.`,
    remaining: 0,
    upgradeTo: userTier === 'free' ? 'starter' : 'pro',
  };
}

export function checkResumeAccess(userTier: string, reviewsThisMonth: number): SubscriptionCheck {
  const tier = PRICING_TIERS[userTier as TierKey] ?? PRICING_TIERS.free;
  const limit = tier.limits.resumeReviewsPerMonth;
  if (limit === -1) return { allowed: true };
  if (reviewsThisMonth < limit) return { allowed: true, remaining: limit - reviewsThisMonth };
  return {
    allowed: false,
    reason: `You've used all ${limit} resume reviews this month on the ${tier.name} plan.`,
    remaining: 0,
    upgradeTo: 'starter',
  };
}

export function checkCoverLetterAccess(userTier: string, lettersThisMonth: number): SubscriptionCheck {
  const tier = PRICING_TIERS[userTier as TierKey] ?? PRICING_TIERS.free;
  const limit = tier.limits.coverLettersPerMonth;
  if (limit === -1) return { allowed: true };
  if (lettersThisMonth < limit) return { allowed: true, remaining: limit - lettersThisMonth };
  return {
    allowed: false,
    reason: `You've used all ${limit} cover letter generations this month on the ${tier.name} plan.`,
    remaining: 0,
    upgradeTo: 'starter',
  };
}

export function checkPracticeTestAccess(userTier: string, testsThisMonth: number): SubscriptionCheck {
  const tier = PRICING_TIERS[userTier as TierKey] ?? PRICING_TIERS.free;
  const limit = tier.limits.practiceTestsPerMonth;
  if (limit === -1) return { allowed: true };
  if (testsThisMonth < limit) return { allowed: true, remaining: limit - testsThisMonth };
  return {
    allowed: false,
    reason: `You've used all ${limit} practice tests this month on the ${tier.name} plan.`,
    remaining: 0,
    upgradeTo: userTier === 'free' ? 'starter' : 'pro',
  };
}

export function checkQuestionBankAccess(userTier: string, questionDifficulty: string): SubscriptionCheck {
  const tier = PRICING_TIERS[userTier as TierKey] ?? PRICING_TIERS.free;
  const accessLevel = tier.limits.questionBankAccess;
  const hierarchy: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  const userLevel = hierarchy[accessLevel] ?? 0;
  const required = hierarchy[questionDifficulty] ?? 0;
  if (userLevel >= required) return { allowed: true };
  const upgradeTo: TierKey = accessLevel === 'beginner' ? 'starter' : 'pro';
  return {
    allowed: false,
    reason: `${questionDifficulty} questions require the ${upgradeTo === 'starter' ? 'Starter' : 'Pro'} plan.`,
    upgradeTo,
  };
}

export function checkDownloadAccess(userTier: string, requiredTier: string): SubscriptionCheck {
  if (canAccessTier(userTier, requiredTier)) return { allowed: true };
  const upgradeTo: TierKey = requiredTier === 'starter' ? 'starter' : 'pro';
  return {
    allowed: false,
    reason: `This download requires the ${requiredTier === 'starter' ? 'Starter' : 'Pro'} plan.`,
    upgradeTo,
  };
}

export function checkGuideAccess(userTier: string, guideLevel: string): SubscriptionCheck {
  const tier = PRICING_TIERS[userTier as TierKey] ?? PRICING_TIERS.free;
  const accessLevel = tier.limits.guideAccess;
  const hierarchy: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
  const userLevel = hierarchy[accessLevel] ?? 0;
  const required = hierarchy[guideLevel] ?? 0;
  if (userLevel >= required) return { allowed: true };
  const upgradeTo: TierKey = accessLevel === 'beginner' ? 'starter' : 'pro';
  return {
    allowed: false,
    reason: `${guideLevel} guides require the ${upgradeTo === 'starter' ? 'Starter' : 'Pro'} plan.`,
    upgradeTo,
  };
}
