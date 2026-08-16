import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function executedSql(): string {
  const template = queryRaw.mock.calls[0]?.[0] as TemplateStringsArray | undefined;
  return template ? Array.from(template).join('?') : '';
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    deleteMany.mockReset();
  });

  it('atomically creates or increments a bucket and returns its remaining capacity', async () => {
    queryRaw.mockResolvedValue([{ count: 4 }]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 6 });
    expect(queryRaw).toHaveBeenCalledOnce();
    expect(executedSql()).toContain('ON CONFLICT ("key") DO UPDATE');
    expect(executedSql()).toContain('ELSE "RateLimitEntry"."count" + 1');
    expect(executedSql()).toContain('"RateLimitEntry"."count" <');
  });

  it('resets an expired bucket as part of the same atomic statement', async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 9 });
    expect(executedSql()).toContain('"RateLimitEntry"."resetTime" <');
    expect(executedSql()).toContain('THEN 1');
  });

  it('rejects a request when the conditional upsert returns no row', async () => {
    queryRaw.mockResolvedValue([]);

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it('scopes rate limits per prefix', async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);

    await checkRateLimit('1.2.3.4', 'auth-register', 5, 60_000);

    expect(queryRaw.mock.calls[0]).toContain('auth-register:1.2.3.4');
  });

  it('rejects invalid limits without querying the database', async () => {
    expect(await checkRateLimit('1.2.3.4', 'auth-login', 0, 60_000)).toEqual({
      allowed: false,
      remaining: 0,
    });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('fails closed if the database throws', async () => {
    queryRaw.mockRejectedValue(new Error('connection lost'));

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
