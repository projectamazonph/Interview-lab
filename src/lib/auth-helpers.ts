/**
 * Server-side auth helpers for API routes.
 *
 * Uses JWT session cookies exclusively.
 * The x-user-id header approach has been removed — it allowed any client
 * to impersonate any user by setting the header.
 */

import { db } from './db';
import { verifyToken, TOKEN_NAME } from './session';
import type { NextRequest } from 'next/server';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

/**
 * Verify the authenticated user from a request.
 * Uses JWT session cookie only — no header fallback.
 * Returns the user record if valid, null otherwise.
 */
export async function verifyAuth(userId: string | null): Promise<AuthUser | null> {
  if (!userId || typeof userId !== 'string') return null;

  // Validate format - CUIDs are typically 25+ chars, alphanumeric + dashes
  if (userId.length < 10 || userId.length > 50) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        isAdmin: true,
        emailVerified: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Get the authenticated user from a NextRequest.
 * Verifies JWT session cookie and returns the user record.
 *
 * Usage in API routes:
 *   const user = await getUserFromRequest(request);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getUserFromRequest(request: NextRequest | Request): Promise<AuthUser | null> {
  if ('cookies' in request) {
    try {
      const nextReq = request as NextRequest;
      const token = nextReq.cookies.get(TOKEN_NAME)?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          const user = await db.user.findUnique({
            where: { id: payload.sub },
            select: {
              id: true,
              email: true,
              name: true,
              subscriptionTier: true,
              isAdmin: true,
              emailVerified: true,
            },
          });
          if (user) return user;
        }
      }
    } catch {
      // Token invalid or expired
    }
  }

  return null;
}

/**
 * Verify that the requesting user is an admin.
 * Returns the user record if admin, null otherwise.
 */
export async function verifyAdmin(userId: string | null): Promise<AuthUser | null> {
  const user = await verifyAuth(userId);
  if (!user || !user.isAdmin) return null;
  return user;
}
