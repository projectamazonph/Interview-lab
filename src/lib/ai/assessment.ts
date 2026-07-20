import { validateShape, type AIHandlerConfig } from './handlers';

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

interface AssessmentBody {
  assessmentTitle: string;
  assessmentData?: unknown;
  userAnswers: unknown;
}

interface AssessmentResult {
  score: number;
  correctDecisions: string[];
  incorrectDecisions: string[];
  missedOpportunities: string[];
  recommendedNextStep: string;
  modelAnswer: string;
}

export const assessmentScoreConfig: AIHandlerConfig<AssessmentBody, AssessmentResult> = {
  systemPrompt: ASSESSMENT_PROMPT,
  validate: (body) => {
    const shape = validateShape(body, ['assessmentTitle', 'userAnswers']);
    if (!shape.ok) {
      return { ok: false, status: 400, error: 'Assessment title and answers are required' };
    }
    const b = body as AssessmentBody;
    const length =
      typeof b.userAnswers === 'string'
        ? b.userAnswers.length
        : JSON.stringify(b.userAnswers).length;
    if (length > 50000) {
      return { ok: false, status: 400, error: 'Answers are too long' };
    }
    return { ok: true, value: b };
  },
  buildUserPrompt: (body) =>
    `Assessment: ${body.assessmentTitle}\n\nAssessment Data: ${body.assessmentData ? JSON.stringify(body.assessmentData).substring(0, 5000) : 'N/A'}\n\nUser's Answers: ${body.userAnswers}`,
  onParseFailure: () => ({ ok: false, status: 500, error: 'Failed to score assessment' }),
  // Graceful degradation when the AI provider is unavailable (missing key, outage).
  onProviderError: () => ({
    ok: true,
    value: {
      score: 0,
      correctDecisions: [],
      incorrectDecisions: [],
      missedOpportunities: [],
      recommendedNextStep:
        'The AI assessment scoring service is currently unavailable. Please try again shortly.',
      modelAnswer: 'The AI assessment scoring service is currently unavailable. Please try again shortly.',
    },
  }),
};
