import { describe, it, expect, vi, beforeEach } from 'vitest';

const findUnique = vi.fn();
const upsert = vi.fn();
const update = vi.fn();
const deleteMany = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    rateLimitEntry: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      upsert: (...args: unknown[]) => upsert(...args),
      update: (...args: unknown[]) => update(...args),
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

import { checkRateLimit, cleanupExpiredRateLimits } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    findUnique.mockReset();
    upsert.mockReset();
    update.mockReset();
    deleteMany.mockReset();
  });

  it('allows the first request for a new key and creates an entry with count 1', async () => {
    findUnique.mockResolvedValue(null);
    upsert.mockResolvedValue({});

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 9 });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'auth-login:1.2.3.4' },
        create: expect.objectContaining({ key: 'auth-login:1.2.3.4', count: 1 }),
      })
    );
  });

  it('treats an expired entry as a new window and resets the count', async () => {
    findUnique.mockResolvedValue({ count: 10, resetTime: new Date(Date.now() - 1000) });
    upsert.mockResolvedValue({});

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 9 });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ count: 1 }) })
    );
  });

  it('increments the count and allows the request while under the max', async () => {
    findUnique.mockResolvedValue({ count: 3, resetTime: new Date(Date.now() + 60_000) });
    update.mockResolvedValue({});

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 6 });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'auth-login:1.2.3.4' },
        data: { count: 4 },
      })
    );
  });

  it('rejects the request once the count reaches the max and does not increment further', async () => {
    findUnique.mockResolvedValue({ count: 10, resetTime: new Date(Date.now() + 60_000) });

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(update).not.toHaveBeenCalled();
  });

  it('scopes rate limits per prefix so different actions do not share a bucket', async () => {
    findUnique.mockResolvedValue(null);
    upsert.mockResolvedValue({});

    await checkRateLimit('1.2.3.4', 'auth-register', 5, 60_000);

    expect(findUnique).toHaveBeenCalledWith({ where: { key: 'auth-register:1.2.3.4' } });
  });

  it('fails open (allows the request) if the database throws', async () => {
    findUnique.mockRejectedValue(new Error('connection lost'));

    const result = await checkRateLimit('1.2.3.4', 'auth-login', 10, 60_000);

    expect(result).toEqual({ allowed: true, remaining: 10 });
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
