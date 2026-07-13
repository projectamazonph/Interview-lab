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
    const existing = await db.rateLimitEntry.findUnique({
      where: { key: compositeKey },
    });

    if (!existing || now > existing.resetTime) {
      await db.rateLimitEntry.upsert({
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

    await db.rateLimitEntry.update({
      where: { key: compositeKey },
      data: { count: existing.count + 1 },
    });

    return { allowed: true, remaining: max - existing.count - 1 };
  } catch {
    return { allowed: true, remaining: max };
  }
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    await db.rateLimitEntry.deleteMany({
      where: { resetTime: { lt: new Date() } },
    });
  } catch {
    // silently fail
  }
}
