import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';

const ASSESSMENT_PROMPT = `You are an Amazon VA career preparation assistant. You help users prepare for Amazon marketplace virtual assistant roles.

Evaluate the user's assessment answers and provide scoring feedback.

Respond in the following JSON format only:
{
  "score": <number 0-100>,
  "correctDecisions": ["<what they did well>"],
  "incorrectDecisions": ["<what they got wrong>"],
  "missedOpportunities": ["<what they missed>"],
  "recommendedNextStep": "<what to study next>",
  "modelAnswer": "<ideal answer for reference>"
}

IMPORTANT:
- Be constructive and specific in your feedback
- The modelAnswer should show the ideal response without using it to inflate/deflate the user's score
- Never guarantee job placement or test performance`;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessmentTitle, assessmentData, userAnswers } = await request.json();

    if (!assessmentTitle || !userAnswers) {
      return NextResponse.json({ error: 'Assessment title and answers are required' }, { status: 400 });
    }

    if (userAnswers.length > 50000) {
      return NextResponse.json({ error: 'Answers are too long' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: ASSESSMENT_PROMPT },
        {
          role: 'user',
          content: `Assessment: ${assessmentTitle}\n\nAssessment Data: ${assessmentData ? JSON.stringify(assessmentData).substring(0, 5000) : 'N/A'}\n\nUser's Answers: ${userAnswers}`,
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
      return NextResponse.json(
        { error: 'Failed to score assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Assessment score error:', error);
    return NextResponse.json(
      { error: 'Failed to score assessment' },
      { status: 500 }
    );
  }
}
