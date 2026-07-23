import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyPassword, isLegacyHash } from '@/lib/password';
import { createSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

// Precomputed bcrypt hash with no matching plaintext. Compared against on the
// "user not found" path so login takes the same time whether or not the
// email exists — otherwise the fast-fail (no hash to check) vs. slow-fail
// (bcrypt.compare) timing difference lets an attacker enumerate valid emails.
const DUMMY_HASH = '$2b$12$o54VyLSoCUZmk6w3bPIIkuVkdpNV.4veaAo1.gw3SfNBIxSiYsWK6';

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
    // Expired RateLimitEntry rows are swept by the scheduled /api/cron/cleanup route.

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const sanitizedEmail = String(email).trim().toLowerCase().substring(0, 255);

    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      include: { profile: true },
    });

    // Always run a bcrypt comparison, even when the user doesn't exist or has
    // a legacy hash, so response time doesn't leak account state.
    const hasBcryptHash = !!user?.passwordHash && !isLegacyHash(user.passwordHash);
    const isValid = await verifyPassword(password, hasBcryptHash ? user!.passwordHash! : DUMMY_HASH);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Accounts still on the pre-bcrypt (unsalted SHA-256) hash can't be
    // authenticated with a password anymore — they must reset it first.
    if (isLegacyHash(user.passwordHash)) {
      return NextResponse.json(
        { error: 'Please reset your password to continue.', code: 'PASSWORD_RESET_REQUIRED' },
        { status: 403 }
      );
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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
      v: user.tokenVersion,
    }, response);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
