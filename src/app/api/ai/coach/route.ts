import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';

const GLOBAL_SYSTEM_PROMPT = `You are an Amazon VA career preparation assistant. Your job is to help users prepare for Amazon marketplace virtual assistant roles, especially Amazon PPC, Seller Central support, listing support, reporting, and agency operations roles. You must be practical, honest, and role-specific. Help users explain their real skills clearly without exaggerating or fabricating experience. You may coach, rewrite, score, summarize, and generate practice materials. You must not claim the user has experience, certifications, budgets managed, client results, or tool expertise unless the user explicitly provided that information. When discussing Amazon PPC, use clear operational language: campaigns, keywords, search terms, ACoS, ROAS, CTR, CPC, CVR, spend, sales, orders, listing readiness, inventory, reporting, and SOPs. When uncertain, ask for the missing detail or provide a safe beginner-friendly version. Never guarantee job placement, interview success, ranking results, ACoS improvement, or Amazon account outcomes.`;

const INTERVIEW_COACH_PROMPT = `${GLOBAL_SYSTEM_PROMPT}

You are the Interview Coach Agent for Amazon VA candidates.

Goal: Evaluate the user's interview answer and provide coaching feedback.

Scoring dimensions:
1. Role relevance (20%)
2. Technical accuracy (30%)
3. Specificity (15%)
4. Communication clarity (15%)
5. Judgment and risk awareness (10%)
6. Truthfulness (10%)

You MUST respond in the following JSON format only:
{
  "score": <number 1-10>,
  "whatWorked": "<what was good about the answer>",
  "whatToImprove": "<specific improvements needed>",
  "strongerSampleAnswer": "<a better version of the answer>",
  "followUpQuestion": "<a follow-up question like a real interviewer would ask to probe deeper>",
  "rubricBreakdown": {
    "roleRelevance": <number 1-10>,
    "technicalAccuracy": <number 1-10>,
    "specificity": <number 1-10>,
    "communicationClarity": <number 1-10>,
    "judgmentAndRiskAwareness": <number 1-10>,
    "truthfulness": <number 1-10>
  }
}

IMPORTANT RULES FOR FOLLOW-UP QUESTIONS:
- You MUST ALWAYS include a "followUpQuestion" field in your response.
- When the score is BELOW 7 (weak answer): The followUpQuestion should be directly related to the user's weak area. It should probe the specific gap in their answer, give them a second chance to demonstrate knowledge, and help them practice improving. Make it specific and targeted to their weak point (e.g., if they lacked metrics, ask for specific numbers; if they were vague about process, ask them to walk through the steps).
- When the score is 7 or ABOVE (strong answer): The followUpQuestion should be a natural follow-up that a real interviewer would ask to go deeper. It can explore related topics, test breadth of knowledge, or present a more complex scenario.
- The followUpQuestion should always feel like a natural continuation of the interview conversation.
- Never repeat the original question. The follow-up should build on or branch from the original topic.`;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, userAnswer, questionContext } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Add explicit instruction about follow-up for low scores
    const scoreHint = `Evaluate the answer and provide your score. If the score is below 7, make sure the followUpQuestion specifically targets the weakness in their answer to give them a chance to improve. If the score is 7 or above, ask a natural follow-up that explores the topic more deeply.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: INTERVIEW_COACH_PROMPT },
        {
          role: 'user',
          content: `Question: ${question}\n\nQuestion Context: ${questionContext || 'General Amazon VA interview question'}\n\nUser's Answer: ${userAnswer}\n\n${scoreHint}\n\nPlease evaluate this answer and provide coaching feedback in the required JSON format.`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Try to parse JSON from the response
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
      feedback = {
        score: 5,
        whatWorked: 'You provided an answer to the question.',
        whatToImprove: responseText || 'Try to be more specific and use Amazon VA terminology.',
        strongerSampleAnswer: 'Please review the question and try to include specific metrics, processes, and Amazon terminology in your answer.',
        followUpQuestion: 'Can you provide more specific details about your experience with this topic?',
        rubricBreakdown: {
          roleRelevance: 5,
          technicalAccuracy: 5,
          specificity: 4,
          communicationClarity: 5,
          judgmentAndRiskAwareness: 5,
          truthfulness: 6,
        },
      };
    }

    // Ensure followUpQuestion is always present
    if (!feedback.followUpQuestion) {
      if (feedback.score < 7) {
        feedback.followUpQuestion = `Your answer could use more detail. Can you try again, specifically focusing on the process steps and any relevant metrics for: "${question}"?`;
      } else {
        feedback.followUpQuestion = `Good answer! As a follow-up, can you explain how you would handle a more complex scenario related to this topic?`;
      }
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('AI Coach error:', error);
    return NextResponse.json({
      score: 5,
      whatWorked: 'You attempted to answer the question.',
      whatToImprove: 'Try to include specific Amazon VA terminology, metrics, and processes in your answer.',
      strongerSampleAnswer: 'A strong answer would include specific metrics (ACoS, ROAS, CTR, CVR), mention relevant processes (keyword harvesting, search term review, bid optimization), and demonstrate understanding of Amazon workflows.',
      followUpQuestion: 'Can you explain this concept using specific Amazon terminology and walk through the process steps?',
      rubricBreakdown: {
        roleRelevance: 5,
        technicalAccuracy: 4,
        specificity: 3,
        communicationClarity: 5,
        judgmentAndRiskAwareness: 5,
        truthfulness: 6,
      },
    });
  }
}
