import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryRaw = vi.fn();
const deleteMany = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    rateLimitEntry: {
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

import { checkRateLimit, cleanupExpiredRateLimits } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    deleteMany.mockReset();
  });

  it('allows the first request for a new key (count 1 from a fresh row)', async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 9 });
  });

  it('allows the request while the post-increment count is under max', async () => {
    queryRaw.mockResolvedValue([{ count: 4 }]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 6 });
  });

  it('allows the request when the count lands exactly on max', async () => {
    queryRaw.mockResolvedValue([{ count: 10 }]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 0 });
  });

  it('rejects the request once the count exceeds max', async () => {
    queryRaw.mockResolvedValue([{ count: 11 }]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it('scopes rate limits per prefix so different actions do not share a bucket', async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);

    await checkRateLimit('1.2.3.4', 'auth-register', 5, 60_000);

    const values = queryRaw.mock.calls[0];
    expect(values).toContain('auth-register:1.2.3.4');
  });

  it('performs a single atomic query per call (no separate read-then-write)', async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);

    await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('fails closed (denies the request) if the database throws', async () => {
    queryRaw.mockRejectedValue(new Error('connection lost'));

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it('fails closed if the query returns no rows', async () => {
    queryRaw.mockResolvedValue([]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });
});

describe('cleanupExpiredRateLimits', () => {
  beforeEach(() => {
    deleteMany.mockReset();
  });

  it('deletes entries whose resetTime has passed', async () => {
    deleteMany.mockResolvedValue({ count: 3 });
    await cleanupExpiredRateLimits();
    expect(deleteMany).toHaveBeenCalledWith({
      where: { resetTime: { lt: expect.any(Date) } },
    });
  });

  it('silently swallows database errors', async () => {
    deleteMany.mockRejectedValue(new Error('connection lost'));
    await expect(cleanupExpiredRateLimits()).resolves.toBeUndefined();
  });
});
