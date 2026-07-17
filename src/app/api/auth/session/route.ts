import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifySession(request);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

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

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
