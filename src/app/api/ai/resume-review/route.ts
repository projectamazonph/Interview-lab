import { createAIHandler } from '@/lib/ai/handlers';
import { resumeReviewConfig } from '@/lib/ai/resume';

export const POST = createAIHandler(resumeReviewConfig);
