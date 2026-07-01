import { NextResponse } from 'next/server';
import { getUserIdFromHeader, verifyAuth } from '@/lib/auth-helpers';
import { BrowserLLMIntegration } from '@/lib/browser-llm-integration';

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromHeader(request);
    const user = await verifyAuth(userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobDescription, tone, targetRole, userName } = await request.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    // Use browser-based LLM integration
    const browserLLM = BrowserLLMIntegration.getInstance();
    const prompt = `Target Role: ${targetRole || 'Amazon VA'}\nTone: ${tone || 'formal'}\nApplicant Name: ${userName || '[Your Name]'}\n\nJob Description:\n${jobDescription}\n\nPlease generate a cover letter in the required JSON format.`;
    
    const result = await browserLLM.generateResponse(prompt, 'cover-letter');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Browser LLM Cover Letter error:', error);
    // Fallback to default cover letter
    return NextResponse.json({
      draftLetter: 'Error generating cover letter. Please try again.',
      shorterVersion: '',
      subjectLine: '',
      customizationTips: [],
      claimsToVerify: [],
    });
  }
}
