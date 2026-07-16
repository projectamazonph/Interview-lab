import { describe, it, expect, beforeEach } from 'vitest';

// --- In-memory pricing model (mirrors src/lib/pricing.ts) ---
const CURRENCY = { code: 'PHP', symbol: '₱' };

const PRICING_TIERS: any = {
  free: { name: 'Free', price: 0, yearlyPrice: 0, limits: { interviewsPerWeek: 1, resumeReviewsPerMonth: 1, coverLettersPerMonth: 1, practiceTestsPerMonth: 2 } },
  starter: { name: 'Starter', price: 499, yearlyPrice: 399, limits: { interviewsPerWeek: 5, resumeReviewsPerMonth: -1, coverLettersPerMonth: -1, practiceTestsPerMonth: 5 } },
  pro: { name: 'Pro', price: 999, yearlyPrice: 799, limits: { interviewsPerWeek: -1, resumeReviewsPerMonth: -1, coverLettersPerMonth: -1, practiceTestsPerMonth: -1 } },
};
const TIER_HIERARCHY: any = { free: 0, starter: 1, pro: 2 };

function getTierPrice(tier: string, billing: string): number {
  const c = PRICING_TIERS[tier];
  if (billing === 'yearly' && c.yearlyPrice > 0) return c.yearlyPrice;
  return c.price;
}

function remaining(limit: number, used: number): number {
  return limit === -1 ? -1 : Math.max(0, limit - used);
}

function percentUsed(limit: number, used: number): number {
  return limit === -1 ? 0 : Math.round((used / limit) * 100);
}

// --- Stubs ---
let currentUser: any = null;
let subscriptions: any[] = [];
let sessions: any[] = [];
let resumes: any[] = [];
let coverLetters: any[] = [];
let agentRuns: any[] = [];
let payments: any[] = [];
let updatedUser: any = null;

function reset() {
  currentUser = null; subscriptions = []; sessions = []; resumes = [];
  coverLetters = []; agentRuns = []; payments = []; updatedUser = null;
}

function req() { return { headers: { get: () => null } }; }
function postReq(body: any) { return { headers: { get: () => null }, json: async () => body }; }

// --- Handlers ---
async function statusGet() {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const sub = subscriptions.find(s => s.userId === currentUser.id);
    const tier = currentUser.subscriptionTier || 'free';
    const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.free;
    const now = new Date();
    const ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0,0,0,0);
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const uSessions = sessions.filter(s => s.userId === currentUser.id && new Date(s.startedAt) >= ws).length;
    const uResumes = resumes.filter(r => r.userId === currentUser.id && new Date(r.createdAt) >= ms).length;
    const uCLs = coverLetters.filter(c => c.userId === currentUser.id && new Date(c.createdAt) >= ms).length;
    const uPT = agentRuns.filter(a => a.userId === currentUser.id && a.agentType === 'practice_test' && new Date(a.createdAt) >= ms).length;
    const rPay = payments.filter(p => p.userId === currentUser.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    return {
      status: 200,
      body: {
        tier, tierName: tierConfig.name, status: sub?.status ?? 'active',
        subscription: sub ? { id: sub.id, tier: sub.tier, status: sub.status } : null,
        limits: tierConfig.limits,
        usage: { interviewsThisWeek: uSessions, resumeReviewsThisMonth: uResumes, coverLettersThisMonth: uCLs, practiceTestsThisMonth: uPT },
        remaining: {
          interviewsThisWeek: remaining(tierConfig.limits.interviewsPerWeek, uSessions),
          resumeReviewsThisMonth: remaining(tierConfig.limits.resumeReviewsPerMonth, uResumes),
          coverLettersThisMonth: remaining(tierConfig.limits.coverLettersPerMonth, uCLs),
          practiceTestsThisMonth: remaining(tierConfig.limits.practiceTestsPerMonth, uPT),
        },
        recentPayments: rPay,
      },
    };
  } catch { return { status: 500, body: { error: 'Failed' } }; }
}

