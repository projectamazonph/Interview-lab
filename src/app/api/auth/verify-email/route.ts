import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateVerificationToken } from '@/lib/email-verification';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/?verified=missing-token', request.url)
      );
    }

    const email = await validateVerificationToken(token);

    if (!email) {
      return NextResponse.redirect(
        new URL('/?verified=invalid', request.url)
      );
    }

    // Mark the user's email as verified
    const user = await db.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    console.log(`[EMAIL VERIFICATION] Verified email for user ${user.id} (${email})`);

    // Redirect to the app with success indicator
    return NextResponse.redirect(
      new URL('/?verified=success', request.url)
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/?verified=error', request.url)
    );
  }
}
