import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';

const COVER_LETTER_PROMPT = `You are an Amazon VA career preparation assistant. You help users prepare for Amazon marketplace virtual assistant roles.

Generate a professional cover letter based on the job description and target role provided.

Respond in the following JSON format only:
{
  "draftLetter": "<full cover letter>",
  "shorterVersion": "<2-3 sentence summary>",
  "subjectLine": "<email subject line>",
  "customizationTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "claimsToVerify": ["<claim 1>", "<claim 2>"]
}

IMPORTANT:
- Do NOT fabricate specific experience, certifications, metrics, or tools the user hasn't explicitly mentioned
- Use generic placeholders like "[X years of experience]" where specific numbers aren't provided
- Focus on transferable skills and willingness to learn
- Never guarantee job placement or interview success`;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobDescription, tone, targetRole, userName } = await request.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    if (jobDescription.length > 10000) {
      return NextResponse.json({ error: 'Job description is too long' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: COVER_LETTER_PROMPT },
        {
          role: 'user',
          content: `Target Role: ${targetRole || 'Amazon VA'}\nTone: ${tone || 'formal'}\nApplicant Name: ${userName || '[Your Name]'}\n\nJob Description:\n${jobDescription}`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = null;
    }

    if (!result) {
      return NextResponse.json({
        draftLetter: 'Unable to generate cover letter. Please try again.',
        shorterVersion: '',
        subjectLine: '',
        customizationTips: [],
        claimsToVerify: [],
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