async function usageGet() {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const tier = currentUser.subscriptionTier || 'free';
    const tierConfig = PRICING_TIERS[tier];
    const now = new Date();
    const ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay()); ws.setHours(0,0,0,0);
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const uSessions = sessions.filter(s => s.userId === currentUser.id && new Date(s.startedAt) >= ws).length;
    const uResumes = resumes.filter(r => r.userId === currentUser.id && new Date(r.createdAt) >= ms).length;
    const uCLs = coverLetters.filter(c => c.userId === currentUser.id && new Date(c.createdAt) >= ms).length;
    const uPT = agentRuns.filter(a => a.userId === currentUser.id && a.agentType === 'practice_test' && new Date(a.createdAt) >= ms).length;
    return {
      status: 200,
      body: {
        tier,
        usage: { interviewsThisWeek: uSessions, resumeReviewsThisMonth: uResumes, coverLettersThisMonth: uCLs, practiceTestsThisMonth: uPT },
        limits: tierConfig.limits,
        remaining: {
          interviewsThisWeek: remaining(tierConfig.limits.interviewsPerWeek, uSessions),
          resumeReviewsThisMonth: remaining(tierConfig.limits.resumeReviewsPerMonth, uResumes),
          coverLettersThisMonth: remaining(tierConfig.limits.coverLettersPerMonth, uCLs),
          practiceTestsThisMonth: remaining(tierConfig.limits.practiceTestsPerMonth, uPT),
        },
        percentUsed: {
          interviewsThisWeek: percentUsed(tierConfig.limits.interviewsPerWeek, uSessions),
          resumeReviewsThisMonth: percentUsed(tierConfig.limits.resumeReviewsPerMonth, uResumes),
          coverLettersThisMonth: percentUsed(tierConfig.limits.coverLettersPerMonth, uCLs),
          practiceTestsThisMonth: percentUsed(tierConfig.limits.practiceTestsPerMonth, uPT),
        },
      },
    };
  } catch { return { status: 500, body: { error: 'Failed' } }; }
}

async function checkoutPost(request: any) {
  try {
    if (!currentUser) return { status: 401, body: { error: 'Unauthorized' } };
    const { tier, billing = 'monthly' } = await request.json();
    if (!['starter', 'pro'].includes(tier)) return { status: 400, body: { error: 'Invalid tier. Must be "starter" or "pro".' } };
    if (!['monthly', 'yearly'].includes(billing)) return { status: 400, body: { error: 'Invalid billing period.' } };
    const curLevel = TIER_HIERARCHY[currentUser.subscriptionTier] ?? 0;
    const reqLevel = TIER_HIERARCHY[tier] ?? 0;
    if (curLevel >= reqLevel) return { status: 400, body: { error: `You are already on the ${PRICING_TIERS[currentUser.subscriptionTier]?.name} plan or higher.` } };
    const price = getTierPrice(tier, billing);
    const now = new Date();
    const pe = new Date(now);
    if (billing === 'monthly') pe.setMonth(pe.getMonth() + 1); else pe.setFullYear(pe.getFullYear() + 1);
    const subId = 'sub-' + Date.now();
    subscriptions.push({ id: subId, userId: currentUser.id, tier, status: 'active', currentPeriodStart: now, currentPeriodEnd: pe });
    updatedUser = { ...currentUser, subscriptionTier: tier };
    const payId = 'pay-' + Date.now();
    payments.push({ id: payId, userId: currentUser.id, amount: Math.round(price * 100), status: 'completed', description: `${PRICING_TIERS[tier].name} plan - ${billing}`, createdAt: now });
    return {
      status: 200,
      body: {
        success: true, url: `/dashboard?upgraded=${tier}`,
        subscription: { id: subId, tier, status: 'active' },
        payment: { id: payId, amount: Math.round(price * 100), status: 'completed' },
        message: `Successfully upgraded to ${PRICING_TIERS[tier].name} plan!`,
      },
    };
  } catch { return { status: 500, body: { error: 'Failed to process checkout' } }; }
}

describe('Pricing logic', () => {
  it('free tier has correct limits', () => {
    expect(PRICING_TIERS.free.limits.interviewsPerWeek).toBe(1);
    expect(PRICING_TIERS.free.limits.resumeReviewsPerMonth).toBe(1);
    expect(PRICING_TIERS.free.limits.coverLettersPerMonth).toBe(1);
    expect(PRICING_TIERS.free.limits.practiceTestsPerMonth).toBe(2);
  });
  it('starter tier has correct limits', () => {
    expect(PRICING_TIERS.starter.limits.interviewsPerWeek).toBe(5);
    expect(PRICING_TIERS.starter.limits.resumeReviewsPerMonth).toBe(-1);
  });
  it('pro tier is unlimited for everything', () => {
    expect(PRICING_TIERS.pro.limits.interviewsPerWeek).toBe(-1);
    expect(PRICING_TIERS.pro.limits.practiceTestsPerMonth).toBe(-1);
  });
  it('tier hierarchy is ordered correctly', () => {
    expect(TIER_HIERARCHY.free).toBeLessThan(TIER_HIERARCHY.starter);
    expect(TIER_HIERARCHY.starter).toBeLessThan(TIER_HIERARCHY.pro);
  });
  it('getTierPrice returns monthly by default', () => {
    expect(getTierPrice('starter', 'monthly')).toBe(499);
    expect(getTierPrice('pro', 'monthly')).toBe(999);
  });
  it('getTierPrice returns yearly price', () => {
    expect(getTierPrice('starter', 'yearly')).toBe(399);
    expect(getTierPrice('pro', 'yearly')).toBe(799);
  });
  it('getTierPrice returns monthly for free tier', () => {
    expect(getTierPrice('free', 'yearly')).toBe(0);
  });
  it('remaining() returns -1 for unlimited', () => {
    expect(remaining(-1, 5)).toBe(-1);
  });
  it('remaining() returns correct value', () => {
    expect(remaining(5, 3)).toBe(2);
    expect(remaining(5, 10)).toBe(0);
  });
  it('percentUsed() returns 0 for unlimited', () => {
    expect(percentUsed(-1, 100)).toBe(0);
  });
  it('percentUsed() calculates correctly', () => {
    expect(percentUsed(10, 5)).toBe(50);
    expect(percentUsed(3, 2)).toBe(67);
  });
});

