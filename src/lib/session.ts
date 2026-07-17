/**
 * JWT-based session management using the `jose` library.
 * Issues and verifies HttpOnly cookies containing signed JWTs.
 *
 * This replaces the insecure localStorage-only session model:
 *   - Tokens are HttpOnly + Secure + SameSite=Lax → not accessible to JS
 *   - Signed with HS256 using a server-side secret → tamper-proof
 *   - Includes expiry (24h default) → auto-rotation
 *   - Contains minimal claims (sub, email, tier, isAdmin)
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// JWT_SECRET must be configured with at least 32 characters
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters");
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

const TOKEN_NAME = 'interviewlab_session';
const TOKEN_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

export interface SessionPayload {
  sub: string;        // user ID
  email: string;
  tier: string;       // subscriptionTier
  isAdmin: boolean;
}

/**
 * Create a signed JWT and set it as an HttpOnly cookie on the response.
 */
export async function createSession(
  payload: SessionPayload,
  response?: NextResponse
): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(JWT_SECRET);

  const cookieOptions = {
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  };

  if (response) {
    response.cookies.set(cookieOptions);
  }

  return token;
}

/**
 * Verify and decode a JWT from the request cookies.
 * Returns the payload if valid, null otherwise.
 */
export async function verifySession(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      tier: payload.tier as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a JWT from a raw token string (for API routes that receive it in headers).
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      tier: payload.tier as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (logout).
 */
export function clearSession(response: NextResponse): void {
  response.cookies.set({
    name: TOKEN_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Get the current session from server-side cookies (for use in Server Components / Route Handlers).
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export { TOKEN_NAME, TOKEN_MAX_AGE };
