import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { BrowserLLMIntegration } from '@/lib/browser-llm-integration';

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

    // Use browser-based LLM integration
    const browserLLM = BrowserLLMIntegration.getInstance();
    const prompt = `Target Role: ${targetRole || 'Amazon VA'}\n\nResume Text:\n${resumeText}\n\nPlease review this resume and provide improvement suggestions in the required JSON format.`;
    
    const feedback = await browserLLM.generateResponse(prompt, 'resume');

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Browser LLM Resume Review error:', error);
    // Fallback to default resume feedback
    return NextResponse.json({
      score: 40,
      missingKeywords: ['Seller Central', 'PPC reporting', 'ACoS', 'ROAS'],
      weakSections: ['Professional Summary'],
      improvedSummary: 'Amazon-focused Virtual Assistant with training in Seller Central support, Amazon Ads reporting, and client communication.',
      improvedBullets: [],
      skillsRecommendations: ['Amazon Seller Central', 'PPC Reporting'],
      truthWarnings: [],
      improvedVersion: '',
    });
  }
}
