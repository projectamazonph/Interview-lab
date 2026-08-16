/**
 * @vitest-environment node
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

const testWithDatabase = process.env.DATABASE_URL ? it : it.skip;

describe('checkRateLimit PostgreSQL concurrency', () => {
  testWithDatabase('allows exactly max requests when one bucket is hit concurrently', async () => {
    const prefix = `concurrency-${randomUUID()}`;
    const key = randomUUID();
    const compositeKey = `${prefix}:${key}`;
    const max = 15;

    try {
      const firstWave = await Promise.all(
        Array.from({ length: 50 }, () => checkRateLimit(key, prefix, max, 60_000)),
      );
      expect(firstWave.filter((result) => result.allowed)).toHaveLength(max);

      const stored = await db.rateLimitEntry.findUnique({ where: { key: compositeKey } });
      expect(stored?.count).toBe(max);

      const secondWave = await Promise.all(
        Array.from({ length: 10 }, () => checkRateLimit(key, prefix, max, 60_000)),
      );
      expect(secondWave.every((result) => !result.allowed)).toBe(true);
    } finally {
      await db.rateLimitEntry.deleteMany({ where: { key: compositeKey } });
    }
  });
});
