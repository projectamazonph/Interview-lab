import { validateShape, type AIHandlerConfig } from './handlers';

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

interface ResumeReviewBody {
  resumeText: string;
  targetRole?: string;
}

interface ResumeReviewResult {
  score: number;
  missingKeywords: string[];
  weakSections: string[];
  improvedSummary: string;
  improvedBullets: string[];
  skillsRecommendations: string[];
  truthWarnings: string[];
}

export const resumeReviewConfig: AIHandlerConfig<ResumeReviewBody, ResumeReviewResult> = {
  systemPrompt: RESUME_REVIEW_PROMPT,
  validate: (body) => {
    const shape = validateShape(body, ['resumeText']);
    if (!shape.ok) {
      return { ok: false, status: 400, error: 'Resume text is required' };
    }
    const resumeText = (body as ResumeReviewBody).resumeText;
    if (typeof resumeText === 'string' && resumeText.length > 20000) {
      return { ok: false, status: 400, error: 'Resume is too long' };
    }
    return { ok: true, value: body as ResumeReviewBody };
  },
  buildUserPrompt: (body) =>
    `Target Role: ${body.targetRole || 'Amazon VA'}\n\nResume Text:\n${body.resumeText}`,
  onParseFailure: () => ({ ok: false, status: 500, error: 'Failed to parse resume review' }),
  // Graceful degradation when the AI provider is unavailable (missing key, outage).
  onProviderError: () => ({
    ok: true,
    value: {
      score: 0,
      missingKeywords: [],
      weakSections: ['The AI resume review service is currently unavailable. Please try again shortly.'],
      improvedSummary:
        'The AI resume review service is currently unavailable. Please try again shortly.',
      improvedBullets: [],
      skillsRecommendations: [],
      truthWarnings: [],
    },
  }),
};
