import { getUserFromRequest } from '@/lib/auth-helpers';
import { clearSession } from '@/lib/session';
import { revokeAllUserSessions } from '@/lib/session-revocation';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await revokeAllUserSessions(user.id);
    const response = NextResponse.json({ success: true });
    clearSession(response);
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
