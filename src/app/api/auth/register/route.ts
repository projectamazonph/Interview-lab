import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { createVerificationToken } from '@/lib/email-verification';
import { createSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

// Configurable max users (0 = unlimited). Set via AppSetting "max_users" in DB, or env MAX_USERS.
const DEFAULT_MAX_USERS = 0;

async function getMaxUsers(): Promise<number> {
  // Check env first
  const envMax = parseInt(process.env.MAX_USERS || '0', 10);
  if (envMax > 0) return envMax;

  // Then check DB
  try {
    const setting = await db.appSetting.findUnique({ where: { key: 'max_users' } });
    if (setting) return parseInt(setting.value, 10);
  } catch {
    // AppSetting table may not exist yet
  }
  return DEFAULT_MAX_USERS;
}

// Simple honeypot + timing check for bot protection
function isBot(body: Record<string, unknown>): boolean {
  // Honeypot field: if a hidden field is filled, it's a bot
  if (body.honeypot && body.honeypot !== '') return true;

  // Check for suspiciously fast submission (filled in < 2 seconds)
  if (body._formStart) {
    const elapsed = Date.now() - Number(body._formStart);
    if (elapsed < 2000) return true; // Less than 2 seconds to fill form
  }

  return false;
}

export async function POST(request: Request) {
  try {
    // Persistent rate limiting (survives server restarts)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const registerRateLimitMax = Number(process.env.AUTH_REGISTER_RATE_LIMIT_MAX) || 5;
    const rl = await checkRateLimit(clientIp, 'auth-register', registerRateLimitMax, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }
    // rate-limit cleanup handled by Prisma TTL

    const body = await request.json();
    const { email, name, password } = body;

    // Bot protection check
    if (isBot(body)) {
      // Return a fake success to not alert bots
      return NextResponse.json({
        id: 'bot-trap',
        email: 'trap@trap.com',
        name: 'Trap',
        subscriptionTier: 'free',
        isAdmin: false,
        emailVerified: false,
        message: 'Registration received. Please check your email to verify your account.',
      }, { status: 201 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = (name || email.split('@')[0])
      .replace(/<[^>]*>/g, '')
      .replace(/[<>"'&]/g, '')
      .trim()
      .substring(0, 100);

    const sanitizedEmail = email.trim().toLowerCase().substring(0, 255);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check global user cap
    const maxUsers = await getMaxUsers();
    if (maxUsers > 0) {
      const currentCount = await db.user.count();
      if (currentCount >= maxUsers) {
        return NextResponse.json({
          error: 'Registration is temporarily closed. We have reached our current capacity. Please try again later.',
        }, { status: 503 });
      }
    }

    // Check duplicate email
    const existing = await db.user.findUnique({ where: { email: sanitizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password with bcrypt (upgraded from SHA-256)
    const passwordHash = await hashPassword(password);

    // Create user with emailVerified = false
    const user = await db.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        passwordHash,
        emailVerified: false,
        profile: { create: {} },
      },
    });

    // Create email verification token
    await createVerificationToken(sanitizedEmail);

    // Clean up expired tokens periodically
    // cleanup handled by Prisma TTL;

    // In production, send verification via email instead of logging
    // Verification token is stored in the database for the verify-email endpoint

    // Create JWT session (HttpOnly cookie)
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      message: 'Registration successful! Please check your email to verify your account.',
    }, { status: 201 });

    await createSession({
      sub: user.id,
      email: user.email,
      tier: user.subscriptionTier,
      isAdmin: user.isAdmin,
    }, response);

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
