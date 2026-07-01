import { db } from '@/lib/db';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';
import { sanitizeText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';

// Validate allowed fields and their types
const ALLOWED_PROFILE_FIELDS = [
  'targetRole', 'experienceLevel', 'toolsKnown', 'weakAreas',
  'interviewDate', 'confidenceLevel', 'resumeStatus', 'country', 'onboardingDone',
] as const;

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ onboardingDone: false });
    }

    return NextResponse.json({
      ...profile,
      toolsKnown: profile.toolsKnown ? JSON.parse(profile.toolsKnown) : null,
      weakAreas: profile.weakAreas ? JSON.parse(profile.weakAreas) : null,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawData = await request.json();

    // Whitelist only allowed fields — ignore any extra fields
    const data: Record<string, unknown> = {};
    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (key in rawData) {
        if (key === 'onboardingDone') {
          data[key] = typeof rawData[key] === 'boolean' ? rawData[key] : true;
        } else if (key === 'toolsKnown' || key === 'weakAreas') {
          // These are JSON arrays
          const val = rawData[key];
          if (Array.isArray(val)) {
            data[key] = JSON.stringify(val.map((v: string) => sanitizeText(v)).filter(Boolean));
          } else if (typeof val === 'string') {
            const cleaned = sanitizeText(val);
            if (cleaned) data[key] = JSON.stringify([cleaned]);
          }
        } else {
          data[key] = sanitizeText(rawData[key]);
        }
      }
    }

    const profile = await db.userProfile.upsert({
      where: { userId: user.id },
      update: {
        targetRole: data.targetRole as string | undefined,
        experienceLevel: data.experienceLevel as string | undefined,
        toolsKnown: data.toolsKnown as string | undefined,
        weakAreas: data.weakAreas as string | undefined,
        interviewDate: data.interviewDate as string | undefined,
        confidenceLevel: data.confidenceLevel as string | undefined,
        resumeStatus: data.resumeStatus as string | undefined,
        country: data.country as string | undefined,
        onboardingDone: data.onboardingDone as boolean | undefined,
      },
      create: {
        userId: user.id,
        targetRole: (data.targetRole as string) || null,
        experienceLevel: (data.experienceLevel as string) || null,
        toolsKnown: (data.toolsKnown as string) || null,
        weakAreas: (data.weakAreas as string) || null,
        interviewDate: (data.interviewDate as string) || null,
        confidenceLevel: (data.confidenceLevel as string) || null,
        resumeStatus: (data.resumeStatus as string) || null,
        country: (data.country as string) || null,
        onboardingDone: (data.onboardingDone as boolean) ?? true,
      },
    });

    return NextResponse.json({
      ...profile,
      toolsKnown: profile.toolsKnown ? JSON.parse(profile.toolsKnown) : null,
      weakAreas: profile.weakAreas ? JSON.parse(profile.weakAreas) : null,
    });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
