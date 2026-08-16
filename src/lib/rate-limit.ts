import { randomUUID } from 'node:crypto';
import { db } from './db';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

interface RateLimitRow {
  count: number;
}

export async function checkRateLimit(
  key: string,
  prefix: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!Number.isInteger(max) || max <= 0 || !Number.isFinite(windowMs) || windowMs <= 0) {
    return { allowed: false, remaining: 0 };
  }

  const compositeKey = `${prefix}:${key}`;
  const now = new Date();
  const resetTime = new Date(now.getTime() + windowMs);

  try {
    // A conditional PostgreSQL upsert takes a row lock on the unique key. The
    // statement returns no row once the active window has reached its limit,
    // so concurrent callers cannot read the same count and overwrite each other.
    const rows = await db.$queryRaw<RateLimitRow[]>`
      INSERT INTO "RateLimitEntry" ("id", "key", "count", "resetTime", "createdAt")
      VALUES (${randomUUID()}, ${compositeKey}, 1, ${resetTime}, ${now})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimitEntry"."resetTime" <= ${now} THEN 1
          ELSE "RateLimitEntry"."count" + 1
        END,
        "resetTime" = CASE
          WHEN "RateLimitEntry"."resetTime" <= ${now} THEN ${resetTime}
          ELSE "RateLimitEntry"."resetTime"
        END
      WHERE
        "RateLimitEntry"."resetTime" <= ${now}
        OR "RateLimitEntry"."count" < ${max}
      RETURNING "count"
    `;

    const row = rows[0];
    if (!row) return { allowed: false, remaining: 0 };

    return { allowed: true, remaining: Math.max(max - row.count, 0) };
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
