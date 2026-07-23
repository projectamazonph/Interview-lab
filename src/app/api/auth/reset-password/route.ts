import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { validateVerificationToken } from '@/lib/email-verification';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const rl = await checkRateLimit(clientIp, 'auth-reset-password', 10, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { token, password } = await request.json();
    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const email = await validateVerificationToken(token, 'password_reset');
    if (!email) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Bump tokenVersion so every existing session (including one held by
    // whoever had the old, possibly-compromised password) is invalidated.
    await db.user.update({
      where: { email },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    return NextResponse.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (error) {
    console.error('Reset-password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
