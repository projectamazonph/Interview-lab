import { createAIHandler } from '@/lib/ai/handlers';
import { assessmentScoreConfig } from '@/lib/ai/assessment';

export const POST = createAIHandler(assessmentScoreConfig);
