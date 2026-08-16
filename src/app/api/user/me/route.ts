import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { clearSession } from '@/lib/session';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/user/me — permanently delete the authenticated user's account
 * and all associated data. Requires password confirmation per GDPR Art. 17.
 *
 * DELETE also requires a JSON body: { "confirmPassword": "..." }
 */
export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body required' }, { status: 400 });
  }

  if (!body.confirmPassword) {
    return NextResponse.json(
      { error: 'Password confirmation is required to delete your account.' },
      { status: 400 },
    );
  }

  // Re-verify password so nobody can POST-delete via CSRF
  const fullUser = await db.user.findUnique({ where: { id: user.id } });
  if (!fullUser || !fullUser.passwordHash) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  const { verifyPassword } = await import('@/lib/password');
  const valid = await verifyPassword(body.confirmPassword, fullUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
  }

  try {
    // Verification tokens and rate-limit rows are not related to User in the
    // schema, so remove them explicitly in the same transaction. All other
    // user-owned records are deleted through their cascade relations.
    await db.$transaction([
      db.verificationToken.deleteMany({ where: { email: fullUser.email } }),
      db.rateLimitEntry.deleteMany({ where: { key: { endsWith: `:${user.id}` } } }),
      db.user.delete({ where: { id: user.id } }),
    ]);

    const response = NextResponse.json(
      { message: 'Account and all associated data have been permanently deleted.' },
      { status: 200 },
    );

    clearSession(response);

    return response;
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
