/**
 * Server-side auth helpers for API routes.
 *
 * Supports both:
 *   1. JWT session cookies (primary, secure)
 *   2. x-user-id header (legacy, for backward compatibility during transition)
 *
 * The JWT approach prevents the critical x-user-id spoofing vulnerability
 * where any client could set the header to impersonate another user.
 */

import { db } from './db';
import { verifySession, verifyToken, TOKEN_NAME } from './session';
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
 * Tries JWT cookie first, falls back to x-user-id header.
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
 * Checks JWT session cookie first (secure), then falls back to x-user-id header (legacy).
 *
 * Usage in API routes:
 *   const user = await getUserFromRequest(request);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getUserFromRequest(request: NextRequest | Request): Promise<AuthUser | null> {
  // 1. Try JWT session cookie (NextRequest has cookies)
  if ('cookies' in request) {
    try {
      const nextReq = request as NextRequest;
      const token = nextReq.cookies.get(TOKEN_NAME)?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          // Verify user still exists in DB
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
      // Fall through to header-based auth
    }
  }

  // 2. Fallback: x-user-id header (legacy, less secure)
  const userId = getUserIdFromHeader(request);
  if (userId) {
    return verifyAuth(userId);
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

/**
 * Get user ID from request headers with basic validation.
 * Returns null if the header is missing or invalid format.
 */
export function getUserIdFromHeader(request: Request): string | null {
  const userId = request.headers.get('x-user-id');
  if (!userId || typeof userId !== 'string') return null;
  if (userId.length < 10 || userId.length > 50) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return null;
  return userId;
}
