import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyPassword, isLegacyHash, hashPassword } from '@/lib/password';
import { createSession } from '@/lib/session';
import { checkRateLimit, cleanupExpiredRateLimits } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Persistent rate limiting for login (survives server restarts)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const loginRateLimitMax = Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX) || 10;
    const rl = await checkRateLimit(clientIp, 'auth-login', loginRateLimitMax, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }
    // rate-limit cleanup handled by Prisma TTL

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const sanitizedEmail = String(email).trim().toLowerCase().substring(0, 255);

    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password (supports both bcrypt and legacy SHA-256)
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Auto-upgrade legacy SHA-256 hashes to bcrypt on successful login
    if (isLegacyHash(user.passwordHash)) {
      try {
        const newHash = await hashPassword(password);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
        console.log(`[AUTH] Upgraded password hash for user ${user.id} from SHA-256 to bcrypt`);
      } catch (upgradeErr) {
        console.error(`[AUTH] Failed to upgrade hash for user ${user.id}:`, upgradeErr);
        // Non-blocking — login still succeeds
      }
    }

    // Create JWT session (HttpOnly cookie)
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      profile: user.profile,
    });

    await createSession({
      sub: user.id,
      email: user.email,
      tier: user.subscriptionTier,
      isAdmin: user.isAdmin,
    }, response);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
