import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { BrowserLLMIntegration } from '@/lib/browser-llm-integration';

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

    // Use browser-based LLM integration
    const browserLLM = BrowserLLMIntegration.getInstance();
    const prompt = `Assessment: ${assessmentTitle}\n\nAssessment Data: ${JSON.stringify(assessmentData)}\n\nUser's Answers: ${userAnswers}\n\nPlease evaluate these answers and provide scoring in the required JSON format.`;
    
    const result = await browserLLM.generateResponse(prompt, 'assessment');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Browser LLM Assessment Score error:', error);
    // Fallback to default assessment feedback
    return NextResponse.json({
      score: 0,
      correctDecisions: [],
      incorrectDecisions: [],
      missedOpportunities: [],
      recommendedNextStep: 'Please try again',
      modelAnswer: 'Error scoring assessment.',
    });
  }
}
