import { validateShape, type AIHandlerConfig } from './handlers';

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

interface CoverLetterBody {
  jobDescription: string;
  tone?: string;
  targetRole?: string;
  userName?: string;
}

interface CoverLetterResult {
  draftLetter: string;
  shorterVersion?: string;
  subjectLine?: string;
  customizationTips?: string[];
  claimsToVerify?: string[];
}

const EMPTY_RESULT: CoverLetterResult = {
  draftLetter: 'Unable to generate cover letter. Please try again.',
  shorterVersion: '',
  subjectLine: '',
  customizationTips: [],
  claimsToVerify: [],
};

export const coverLetterConfig: AIHandlerConfig<CoverLetterBody, CoverLetterResult> = {
  systemPrompt: COVER_LETTER_PROMPT,
  validate: (body) => {
    const shape = validateShape(body, ['jobDescription']);
    if (!shape.ok) {
      return { ok: false, status: 400, error: 'Job description is required' };
    }
    const jobDescription = (body as CoverLetterBody).jobDescription;
    if (typeof jobDescription === 'string' && jobDescription.length > 10000) {
      return { ok: false, status: 400, error: 'Job description is too long' };
    }
    return { ok: true, value: body as CoverLetterBody };
  },
  buildUserPrompt: (body) =>
    `Target Role: ${body.targetRole || 'Amazon VA'}\nTone: ${body.tone || 'formal'}\nApplicant Name: ${body.userName || '[Your Name]'}\n\nJob Description:\n${body.jobDescription}`,
  // Original route returned a graceful partial object (200) on parse failure.
  onParseFailure: () => ({ ok: true, value: EMPTY_RESULT }),
  // Graceful degradation when the AI provider is unavailable (missing key, outage).
  onProviderError: () => ({ ok: true, value: EMPTY_RESULT }),
};
