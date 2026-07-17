import { db } from './db';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  key: string,
  prefix: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const compositeKey = `${prefix}:${key}`;
  const now = new Date();

  try {
    // Use a transaction for atomic read-check-update to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.rateLimitEntry.findUnique({
        where: { key: compositeKey },
      });

      if (!existing || now > existing.resetTime) {
        // New window: create or reset
        await tx.rateLimitEntry.upsert({
          where: { key: compositeKey },
          update: {
            count: 1,
            resetTime: new Date(now.getTime() + windowMs),
          },
          create: {
            key: compositeKey,
            count: 1,
            resetTime: new Date(now.getTime() + windowMs),
          },
        });
        return { allowed: true, remaining: max - 1 };
      }

      if (existing.count >= max) {
        return { allowed: false, remaining: 0 };
      }

      // Atomic increment within the transaction
      await tx.rateLimitEntry.update({
        where: { key: compositeKey },
        data: { count: existing.count + 1 },
      });

      return { allowed: true, remaining: max - existing.count - 1 };
    });

    return result;
  } catch (error) {
    // Fail closed when database is unavailable — log and deny to be safe
    console.error('[rate-limit] Database error, denying request:', error);
    return { allowed: false, remaining: 0 };
  }
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    await db.rateLimitEntry.deleteMany({
      where: { resetTime: { lt: new Date() } },
    });
  } catch (error) {
    console.error('[rate-limit] Cleanup error:', error);
  }
}
