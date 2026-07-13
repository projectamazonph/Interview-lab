/**
 * Currency configuration for the application.
 * All prices are in Philippine Peso (PHP / ₱).
 */
export const CURRENCY = {
  code: 'PHP',
  symbol: '₱',
  locale: 'fil-PH',
} as const;

/**
 * Format a price in PHP with the ₱ symbol.
 * Examples: formatPrice(0) → '₱0' | formatPrice(499) → '₱499' | formatPrice(499.99) → '₱499.99'
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return `${CURRENCY.symbol}0`;
  if (Number.isInteger(amount)) return `${CURRENCY.symbol}${amount.toLocaleString()}`;
  return `${CURRENCY.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    priceId: '',
    yearlyPriceId: '',
    description: 'Get started with basic interview prep',
    features: [
      'Access to beginner question bank',
      '1 mock interview per week',
      'Basic resume review',
      'Basic cover letter generation',
      'Free-tier downloads only',
      'Beginner learning paths',
    ],
    limits: {
      interviewsPerWeek: 1,
      resumeReviewsPerMonth: 1,
      coverLettersPerMonth: 1,
      questionBankAccess: 'beginner' as const,
      downloadAccess: 'free' as const,
      guideAccess: 'beginner' as const,
      practiceTestsPerMonth: 2,
    },
  },
  starter: {
    name: 'Starter',
    price: 499, // ₱499/mo
    yearlyPrice: 399, // ₱399/mo when billed yearly (₱4,788/yr)
    priceId: '',
    yearlyPriceId: '',
    description: 'Everything you need for interview prep',
    features: [
      'All question difficulties (beginner + intermediate)',
      '5 mock interviews per week',
      'Unlimited resume reviews',
      'Unlimited cover letters',
      'Starter-tier downloads',
      'Beginner + intermediate learning paths',
      '5 practice tests per month',
      'Export to DOCX & PDF',
    ],
    limits: {
      interviewsPerWeek: 5,
      resumeReviewsPerMonth: -1, // unlimited
      coverLettersPerMonth: -1,
      questionBankAccess: 'intermediate' as const,
      downloadAccess: 'starter' as const,
      guideAccess: 'intermediate' as const,
      practiceTestsPerMonth: 5,
    },
  },
  pro: {
    name: 'Pro',
    price: 999, // ₱999/mo
    yearlyPrice: 799, // ₱799/mo when billed yearly (₱9,588/yr)
    priceId: '',
    yearlyPriceId: '',
    description: 'Full access to everything',
    features: [
      'All question difficulties including advanced',
      'Unlimited mock interviews',
      'Unlimited resume reviews with AI coaching',
      'Unlimited cover letters with all tones',
      'All downloads including Pro templates',
      'All learning paths including advanced',
      'Unlimited practice tests',
      'Export to DOCX & PDF',
      'Priority AI feedback',
      'Adaptive follow-up questions',
      'Admin dashboard access (on request)',
    ],
    limits: {
      interviewsPerWeek: -1, // unlimited
      resumeReviewsPerMonth: -1,
      coverLettersPerMonth: -1,
      questionBankAccess: 'advanced' as const,
      downloadAccess: 'pro' as const,
      guideAccess: 'advanced' as const,
      practiceTestsPerMonth: -1,
    },
  },
} as const;

export type TierKey = keyof typeof PRICING_TIERS;

export const TIER_HIERARCHY: Record<TierKey, number> = { free: 0, starter: 1, pro: 2 };

export function canAccessTier(userTier: string, requiredTier: string): boolean {
  return (TIER_HIERARCHY[userTier as TierKey] ?? 0) >= (TIER_HIERARCHY[requiredTier as TierKey] ?? 0);
}

export type BillingPeriod = 'monthly' | 'yearly';

export interface PricingTierConfig {
  name: string;
  price: number;
  yearlyPrice: number;
  priceId: string;
  yearlyPriceId: string;
  description: string;
  features: readonly string[];
  limits: {
    interviewsPerWeek: number;
    resumeReviewsPerMonth: number;
    coverLettersPerMonth: number;
    questionBankAccess: string;
    downloadAccess: string;
    guideAccess: string;
    practiceTestsPerMonth: number;
  };
}

export function getTierPrice(tier: TierKey, billing: BillingPeriod): number {
  const config = PRICING_TIERS[tier];
  if (billing === 'yearly' && config.yearlyPrice > 0) {
    return config.yearlyPrice;
  }
  return config.price;
}

export function getYearlySavings(tier: TierKey): number {
  const config = PRICING_TIERS[tier];
  const yearlyPrice = config.yearlyPrice as number;
  if (!yearlyPrice) return 0;
  const monthlyTotal = config.price * 12;
  const yearlyTotal = yearlyPrice * 12;
  return Math.round((monthlyTotal - yearlyTotal) * 100) / 100;
}
