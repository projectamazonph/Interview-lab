/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const findUnique = vi.fn();
const update = vi.fn();
const create = vi.fn();
const userUpdate = vi.fn();
const paymentCreate = vi.fn();
const getUserFromRequest = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
      create: (...args: unknown[]) => create(...args),
    },
    user: {
      update: (...args: unknown[]) => userUpdate(...args),
    },
    payment: {
      create: (...args: unknown[]) => paymentCreate(...args),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getUserFromRequest: (...args: unknown[]) => getUserFromRequest(...args),
}));

import { GET, POST } from '@/app/api/subscription/manage/route';

const freeUser = { id: 'u1', email: 'free@test.com', subscriptionTier: 'free', isAdmin: false };
const proUser = { id: 'u2', email: 'pro@test.com', subscriptionTier: 'pro', isAdmin: false };

function getReq() {
  return new Request('http://localhost/api/subscription/manage');
}

function postReq(body: unknown) {
  return new Request('http://localhost/api/subscription/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/subscription/manage', () => {
  beforeEach(() => {
    findUnique.mockReset();
    getUserFromRequest.mockReset();
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('returns free tier with no subscription and no billing info', async () => {
    getUserFromRequest.mockResolvedValue(freeUser);
    findUnique.mockResolvedValue(null);
    const res = await GET(getReq());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tier).toBe('free');
    expect(body.subscription).toBeNull();
    expect(body.billing).toBeNull();
  });

  it('returns billing details for a paid tier with an active subscription', async () => {
    getUserFromRequest.mockResolvedValue(proUser);
    findUnique.mockResolvedValue({
      id: 'sub1',
      tier: 'pro',
      status: 'active',
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-02-01'),
      cancelAtPeriodEnd: false,
      stripePriceId: 'price_pro_monthly',
    });
    const res = await GET(getReq());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.subscription.id).toBe('sub1');
    expect(body.billing).toEqual({ amount: 999, currency: 'php', period: 'monthly' });
    expect(body.nextBillingDate).toBe('2026-02-01T00:00:00.000Z');
  });

  it('returns 500 when the database throws', async () => {
    getUserFromRequest.mockResolvedValue(freeUser);
    findUnique.mockRejectedValue(new Error('db down'));
    const res = await GET(getReq());
    expect(res.status).toBe(500);
  });
});

describe('POST /api/subscription/manage — cancel', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    getUserFromRequest.mockResolvedValue(proUser);
  });

  it('returns 401 when not authenticated', async () => {
    getUserFromRequest.mockResolvedValue(null);
    const res = await POST(postReq({ action: 'cancel' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when there is no subscription to cancel', async () => {
    findUnique.mockResolvedValue(null);
    const res = await POST(postReq({ action: 'cancel' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when already canceled', async () => {
    findUnique.mockResolvedValue({ id: 'sub1', status: 'canceled' });
    const res = await POST(postReq({ action: 'cancel' }));
    expect(res.status).toBe(400);
  });

  it('marks the subscription to cancel at period end', async () => {
    findUnique.mockResolvedValue({ id: 'sub1', status: 'active', currentPeriodEnd: new Date('2026-02-01') });
    const res = await POST(postReq({ action: 'cancel' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.cancelAtPeriodEnd).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'sub1' },
      data: { cancelAtPeriodEnd: true, status: 'active' },
    });
  });
});

describe('POST /api/subscription/manage — reactivate', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    getUserFromRequest.mockResolvedValue(proUser);
  });

  it('returns 400 when there is no subscription', async () => {
    findUnique.mockResolvedValue(null);
    const res = await POST(postReq({ action: 'reactivate' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when the subscription is not scheduled for cancellation', async () => {
    findUnique.mockResolvedValue({ id: 'sub1', cancelAtPeriodEnd: false });
    const res = await POST(postReq({ action: 'reactivate' }));
    expect(res.status).toBe(400);
  });

  it('clears the cancellation schedule', async () => {
    findUnique.mockResolvedValue({ id: 'sub1', cancelAtPeriodEnd: true });
    const res = await POST(postReq({ action: 'reactivate' }));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 'sub1' }, data: { cancelAtPeriodEnd: false } });
  });
});

describe('POST /api/subscription/manage — change', () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    create.mockReset();
    userUpdate.mockReset();
    paymentCreate.mockReset();
  });

  it('returns 400 when tier is missing', async () => {
    getUserFromRequest.mockResolvedValue(freeUser);
    findUnique.mockResolvedValue(null);
    const res = await POST(postReq({ action: 'change' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid tier', async () => {
    getUserFromRequest.mockResolvedValue(freeUser);
    findUnique.mockResolvedValue(null);
    const res = await POST(postReq({ action: 'change', tier: 'enterprise' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when already on the requested tier', async () => {
    getUserFromRequest.mockResolvedValue(proUser);
    findUnique.mockResolvedValue({ id: 'sub1', tier: 'pro' });
    const res = await POST(postReq({ action: 'change', tier: 'pro' }));
    expect(res.status).toBe(400);
  });

  it('creates a subscription and an upgrade payment when moving to a higher tier with no existing subscription', async () => {
    getUserFromRequest.mockResolvedValue(freeUser);
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({});
    userUpdate.mockResolvedValue({});
    paymentCreate.mockResolvedValue({});

    const res = await POST(postReq({ action: 'change', tier: 'starter', billing: 'monthly' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tier).toBe('starter');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'u1', tier: 'starter', status: 'active' }),
    }));
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { subscriptionTier: 'starter' } });
    expect(paymentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amount: 49900, status: 'completed' }),
    }));
  });

  it('updates the existing subscription and records a pending payment when downgrading', async () => {
    getUserFromRequest.mockResolvedValue(proUser);
    findUnique.mockResolvedValue({ id: 'sub1', tier: 'pro' });
    update.mockResolvedValue({});
    userUpdate.mockResolvedValue({});
    paymentCreate.mockResolvedValue({});

    const res = await POST(postReq({ action: 'change', tier: 'starter', billing: 'monthly' }));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'sub1' } }));
    expect(paymentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'pending' }),
    }));
  });

  it('uses the yearly price when billing=yearly', async () => {
    getUserFromRequest.mockResolvedValue(freeUser);
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({});
    userUpdate.mockResolvedValue({});
    paymentCreate.mockResolvedValue({});

    await POST(postReq({ action: 'change', tier: 'starter', billing: 'yearly' }));
    expect(paymentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amount: 39900 }),
    }));
  });
});

describe('POST /api/subscription/manage — invalid action', () => {
  it('returns 400 for an unrecognized action', async () => {
    getUserFromRequest.mockResolvedValue(proUser);
    findUnique.mockResolvedValue(null);
    const res = await POST(postReq({ action: 'not-a-real-action' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when request.json() throws', async () => {
    getUserFromRequest.mockResolvedValue(proUser);
    const badReq = new Request('http://localhost/api/subscription/manage', { method: 'POST', body: 'not json' });
    const res = await POST(badReq);
    expect(res.status).toBe(500);
  });
});
