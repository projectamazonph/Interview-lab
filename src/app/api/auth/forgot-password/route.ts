import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createVerificationToken } from '@/lib/email-verification';
import { checkRateLimit } from '@/lib/rate-limit';

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a password reset link has been sent.',
};

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const rl = await checkRateLimit(clientIp, 'auth-forgot-password', 5, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase().substring(0, 255);
    const user = await db.user.findUnique({ where: { email: sanitizedEmail } });

    // Always return the same generic response — don't reveal whether the
    // email is registered.
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const token = await createVerificationToken(sanitizedEmail, 'password_reset');

    // TODO: no outbound email integration exists yet — the reset link is
    // logged instead of emailed. Wire up a real mail provider and send this
    // instead of relying on server logs.
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log(`[PASSWORD RESET] ${sanitizedEmail}: ${resetUrl}`);

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Forgot-password error:', error);
    // Still return the generic response so failures don't leak account state.
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
