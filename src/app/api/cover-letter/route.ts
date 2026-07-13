import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { sanitizeText, sanitizeRichText } from '@/lib/sanitize';
import { NextResponse } from 'next/server';

// Allowed tone values
const ALLOWED_TONES = ['formal', 'conversational', 'beginner_friendly', 'agency', 'upwork', 'cold_email', 'linkedin', 'professional'];

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coverLetters = await db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coverLetters });
  } catch (error) {
    console.error('CoverLetter GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cover letters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json();

    // Sanitize user inputs — jobDescription is plain text, generatedLetter allows formatting
    const jobDescription = sanitizeText(rawBody.jobDescription);
    const tone = ALLOWED_TONES.includes(rawBody.tone) ? rawBody.tone : 'formal';
    const generatedLetter = sanitizeRichText(rawBody.generatedLetter);

    // Validate truth flags — must be an array of strings
    let truthFlags: string | null = null;
    if (Array.isArray(rawBody.truthFlags)) {
      const sanitized = rawBody.truthFlags
        .filter((v: unknown) => typeof v === 'string')
        .map((v: string) => sanitizeText(v) || '')
        .filter((v: string) => v.length > 0);
      if (sanitized.length > 0) {
        truthFlags = JSON.stringify(sanitized);
      }
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    const coverLetter = await db.coverLetter.create({
      data: {
        userId: user.id,
        jobDescription,
        tone,
        generatedLetter,
        truthFlags,
      },
    });

    return NextResponse.json(coverLetter, { status: 201 });
  } catch (error) {
    console.error('CoverLetter POST error:', error);
    return NextResponse.json({ error: 'Failed to create cover letter' }, { status: 500 });
  }
}
