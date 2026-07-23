import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cleanupExpiredRateLimits } from '@/lib/rate-limit';

/**
 * Scheduled maintenance: sweep expired RateLimitEntry and VerificationToken
 * rows. Both tables grow unboundedly otherwise — RateLimitEntry gets a new
 * row per rate-limited key (IP, user, etc.) and VerificationToken per
 * registration/password-reset request. Wired up via vercel.json `crons`.
 *
 * Vercel signs its own cron invocations with `Authorization: Bearer
 * $CRON_SECRET` when CRON_SECRET is set on the project — this route requires
 * that header to match, so it can't be hit by outside traffic.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rateLimitResult, tokenResult] = await Promise.all([
      cleanupExpiredRateLimits(),
      db.verificationToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    ]);

    return NextResponse.json({
      ok: true,
      verificationTokensDeleted: tokenResult.count,
      rateLimitCleanup: rateLimitResult ?? 'done',
    });
  } catch (error) {
    console.error('[cron/cleanup] error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