describe('GET /api/subscription/status', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await statusGet();
    expect(res.status).toBe(401);
  });

  it('returns free tier when no subscription', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await statusGet();
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('free');
    expect(res.body.tierName).toBe('Free');
    expect(res.body.subscription).toBeNull();
    expect(res.body.limits.interviewsPerWeek).toBe(1);
  });

  it('returns subscription data when exists', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'starter' };
    subscriptions.push({ id: 's1', userId: 'u1', tier: 'starter', status: 'active' });
    const res = await statusGet();
    expect(res.body.subscription).not.toBeNull();
    expect(res.body.subscription.id).toBe('s1');
    expect(res.body.tier).toBe('starter');
  });

  it('calculates remaining interviews for free tier', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    sessions.push({ userId: 'u1', startedAt: new Date().toISOString() });
    const res = await statusGet();
    expect(res.body.usage.interviewsThisWeek).toBe(1);
    expect(res.body.remaining.interviewsThisWeek).toBe(0);
  });

  it('shows -1 remaining for unlimited', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'pro' };
    sessions.push({ userId: 'u1', startedAt: new Date().toISOString() });
    sessions.push({ userId: 'u1', startedAt: new Date().toISOString() });
    const res = await statusGet();
    expect(res.body.remaining.interviewsThisWeek).toBe(-1);
  });

  it('returns recent payments', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'starter' };
    payments.push({ id: 'p1', userId: 'u1', amount: 49900, status: 'completed', description: 'Starter plan', createdAt: '2026-07-01' });
    const res = await statusGet();
    expect(res.body.recentPayments.length).toBe(1);
    expect(res.body.recentPayments[0].amount).toBe(49900);
  });
});

describe('GET /api/subscription/usage', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await usageGet();
    expect(res.status).toBe(401);
  });

  it('returns correct usage for free tier', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await usageGet();
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('free');
    expect(res.body.limits.interviewsPerWeek).toBe(1);
  });

  it('returns percentUsed = 0 for unlimited', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'pro' };
    sessions.push({ userId: 'u1', startedAt: new Date().toISOString() });
    const res = await usageGet();
    expect(res.body.percentUsed.interviewsThisWeek).toBe(0);
  });

  it('calculates percentUsed correctly', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    sessions.push({ userId: 'u1', startedAt: new Date().toISOString() });
    const res = await usageGet();
    expect(res.body.percentUsed.interviewsThisWeek).toBe(100);
  });
});

describe('POST /api/subscription/checkout', () => {
  beforeEach(() => reset());

  it('returns 401 when not authenticated', async () => {
    currentUser = null;
    const res = await checkoutPost(postReq({ tier: 'starter', billing: 'monthly' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid tier', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await checkoutPost(postReq({ tier: 'enterprise', billing: 'monthly' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid tier');
  });

  it('returns 400 for invalid billing', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await checkoutPost(postReq({ tier: 'starter', billing: 'weekly' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when already on same tier', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'starter' };
    const res = await checkoutPost(postReq({ tier: 'starter', billing: 'monthly' }));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already on');
  });

  it('returns 400 when on higher tier', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'pro' };
    const res = await checkoutPost(postReq({ tier: 'starter', billing: 'monthly' }));
    expect(res.status).toBe(400);
  });

  it('upgrades free → starter successfully', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await checkoutPost(postReq({ tier: 'starter', billing: 'monthly' }));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subscription.tier).toBe('starter');
    expect(res.body.payment.amount).toBe(49900);
    expect(subscriptions.length).toBe(1);
    expect(updatedUser.subscriptionTier).toBe('starter');
  });

  it('upgrades free → pro successfully', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await checkoutPost(postReq({ tier: 'pro', billing: 'monthly' }));
    expect(res.body.subscription.tier).toBe('pro');
    expect(res.body.payment.amount).toBe(99900);
  });

  it('uses yearly pricing when billing=yearly', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await checkoutPost(postReq({ tier: 'starter', billing: 'yearly' }));
    expect(res.body.payment.amount).toBe(39900);
  });

  it('creates payment record with correct amount', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    await checkoutPost(postReq({ tier: 'pro', billing: 'yearly' }));
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(79900);
    expect(payments[0].status).toBe('completed');
  });

  it('defaults billing to monthly', async () => {
    currentUser = { id: 'u1', subscriptionTier: 'free' };
    const res = await checkoutPost(postReq({ tier: 'starter' }));
    expect(res.body.payment.amount).toBe(49900);
  });
});
