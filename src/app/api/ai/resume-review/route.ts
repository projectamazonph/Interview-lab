import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';

const RESUME_REVIEW_PROMPT = `You are an Amazon VA career preparation assistant. You help users prepare for Amazon marketplace virtual assistant roles.

Review the provided resume text for the target role and provide constructive feedback.

Respond in the following JSON format only:
{
  "score": <number 0-100>,
  "missingKeywords": ["<keyword 1>", "<keyword 2>"],
  "weakSections": ["<section 1>", "<section 2>"],
  "improvedSummary": "<rewritten professional summary>",
  "improvedBullets": ["<bullet 1>", "<bullet 2>"],
  "skillsRecommendations": ["<skill 1>", "<skill 2>"],
  "truthWarnings": ["<warning if user fabricated experience>"],
}

IMPORTANT:
- The score should reflect the resume's fit for Amazon VA roles, not generic quality
- Only flag truth warnings if the resume makes specific verifiable claims that seem exaggerated
- Skills recommendations should focus on Amazon-related skills
- Do not suggest the user has certifications or experience they haven't mentioned
- Never guarantee job placement`;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeText, targetRole } = await request.json();

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    if (resumeText.length > 20000) {
      return NextResponse.json({ error: 'Resume is too long' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: RESUME_REVIEW_PROMPT },
        {
          role: 'user',
          content: `Target Role: ${targetRole || 'Amazon VA'}\n\nResume Text:\n${resumeText}`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';

    let feedback;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      }
    } catch {
      feedback = null;
    }

    if (!feedback) {
      return NextResponse.json(
        { error: 'Failed to parse resume review' },
        { status: 500 }
      );
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Resume review error:', error);
    return NextResponse.json(
      { error: 'Failed to review resume' },
      { status: 500 }
    );
  }
}
