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
              tokenVersion: true,
            },
          });
          // tokenVersion must match: it's bumped on logout and password
          // reset, which immediately invalidates every JWT issued before then.
          if (user && user.tokenVersion === payload.v) {
            const { tokenVersion: _tokenVersion, ...authUser } = user;
            return authUser;
          }
        }
      }
    } catch {
      // Token invalid or expired
    }
  }

  return null;
}
