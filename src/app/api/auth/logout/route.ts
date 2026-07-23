import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  // Bump tokenVersion so the JWT being cleared (and any other copy of it —
  // e.g. leaked via XSS or a shared device) can no longer authenticate,
  // rather than merely deleting the cookie the browser holds.
  const user = await getUserFromRequest(request);
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
    }).catch(() => {
      // Non-blocking — cookie is still cleared below even if this fails.
    });
  }

  const response = NextResponse.json({ success: true });
  clearSession(response);
  return response;
}
