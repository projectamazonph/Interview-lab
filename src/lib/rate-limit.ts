import { db } from './db';
import { randomUUID } from 'crypto';

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
  const resetTime = new Date(now.getTime() + windowMs);

  try {
    // Single atomic INSERT ... ON CONFLICT DO UPDATE. A read-then-write
    // transaction (SELECT the row, then UPDATE it) has a race window under
    // Postgres's default READ COMMITTED isolation: two concurrent requests
    // for the same key can both read `count < max` before either writes,
    // letting both through. Folding the check into the UPDATE's row values
    // and returning the post-increment count removes that window entirely.
    const rows = await db.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimitEntry" (id, key, count, "resetTime", "createdAt")
      VALUES (${randomUUID()}, ${compositeKey}, 1, ${resetTime}, ${now})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN "RateLimitEntry"."resetTime" < ${now} THEN 1 ELSE "RateLimitEntry".count + 1 END,
        "resetTime" = CASE WHEN "RateLimitEntry"."resetTime" < ${now} THEN ${resetTime} ELSE "RateLimitEntry"."resetTime" END
      RETURNING count
    `;

    const row = rows[0];
    if (!row) return { allowed: false, remaining: 0 };

    const allowed = row.count <= max;
    return { allowed, remaining: Math.max(0, max - row.count) };
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
